import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { X, Save, Trash2, Ban } from 'lucide-react';

const SERVICES_CONFIG = {
    "COIFFURE": [ { name: "Brushing", duration: 30 }, { name: "SHP+ Masque+ Brushing", duration: 45 }, { name: "SHP spécifique+Masque traitant+ Brush", duration: 60 }, { name: "Wavy", duration: 30 }, { name: "Wavy + SHP+ Masque", duration: 45 }, { name: "Coupe correction et pointes", duration: 30 }, { name: "Coupe transformation", duration: 60 }, { name: "Coupe enfant", duration: 30 }, { name: "Consultation et diagnostique", duration: 30 }, { name: "Diagnostique et mèche test", duration: 45 } ],
    "COLORATION": [ { name: "Coloration", duration: 120 }, { name: "Coloration racines", duration: 90 }, { name: "Rinçage et correction de couleur", duration: 60 }, { name: "Ombré", duration: 180 }, { name: "Balayage", duration: 180 }, { name: "Airtouch", duration: 240 } ],
    "SOINS DE CHEVEUX": [ { name: "Soin ON h’AIR", duration: 60 }, { name: "Soin COLLAGENE", duration: 90 }, { name: "Soin PROTEINE", duration: 90 }, { name: "Soin BRUSHING permanent", duration: 120 } ],
    "MANUCURE": [ { name: "Pose vernis permanent", duration: 40 }, { name: "Manucure classique", duration: 45 }, { name: "Manucure BIAB", duration: 90 }, { name: "Extension de gel", duration: 120 } ],
    "PÉDICURE": [ { name: "Pédicure classique", duration: 45 }, { name: "Pédicure SPA", duration: 60 } ],
    "YEUX & MAQUILLAGE": [ { name: "Maquillage soirée", duration: 60 }, { name: "Maquillage Mariée", duration: 120 } ]
};

const STAFF_MEMBERS = [
    { id: 'Fahd', name: 'Fahd', role: 'Coiffeur' },
    { id: 'Nabil', name: 'Nabil', role: 'Coiffeur Styliste' },
    { id: 'Nezha', name: 'Nezha', role: 'Esthéticienne experte' }
];

export default function BookingModal({ isOpen, onClose, onSave, initialData, onDelete }) {
    const [selectedCategory, setSelectedCategory] = useState("COIFFURE");
    const [formData, setFormData] = useState({
        id: null, firstName: '', lastName: '', phone: '', service: '', staff: 'Fahd', date: '', time: '', duration: 30, status: 'confirmed'
    });

    useEffect(() => {
        if (isOpen && initialData) {
            const names = (initialData.title || initialData.clientName || '').split(' ');
            setFormData({
                id: initialData.id || null, 
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                phone: initialData.phone || '',
                service: initialData.service || '', 
                staff: initialData.resourceId || initialData.staff || 'Fahd',
                date: moment(initialData.start || initialData.date).format('YYYY-MM-DD'), 
                time: moment(initialData.start || initialData.date).format('HH:mm'),
                duration: initialData.duration || 30,
                status: initialData.status || 'confirmed'
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleDelete = () => {
        if (window.confirm("Supprimer définitivement ce rendez-vous ?")) {
            onDelete(formData.id);
            onClose();
        }
    };

    const handleCancel = () => {
        if (window.confirm("Annuler ce rendez-vous ? (Il restera visible mais barré)")) {
            onSave({ ...formData, clientName: `${formData.firstName} ${formData.lastName}`.trim(), status: 'cancelled' });
            onClose();
        }
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const finalData = { ...formData, clientName: `${formData.firstName} ${formData.lastName}`.trim(), status: 'confirmed' };
        onSave(finalData); 
        
        if (finalData.phone) {
            const msg = `Bonjour ${formData.firstName},\n\nNous confirmons votre réservation chez ON H'AIR STUDIO :\n\nPrestation : ${formData.service}\nDate : ${moment(formData.date).format('DD/MM/YYYY')}\nHeure : ${formData.time}\nPersonnel : ${formData.staff}`;
            window.open(`https://wa.me/${formData.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
        }
        onClose();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={{margin:0}}>{formData.id ? 'Modifier' : 'Nouveau'} RDV</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X /></button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.row}>
                        <input placeholder="Prénom" required style={styles.input} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        <input placeholder="Nom" required style={styles.input} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                    <input placeholder="WhatsApp (ex: 2126...)" required style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <div style={styles.row}>
                        <select style={styles.select} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            {Object.keys(SERVICES_CONFIG).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <select required style={styles.select} value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}>
                            <option value="">Service...</option>
                            {SERVICES_CONFIG[selectedCategory].map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <select style={styles.select} value={formData.staff} onChange={(e) => setFormData({...formData, staff: e.target.value})}>
                        {STAFF_MEMBERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div style={styles.row}>
                        <input type="date" required style={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        <input type="time" required style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                    </div>
                    
                    <div style={styles.footer}>
                        {formData.id && (
                            <>
                                <button type="button" onClick={handleDelete} style={styles.btnDelete} title="Supprimer">
                                    <Trash2 size={20} />
                                </button>
                                <button type="button" onClick={handleCancel} style={styles.btnCancel}>
                                    <Ban size={16} /> Annuler
                                </button>
                            </>
                        )}
                        <button type="submit" style={styles.btnConfirm}>
                            <Save size={16}/> {formData.id ? 'Enregistrer' : 'Confirmer & WhatsApp'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    modal: { backgroundColor: '#18181b', width: '90%', maxWidth: '450px', borderRadius: '12px', color: 'white', border: '1px solid #27272a' },
    header: { padding: '15px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between' },
    closeBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer' },
    form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' },
    row: { display: 'flex', gap: '10px' },
    input: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '6px', flex: 1 },
    select: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '6px', flex: 1 },
    footer: { display: 'flex', gap: '10px', marginTop: '10px' },
    btnConfirm: { flex: 2, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    btnCancel: { flex: 1, background: 'none', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', padding: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    btnDelete: { background: 'none', color: '#71717a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '10px' }
};