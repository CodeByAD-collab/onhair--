import React, { useState } from 'react';
import { X, Save, Clock, User, Phone, Scissors, Calendar } from 'lucide-react';

const SERVICES = ["Coupe", "Brushing", "Coloration", "Soin"]; // Liste simple

export default function SimpleBookingModal({ isOpen, onClose, staffList = [], onSave, initialData = {} }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        clientName: initialData.clientName || '',
        phone: initialData.phone || '',
        service: 'Coupe',
        staff: staffList.length > 0 ? staffList[0].id : 'Non assigné',
        date: new Date().toISOString().split('T')[0],
        time: '12:00'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}><h2 style={{margin:0}}>Ajouter une Visite</h2><button onClick={onClose} style={styles.closeBtn}><X size={24} /></button></div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.row}>
                        <div style={styles.group}><label>Client</label><input required style={styles.input} value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} /></div>
                        <div style={styles.group}><label>Téléphone</label><input style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label>Service</label>
                            <select style={styles.select} value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})}>
                                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={styles.group}>
                            <label>Coiffeur</label>
                            <select style={styles.select} value={formData.staff} onChange={e => setFormData({...formData, staff: e.target.value})}>
                                {staffList.map(s => ( <option key={s.id} value={s.id}>{s.title}</option>))}
                            </select>
                        </div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.group}><label>Date</label><input type="date" style={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                        <div style={styles.group}><label>Heure</label><input type="time" style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
                    </div>
                    <button type="submit" style={styles.submitBtn}>Enregistrer la Visite</button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modal: { backgroundColor: '#18181b', width: '500px', borderRadius: '16px', border: '1px solid #27272a' },
    header: { padding: '20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' },
    closeBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' },
    form: { padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' },
    row: { display: 'flex', gap: '15px' },
    group: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', color: '#a1a1aa' },
    input: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px' },
    select: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px' },
    submitBtn: { marginTop: '10px', background: 'white', color: 'black', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }
};