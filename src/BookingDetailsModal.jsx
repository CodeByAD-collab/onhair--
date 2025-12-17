import React from 'react';
import { X, Trash2, User, Scissors, Calendar, UserCheck } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function BookingDetailsModal({ event, onClose, onDelete }) {
    if (!event) return null;

    const handleDelete = () => {
        // --- MODIFIÉ: Message de confirmation en français ---
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.")) {
            onDelete(event.id);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={{...styles.header, borderLeft: `6px solid ${event.bgColor || '#52525b'}`}}>
                    <h2 style={{margin:0, fontSize:18}}>Détails du Rendez-vous</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
                </div>
                <div style={styles.content}>
                    <div style={styles.row}>
                        <div style={styles.iconBox}><User size={20} color="#a1a1aa"/></div>
                        <div>
                            <div style={styles.label}>Client</div>
                            <div style={styles.value}>{event.title}</div>
                        </div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.iconBox}><UserCheck size={20} color="#F59E0B"/></div>
                        <div>
                            <div style={styles.label}>Coiffeur / Staff</div>
                            <div style={styles.value}>{event.resourceId}</div>
                        </div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.iconBox}><Scissors size={20} color="#EC4899"/></div>
                        <div>
                            <div style={styles.label}>Service</div>
                            <div style={styles.value}>{event.service}</div>
                        </div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.iconBox}><Calendar size={20} color="#8B5CF6"/></div>
                        <div>
                            <div style={styles.label}>Date & Heure</div>
                            <div style={styles.value}>
                                {moment(event.start).format('dddd D MMMM YYYY')} <br/>
                                <span style={{color:'#fff', fontWeight:'bold'}}>
                                    {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={styles.footer}>
                    <button onClick={handleDelete} style={styles.deleteBtn}>
                        <Trash2 size={18} /> Supprimer
                    </button>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = { overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }, modal: { backgroundColor: '#18181b', width: '90%', maxWidth: '420px', borderRadius: '16px', border: '1px solid #27272a', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }, header: { padding: '20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', color:'white' }, closeBtn: { background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }, content: { padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }, row: { display: 'flex', alignItems: 'center', gap: '15px' }, iconBox: { width: 40, height: 40, borderRadius: '50%', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 12, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }, value: { fontSize: 16, color: 'white', fontWeight: '500' }, footer: { padding: '20px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', gap: 10 }, deleteBtn: { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight:'bold' }, cancelBtn: { flex: 1, backgroundColor: 'transparent', color: 'white', border: '1px solid #52525b', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' } };