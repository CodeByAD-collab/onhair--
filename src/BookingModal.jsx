import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { X, Save, Clock, User, Phone, Scissors, Calendar, Trash2 } from 'lucide-react';

const SERVICES_CONFIG = {
    "COIFFURE": [ { name: "Brushing", duration: 30 }, { name: "SHP+ Masque+ Brushing", duration: 45 }, { name: "SHP spécifique+Masque traitant+ Brush", duration: 60 }, { name: "Wavy", duration: 30 }, { name: "Wavy + SHP+ Masque", duration: 45 }, { name: "Coupe correction et pointes", duration: 30 }, { name: "Coupe transformation", duration: 60 }, { name: "Coupe enfant", duration: 30 }, { name: "Consultation et diagnostique", duration: 30 }, { name: "Diagnostique et mèche test", duration: 45 } ],
    "COLORATION": [ { name: "Coloration", duration: 120 }, { name: "Coloration sans ammoniaque", duration: 120 }, { name: "Coloration racines", duration: 90 }, { name: "Coloration racines sans ammoniaque", duration: 90 }, { name: "Rinçage et correction de couleur", duration: 60 }, { name: "Reflets Highlight", duration: 150 }, { name: "Ombré", duration: 180 }, { name: "Balayage", duration: 180 }, { name: "Airtouch", duration: 240 } ],
    "SOINS DE CHEVEUX": [ { name: "Soin ON h’AIR", duration: 60 }, { name: "Soin a base de PLEX", duration: 60 }, { name: "Soin COLLAGENE", duration: 90 }, { name: "Soin PROTEINE", duration: 90 }, { name: "Soin BRUSHING permanent", duration: 120 }, { name: "Soin semi permanent CURLY hair", duration: 90 }, { name: "Soin permanent CURLY hair", duration: 120 } ],
    "ÉPILATION": [ { name: "Duvet", duration: 10 }, { name: "Sourcil", duration: 15 }, { name: "Menton", duration: 10 }, { name: "Visage Complet", duration: 30 }, { name: "Bras", duration: 20 }, { name: "Demis jambe", duration: 20 }, { name: "Jambe complète", duration: 40 }, { name: "Aisselles", duration: 15 }, { name: "Maillot", duration: 20 }, { name: "Épilation complète", duration: 60 } ],
    "MASSAGE": [ { name: "Massage Relaxant 30min", duration: 30 }, { name: "Massage Relaxant 45min", duration: 45 }, { name: "Massage Relaxant 60min", duration: 60 }, { name: "Massage Nuque et épaules 15min", duration: 15 }, { name: "Massage cranien et faciale 15min", duration: 15 }, { name: "Massage des pieds 15min", duration: 15 } ],
};

// Hardcoded staff based on your request
const STAFF_MEMBERS = [
    { id: 'nabil', name: 'Nabil', role: 'Coiffeur Styliste' },
    { id: 'fahd', name: 'Fahd', role: 'Expert Coiffure' },
    { id: 'nezha', name: 'Nezha', role: 'Esthéticienne experte' }
];

const findService = (serviceName) => { 
    for (const category in SERVICES_CONFIG) { 
        const found = SERVICES_CONFIG[category].find(s => s.name === serviceName); 
        if (found) return found; 
    } 
    return null; 
};

