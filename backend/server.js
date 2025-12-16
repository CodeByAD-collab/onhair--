const express = require('express');
const { Pool } = require('pg'); // Use Postgres instead of SQLite
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
require('dotenv').config(); // Load the secret code

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. WHATSAPP CONFIGURATION ---
console.log("🔄 Starting System...");

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

whatsappClient.on('qr', (qr) => {
    console.log('\n=== QR CODE FOR LOGIN ===');
    qrcode.generate(qr, { small: true });
    console.log('=========================\n');
});

whatsappClient.on('ready', () => console.log('✅ WhatsApp Connected!'));
whatsappClient.initialize();

// --- 2. CONNECT TO NEON DATABASE ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon
});

// Initialize Tables (Postgres Syntax)
const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS clients (id SERIAL PRIMARY KEY, nom TEXT, prenom TEXT, telephone TEXT UNIQUE)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS staff (id SERIAL PRIMARY KEY, name TEXT, color TEXT, special TEXT)`);
        
        // Bookings table
        await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY, 
            name TEXT, 
            phone TEXT, 
            date TEXT, 
            time TEXT, 
            service_name TEXT, 
            price TEXT, 
            staff TEXT, 
            status TEXT, 
            notes TEXT, 
            clientId INTEGER, 
            reminder_sent INTEGER DEFAULT 0
        )`);
        
        await pool.query(`CREATE TABLE IF NOT EXISTS expenses (id SERIAL PRIMARY KEY, category TEXT, name TEXT, amount INTEGER, date TEXT)`);
        console.log("💾 Database Connected (Neon Cloud).");
    } catch (err) {
        console.error("❌ DB Connection Error:", err);
    }
};
initDB();

// --- 3. CRON JOB (REMINDER) ---
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('fr-CA'); // YYYY-MM-DD

    try {
        const res = await pool.query(`SELECT * FROM bookings WHERE date = $1 AND reminder_sent = 0`, [todayStr]);
        const rows = res.rows;

        rows.forEach((booking) => {
            const bookingDate = new Date(`${booking.date}T${booking.time}`);
            const diffMinutes = Math.floor((bookingDate - now) / 60000);

            if (diffMinutes >= 115 && diffMinutes <= 125) {
                sendReminder(booking);
            }
        });
    } catch (e) { console.error(e); }
});

function sendReminder(booking) {
    if (!whatsappClient.info) return;
    const chatId = formatPhoneNumber(booking.phone);
    if (!chatId) return;

    // Verify number before sending
    whatsappClient.getNumberId(chatId).then(contact => {
        if(contact) {
            const message = `⏳ *Rappel Rendez-vous* ⏳\n\nBonjour ${booking.name},\nPetit rappel pour votre RDV dans *2 heures*.\n\n🕒 *Heure :* ${booking.time}\n💇‍♀️ *Service :* ${booking.service_name}\n\nÀ tout de suite chez OnHair ! ✨`;
            whatsappClient.sendMessage(contact._serialized, message).then(async () => {
                console.log(`🔔 Reminder sent to ${booking.name}`);
                await pool.query(`UPDATE bookings SET reminder_sent = 1 WHERE id = $1`, [booking.id]);
            });
        }
    });
}

function formatPhoneNumber(phone) {
    if (!phone) return null;
    let clean = phone.toString().replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 10) clean = '212' + clean.substring(1);
    else if ((clean.startsWith('6') || clean.startsWith('7')) && clean.length === 9) clean = '212' + clean;
    return clean + "@c.us";
}

// --- ROUTES ---

// Clients
app.get('/api/clients', async (req, res) => {
    try { const { rows } = await pool.query("SELECT * FROM clients ORDER BY prenom ASC"); res.json({ data: rows }); } 
    catch (e) { res.json({ data: [] }); }
});

// Bookings (Create)
app.post('/api/bookings', async (req, res) => {
    const { name, date, time, service_name, staff, notes } = req.body;
    let phone = req.body.phone || req.body.telephone;

    if (!name || !date || !time) return res.status(400).json({ message: "Missing info" });

    // Function to save
    const saveAndNotify = async (clientId, finalPhone) => {
        try {
            const result = await pool.query(
                `INSERT INTO bookings (name, phone, date, time, service_name, staff, clientId, price, status, reminder_sent, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, '0', 'confirmed', 0, $8) RETURNING id`,
                [name, finalPhone, date, time, service_name, staff, clientId, notes || '']
            );
            
            res.status(201).json({ id: result.rows[0].id });

            // WhatsApp Logic
            if (finalPhone && whatsappClient.info) {
                const chatId = formatPhoneNumber(finalPhone);
                const contact = await whatsappClient.getNumberId(chatId);
                if (contact) {
                    const msg = `✨ *Confirmation OnHair* ✨\n\nBonjour ${name} ! 👋\nVotre rendez-vous est confirmé.\n\n📅 *Le :* ${date}\n🕒 *À :* ${time}\n💇‍♀️ *Service :* ${service_name}\n👤 *Avec :* ${staff}\n\nMerci de votre confiance ! 💖`;
                    whatsappClient.sendMessage(contact._serialized, msg);
                }
            }
        } catch (e) { res.status(500).json({ error: e.message }); }
    };

    // Client Logic
    if (phone) {
        const clientRes = await pool.query(`SELECT id FROM clients WHERE telephone = $1`, [phone]);
        if (clientRes.rows.length > 0) {
            saveAndNotify(clientRes.rows[0].id, phone);
        } else {
            const [p, ...n] = name.split(" ");
            const newClient = await pool.query(`INSERT INTO clients (nom, prenom, telephone) VALUES ($1, $2, $3) RETURNING id`, [n.join(" ")||"", p, phone]);
            saveAndNotify(newClient.rows[0].id, phone);
        }
    } else {
        saveAndNotify(null, "");
    }
});

// Other Routes
app.get('/api/bookings', async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM bookings ORDER BY date DESC, time DESC");
    res.json({ data: rows });
});
app.delete('/api/bookings/:id', async (req, res) => {
    await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]);
    res.json({ message: "deleted" });
});

app.get('/api/staff', async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM staff");
    res.json({ data: rows });
});
app.post('/api/staff', async (req, res) => {
    await pool.query("INSERT INTO staff (name, color, special) VALUES ($1, $2, $3)", [req.body.name, req.body.color, req.body.special]);
    res.json({ message: "ok" });
});
app.delete('/api/staff/:id', async (req, res) => {
    await pool.query("DELETE FROM staff WHERE id = $1", [req.params.id]);
    res.json({ message: "deleted" });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));