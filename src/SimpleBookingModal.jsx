import React, { useState, useEffect } from 'react';
import { X, User, Phone, Scissors, Calendar, Clock, Bell } from 'lucide-react';

// Specific staff members as requested
const STAFF_MEMBERS = [
    { id: 'nabil', name: 'Nabil', role: 'Coiffeur Styliste' },
    { id: 'fahd', name: 'Fahd', role: 'Expert Coiffure' },
    { id: 'nezha', name: 'Nezha', role: 'Esthéticienne experte' }
];

export default function SimpleBookingModal({ isOpen, onClose, onSave, initialData = {} }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        service: 'Coupe',
        staff: STAFF_MEMBERS[0].id,
        date: new Date().toISOString().split('T')[0],
        time: '12:00'
    });

    // Request permission for notifications when modal opens
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Notify the owner (Browser Notification)
        if (Notification.permission === "granted") {
            new Notification("Nouvelle Réservation !", {
                body: `Client: ${formData.firstName} ${formData.lastName}\nService: ${formData.service}`,
                icon: "/logo.jpg" // adjust if you have a logo path
            });
        }

        // Combine names for your database/save function
        const finalData = {
            ...formData,
            clientName: `${formData.firstName} ${formData.lastName}`.trim()
        };
        
        onSave(finalData);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header with Logo Area logic */}
                <div style={styles.header}>
                    <h2 style={{margin:0, fontSize: '18px', color: '#eab308'}}>Vos Coordonnées</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Nom and Prénom split */}
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Prénom</label>
                            <input 
                                required 
                                placeholder="Votre Prénom"
                                style={styles.input} 
                                value={formData.firstName} 
                                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                            />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Nom</label>
                            <input 
                                required 
                                placeholder="Votre Nom"
                                style={styles.input} 
                                value={formData.lastName} 
                                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Phone field with prefix style */}
                    <div style={styles.group}>
                        <label style={styles.label}>Téléphone</label>
                        <div style={{display: 'flex', gap: '8px'}}>
                            <div style={styles.prefix}>+212</div>
                            <input 
                                required
                                placeholder="6 00 00 00 00" 
                                style={{...styles.input, flex: 1}} 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Staff selection - Smaller and cleaner */}
                    <div style={styles.group}>
                        <label style={styles.label}>Choix du Professionnel</label>
                        <select 
                            style={styles.selectSmall} 
                            value={formData.staff} 
                            onChange={e => setFormData({...formData, staff: e.target.value})}
                        >
                            {STAFF_MEMBERS.map(s => ( 
                                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Date</label>
                            <input type="date" style={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Heure</label>
                            <input type="time" style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.backBtn}>Retour</button>
                        <button type="submit" style={styles.confirmBtn}>Confirmer</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' },
    modal: { backgroundColor: '#0f0f0f', width: '95%', maxWidth: '450px', borderRadius: '24px', border: '1px solid #27272a', overflow: 'hidden' },
    header: { padding: '20px', borderBottom: '1px solid #1f1f23', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' },
    form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' },
    row: { display: 'flex', gap: '12px' },
    group: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
    label: { color: '#a1a1aa', fontSize: '13px', fontWeight: '500' },
    input: { background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '15px', outline: 'none' },
    prefix: { background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '15px', width: '60px', textAlign: 'center' },
    selectSmall: { background: '#18181b', border: '1px solid #27272a', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer', outline: 'none' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
    backBtn: { background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '15px', cursor: 'pointer' },
    confirmBtn: { background: '#857033', color: 'black', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }
};