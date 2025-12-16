import React, { useState, useEffect } from 'react';
import { User, Phone, Search, Calendar, FileText, ChevronRight, X, Save, Edit, Trash2, Plus, ArrowLeft, MousePointer2 } from 'lucide-react';
import ClientVisitModal from './ClientVisitModal';

// --- MODALE POUR CRÉER/MODIFIER UN CLIENT ---
const ClientFormModal = ({ client, onClose, onSave }) => {
    const [prenom, setPrenom] = useState(client ? client.prenom : '');
    const [nom, setNom] = useState(client ? client.nom : '');
    const [telephone, setTelephone] = useState(client ? client.telephone : '');

    const handleSave = () => {
        if (!prenom || !telephone) return alert("Le prénom et le téléphone sont obligatoires.");
        onSave({ id: client ? client.id : null, nom, prenom, telephone });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{client ? "Modifier la Fiche" : "Nouveau Client"}</h3>
                <div style={styles.inputGroup}><label>Prénom*</label><input style={styles.textArea} value={prenom} onChange={e => setPrenom(e.target.value)} /></div>
                <div style={styles.inputGroup}><label>Nom</label><input style={styles.textArea} value={nom} onChange={e => setNom(e.target.value)} /></div>
                <div style={styles.inputGroup}><label>Téléphone*</label><input style={styles.textArea} value={telephone} onChange={e => setTelephone(e.target.value)} /></div>
                <div style={{display:'flex', gap:10, marginTop:15}}>
                    <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
                    <button onClick={handleSave} style={styles.saveBtn}><Save size={16}/> Enregistrer</button>
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
                fetch('http://localhost:3000/api/clients'),
                fetch('http://localhost:3000/api/bookings'),
                fetch('http://localhost:3000/api/staff')
            ]);
            const clientsData = await clientsRes.json();
            const bookingsData = await bookingsRes.json();
            const staffData = await staffRes.json();
            
            setClients(clientsData.data || []);
            setBookings(bookingsData.data || []);
            setStaffList(staffData.data || []);
        } catch (err) { console.error(err); }
    };

    const handleSelectClient = (client) => {
        const history = bookings.filter(b => b.phone === client.telephone);
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        setClientHistory(history);
        setSelectedClient(client);
    };

    const handleOpenNote = (booking) => {
        setEditingNoteId(booking.id);
        setNoteText(booking.notes || '');
    };

    const handleSaveNote = async () => {
        try {
            await fetch(`http://localhost:3000/api/bookings/${editingNoteId}/notes`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: noteText })
            });
            setEditingNoteId(null);
            loadAllData();
            setClientHistory(prev => prev.map(b => b.id === editingNoteId ? {...b, notes: noteText} : b));
        } catch (err) { alert("Erreur sauvegarde note"); }
    };

    const handleSaveClient = async (clientData) => {
        const url = clientData.id ? `http://localhost:3000/api/clients/${clientData.id}` : 'http://localhost:3000/api/clients';
        const method = clientData.id ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            if (!response.ok) throw new Error("Erreur serveur.");

            setIsClientModalOpen(false);
            if(clientData.id) setSelectedClient({...selectedClient, ...clientData}); 
            else setSelectedClient(null);
            
            loadAllData();
        } catch (err) { alert(`Erreur : ${err.message}`); }
    };

    const handleDeleteClient = async () => {
        if (!selectedClient) return;
        if (!window.confirm(`Supprimer ${selectedClient.prenom} ${selectedClient.nom} ?`)) return;
        try {
            await fetch(`http://localhost:3000/api/clients/${selectedClient.id}`, { method: 'DELETE' });
            setSelectedClient(null);
            loadAllData();
        } catch (err) { alert("Erreur suppression."); }
    };
    
    const handleCreateVisit = async (formData) => {
        try {
            const newBooking = { name: formData.clientName, phone: formData.phone, service_name: formData.service, staff: formData.staff, date: formData.date, time: formData.time };
            const response = await fetch('http://localhost:3000/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBooking) });
            if (!response.ok) throw new Error("Erreur création.");
            
            setIsVisitModalOpen(false);
            loadAllData();
            setTimeout(() => handleSelectClient(selectedClient), 100);
        } catch (err) { alert(err.message); }
    };
    
    const filteredClients = clients.filter(c => 
        `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.telephone && c.telephone.includes(searchTerm))
    );

    return (
        <div className="clients-container">
            {/* --- PROFESSIONNEL STYLING --- */}
            <style>{`
                .clients-container { display: flex; height: 100vh; background: #000; color: white; font-family: 'Inter', sans-serif; overflow: hidden; }
                
                /* SCROLLBAR */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #555; }

                /* LIST SECTION (Wider on Desktop) */
                .list-section { 
                    width: 400px; /* Made Wider */
                    border-right: 1px solid #27272a; 
                    display: flex; 
                    flex-direction: column;
                    background: #050505; /* Slightly darker */
                    flex-shrink: 0;
                    z-index: 2;
                }
                .list-header { padding: 25px; border-bottom: 1px solid #27272a; }
                .list-content { flex: 1; overflow-y: auto; padding: 15px; }
                
                /* DETAILS SECTION */
                .details-section { 
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    background: #000; /* Pitch black */
                    position: relative;
                }

                /* EMPTY STATE CENTERED */
                .details-empty { 
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    height: 100%; 
                    color: #555; 
                    text-align: center;
                }

                /* MAX WIDTH CONTAINER FOR DETAILS (Keeps it looking Pro) */
                .details-content-wrapper {
                    max-width: 900px; /* Limits width so it doesn't stretch */
                    width: 100%;
                    margin: 0 auto; /* Centers it */
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                /* MOBILE ADJUSTMENTS (Max 900px) */
                @media (max-width: 900px) {
                    .list-section { width: 100%; }
                    .details-section { 
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: #000; z-index: 50; 
                        transform: translateX(100%); transition: transform 0.3s ease;
                    }
                    .details-section.active { transform: translateX(0); }
                    .details-content-wrapper { max-width: 100%; } /* Full width on mobile */
                    
                    .back-btn { display: flex !important; }
                    .close-desktop-btn { display: none !important; }
                }

                .back-btn { display: none; background: #27272a; border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; margin-right: 15px; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); }
                .modal-content { background: #18181b; padding: 30px; border-radius: 20px; width: 400px; border: 1px solid #333; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            `}</style>

            {/* --- LEFT: CLIENT LIST --- */}
            <div className="list-section">
                <div className="list-header">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                        <h2 style={{margin:0, display:'flex', gap:12, fontSize:22}}><User color="#EC4899"/> Clients</h2>
                        <button onClick={() => { setSelectedClient(null); setIsClientModalOpen(true); }} style={styles.addBtn}>
                            <Plus size={18}/> <span className="hide-mobile">Nouveau</span>
                        </button>
                    </div>
                    <div style={styles.searchBox}>
                        <Search size={18} color="#6b7280"/>
                        <input 
                            placeholder="Rechercher un client..." 
                            style={styles.searchInput} 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
                <div className="list-content">
                    {filteredClients.map(client => (
                        <div 
                            key={client.id} 
                            style={{
                                ...styles.clientCard,
                                background: selectedClient?.id === client.id ? '#18181b' : 'transparent',
                                border: selectedClient?.id === client.id ? '1px solid #EC4899' : '1px solid #27272a'
                            }} 
                            onClick={() => handleSelectClient(client)}
                        >
                            <div style={styles.avatar}>{client.prenom.charAt(0)}</div>
                            <div style={{flex:1}}>
                                <div style={{fontWeight:'bold', fontSize:15, color: selectedClient?.id === client.id ? 'white' : '#e5e7eb'}}>{client.prenom} {client.nom}</div>
                                <div style={styles.clientPhone}>{client.telephone || "N/A"}</div>
                            </div>
                            <ChevronRight size={16} color="#555"/>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT: DETAILS PANEL --- */}
            <div className={`details-section ${selectedClient ? 'active' : ''}`}>
                {selectedClient ? (
                    <div className="details-content-wrapper">
                        {/* HEADER DETAILS */}
                        <div style={styles.detailsHeader}>
                            <div style={{display:'flex', alignItems:'center'}}>
                                <button className="back-btn" onClick={() => setSelectedClient(null)}>
                                    <ArrowLeft size={20}/>
                                </button>
                                <div>
                                    <h1 style={{margin:0, fontSize:24}}>{selectedClient.prenom} {selectedClient.nom}</h1>
                                    <span style={{color:'#9ca3af', fontSize:14, display:'flex', alignItems:'center', gap:5, marginTop:5}}>
                                        <Phone size={14}/> {selectedClient.telephone}
                                    </span>
                                </div>
                            </div>
                            <div style={{display:'flex', gap:10}}>
                                <button onClick={() => setIsClientModalOpen(true)} style={styles.actionBtn}><Edit size={18}/></button>
                                <button onClick={handleDeleteClient} style={{...styles.actionBtn, color:'#ef4444', background:'rgba(239,68,68,0.1)'}}><Trash2 size={18}/></button>
                                <button className="close-desktop-btn" onClick={() => setSelectedClient(null)} style={styles.closeBtn}><X size={20}/></button>
                            </div>
                        </div>
                        
                        {/* HISTORY */}
                        <div style={styles.historyContainer}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #27272a', paddingBottom:15, marginBottom:20}}>
                                <h3 style={{margin:0, fontSize:18}}>Historique Visites</h3>
                                <button onClick={() => setIsVisitModalOpen(true)} style={styles.addVisitBtn}>
                                    <Plus size={16}/> Ajouter Visite
                                </button>
                            </div>
                            
                            {clientHistory.length === 0 ? (
                                <div style={{padding:40, textAlign:'center', color:'#555', fontStyle:'italic', border:'1px dashed #333', borderRadius:10}}>
                                    Aucune visite enregistrée pour ce client.
                                </div>
                            ) : (
                                clientHistory.map(booking => (
                                    <div key={booking.id} style={styles.historyItem}>
                                        <div style={styles.historyTop}>
                                            <div style={{display:'flex', gap:15, alignItems:'center'}}>
                                                <div style={styles.dateBadge}><Calendar size={14}/> {booking.date}</div>
                                                <div style={{fontWeight:'bold', fontSize:16, color:'#EC4899'}}>{booking.service_name}</div>
                                            </div>
                                            <div style={{fontSize:13, color:'#9ca3af', background:'#27272a', padding:'2px 8px', borderRadius:4}}>Staff: {booking.staff}</div>
                                        </div>
                                        
                                        <div style={styles.noteSection} onClick={() => handleOpenNote(booking)}>
                                            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8, fontSize:12, color:'#8B5CF6', fontWeight:'bold', textTransform:'uppercase', letterSpacing:0.5}}>
                                                <FileText size={14}/> Fiche Technique
                                            </div>
                                            {booking.notes ? 
                                                <div style={{fontSize:14, color:'#d1d5db', lineHeight:1.5}}>"{booking.notes}"</div> : 
                                                <div style={{fontSize:13, color:'#555', fontStyle:'italic'}}>Cliquez pour ajouter une note...</div>
                                            }
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="details-empty">
                        <div style={{background:'#18181b', padding:30, borderRadius:'50%', marginBottom:20}}>
                            <MousePointer2 size={40} color="#333" />
                        </div>
                        <h2 style={{margin:0, color:'#333'}}>Aucun client sélectionné</h2>
                        <p style={{marginTop:10}}>Cliquez sur un client à gauche pour voir les détails.</p>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {isClientModalOpen && (<ClientFormModal client={selectedClient} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveClient} />)}
            
            {editingNoteId && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{marginBottom:20}}>Fiche Technique</h3>
                        <textarea 
                            style={styles.textArea} 
                            value={noteText} 
                            onChange={e => setNoteText(e.target.value)} 
                            placeholder="Ex: 50g 6.1 + 10g 5.0, 20vol..." 
                            rows={6} 
                        />
                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button onClick={() => setEditingNoteId(null)} style={styles.cancelBtn}>Annuler</button>
                            <button onClick={handleSaveNote} style={styles.saveBtn}><Save size={16}/> Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isVisitModalOpen && (
                <ClientVisitModal
                    isOpen={isVisitModalOpen}
                    onClose={() => setIsVisitModalOpen(false)}
                    staffList={staffList}
                    onSave={handleCreateVisit}
                    initialData={selectedClient ? { clientName: `${selectedClient.prenom} ${selectedClient.nom}`, phone: selectedClient.telephone } : {}}
                />
            )}
        </div>
    );
}

const styles = {
    searchBox: { display: 'flex', alignItems: 'center', background: '#18181b', padding: '12px 15px', borderRadius: 12, border: '1px solid #27272a', width: '100%', boxSizing:'border-box', transition:'0.2s' },
    searchInput: { background: 'transparent', border: 'none', color: 'white', marginLeft: 10, outline: 'none', width: '100%', fontSize:14 },
    addBtn: { background: 'linear-gradient(135deg, #EC4899 0%, #db2777 100%)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, boxShadow:'0 4px 10px rgba(236, 72, 153, 0.3)' },
    
    clientCard: { display: 'flex', alignItems: 'center', gap: 15, padding: '15px 20px', borderRadius: 12, cursor: 'pointer', transition: '0.2s', marginBottom: 8 },
    avatar: { width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #374151, #1f2937)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, color:'#9ca3af' },
    clientPhone: { fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 },
    
    detailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 40px', borderBottom: '1px solid #1f1f1f' },
    closeBtn: { background: '#27272a', border: 'none', color: '#9ca3af', cursor: 'pointer', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', transition:'0.2s' },
    actionBtn: { background: '#27272a', border: 'none', color: 'white', cursor: 'pointer', borderRadius:'10px', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', transition:'0.2s' },
    
    historyContainer: { flex: 1, overflowY: 'auto', padding: '30px 40px' },
    addVisitBtn: { background: 'transparent', border: '1px solid #374151', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize:13, fontWeight:'600', transition:'0.2s' },
    
    historyItem: { marginTop: 20, background: '#121214', borderRadius: 16, padding: 20, border: '1px solid #27272a', transition:'0.2s' },
    historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    dateBadge: { display: 'flex', alignItems: 'center', gap: 6, background: '#27272a', padding: '5px 10px', borderRadius: 6, fontSize: 12, color:'#d1d5db' },
    noteSection: { background: '#080808', padding: 15, borderRadius: 10, cursor: 'pointer', border: '1px dashed #333', transition:'0.2s' },
    
    inputGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 15 },
    textArea: { width: '100%', background: '#000', border: '1px solid #333', color: 'white', padding: 15, borderRadius: 10, marginTop: 5, outline: 'none', boxSizing: 'border-box', lineHeight:1.5 },
    saveBtn: { background: '#EC4899', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 },
    cancelBtn: { background: 'transparent', color: '#9ca3af', padding: '12px 24px', border: '1px solid #333', borderRadius: 10, cursor: 'pointer', fontWeight:'600' }
};