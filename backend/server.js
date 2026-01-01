const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const twilio = require('twilio'); 
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION TWILIO (SAFE VERSION) ---
// These lines will now ONLY read from the Environment Variables on Render.
const TWILIO_SID = process.env.TWILIO_SID; 
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_PHONE = 'whatsapp:+14155238886'; 

// Check if the keys were found. If not, the server will log an error and still run,
// but WhatsApp messages will fail. This is safer than crashing.
let twilioClient;
if (TWILIO_SID && TWILIO_TOKEN) {
    twilioClient = new twilio(TWILIO_SID, TWILIO_TOKEN);
    console.log("✅ Twilio client configured successfully.");
} else {
    console.error("❌ WARNING: TWILIO_SID or TWILIO_TOKEN not found in environment variables. WhatsApp messages will fail.");
}

app.use(cors());
app.use(express.json());

// --- CONNEXION BASE DE DONNÉES ---
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

// --- INITIALISATION ET RÉPARATION DES TABLES ---
const initDb = async () => {
    try {
        console.log("🛠️ Initialisation de la base de données...");
        await pool.query(`CREATE TABLE IF NOT EXISTS staff (id SERIAL PRIMARY KEY, name TEXT NOT NULL, color TEXT, special TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS clients (id SERIAL PRIMARY KEY, prenom TEXT NOT NULL, nom TEXT, telephone TEXT NOT NULL);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS expenses (id SERIAL PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, amount FLOAT NOT NULL, date TEXT NOT NULL, notes TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, name TEXT, phone TEXT, date DATE, time TEXT, service_name TEXT, staff TEXT, duration TEXT, price TEXT DEFAULT '0', status TEXT DEFAULT 'confirmed', notes TEXT);`);

        // Force l'ajout des colonnes si elles manquent
        await pool.query("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;");
        await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;");
        await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration TEXT;");
        
        console.log("✅ Base de données prête et routes activées !");
    } catch (err) { console.error("❌ Erreur DB :", err.message); }
};
initDb();

// --- 1. ROUTES CAISSE (EXPENSES) ---
app.get('/api/expenses', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM expenses ORDER BY date DESC, id DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', async (req, res) => {
    const { category, name, amount, date, notes } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO expenses (category, name, amount, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [category, name, amount, date, notes]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
        res.json({ msg: "deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 2. ROUTES BOOKINGS (PLANNING & RÉSERVATION) ---
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

        // ================== DÉBUT DU CODE WHATSAPP ==================
        if (twilioClient) {
            console.log('✅ Booking saved. Trying to send WhatsApp confirmation...');
            try {
                const formattedDate = new Date(date).toLocaleDateString('fr-FR');
                const clientPhoneNumber = `whatsapp:${phone}`;

                await twilioClient.messages.create({
                    contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
                    contentVariables: JSON.stringify({
                      '1': formattedDate,
                      '2': time
                    }),
                    from: TWILIO_PHONE,
                    to: clientPhoneNumber 
                });
                console.log('🎉 WhatsApp confirmation sent successfully!');
            } catch (twilioError) {
                console.error('❌ Could not send WhatsApp message. Error:', twilioError.message);
            }
        }
        // ================== FIN DU CODE WHATSAPP ==================
        
        res.status(201).json({ id: result.rows[0].id });
        
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/bookings/:id', async (req, res) => {
    const fields = req.body;
    const keys = Object.keys(fields);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);
    try {
        await pool.query(`UPDATE bookings SET ${setClause} WHERE id = $${values.length}`, values);
        res.json({ msg: "ok" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]);
        res.json({ msg: "deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 3. ROUTES CLIENTS ---
app.get('/api/clients', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM clients ORDER BY prenom ASC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients', async (req, res) => {
    const { prenom, nom, telephone } = req.body;
    try {
        const result = await pool.query("INSERT INTO clients (prenom, nom, telephone) VALUES ($1, $2, $3) RETURNING id", [prenom, nom, telephone]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
    const { prenom, nom, telephone } = req.body;
    try {
        await pool.query("UPDATE clients SET prenom=$1, nom=$2, telephone=$3 WHERE id=$4", [prenom, nom, telephone, req.params.id]);
        res.json({ msg: "ok" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM clients WHERE id = $1", [req.params.id]);
        res.json({ msg: "deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 4. ROUTES STAFF ---
app.get('/api/staff', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM staff ORDER BY name ASC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/staff', async (req, res) => {
    try {
        await pool.query("INSERT INTO staff (name, color, special) VALUES ($1, $2, $3)", [req.body.name, req.body.color, req.body.special]);
        res.json({ msg: "ok" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/staff/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM staff WHERE id = $1", [req.params.id]);
        res.json({ msg: "deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));