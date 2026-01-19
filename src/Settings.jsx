import React, { useState, useEffect } from 'react';
import { Save, Clock, Scissors, Globe, DollarSign, Bell, Shield } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        salonName: "ON h'AIR STUDIO",
        startHour: 8,
        endHour: 20,
        currency: "DH",
        slotDuration: 30,
        whatsappNotification: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load existing settings from API
        fetch('https://onhair.onrender.com/api/settings')
            .then(res => res.json())
            .then(data => { if(data.data) setSettings(data.data); })
            .catch(err => console.error("Error loading settings"));
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await fetch('https://onhair.onrender.com/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            alert("Application mise à jour avec succès !");
            window.location.reload(); // Refresh to apply changes everywhere
        } catch (err) {
            alert("Erreur de sauvegarde");
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{margin:0, fontSize:28, color:'white'}}><span style={{color:'#ef4444'}}>ON</span> SETTINGS</h1>
                <button onClick={handleSave} style={styles.saveBtn} disabled={loading}>
                    <Save size={18}/> {loading ? "Enregistrement..." : "Appliquer Globalement"}
                </button>
            </div>

            <div style={styles.grid}>
                {/* PLANNING CONFIG */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}><Clock color="#ef4444" size={20}/> Planning & Horaires</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Ouverture (Ex: 8)</label>
                        <input type="number" style={styles.input} value={settings.startHour} onChange={e => setSettings({...settings, startHour: parseInt(e.target.value)})} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Fermeture (Ex: 20)</label>
                        <input type="number" style={styles.input} value={settings.endHour} onChange={e => setSettings({...settings, endHour: parseInt(e.target.value)})} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Intervalle (Minutes)</label>
                        <select style={styles.input} value={settings.slotDuration} onChange={e => setSettings({...settings, slotDuration: parseInt(e.target.value)})}>
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={60}>1 heure</option>
                        </select>
                    </div>
                </div>

                {/* BUSINESS CONFIG */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}><Globe color="#ef4444" size={20}/> Informations Générales</div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Nom de l'établissement</label>
                        <input style={styles.input} value={settings.salonName} onChange={e => setSettings({...settings, salonName: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Devise</label>
                        <input style={styles.input} value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { background: '#000', color: 'white', height: '100vh', padding: '40px', overflowY: 'auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', maxWidth: '900px', margin: '0 auto 40px auto' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' },
    card: { background: '#0a0a0a', borderRadius: '15px', padding: '25px', border: '1px solid #1a1a1a' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'white' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', fontSize: '11px', color: '#444', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' },
    input: { width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' },
    saveBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }
};