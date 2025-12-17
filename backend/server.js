const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js'); // MessageMedia is not used but good to keep
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. WHATSAPP CONFIGURATION (WITH LOW-MEMORY OPTIMIZATIONS) ---
console.log("🔄 Initializing WhatsApp Client with low-memory settings...");

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // --- THIS IS THE CRITICAL FIX FOR RENDER'S FREE PLAN ---
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ],
    }
});

// --- NOUVEAU: "Watchdog" timer to detect startup failure ---
const clientInitializationTimeout = setTimeout(() => {
    console.error("❌ FATAL: WhatsApp client initialization timed out after 2 minutes. This is likely due to a memory issue on the server. Please consider upgrading your Render plan or using an official API like Twilio.");
}, 120000); // 2 minutes

whatsappClient.on('qr', (qr) => {
    // When QR is received, we know the client is working, so we can clear the timeout
    clearTimeout(clientInitializationTimeout);
    console.log('\n=== SCAN THIS QR CODE WITH WHATSAPP ===');
    qrcode.generate(qr, { small: true });
    console.log('======================================\n');
});

whatsappClient.on('ready', () => {
    // Also clear the timeout if we reconnect successfully without a QR code
    clearTimeout(clientInitializationTimeout);
    console.log('✅ WhatsApp Client is ready!');
});

whatsappClient.on('auth_failure', msg => console.error('❌ WHATSAPP AUTHENTICATION FAILURE', msg));
whatsappClient.on('disconnected', (reason) => console.log('❌ WhatsApp Client was logged out', reason));

whatsappClient.initialize().catch(err => {
    clearTimeout(clientInitializationTimeout);
    console.error("❌ Failed to initialize WhatsApp Client on startup:", err);
});

// (The rest of the file remains the same)

// --- 2. DATABASE ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const initDB = async () => { try { await pool.query(`CREATE TABLE IF NOT EXISTS clients (id SERIAL PRIMARY KEY, nom TEXT, prenom TEXT, telephone TEXT UNIQUE)`); await pool.query(`CREATE TABLE IF NOT EXISTS staff (id SERIAL PRIMARY KEY, name TEXT, color TEXT, special TEXT)`); await pool.query(`CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, name TEXT, phone TEXT, date TEXT, time TEXT, service_name TEXT, duration INTEGER, price TEXT, staff TEXT, status TEXT, notes TEXT, reminder_sent BOOLEAN DEFAULT false)`); await pool.query(`CREATE TABLE IF NOT EXISTS expenses (id SERIAL PRIMARY KEY, category TEXT, name TEXT, amount INTEGER, date TEXT)`); console.log("💾 Database connected and tables are ready."); } catch (err) { console.error("❌ Database Initialization Error:", err); } };
initDB();

// --- 3. CRON JOB ---
console.log("⏰ Reminder Cron Job scheduled for 09:00 AM (Casablanca Time).")
cron.schedule('0 9 * * *', async () => { console.log(`\n🔔 Running Daily Reminder Check... (${new Date().toLocaleString()})`); const tomorrow = moment().tz('Africa/Casablanca').add(1, 'days').format('YYYY-MM-DD'); console.log(`🔍 Checking for appointments on: ${tomorrow}`); try { const res = await pool.query(`SELECT * FROM bookings WHERE date = $1 AND reminder_sent = false AND status = 'confirmed'`, [tomorrow]); if (res.rows.length === 0) { console.log("👍 No reminders to send for tomorrow."); return; } console.log(`Found ${res.rows.length} reminder(s) to send.`); for (const booking of res.rows) { await sendReminder(booking); } } catch (e) { console.error("❌ Error during cron job:", e); } }, { scheduled: true, timezone: "Africa/Casablanca" });

