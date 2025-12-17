const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js'); 
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Keep Render Awake (Self Ping)
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// --- 1. WHATSAPP CLIENT SETUP ---
console.log("🔄 Starting WhatsApp Client...");

const whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }), // Explicit path
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
            '--disable-gpu'
        ],
    }
});

// QR Code Generation
whatsappClient.on('qr', (qr) => {
    console.log('\n⚠️  SESSION EXPIRED OR NOT FOUND. PLEASE SCAN QR CODE:');
    console.log('===================================================');
    qrcode.generate(qr, { small: true });
    console.log('===================================================\n');
});

whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Client is READY and Connected!');
});

whatsappClient.on('auth_failure', msg => console.error('❌ WhatsApp Auth Failure:', msg));

whatsappClient.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Client Disconnected:', reason);
    // Optional: Try to re-initialize
    whatsappClient.initialize();
});

whatsappClient.initialize();


// --- 2. DATABASE CONNECT ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --- 3. HELPER: FORMAT PHONE NUMBER ---
// Morrocan Format: 06XXXXXXXX -> 2126XXXXXXXX@c.us
function formatPhoneNumber(phone) { 
    if (!phone) return null; 
    let clean = phone.toString().replace(/\D/g, ''); // Remove non-numbers
    
    // Convert 06... or 07... to 212...
    if (clean.startsWith('0')) { 
        clean = '212' + clean.substring(1); 
    } 
    
    // Ensure it is 12 digits (212 + 9 digits)
    if (clean.length === 12 && clean.startsWith('212')) { 
        return clean + "@c.us"; 
    } 
    return null; 
}

// --- 4. CRON JOB FOR REMINDERS (9:00 AM) ---
console.log("⏰ Cron Job initialized for 09:00 AM Casablanca time.");

cron.schedule('0 9 * * *', async () => { 
    const todayStr = moment().tz('Africa/Casablanca').format('YYYY-MM-DD HH:mm:ss');
    console.log(`\n🔔 [${todayStr}] Running Daily Reminder Check...`); 
    
    // Get date for TOMORROW
    const tomorrow = moment().tz('Africa/Casablanca').add(1, 'days').format('YYYY-MM-DD'); 
    console.log(`🔍 Checking bookings for: ${tomorrow}`); 
    
    try { 
        const res = await pool.query(`SELECT * FROM bookings WHERE date = $1 AND reminder_sent = false AND status = 'confirmed'`, [tomorrow]); 
        
        if (res.rows.length === 0) { 
            console.log("👍 No reminders found for tomorrow."); 
            return; 
        } 

        console.log(`🚀 Found ${res.rows.length} reminder(s) to send.`); 
        
        for (const booking of res.rows) { 
            await sendReminder(booking); 
        } 
    } catch (e) { 
        console.error("❌ Cron Job Error:", e); 
    } 
}, { scheduled: true, timezone: "Africa/Casablanca" });


async function sendReminder(booking) { 
    // CHECK 1: Is Client Ready?
    if (!whatsappClient.info) { 
        console.error("⚠️ WhatsApp NOT READY. Cannot send reminder. Please check server logs and scan QR code."); 
        return; 
    } 
    
    const chatId = formatPhoneNumber(booking.phone); 
    if (!chatId) { 
        console.warn(`⚠️ Bad phone format: ${booking.phone} (ID: ${booking.id})`); 
        return; 
    } 

    const message = `✨ *Rappel amical* ✨\n\nBonjour ${booking.name},\nCeci est un petit rappel pour votre rendez-vous demain.\n\n🗓️ *Date :* ${moment(booking.date).format('DD/MM/YYYY')}\n🕒 *Heure :* ${booking.time}\n💇‍♀️ *Service :* ${booking.service_name}\n\nNous avons hâte de vous voir chez OnHair ! 💖`; 

    try { 
        // FIX: Send directly without waiting for getNumberId (it's faster and fails less)
        await whatsappClient.sendMessage(chatId, message); 
        console.log(`✅ Reminder sent to ${booking.name} (${booking.phone})`); 
        
        // Update DB
        await pool.query(`UPDATE bookings SET reminder_sent = true WHERE id = $1`, [booking.id]); 
    } catch (err) { 
        console.error(`❌ Failed to send WhatsApp to ${booking.name}:`, err.message); 
    } 
}

// --- 5. API ROUTES ---

// Create Booking + Send Confirmation
app.post('/api/bookings', async (req, res) => { 
    const { name, date, time, service_name, staff, phone, duration, notes } = req.body; 
    
    if (!name || !date || !time || !service_name) {
        return res.status(400).json({ message: "Missing required info" }); 
    }

    try { 
        const result = await pool.query( 
            `INSERT INTO bookings (name, phone, date, time, service_name, staff, duration, price, status, notes, reminder_sent) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, '0', 'confirmed', $8, false) RETURNING id`, 
            [name, phone || '', date, time, service_name, staff, duration, notes || ''] 
        ); 
        
        res.status(201).json({ id: result.rows[0].id }); 

        // WHATSAPP CONFIRMATION LOGIC
        if (phone && whatsappClient.info) { 
            const chatId = formatPhoneNumber(phone);
            if (chatId) {
                const msg = `✨ *Confirmation OnHair* ✨\n\nBonjour ${name} ! 👋\nVotre rendez-vous est bien confirmé.\n\n🗓️ *Date :* ${moment(date).format('DD/MM/YYYY')}\n🕒 *Heure :* ${time}\n💇‍♀️ *Service :* ${service_name}\n\nMerci de votre confiance et à bientôt ! 💖`; 
                
                // Send directly
                whatsappClient.sendMessage(chatId, msg)
                    .then(() => console.log(`✅ Confirmation sent to ${name}`))
                    .catch(err => console.error(`❌ Failed to send confirmation to ${name}:`, err.message));
            }
        } else {
            if(!whatsappClient.info) console.log("⚠️ Booking created but WhatsApp client is NOT ready.");
        }

    } catch (e) { 
        console.error("Error creating booking:", e); 
        res.status(500).json({ error: e.message }); 
    } 
});

// Other Routes
app.get('/api/bookings', async (req, res) => { 
    try { 
        if (req.query.date) { 
            const { rows } = await pool.query("SELECT * FROM bookings WHERE date = $1 ORDER BY time ASC", [req.query.date]); 
            return res.json({ data: rows }); 
        } 
        const { rows } = await pool.query("SELECT * FROM bookings ORDER BY date DESC, time DESC"); 
        res.json({ data: rows }); 
    } catch (e) { 
        console.error(e); 
        res.status(500).json({ data: [] }); 
    } 
});

app.patch('/api/bookings/:id', async (req, res) => { 
    const { name, phone, service_name, staff, date, time, duration } = req.body; 
    try { 
        await pool.query( `UPDATE bookings SET name=$1, phone=$2, service_name=$3, staff=$4, date=$5, time=$6, duration=$7 WHERE id=$8`, [name, phone, service_name, staff, date, time, duration, req.params.id] ); 
        res.status(200).json({ message: 'Updated' }); 
    } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.delete('/api/bookings/:id', async (req, res) => { 
    await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]); 
    res.json({ message: "deleted" }); 
});

app.get('/api/staff', async (req, res) => { 
    const { rows } = await pool.query("SELECT * FROM staff"); 
    res.json({ data: rows }); 
});

// Health Check / Ping
app.get('/', (req, res) => res.send('OnHair API is Running'));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));