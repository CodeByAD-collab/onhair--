import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Scissors } from 'lucide-react';

export default function ClientVisitModal({ isOpen, onClose, onSave, staffList, initialData = {} }) {
    const [formData, setFormData] = useState({
        clientName: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        service: 'Coupe',
        staff: staffList.length > 0 ? staffList[0].title : '',
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(prev => ({
                ...prev,
                clientName: initialData.clientName || '',
                phone: initialData.phone || ''
            }));
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3>Nouvelle Visite</h3>
                    <button onClick={onClose} style={styles.closeBtn}><X /></button>
                </div>

                <div style={styles.form}>
                    {/* Client Information (Read Only) */}
                    <div style={styles.row}>
                        <label>Client</label>
                        <input style={{...styles.input, opacity: 0.7}} value={formData.clientName} readOnly />
                    </div>

                    {/* Service Selection */}
                    <div style={styles.row}>
                        <label>Service</label>
                        <div style={styles.inputIcon}>
                            <Scissors size={16} color="#EC4899"/>
                            <select 
                                style={styles.select} 
                                value={formData.service} 
                                onChange={e => setFormData({...formData, service: e.target.value})}
                            >
                                <option>Coupe</option>
                                <option>Coloration</option>
                                <option>Brushing</option>
                                <option>Soin</option>
                                <option>Mèches</option>
                                <option>Lissage</option>
                            </select>
                        </div>
                    </div>

                    {/* Staff Selection */}
                    <div style={styles.row}>
                        <label>Coiffeur / Staff</label>
                        <div style={styles.inputIcon}>
                            <User size={16} color="#EC4899"/>
                            <select 
                                style={styles.select} 
                                value={formData.staff} 
                                onChange={e => setFormData({...formData, staff: e.target.value})}
                            >
                                <option value="">Choisir...</option>
                                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div style={styles.grid}>
                        <div>
                            <label>Date</label>
                            <div style={styles.inputIcon}>
                                <Calendar size={16} />
                                <input type="date" style={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label>Heure</label>
                            <div style={styles.inputIcon}>
                                <Clock size={16} />
                                <input type="time" style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <button onClick={() => onSave(formData)} style={styles.saveBtn}>Confirmer la Visite</button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#18181b', padding: 25, borderRadius: 16, width: 400, border: '1px solid #333', color: 'white' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    closeBtn: { background: 'transparent', border: 'none', color: '#999', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: 15 },
    row: { display: 'flex', flexDirection: 'column', gap: 5 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 },
    inputIcon: { display: 'flex', alignItems: 'center', gap: 10, background: '#000', border: '1px solid #333', borderRadius: 8, padding: '0 10px' },
    input: { background: 'transparent', border: 'none', color: 'white', padding: '12px 0', width: '100%', outline: 'none' },
    select: { background: 'transparent', border: 'none', color: 'white', padding: '12px 0', width: '100%', outline: 'none' },
    saveBtn: { marginTop: 10, background: '#EC4899', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }
};