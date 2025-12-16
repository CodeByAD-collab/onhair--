import React, { useState } from 'react';
import { X, Save, Clock, User, Phone, Scissors, Calendar } from 'lucide-react';

// --- LISTE COMPLÈTE DES SERVICES ---
const SALON_SERVICES = {
    "COIFFURE": ["Brushing", "SHP+ Masque+ Brushing", "SHP spécifique+Masque traitant+ Brush", "Wavy", "Wavy + SHP+ Masque", "Coupe correction et pointes", "Coupe transformation", "Coupe enfant", "Consultation et diagnostique", "Diagnostique et mèche test"],
    "COLORATION": ["Coloration", "Coloration sans ammoniaque", "Coloration racines", "Coloration racines sans ammoniaque", "Rinçage et correction de couleur", "Reflets Highlight", "Ombré", "Balayage", "Airtouch"],
    "SOINS DE CHEVEUX": ["Soin ON h’AIR", "Soin a base de PLEX", "Soin COLLAGENE", "Soin PROTEINE", "Soin BRUSHING permanent", "Soin semi permanent CURLY hair", "Soin permanent CURLY hair"],
    "ÉPILATION": ["Duvet", "Sourcil", "Menton", "Visage Complet", "Bras", "Demis jambe", "Jambe complète", "Aisselles", "Maillot", "Épilation complète"],
    "MASSAGE": ["Massage Relaxant 30min", "Massage Relaxant 45min", "Massage Relaxant 60min", "Massage Nuque et épaules 15min", "Massage cranien et faciale 15min", "Massage des pieds 15min"],
    "YEUX": ["Faux cils", "Coloration des sourcils"],
    "MAQUILLAGE": ["Maquillage soirée", "Maquillage Fiançailles", "Maquillage de la mariée", "Pack de la mariée", "Pack de la mariée avec accompagnement"],
    "MANUCURE": ["Pose vernis normal", "Pose vernis permanent", "Manucure classique", "Manucure SPA", "Manucure BIAB", "Extension de gel (chablon / faux ongle)", "Remplissage de gel"],
    "PEDICURE": ["Pose vernis normal", "Pose vernis permanent", "Pédicure classique", "Pédicure SPA", "Pédicure BIAB", "Extention de Gel", "Remplissage de Gel"],
    "EXTRA ONGLES": ["Nail Art", "French", "Babyboomer", "Faux Ongles avec permanent", "Chrome", "Dépose vernis normal", "Dépose vernis permanent", "Dépose gel"],
    "SOIN DE VISAGE": ["Soin purifiant", "Soin éclat", "Soin hydratant"]
};

export default function BookingModal({ isOpen, onClose, staffList = [], onSave, initialData = {} }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        clientName: initialData.clientName || '',
        phone: initialData.phone || '',
        service: 'Brushing',
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
                <div style={styles.header}>
                    <h2 style={{margin:0}}>Nouvelle Réservation</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* --- LIGNE CLIENT & TÉLÉPHONE --- */}
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label><User size={14}/> Client</label>
                            <input required placeholder="Prénom Nom" style={styles.input} value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                        </div>
                        <div style={styles.group}>
                            <label><Phone size={14}/> Téléphone</label>
                            <input placeholder="06..." style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                    
                    {/* --- LIGNE SERVICE & COIFFEUR --- */}
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label><Scissors size={14}/> Service</label>
                            <select style={styles.select} value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})}>
                                {Object.keys(SALON_SERVICES).map(category => (
                                    <optgroup label={category} key={category}>
                                        {SALON_SERVICES[category].map(service => ( <option value={service} key={service}>{service}</option>))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div style={styles.group}>
                            <label><User size={14}/> Coiffeur</label>
                            <select style={styles.select} value={formData.staff} onChange={e => setFormData({...formData, staff: e.target.value})}>
                                {staffList.map(s => ( <option key={s.id} value={s.id}>{s.title}</option>))}
                            </select>
                        </div>
                    </div>

                    {/* --- LIGNE DATE & HEURE --- */}
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label><Calendar size={14}/> Date</label>
                            <input type="date" style={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div style={styles.group}>
                            <label><Clock size={14}/> Heure</label>
                            <input type="time" style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                        </div>
                    </div>
                    
                    {/* --- BOUTON VALIDER --- */}
                    <button type="submit" style={styles.submitBtn}><Save size={18} /> Confirmer</button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' },
    modal: { backgroundColor: '#18181b', width: '500px', borderRadius: '16px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' },
    header: { padding: '20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #EC4899, #8B5CF6)', color: 'white' },
    closeBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' },
    form: { padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' },
    row: { display: 'flex', gap: '15px' },
    group: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#a1a1aa', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' },
    input: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
    select: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
    submitBtn: { marginTop: '10px', background: 'white', color: 'black', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }
};