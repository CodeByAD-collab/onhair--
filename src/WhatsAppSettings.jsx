import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function WhatsAppSettings() {
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('disconnected'); // disconnected, loading, connected
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('https://onhair.onrender.com/api/whatsapp/status');
            const data = await res.json();
            setStatus(data.status);
            if (data.qr) setQrCode(data.qr);
        } catch (e) { console.error("WA Status Error", e); }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            await fetch('https://onhair.onrender.com/api/whatsapp/connect', { method: 'POST' });
            fetchStatus();
        } catch (e) { alert("Erreur de connexion"); }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Gestion WhatsApp</h1>
            
            <div style={styles.card}>
                {status === 'connected' ? (
                    <div style={styles.statusBox}>
                        <CheckCircle size={60} color="#10B981" />
                        <h2 style={{color: '#10B981'}}>WhatsApp Connecté</h2>
                        <p style={{color: '#666'}}>Les rappels automatiques (2h avant) sont activés.</p>
                    </div>
                ) : (
                    <div style={styles.statusBox}>
                        <QrCode size={60} color="#d4af37" />
                        <h2>Lier WhatsApp</h2>
                        <p style={{color: '#666', marginBottom: 20}}>Scannez le QR Code pour activer les notifications automatiques.</p>
                        
                        {qrCode ? (
                            <div style={styles.qrContainer}>
                                <img src={qrCode} alt="WhatsApp QR" style={{width: 250, borderRadius: 10}} />
                            </div>
                        ) : (
                            <button onClick={handleGenerate} disabled={loading} style={styles.btn}>
                                {loading ? "Génération..." : "Générer QR Code"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: 40, background: '#000', minHeight: '100vh', color: '#fff' },
    title: { fontSize: 32, fontWeight: 900, marginBottom: 30 },
    card: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 24, padding: 50, textAlign: 'center', maxWidth: 600, margin: '0 auto' },
    statusBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 },
    qrContainer: { background: '#fff', padding: 20, borderRadius: 15, marginTop: 20 },
    btn: { background: '#ef4444', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' }
};