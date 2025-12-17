const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js'); 
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- GLOBAL VAR TO HOLD QR CODE ---
let currentQRCodeData = null;
let isClientReady = false;

// --- 1. WHATSAPP CLIENT ---
console.log("🔄 Starting WhatsApp Client...");
const whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }), 
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu'],
    }
});

whatsappClient.on('qr', async (qr) => {
    console.log('📲 New QR Code generated...');
    qrcodeTerminal.generate(qr, { small: true }); // Show in logs
    try { currentQRCodeData = await qrcode.toDataURL(qr); } catch (err) {} // Save for browser
});

whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Client is READY!');
    isClientReady = true;
    currentQRCodeData = null;
});

whatsappClient.initialize();

// --- 2. DATABASE ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --- 3. BROWSER QR ROUTE (The Fix) ---
app.get('/qr', (req, res) => {
    if (isClientReady) return res.send('<h1 style="color:green; text-align:center; margin-top:50px;">✅ WhatsApp Connected!</h1>');
    if (currentQRCodeData) return res.send(`<div style="text-align:center; margin-top:50px;"><h1>Scan Me</h1><img src="${currentQRCodeData}" style="border:1px solid #333;"/><p>Refresh if needed.</p></div>`);
    return res.send('<div style="text-align:center; margin-top:50px;"><h1>⏳ Loading...</h1><p>Please refresh in 10 seconds.</p></div>');
});

// --- 4. API ROUTES ---
app.post('/api/bookings', async (req, res) => {
    const { name, phone, date, time, service_name, staff, duration, notes } = req.body;
    try {
        const result = await pool.query(`INSERT INTO bookings (name, phone, date, time, service_name, staff, duration, price, status, notes, reminder_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, '0', 'confirmed', $8, false) RETURNING id`, [name, phone, date, time, service_name, staff, duration, notes]);
        res.status(201).json({ id: result.rows[0].id });
        if (phone && isClientReady) {
            const chatId = phone.replace(/\D/g, '').replace(/^0/, '212') + "@c.us";
            const msg = `✨ *Confirmation OnHair* ✨\n\nBonjour ${name} ! 👋\nVotre rendez-vous est bien confirmé.\n\n🗓️ *Date :* ${date}\n🕒 *Heure :* ${time}\n💇‍♀️ *Service :* ${service_name}`;
            whatsappClient.sendMessage(chatId, msg).catch(e => console.log("Msg failed"));
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bookings', async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM bookings ORDER BY date DESC, time DESC");
    res.json({ data: rows });
});

// Simple Cron for Reminders (9am)
cron.schedule('0 9 * * *', async () => {
    const tomorrow = moment().tz('Africa/Casablanca').add(1, 'days').format('YYYY-MM-DD');
    const res = await pool.query(`SELECT * FROM bookings WHERE date = $1 AND reminder_sent = false`, [tomorrow]);
    for (const b of res.rows) {
        if(isClientReady) {
            const chatId = b.phone.replace(/\D/g, '').replace(/^0/, '212') + "@c.us";
            whatsappClient.sendMessage(chatId, `✨ *Rappel* : Rendez-vous demain à ${b.time} !`).catch(()=>{});
            pool.query(`UPDATE bookings SET reminder_sent = true WHERE id = $1`, [b.id]);
        }
    }
}, { timezone: "Africa/Casablanca" });

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));