async function sendReminder(booking) { if (!whatsappClient.info) { console.warn("⚠️ Cannot send reminder, WhatsApp client not ready."); return; } const chatId = formatPhoneNumber(booking.phone); if (!chatId) { console.warn(`⚠️ Invalid phone number for booking ID ${booking.id}. Skipping reminder.`); return; } try { const contact = await whatsappClient.getNumberId(chatId); if (contact) { const message = `✨ *Rappel amical* ✨\n\nBonjour ${booking.name},\nCeci est un petit rappel pour votre rendez-vous demain.\n\n🗓️ *Date :* ${moment(booking.date).format('dddd, D MMMM')}\n🕒 *Heure :* ${booking.time}\n💇‍♀️ *Service :* ${booking.service_name}\n\nNous avons hâte de vous voir chez OnHair ! 💖`; await whatsappClient.sendMessage(contact._serialized, message); console.log(`✅ Reminder sent successfully to ${booking.name}`); await pool.query(`UPDATE bookings SET reminder_sent = true WHERE id = $1`, [booking.id]); } else { console.warn(`⚠️ Contact not found on WhatsApp for ${booking.phone}. Cannot send reminder.`); } } catch (err) { console.error(`❌ Failed to send reminder to ${booking.name}:`, err); } }
function formatPhoneNumber(phone) { if (!phone) return null; let clean = phone.toString().replace(/\D/g, ''); if (clean.startsWith('0')) { clean = '212' + clean.substring(1); } if (clean.length === 12 && clean.startsWith('212')) { return clean + "@c.us"; } return null; }

// --- API ROUTES ---
app.post('/api/bookings', async (req, res) => { const { name, date, time, service_name, staff, phone, duration, notes } = req.body; if (!name || !date || !time || !service_name) return res.status(400).json({ message: "Missing required booking info" }); try { const result = await pool.query( `INSERT INTO bookings (name, phone, date, time, service_name, staff, duration, price, status, notes, reminder_sent) VALUES ($1, $2, $3, $4, $5, $6, $7, '0', 'confirmed', $8, false) RETURNING id`, [name, phone || '', date, time, service_name, staff, duration, notes || ''] ); res.status(201).json({ id: result.rows[0].id }); if (phone && whatsappClient.info) { const chatId = formatPhoneNumber(phone); if (chatId) { const contact = await whatsappClient.getNumberId(chatId); if (contact) { const msg = `✨ *Confirmation OnHair* ✨\n\nBonjour ${name} ! 👋\nVotre rendez-vous est bien confirmé.\n\n🗓️ *Date :* ${moment(date).format('dddd, D MMMM')}\n🕒 *Heure :* ${time}\n💇‍♀️ *Service :* ${service_name}\n\nMerci de votre confiance et à bientôt ! 💖`; whatsappClient.sendMessage(contact._serialized, msg) .then(() => console.log(`✅ Confirmation sent to ${name}`)) .catch(err => console.error(`❌ Failed to send confirmation to ${name}:`, err)); } } } } catch (e) { console.error("Error creating booking:", e); res.status(500).json({ error: e.message }); } });
app.get('/api/bookings', async (req, res) => { try { if (req.query.date) { const { rows } = await pool.query("SELECT * FROM bookings WHERE date = $1 ORDER BY time ASC", [req.query.date]); return res.json({ data: rows }); } const { rows } = await pool.query("SELECT * FROM bookings ORDER BY date DESC, time DESC"); res.json({ data: rows }); } catch (e) { console.error("Error fetching bookings:", e); res.status(500).json({ data: [] }); } });
app.patch('/api/bookings/:id', async (req, res) => { const { name, phone, service_name, staff, date, time, duration } = req.body; try { await pool.query( `UPDATE bookings SET name=$1, phone=$2, service_name=$3, staff=$4, date=$5, time=$6, duration=$7 WHERE id=$8`, [name, phone, service_name, staff, date, time, duration, req.params.id] ); res.status(200).json({ message: 'Booking updated' }); } catch (e) { console.error("Error updating booking:", e); res.status(500).json({ error: e.message }); } });
app.delete('/api/bookings/:id', async (req, res) => { await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]); res.json({ message: "deleted" }); });
app.get('/api/staff', async (req, res) => { const { rows } = await pool.query("SELECT * FROM staff"); res.json({ data: rows }); });
app.post('/api/staff', async (req, res) => { await pool.query("INSERT INTO staff (name, color, special) VALUES ($1, $2, $3)", [req.body.name, req.body.color, req.body.special]); res.json({ message: "ok" }); });
app.delete('/api/staff/:id', async (req, res) => { await pool.query("DELETE FROM staff WHERE id = $1", [req.params.id]); res.json({ message: "deleted" }); });
app.listen(PORT, () => console.log(`🚀 Server is live on port ${PORT}`));