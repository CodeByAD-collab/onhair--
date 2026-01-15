const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

// --- WHATSAPP BOT LOGIC ---
let whatsappStatus = 'disconnected';
let latestQR = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('New QR Received');
    qrcode.toDataURL(qr, (err, url) => {
        latestQR = url;
        whatsappStatus = 'qr_ready';
    });
});

client.on('ready', () => {
    console.log('✅ WhatsApp is READY');
    whatsappStatus = 'connected';
    latestQR = null;
});

client.on('disconnected', () => {
    whatsappStatus = 'disconnected';
});

client.initialize();

// --- AUTOMATIC 2-HOUR REMINDER (CRON JOB) ---
// Runs every 15 minutes
cron.schedule('*/15 * * * *', async () => {
    if (whatsappStatus !== 'connected') return;

    console.log("⏰ Checking for upcoming reminders...");
    const reminderTime = moment().tz("Africa/Casablanca").add(2, 'hours');
    const targetDate = reminderTime.format('YYYY-MM-DD');
    const targetTime = reminderTime.format('HH:mm');

    try {
        const { rows } = await pool.query(
            "SELECT * FROM bookings WHERE date = $1 AND time LIKE $2 AND status = 'confirmed'",
            [targetDate, `${targetTime.substring(0, 4)}%`]
        );

        for (const booking of rows) {
            const cleanPhone = booking.phone.replace(/\s/g, '').replace('+', '');
            const chatId = cleanPhone.includes('212') ? `${cleanPhone}@c.us` : `212${cleanPhone}@c.us`;
            
            const message = `Bonjour ${booking.name}, ceci est un rappel pour votre rendez-vous chez *ON H'AIR STUDIO* à ${booking.time}. À tout à l'heure !`;
            
            await client.sendMessage(chatId, message);
            console.log(`✉️ Reminder sent to ${booking.name}`);
        }
    } catch (err) { console.error("Reminder Error:", err); }
});

// --- WHATSAPP API ROUTES ---
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: whatsappStatus, qr: latestQR });
});

app.post('/api/whatsapp/connect', (req, res) => {
    if (whatsappStatus === 'disconnected') client.initialize();
    res.json({ msg: "Initializing..." });
});

// --- EXISTING ROUTES (BOOKINGS, EXPENSES, etc.) ---
// [Keep all your other existing routes here: GET/POST bookings, expenses, clients, staff]
// (I am omitting them for brevity, but keep them in your file!)

app.get('/api/bookings', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM bookings ORDER BY date DESC, time DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bookings', async (req, res) => {
    const { name, phone, date, time, service_name, staff, duration, notes } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO bookings (name, phone, date, time, service_name, staff, duration, price, status, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, '0', 'confirmed', $8) RETURNING id`,
            [name, phone, date, time, service_name, staff, duration, notes]
        );
        
        // Immediate Confirmation via WhatsApp
        if (whatsappStatus === 'connected') {
            const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
            const chatId = cleanPhone.includes('212') ? `${cleanPhone}@c.us` : `212${cleanPhone}@c.us`;
            const msg = `Confirmation: Votre RDV chez ON H'AIR est noté pour le ${moment(date).format('DD/MM')} à ${time}. Merci !`;
            client.sendMessage(chatId, msg).catch(e => console.log("Send Error", e));
        }

        res.status(201).json({ id: result.rows[0].id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ... Keep your Expenses, Clients, and Staff routes exactly as they were ...

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));