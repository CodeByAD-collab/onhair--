import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react'; // J'ai ajouté Trash2

export default function Staff({ bookings = [] }) { 
    const [staffList, setStaffList] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', color: '#EC4899', special: '' });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = () => {
        fetch('http://localhost:3000/api/staff')
            .then(res => res.json())
            .then(data => {
                setStaffList(data.data || []);
            })
            .catch(err => console.error("Erreur chargement staff:", err));
    };

    const handleAddStaff = (e) => {
        e.preventDefault();
        fetch('http://localhost:3000/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStaff)
        })
        .then(res => res.json())
        .then(() => {
            fetchStaff(); 
            setShowAddModal(false);
            setNewStaff({ name: '', color: '#EC4899', special: '' });
        });
    };

    // --- FONCTION DE SUPPRESSION ---
    const handleDeleteStaff = (id, name) => {
        if(!window.confirm(`Voulez-vous vraiment supprimer ${name} ?`)) return;
        
        fetch(`http://localhost:3000/api/staff/${id}`, { method: 'DELETE' })
            .then(() => fetchStaff());
    };

    const realStaffData = staffList.map(staff => {
        return { ...staff, dayOff: "Lundi", title: staff.name };
    });

    return (
        <div className="staff-container">
            {/* --- RESPONSIVE CSS --- */}
            <style>{`
                .staff-container { padding: 30px; color: white; background: #0B0F19; min-height: 100%; font-family: 'Inter', sans-serif; overflow-y: auto; }
                
                /* HEADER */
                .staff-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 30px;
                }
                
                /* GRID SYSTEM (2 COLONNES) */
                .staff-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 24px; 
                }

                /* CARD STYLES */
                .staff-card { 
                    background: #151E2E; 
                    padding: 24px; 
                    border-radius: 20px; 
                    border: 1px solid #374151; 
                }

                /* DELETE BUTTON */
                .delete-btn {
                    background: rgba(239, 68, 68, 0.1); 
                    color: #EF4444; 
                    border: none; 
                    padding: 8px; 
                    border-radius: 8px; 
                    cursor: pointer;
                    transition: 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .delete-btn:hover {
                    background: rgba(239, 68, 68, 0.3);
                }

                /* --- MOBILE (Max 900px) --- */
                @media (max-width: 900px) {
                    .staff-container { padding: 15px; }
                    .staff-header { flex-direction: column; align-items: flex-start; gap: 15px; }
                    .staff-grid { grid-template-columns: 1fr; }
                }
            `}</style>
            
            {/* HEADER */}
            <div className="staff-header">
                <div>
                    <h1 style={{fontSize:28, fontWeight:800, margin:0}}>Gestion Staff</h1>
                    <span style={{color:'#9CA3AF', fontSize:14}}>Gérez votre équipe</span>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:'10px', background:'linear-gradient(90deg, #EC4899 0%, #8B5CF6 100%)', color:'white', border:'none', fontWeight:700, cursor:'pointer'}}>
                    <Plus size={18}/> Nouveau Membre
                </button>
            </div>
            
            {/* GRID CONTENT */}
            <div className="staff-grid">
                
                {/* 1. LISTE MEMBRES (AVEC SUPPRESSION) */}
                <div className="staff-card">
                    <h3 style={{ margin: 0, fontSize:16, fontWeight:700, paddingBottom:15, borderBottom:'1px solid #374151' }}>Membres & Repos</h3>
                    {realStaffData.map(staff => (
                        <div key={staff.id} style={{ display:'flex', alignItems:'center', gap:15, marginTop:20 }}>
                            <div style={{width:40, height:40, borderRadius:'50%', background: staff.color, display:'flex', justifyContent:'center', alignItems:'center', fontWeight:700}}>{staff.title.charAt(0)}</div>
                            <div style={{flex:1}}>
                                <div style={{ fontWeight: '600' }}>{staff.title}</div>
                                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{staff.dayOff}</div>
                            </div>
                            
                            {/* BOUTON SUPPRIMER ICI */}
                            <button className="delete-btn" onClick={() => handleDeleteStaff(staff.id, staff.name)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* 2. EXPERTISE */}
                <div className="staff-card">
                    <h3 style={{ margin: 0, fontSize:16, fontWeight:700, paddingBottom:15, borderBottom:'1px solid #374151' }}>Expertise</h3>
                    {realStaffData.map(staff => (
                        <div key={staff.id} style={{ display:'flex', alignItems:'center', gap:15, marginTop:20 }}>
                            <div style={{width:40, height:40, borderRadius:'50%', background: staff.color, display:'flex', justifyContent:'center', alignItems:'center', fontWeight:700}}>{staff.title.charAt(0)}</div>
                            <div style={{flex:1}}>
                                <div style={{ fontWeight: '600' }}>{staff.title}</div>
                                <span style={{ display:'inline-block', marginTop:4, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}>{staff.special}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL ADD */}
            {showAddModal && (
                <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                    <div style={{background:'#1F2937', padding:30, borderRadius:20, width:400, margin:20}}>
                        <h2 style={{marginTop:0}}>Nouveau Staff</h2>
                        <form onSubmit={handleAddStaff}>
                            <input required placeholder="Nom" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} style={{width:'100%', padding:12, marginBottom:15, background:'#111827', border:'1px solid #374151', color:'white', borderRadius:8, boxSizing:'border-box'}} />
                            <input required placeholder="Spécialité" value={newStaff.special} onChange={e => setNewStaff({...newStaff, special: e.target.value})} style={{width:'100%', padding:12, marginBottom:15, background:'#111827', border:'1px solid #374151', color:'white', borderRadius:8, boxSizing:'border-box'}} />
                            <div style={{display:'flex', gap:10, marginBottom:20}}>
                                {['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(c => (
                                    <div key={c} onClick={() => setNewStaff({...newStaff, color: c})} style={{width:30, height:30, borderRadius:'50%', background:c, cursor:'pointer', border: newStaff.color === c ? '2px solid white' : 'none'}}></div>
                                ))}
                            </div>
                            <div style={{display:'flex', gap:10}}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{flex:1, padding:12, background:'transparent', color:'#9CA3AF', border:'1px solid #374151', borderRadius:8, cursor:'pointer'}}>Annuler</button>
                                <button type="submit" style={{flex:1, padding:12, background:'linear-gradient(90deg, #EC4899 0%, #8B5CF6 100%)', color:'white', border:'none', borderRadius:8, cursor:'pointer'}}>Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}