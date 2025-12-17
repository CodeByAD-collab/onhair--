import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { X, Save, Clock, User, Phone, Scissors, Calendar } from 'lucide-react';

// --- NOUVEAU: MASTER LISTE DES SERVICES AVEC DURÉE EN MINUTES ---
const SERVICES_CONFIG = {
    "COIFFURE": [
        { name: "Brushing", duration: 30 }, { name: "SHP+ Masque+ Brushing", duration: 45 },
        { name: "SHP spécifique+Masque traitant+ Brush", duration: 60 }, { name: "Wavy", duration: 30 },
        { name: "Wavy + SHP+ Masque", duration: 45 }, { name: "Coupe correction et pointes", duration: 30 },
        { name: "Coupe transformation", duration: 60 }, { name: "Coupe enfant", duration: 30 },
        { name: "Consultation et diagnostique", duration: 30 }, { name: "Diagnostique et mèche test", duration: 45 }
    ],
    "COLORATION": [
        { name: "Coloration", duration: 120 }, { name: "Coloration sans ammoniaque", duration: 120 },
        { name: "Coloration racines", duration: 90 }, { name: "Coloration racines sans ammoniaque", duration: 90 },
        { name: "Rinçage et correction de couleur", duration: 60 }, { name: "Reflets Highlight", duration: 150 },
        { name: "Ombré", duration: 180 }, { name: "Balayage", duration: 180 }, { name: "Airtouch", duration: 240 }
    ],
    "SOINS DE CHEVEUX": [
        { name: "Soin ON h’AIR", duration: 60 }, { name: "Soin a base de PLEX", duration: 60 },
        { name: "Soin COLLAGENE", duration: 90 }, { name: "Soin PROTEINE", duration: 90 },
        { name: "Soin BRUSHING permanent", duration: 120 }, { name: "Soin semi permanent CURLY hair", duration: 90 },
        { name: "Soin permanent CURLY hair", duration: 120 }
    ],
    "ÉPILATION": [
        { name: "Duvet", duration: 10 }, { name: "Sourcil", duration: 15 }, { name: "Menton", duration: 10 },
        { name: "Visage Complet", duration: 30 }, { name: "Bras", duration: 20 }, { name: "Demis jambe", duration: 20 },
        { name: "Jambe complète", duration: 40 }, { name: "Aisselles", duration: 15 }, { name: "Maillot", duration: 20 },
        { name: "Épilation complète", duration: 60 }
    ],
    "MASSAGE": [
        { name: "Massage Relaxant 30min", duration: 30 }, { name: "Massage Relaxant 45min", duration: 45 },
        { name: "Massage Relaxant 60min", duration: 60 }, { name: "Massage Nuque et épaules 15min", duration: 15 },
        { name: "Massage cranien et faciale 15min", duration: 15 }, { name: "Massage des pieds 15min", duration: 15 }
    ],
    // ... (Add other categories here if needed)
};

// Helper to find a service by name
const findService = (serviceName) => {
    for (const category in SERVICES_CONFIG) {
        const found = SERVICES_CONFIG[category].find(s => s.name === serviceName);
        if (found) return found;
    }
    return null;
};

export default function BookingModal({ isOpen, onClose, staffList = [], onSave, initialData }) {
    const [formData, setFormData] = useState({});

    // --- MODIFIÉ: This useEffect makes the form smart ---
    // It runs whenever the modal opens or the initial data changes.
    useEffect(() => {
        if (isOpen && initialData) {
            const defaultService = findService(initialData.service) || SERVICES_CONFIG["COIFFURE"][0];
            setFormData({
                id: initialData.id || null, // Important for knowing if we are editing
                clientName: initialData.clientName || '',
                phone: initialData.phone || '',
                service: defaultService.name,
                staff: initialData.staff || (staffList.length > 0 ? staffList[0].id : ''),
                date: moment(initialData.date).format('YYYY-MM-DD'),
                time: moment(initialData.date).format('HH:mm'),
                duration: initialData.duration || defaultService.duration,
            });
        }
    }, [isOpen, initialData, staffList]);

    if (!isOpen) return null;

    const handleServiceChange = (e) => {
        const serviceName = e.target.value;
        const serviceConfig = findService(serviceName);
        setFormData({
            ...formData,
            service: serviceName,
            duration: serviceConfig ? serviceConfig.duration : 30 // Default duration
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const isEditing = formData.id !== null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={{margin:0}}>{isEditing ? 'Modifier la Réservation' : 'Nouvelle Réservation'}</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}><User size={14}/> Client</label>
                            <input required placeholder="Prénom Nom" style={styles.input} value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><Phone size={14}/> Téléphone</label>
                            <input placeholder="06..." style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                    
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}><Scissors size={14}/> Service</label>
                            <select style={styles.select} value={formData.service} onChange={handleServiceChange}>
                                {Object.keys(SERVICES_CONFIG).map(category => (
                                    <optgroup label={category} key={category}>
                                        {SERVICES_CONFIG[category].map(service => ( <option value={service.name} key={service.name}>{service.name}</option>))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><User size={14}/> Coiffeur</label>
                            <select style={styles.select} value={formData.staff} onChange={e => setFormData({...formData, staff: e.target.value})}>
                                {staffList.map(s => ( <option key={s.id} value={s.id}>{s.title}</option>))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}><Calendar size={14}/> Date</label>
                            <input type="date" style={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><Clock size={14}/> Heure</label>
                            <input type="time" step="900" style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                        </div>
                        {/* --- NOUVEAU: CHAMP DURÉE --- */}
                        <div style={styles.group}>
                            <label style={styles.label}><Clock size={14}/> Durée</label>
                            <select style={styles.select} value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}>
                                <option value={15}>15 min</option><option value={30}>30 min</option>
                                <option value={45}>45 min</option><option value={60}>1h 00</option>
                                <option value={75}>1h 15</option><option value={90}>1h 30</option>
                                <option value={120}>2h 00</option><option value={150}>2h 30</option>
                                <option value={180}>3h 00</option><option value={240}>4h 00</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" style={styles.submitBtn}><Save size={18} /> {isEditing ? 'Enregistrer les Modifications' : 'Confirmer la Réservation'}</button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' },
    modal: { backgroundColor: '#18181b', width: '90%', maxWidth: '600px', borderRadius: '16px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' },
    header: { padding: '20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#27272a', color: 'white' },
    closeBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' },
    form: { padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' },
    row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    group: { flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#a1a1aa', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' },
    input: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
    select: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
    submitBtn: { marginTop: '10px', background: '#EC4899', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }
};