export default function BookingModal({ isOpen, onClose, staffList = [], onSave, initialData, onDelete }) {
    const [formData, setFormData] = useState({
        id: null,
        firstName: '', // Split Name
        lastName: '',  // Split Name
        phone: '',
        service: '',
        staff: '',
        date: '',
        time: '',
        duration: 30
    });

    useEffect(() => {
        if (isOpen && initialData) {
            const defaultService = findService(initialData.service) || SERVICES_CONFIG["COIFFURE"][0];
            
            // Logic to split existing clientName "FirstName LastName" into two fields
            const names = (initialData.clientName || '').split(' ');
            const fName = names[0] || '';
            const lName = names.slice(1).join(' ') || '';

            setFormData({
                id: initialData.id || null, 
                firstName: fName,
                lastName: lName,
                phone: initialData.phone || '',
                service: defaultService.name, 
                staff: initialData.staff || STAFF_MEMBERS[0].id,
                date: moment(initialData.date).format('YYYY-MM-DD'), 
                time: moment(initialData.date).format('HH:mm'),
                duration: initialData.duration || defaultService.duration,
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleServiceChange = (e) => { 
        const serviceName = e.target.value; 
        const serviceConfig = findService(serviceName); 
        setFormData({ ...formData, service: serviceName, duration: serviceConfig ? serviceConfig.duration : 30 }); 
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        // Combine names back for the save function
        const finalData = {
            ...formData,
            clientName: `${formData.firstName} ${formData.lastName}`.trim()
        };
        onSave(finalData); 
    };

    const handleDelete = () => { 
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) { 
            onDelete(formData.id); 
        } 
    };

    const isEditing = formData.id !== null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={{margin:0, fontSize: '18px'}}>{isEditing ? 'Modifier la Réservation' : 'Nouvelle Réservation'}</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* First Row: Nom and Prénom */}
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}><User size={14}/> Prénom</label>
                            <input 
                                required 
                                placeholder="Prénom" 
                                style={styles.input} 
                                value={formData.firstName} 
                                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                            />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><User size={14}/> Nom</label>
                            <input 
                                required 
                                placeholder="Nom" 
                                style={styles.input} 
                                value={formData.lastName} 
                                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}><Phone size={14}/> Téléphone</label>
                            <input 
                                placeholder="06..." 
                                style={styles.input} 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                            />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><Scissors size={14}/> Service</label>
                            <select 
                                style={styles.select} 
                                value={formData.service} 
                                onChange={handleServiceChange}
                            >
                                <option value="" disabled>Choisir un service...</option>
                                {Object.keys(SERVICES_CONFIG).map(category => (
                                    <optgroup label={category} key={category}>
                                        {SERVICES_CONFIG[category].map(service => ( 
                                            <option value={service.name} key={service.name}>{service.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={{...styles.group, flex: '1 1 100%'}}>
                            <label style={styles.label}><User size={14}/> Coiffeur / Esthéticienne</label>
                            <select 
                                style={{...styles.select, fontSize: '13px'}} 
                                value={formData.staff} 
                                onChange={e => setFormData({...formData, staff: e.target.value})}
                            >
                                {STAFF_MEMBERS.map(s => ( 
                                    <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}><Calendar size={14}/> Date</label>
                            <input 
                                type="date" 
                                style={styles.input} 
                                value={formData.date} 
                                onChange={e => setFormData({...formData, date: e.target.value})} 
                            />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><Clock size={14}/> Heure</label>
                            <input 
                                type="time" 
                                step="900" 
                                style={styles.input} 
                                value={formData.time} 
                                onChange={e => setFormData({...formData, time: e.target.value})} 
                            />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}><Clock size={14}/> Durée</label>
                            <select 
                                style={styles.select} 
                                value={formData.duration} 
                                onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                            >
                                { [15, 30, 45, 60, 75, 90, 120, 150, 180, 240].map(d => (
                                    <option key={d} value={d}>{`${Math.floor(d/60)}h ${d%60 < 10 ? '0' : ''}${d%60}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div style={styles.footer}>
                        {isEditing && (
                            <button type="button" onClick={handleDelete} style={styles.deleteBtn}>
                                <Trash2 size={16} /> Supprimer
                            </button>
                        )}
                        <button type="submit" style={styles.submitBtn}>
                            <Save size={18} /> {isEditing ? 'Enregistrer' : 'Confirmer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = { 
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }, 
    modal: { backgroundColor: '#18181b', width: '95%', maxWidth: '550px', borderRadius: '16px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }, 
    header: { padding: '15px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#27272a', color: 'white' }, 
    closeBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }, 
    form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }, 
    row: { display: 'flex', gap: '12px', flexWrap: 'wrap' }, 
    group: { flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '6px' }, 
    label: { color: '#a1a1aa', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' }, 
    input: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' }, 
    select: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' }, 
    footer: { display: 'flex', gap: '10px', marginTop: '10px' }, 
    deleteBtn: { padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight:'bold', fontSize: '13px' }, 
    submitBtn: { flex: 1, background: '#EC4899', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' } 
};