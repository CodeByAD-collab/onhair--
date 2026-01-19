import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import { User, Phone, Search, Calendar, FileText, ChevronRight, X, Save, Edit, Trash2, Plus, ArrowLeft, MousePointer2, Mail, Cake, Clock } from 'lucide-react';
import ClientVisitModal from './ClientVisitModal';

moment.locale('fr');

// HELPER: CALCULATE AGE & FORMAT DATE PROFESSIONALLY
const formatBirthDate = (dob) => {
    if (!dob) return null;
    const age = moment().diff(moment(dob), 'years');
    const formatted = moment(dob).format('D MMMM YYYY');
    return { age: `${age} ans`, full: formatted };
};

const ClientFormModal = ({ client, onClose, onSave }) => {
    const [prenom, setPrenom] = useState(client ? client.prenom : '');
    const [nom, setNom] = useState(client ? client.nom : '');
    const [telephone, setTelephone] = useState(client ? client.telephone : '');
    const [email, setEmail] = useState(client ? client.email : '');
    const [dob, setDob] = useState(client ? client.dob : '');
    const [notes, setNotes] = useState(client ? client.notes : '');

    const handleSave = () => {
        if (!prenom || !telephone) return alert("Prénom et Téléphone obligatoires.");
        onSave({ id: client ? client.id : null, nom, prenom, telephone, email, dob, notes });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={styles.modalHeader}>
                    <h3 style={{margin:0, color:'#ef4444'}}>{client ? "Modifier la Fiche" : "Nouveau Client"}</h3>
                    <X onClick={onClose} style={{cursor:'pointer', color:'#444'}} size={24}/>
                </div>
                
                <div style={styles.formScroll}>
                    <div style={styles.row}>
                        <div style={styles.inputGroup}><label style={styles.label}>Prénom*</label><input style={styles.input} value={prenom} onChange={e => setPrenom(e.target.value)} /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Nom</label><input style={styles.input} value={nom} onChange={e => setNom(e.target.value)} /></div>
                    </div>

                    <div style={styles.inputGroup}><label style={styles.label}>Téléphone*</label><input style={styles.input} value={telephone} onChange={e => setTelephone(e.target.value)} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Email</label><input type="email" style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="exemple@mail.com"/></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Date de Naissance</label><input type="date" style={styles.input} value={dob} onChange={e => setDob(e.target.value)} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Fiche Technique Globale</label><textarea style={styles.textArea} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dosages, préférences, contre-indications..." rows={4} /></div>
                </div>

                <div style={styles.modalFooter}>
                    <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
                    <button onClick={handleSave} style={styles.saveBtn}><Save size={18}/> Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

export default function Clients() {
    const [bookings, setBookings] = useState([]);
    const [clients, setClients] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientHistory, setClientHistory] = useState([]);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteText, setNoteText] = useState('');
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

    useEffect(() => { loadAllData(); }, []);

    const loadAllData = async () => {
        try {
            const [clientsRes, bookingsRes, staffRes] = await Promise.all([
                fetch('https://onhair.onrender.com/api/clients'),
                fetch('https://onhair.onrender.com/api/bookings'),
                fetch('https://onhair.onrender.com/api/staff')
            ]);
            const cData = await clientsRes.json();
            const bData = await bookingsRes.json();
            const sData = await staffRes.json();
            setClients(cData.data || []);
            setBookings(bData.data || []);
            setStaffList(sData.data || []);
        } catch (err) { console.error(err); }
    };

    const handleSelectClient = (client) => {
        const history = bookings.filter(b => b.phone === client.telephone);
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        setClientHistory(history);
        setSelectedClient(client);
    };

    const handleSaveClient = async (clientData) => {
        const url = clientData.id ? `https://onhair.onrender.com/api/clients/${clientData.id}` : 'https://onhair.onrender.com/api/clients';
        await fetch(url, { method: clientData.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
        setIsClientModalOpen(false);
        loadAllData();
        if(clientData.id) setSelectedClient({...selectedClient, ...clientData});
    };

    const handleDeleteClient = async () => {
        if (!window.confirm("Supprimer ce client ?")) return;
        await fetch(`https://onhair.onrender.com/api/clients/${selectedClient.id}`, { method: 'DELETE' });
        setSelectedClient(null);
        loadAllData();
    };

    const filteredClients = clients.filter(c => `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) || (c.telephone && c.telephone.includes(searchTerm)));

    return (
        <div className="clients-page">
            <style>{`
                .clients-page { display: flex; height: 100vh; background: #000; color: white; font-family: 'Inter', sans-serif; overflow: hidden; }
                .list-section { width: 380px; border-right: 1px solid #111; display: flex; flex-direction: column; background: #050505; flex-shrink: 0; }
                .details-section { flex: 1; background: #000; overflow-y: auto; transition: transform 0.3s ease; }
                
                @media (max-width: 850px) {
                    .list-section { width: 100%; display: ${selectedClient ? 'none' : 'flex'}; }
                    .details-section { display: ${selectedClient ? 'block' : 'none'}; width: 100%; }
                }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(10px); }
                .modal-content { background: #0a0a0a; width: 100%; max-width: 500px; border-radius: 20px; border: 1px solid #222; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
                .client-card { padding: 15px 20px; border-bottom: 1px solid #111; cursor: pointer; display: flex; alignItems: center; gap: 15px; transition: 0.2s; }
                .client-card:hover { background: #0a0a0a; }
                .client-card.active { background: #111; border-left: 4px solid #ef4444; }
                .avatar { width: 45px; height: 45px; border-radius: 50%; background: #111; border: 1px solid #222; display: flex; alignItems: center; justifyContent: center; color: #ef4444; font-weight: bold; }
                .fiche-technique { background: #080808; border: 1px solid #111; border-radius: 15px; padding: 25px; margin-bottom: 30px; }
            `}</style>

            {/* SIDEBAR LIST */}
            <div className="list-section">
                <div style={{padding: '25px', borderBottom: '1px solid #111'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                        <h2 style={{margin:0, fontSize:22, color:'white'}}><span style={{color:'#ef4444'}}>ON</span> CLIENTS</h2>
                        <button onClick={() => setIsClientModalOpen(true)} style={styles.addBtn}><Plus size={18}/></button>
                    </div>
                    <div style={styles.searchBox}><Search size={18} color="#333"/><input placeholder="Rechercher..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                </div>
                <div style={{flex:1, overflowY:'auto'}}>
                    {filteredClients.map(client => (
                        <div key={client.id} className={`client-card ${selectedClient?.id === client.id ? 'active' : ''}`} onClick={() => handleSelectClient(client)}>
                            <div className="avatar">{client.prenom.charAt(0)}</div>
                            <div style={{flex:1}}><div style={{fontWeight:'bold', fontSize:15, color: selectedClient?.id === client.id ? '#ef4444' : 'white'}}>{client.prenom} {client.nom}</div><div style={{fontSize:12, color:'#444', marginTop:4}}>{client.telephone}</div></div>
                            <ChevronRight size={16} color="#222"/>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN DETAILS */}
            <div className="details-section">
                {selectedClient ? (
                    <div style={{maxWidth: 800, margin: '0 auto', padding: '40px 20px'}}>
                        {/* MOBILE BACK BUTTON */}
                        <button onClick={() => setSelectedClient(null)} style={styles.mobileBack}><ArrowLeft size={20}/> Retour</button>

                        <div style={styles.header}>
                            <div style={{flex:1}}>
                                <h1 style={{margin:0, fontSize:32, color:'white'}}>{selectedClient.prenom} {selectedClient.nom}</h1>
                                <div style={styles.badgeRow}>
                                    <span style={styles.infoBadge}><Phone size={14}/> {selectedClient.telephone}</span>
                                    {selectedClient.email && <span style={styles.infoBadge}><Mail size={14}/> {selectedClient.email}</span>}
                                    {selectedClient.dob && (
                                        <span style={{...styles.infoBadge, color:'#ef4444', borderColor:'#ef4444'}}>
                                            <Cake size={14}/> {formatBirthDate(selectedClient.dob).age} ({formatBirthDate(selectedClient.dob).full})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{display:'flex', gap:10}}>
                                <button onClick={() => setIsClientModalOpen(true)} style={styles.actionBtn}><Edit size={18}/></button>
                                <button onClick={handleDeleteClient} style={{...styles.actionBtn, color:'#ef4444'}}><Trash2 size={18}/></button>
                            </div>
                        </div>

                        <div className="fiche-technique">
                            <div style={{display:'flex', alignItems:'center', gap:10, color:'#ef4444', fontWeight:'bold', marginBottom:15, fontSize:14, textTransform:'uppercase', letterSpacing:1}}>
                                <FileText size={18}/> Fiche Technique Permanente
                            </div>
                            <div style={{color:'#999', lineHeight:1.8, fontSize:15, whiteSpace:'pre-line'}}>
                                {selectedClient.notes || "Aucune note technique enregistrée pour le moment."}
                            </div>
                        </div>

                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:25}}>
                            <h3 style={{margin:0, fontSize:18, display:'flex', gap:10, alignItems:'center'}}><Clock size={18} color="#ef4444"/> Historique Visites</h3>
                            <button onClick={() => setIsVisitModalOpen(true)} style={styles.addVisitBtn}>Nouvelle Visite</button>
                        </div>

                        {clientHistory.map(booking => (
                            <div key={booking.id} style={styles.visitCard}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                                    <div><div style={{fontSize:12, color:'#444', marginBottom:4}}>{moment(booking.date).format('LL')}</div><div style={{fontWeight:'bold', fontSize:17}}>{booking.service_name}</div></div>
                                    <div style={styles.staffTag}>{booking.staff}</div>
                                </div>
                                <div style={styles.noteLine} onClick={() => { setEditingNoteId(booking.id); setNoteText(booking.notes || ''); }}>
                                    <span style={{color:'#ef4444', fontWeight:'bold', fontSize:11}}>NOTE:</span> {booking.notes || "Ajouter un compte rendu..."}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#111'}}>
                        <MousePointer2 size={80}/>
                        <h2 style={{marginTop:20}}>Sélectionnez un client</h2>
                    </div>
                )}
            </div>

            {isClientModalOpen && <ClientFormModal client={selectedClient} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveClient} />}
            
            {editingNoteId && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{padding:25}}>
                        <h3 style={{color:'#ef4444', marginTop:0}}>Note de Visite</h3>
                        <textarea style={styles.textArea} value={noteText} onChange={e => setNoteText(e.target.value)} rows={6} />
                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button onClick={() => setEditingNoteId(null)} style={styles.cancelBtn}>Annuler</button>
                            <button onClick={async () => {
                                await fetch(`https://onhair.onrender.com/api/bookings/${editingNoteId}/notes`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: noteText }) });
                                setEditingNoteId(null);
                                loadAllData();
                            }} style={styles.saveBtn}>Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}

            {isVisitModalOpen && <ClientVisitModal isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} staffList={staffList} onSave={async (d) => {
                await fetch('https://onhair.onrender.com/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
                setIsVisitModalOpen(false);
                loadAllData();
            }} initialData={{ clientName: `${selectedClient.prenom} ${selectedClient.nom}`, phone: selectedClient.telephone }} />}
        </div>
    );
}

const styles = {
    searchBox: { display: 'flex', alignItems: 'center', background: '#0a0a0a', padding: '12px 15px', borderRadius: 12, border: '1px solid #111' },
    searchInput: { background: 'transparent', border: 'none', color: 'white', marginLeft: 10, outline: 'none', width: '100%', fontSize: 14 },
    addBtn: { background: '#ef4444', color: 'white', border: 'none', width: 40, height: 40, borderRadius: 12, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    mobileBack: { display:'flex', alignItems:'center', gap:8, background:'#111', border:'none', color:'white', padding:'8px 15px', borderRadius:10, marginBottom:30, cursor:'pointer' },
    header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:40, gap:20 },
    badgeRow: { display:'flex', flexWrap:'wrap', gap:12, marginTop:15 },
    infoBadge: { display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:8, border:'1px solid #111', color:'#666', fontSize:13 },
    actionBtn: { background: '#111', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 12, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    visitCard: { background: '#050505', borderRadius: 15, padding: 25, border: '1px solid #111', marginBottom: 15 },
    staffTag: { background: '#111', padding: '4px 12px', borderRadius: 6, fontSize: 12, color: '#ef4444', fontWeight: 'bold', height: 'fit-content' },
    noteLine: { background: '#000', padding: 15, borderRadius: 10, fontSize: 14, color: '#666', border: '1px dashed #222', cursor: 'pointer' },
    addVisitBtn: { background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' },
    modalHeader: { padding: 25, borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    formScroll: { padding: 25, overflowY: 'auto', flex: 1 },
    modalFooter: { padding: 20, borderTop: '1px solid #111', display: 'flex', gap: 10 },
    inputGroup: { marginBottom: 20, flex: 1 },
    label: { fontSize: 11, color: '#444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, display: 'block' },
    input: { width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '12px', borderRadius: 10, boxSizing: 'border-box' },
    textArea: { width: '100%', background: '#000', border: '1px solid #222', color: 'white', padding: '15px', borderRadius: 10, boxSizing: 'border-box' },
    saveBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '12px 25px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
    cancelBtn: { background: 'transparent', color: '#444', border: '1px solid #222', padding: '12px 20px', borderRadius: 12, cursor: 'pointer' },
    row: { display: 'flex', gap: 15 }
};