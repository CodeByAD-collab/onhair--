const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js'); 
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OWNER_PHONE_NUMBER = '212678915564'; // Your Number

app.use(cors());
app.use(express.json());

// --- GLOBAL STATE ---
let isClientReady = false;

// --- 1. WHATSAPP CLIENT SETUP ---
console.log("🔄 Starting WhatsApp Client...");

const whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }), 
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu'],
    }
});

whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Client is READY!');
    isClientReady = true;
});

whatsappClient.on('disconnected', () => {
    console.log('❌ WhatsApp Disconnected');
    isClientReady = false;
    whatsappClient.initialize();
});

whatsappClient.initialize();

// --- 2. DATABASE ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --- 3. PAIRING CODE ROUTE (NO QR) ---
app.get('/pair', async (req, res) => {
    if (isClientReady) {
        return res.send('<h1 style="color:green; text-align:center; font-family:sans-serif;">✅ WhatsApp is Already Connected!</h1>');
    }

    try {
        console.log("Requesting Pairing Code...");
        // Request code for the Owner's number
        const code = await whatsappClient.requestPairingCode(OWNER_PHONE_NUMBER);
        
        return res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1>⚠️ WhatsApp Pairing Required</h1>
                <p>Open WhatsApp on your phone (${OWNER_PHONE_NUMBER})</p>
                <p>Go to <b>Settings > Linked Devices > Link a Device > Link with phone number instead</b></p>
                <p>Enter this code:</p>
                <div style="font-size: 40px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 20px; display: inline-block; border-radius: 10px;">
                    ${code}
                </div>
            </div>
        `);
    } catch (err) {
        console.error("Pairing Error:", err);
        return res.send(`<h3>Error generating code. Check server logs.</h3><p>${err.message}</p>`);
    }
});

// --- 4. API ROUTES ---

// Create Booking & Send Confirmation
app.post('/api/bookings', async (req, res) => {
    const { name, phone, date, time, service_name, staff, duration, notes } = req.body;
    try {
        const result = await pool.query(`INSERT INTO bookings (name, phone, date, time, service_name, staff, duration, price, status, notes, reminder_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, '0', 'confirmed', $8, false) RETURNING id`, [name, phone, date, time, service_name, staff, duration, notes]);
        res.status(201).json({ id: result.rows[0].id });
        
        // Confirmation Message
        if (phone && isClientReady) {
            const chatId = phone.replace(/\D/g, '').replace(/^0/, '212') + "@c.us";
            const msg = `✨ *Confirmation OnHair* ✨\n\nBonjour ${name} ! 👋\nVotre rendez-vous est bien confirmé.\n\n🗓️ *Date :* ${moment(date).format('DD/MM/YYYY')}\n🕒 *Heure :* ${time}\n💇‍♀️ *Service :* ${service_name}\n\nMerci de votre confiance et à bientôt ! 💖`;
            whatsappClient.sendMessage(chatId, msg).catch(e => console.log("Msg failed"));
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bookings', async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM bookings ORDER BY date DESC, time DESC");
    res.json({ data: rows });
});

// --- 5. NEW: 2-HOUR REMINDER CRON JOB ---
// Runs every hour at minute 0 (e.g., 10:00, 11:00, 12:00)
cron.schedule('0 * * * *', async () => {
    const now = moment().tz('Africa/Casablanca');
    console.log(`⏰ Checking for appointments starting around ${now.clone().add(2, 'hours').format('HH:00')}...`);

    // Target: Appointments happening today, roughly 2 hours from now
    const todayStr = now.format('YYYY-MM-DD');
    const targetHour = now.add(2, 'hours').format('HH'); // If now is 14:00, target is "16"

    try {
        // Select bookings for TODAY where time starts with the target hour (e.g., "16:00", "16:30")
        // and reminder has NOT been sent yet.
        const res = await pool.query(
            `SELECT * FROM bookings WHERE date = $1 AND time LIKE $2 AND reminder_sent = false AND status = 'confirmed'`, 
            [todayStr, `${targetHour}:%`] 
        );

        if (res.rows.length > 0) {
            console.log(`🚀 Found ${res.rows.length} bookings for 2-hour reminder.`);
            for (const b of res.rows) {
                if(isClientReady) {
                    const chatId = b.phone.replace(/\D/g, '').replace(/^0/, '212') + "@c.us";
                    const msg = `✨ *Rappel Rendez-vous* ✨\n\nBonjour ${b.name} ! 👋\nCeci est un petit rappel : nous vous attendons dans 2 heures (à ${b.time}) pour votre soin ${b.service_name}.\n\nÀ tout de suite chez OnHair ! 💖`;
                    
                    await whatsappClient.sendMessage(chatId, msg);
                    await pool.query(`UPDATE bookings SET reminder_sent = true WHERE id = $1`, [b.id]);
                    console.log(`✅ Sent reminder to ${b.name}`);
                }
            }
        } else {
            console.log("👍 No upcoming reminders for this hour.");
        }
    } catch (e) {
        console.error("Cron Error:", e);
    }
}, { timezone: "Africa/Casablanca" });

// API Endpoints for Staff/Admin (unchanged)
app.patch('/api/bookings/:id', async (req, res) => { try { await pool.query(`UPDATE bookings SET name=$1, phone=$2, service_name=$3, staff=$4, date=$5, time=$6, duration=$7 WHERE id=$8`, [req.body.name, req.body.phone, req.body.service_name, req.body.staff, req.body.date, req.body.time, req.body.duration, req.params.id]); res.json({msg:'ok'}); } catch(e){res.status(500).json(e)} });
app.delete('/api/bookings/:id', async (req, res) => { await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]); res.json({msg:"deleted"}); });
app.get('/api/staff', async (req, res) => { const { rows } = await pool.query("SELECT * FROM staff"); res.json({ data: rows }); });
app.post('/api/staff', async (req, res) => { await pool.query("INSERT INTO staff (name, color, special) VALUES ($1, $2, $3)", [req.body.name, req.body.color, req.body.special]); res.json({msg:"ok"}); });
app.delete('/api/staff/:id', async (req, res) => { await pool.query("DELETE FROM staff WHERE id = $1", [req.params.id]); res.json({msg:"deleted"}); });

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));