import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText, CheckCircle, Ban, Save, X, User } from 'lucide-react';

export default function Staff() {
    const [staffList, setStaffList] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingNotes, setEditingNotes] = useState(null); // For technical file modal
    const [noteText, setNoteText] = useState('');
    const [newStaff, setNewStaff] = useState({ name: '', color: '#ef4444', special: '', notes: '', isAbsent: false });

    useEffect(() => { fetchStaff(); }, []);

    const fetchStaff = () => {
        fetch('https://onhair.onrender.com/api/staff')
            .then(res => res.json())
            .then(data => setStaffList(data.data || []))
            .catch(err => console.error("Erreur:", err));
    };

    const handleAddStaff = (e) => {
        e.preventDefault();
        fetch('https://onhair.onrender.com/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStaff)
        }).then(() => {
            fetchStaff();
            setShowAddModal(false);
            setNewStaff({ name: '', color: '#ef4444', special: '', notes: '', isAbsent: false });
        });
    };

    const handleDeleteStaff = (id, name) => {
        if (!window.confirm(`Supprimer définitivement ${name} ?`)) return;
        fetch(`https://onhair.onrender.com/api/staff/${id}`, { method: 'DELETE' }).then(() => fetchStaff());
    };

    const toggleAbsence = (staff) => {
        const updated = { ...staff, isAbsent: !staff.isAbsent };
        updateStaffData(staff.id, updated);
    };

    const updateStaffData = (id, data) => {
        fetch(`https://onhair.onrender.com/api/staff/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => fetchStaff());
    };

    const openNotes = (staff) => {
        setEditingNotes(staff);
        setNoteText(staff.notes || '');
    };

    const saveNotes = () => {
        updateStaffData(editingNotes.id, { ...editingNotes, notes: noteText });
        setEditingNotes(null);
    };

    return (
        <div className="staff-container">
            <style>{`
                .staff-container { padding: 40px; background: #000; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; }
                .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
                
                .staff-card { 
                    background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 15px; padding: 25px; 
                    transition: 0.3s; position: relative; overflow: hidden;
                }
                .staff-card.absent { opacity: 0.5; border-color: #ef444433; }
                
                .status-badge { 
                    position: absolute; top: 15px; right: 15px; padding: 4px 10px; border-radius: 5px; 
                    font-size: 10px; font-weight: bold; text-transform: uppercase;
                }

                .avatar-large { 
                    width: 60px; height: 60px; borderRadius: 50%; display: flex; 
                    align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 15px;
                }

                .btn-icon { 
                    background: #111; border: 1px solid #222; color: white; padding: 8px; 
                    border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .btn-icon:hover { background: #1a1a1a; border-color: #ef4444; color: #ef4444; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(10px); }
                .modal-content { background: #0a0a0a; border: 1px solid #222; padding: 30px; border-radius: 20px; width: 450px; }

                @media (max-width: 768px) {
                    .staff-container { padding: 20px; }
                    .header-row { flex-direction: column; gap: 20px; align-items: flex-start !important; }
                }
            `}</style>

            {/* HEADER */}
            <div className="header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h1 style={{margin:0, fontSize:32}}><span style={{color:'#ef4444'}}>ON</span> STAFF</h1>
                    <p style={{color:'#444', margin:'5px 0 0 0'}}>Gestion des présences et fiches techniques</p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{background:'#ef4444', color:'white', border:'none', padding:'12px 25px', borderRadius:12, fontWeight:'bold', cursor:'pointer', display:'flex', gap:10, alignItems:'center'}}>
                    <Plus size={20}/> Nouveau Membre
                </button>
            </div>

            {/* GRID */}
            <div className="staff-grid">
                {staffList.map(staff => (
                    <div key={staff.id} className={`staff-card ${staff.isAbsent ? 'absent' : ''}`}>
                        <div className="status-badge" style={{background: staff.isAbsent ? '#ef4444' : '#10b981', color: 'white'}}>
                            {staff.isAbsent ? 'Absent' : 'Présent'}
                        </div>
                        
                        <div className="avatar-large" style={{background: staff.color, color: 'white'}}>
                            {staff.name.charAt(0)}
                        </div>

                        <h3 style={{margin:'0 0 5px 0', fontSize:20}}>{staff.name}</h3>
                        <p style={{margin:0, color:'#ef4444', fontSize:13, fontWeight:'bold', textTransform:'uppercase'}}>{staff.special}</p>

                        <div style={{marginTop:20, paddingTop:20, borderTop:'1px solid #111', display:'flex', gap:10}}>
                            <button className="btn-icon" onClick={() => toggleAbsence(staff)} title="Signaler Absence">
                                {staff.isAbsent ? <CheckCircle size={18}/> : <Ban size={18}/>}
                            </button>
                            <button className="btn-icon" onClick={() => openNotes(staff)} title="Fiche Technique">
                                <FileText size={18}/>
                            </button>
                            <button className="btn-icon" style={{marginLeft:'auto'}} onClick={() => handleDeleteStaff(staff.id, staff.name)}>
                                <Trash2 size={18} color="#444"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL: ADD STAFF */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:25}}>
                            <h2 style={{margin:0, color:'white'}}>Recruter</h2>
                            <X onClick={() => setShowAddModal(false)} style={{cursor:'pointer'}}/>
                        </div>
                        <form onSubmit={handleAddStaff}>
                            <input placeholder="Nom Complet" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} style={inputStyle} />
                            <input placeholder="Expertise (ex: Coiffeur Styliste)" required value={newStaff.special} onChange={e => setNewStaff({...newStaff, special: e.target.value})} style={inputStyle} />
                            <div style={{display:'flex', gap:10, marginBottom:20}}>
                                {['#ef4444', '#3b82f6', '#a855f7', '#10b981', '#f59e0b'].map(c => (
                                    <div key={c} onClick={() => setNewStaff({...newStaff, color: c})} style={{width:35, height:35, borderRadius:'50%', background:c, cursor:'pointer', border: newStaff.color === c ? '3px solid white' : 'none'}}></div>
                                ))}
                            </div>
                            <button type="submit" style={submitBtnStyle}>Ajouter au staff</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: FICHE TECHNIQUE */}
            {editingNotes && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: 500}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                            <h2 style={{margin:0, color:'#ef4444'}}>Fiche Technique: {editingNotes.name}</h2>
                            <X onClick={() => setEditingNotes(null)} style={{cursor:'pointer'}}/>
                        </div>
                        <textarea 
                            style={{...inputStyle, height: 200, paddingTop:15}} 
                            value={noteText} 
                            onChange={e => setNoteText(e.target.value)} 
                            placeholder="Notes sur la performance, planning spécifique, ou remarques administratives..."
                        />
                        <div style={{display:'flex', gap:10, marginTop:10}}>
                            <button onClick={() => setEditingNotes(null)} style={{...submitBtnStyle, background:'#111', color:'#444'}}>Annuler</button>
                            <button onClick={saveNotes} style={submitBtnStyle}><Save size={18}/> Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = { width: '100%', padding: '15px', marginBottom: '15px', background: '#000', border: '1px solid #222', color: 'white', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' };
const submitBtnStyle = { width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 };