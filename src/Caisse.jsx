import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Trash2, XCircle, List, FileText } from 'lucide-react';

// === CONFIGURATION: Your Live Server URL ===
const API_BASE_URL = 'https://onhair.onrender.com';

const ENVELOPPES = ["Revenus", "Charges Fixes", "Les Produits", "Produit Sorali", "L'Esthétique", "Produit Esthétique"];

export default function Caisse() {
    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState(() => {
        const init = {};
        ENVELOPPES.forEach(cat => init[cat] = 0);
        return init;
    });
    const [soldeTotal, setSoldeTotal] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeFilter, setActiveFilter] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const formRef = useRef(null);

    const [formData, setFormData] = useState({ amount: '', name: '', category: '', type: 'income', notes: '' });

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        try {
            // FIXED: Using the correct live URL
            const res = await fetch(`${API_BASE_URL}/api/expenses`);
            if (!res.ok) return;
            const json = await res.json();
            const data = json.data || [];
            setTransactions(data);
            
            const newTotals = {};
            ENVELOPPES.forEach(cat => newTotals[cat] = 0);
            data.forEach(t => {
                if (t.date === selectedDate) {
                    newTotals[t.category] = (newTotals[t.category] || 0) + (parseFloat(t.amount) || 0);
                }
            });
            setTotals(newTotals);
            setSoldeTotal(data.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0));
        } catch (err) {
            console.error("Failed to load data:", err);
        }
    };

    const handleCardClick = (category) => {
        setActiveFilter(category);
        setFormData({ ...formData, category: category, name: '' });
        setIsFormOpen(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) {
            return alert("Saisir un montant et une catégorie !");
        }
        const finalAmount = formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
        
        const dataToSend = {
            amount: finalAmount,
            name: formData.name || formData.category, // Use 'name' from form, fallback to category
            category: formData.category,
            date: selectedDate,
            notes: formData.notes
        };

        try {
            // FIXED: Using the correct live URL
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });
            if (response.ok) {
                setFormData({ amount: '', name: '', category: '', type: 'income', notes: '' });
                setIsFormOpen(false);
                loadData(); // Reload all data
            } else {
                alert("Erreur lors de la sauvegarde.");
            }
        } catch (err) {
            alert("Erreur de connexion au serveur.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce mouvement ?")) return;
        try {
            // FIXED: Using the correct live URL
            const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadData();
            } else {
                alert("Erreur lors de la suppression (Serveur)");
            }
        } catch (err) {
            alert("Erreur de connexion");
        }
    };

    const displayTransactions = transactions.filter(t => t.date === selectedDate && (activeFilter ? t.category === activeFilter : true));

    return (
        <div className="caisse-container">
            <style>{`
                .caisse-container { padding: 20px; background: #000; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; }
                .card { background: #18181b; padding: 15px; border-radius: 12px; border: 1px solid #27272a; cursor: pointer; transition: 0.2s; }
                .card.active { border-color: #EC4899; background: #2d1421; }
                .cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
                .form-section { background: #18181b; padding: 20px; border-radius: 20px; border: 1px solid #EC4899; margin-bottom: 20px; }
                .input { background: #000; border: 1px solid #333; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px; box-sizing: border-box; font-size:16px; }
                .badge { background: #EC4899; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
            `}</style>

            <div style={{textAlign:'center', marginBottom:20}}>
                <h2 style={{margin:0}}>Caisse OnHair</h2>
                <div style={{background: '#10B981', padding: '5px 15px', borderRadius: 20, display:'inline-block', marginTop:10, fontSize:14}}>
                    SOLDE: <b>{soldeTotal.toLocaleString()} DH</b>
                </div>
            </div>

            <input type="date" style={{background:'#18181b', color:'white', border:'1px solid #333', padding:10, borderRadius:8, width:'100%', marginBottom:20}} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />

            <div className="cards-grid">
                {ENVELOPPES.map(cat => (
                    <div key={cat} className={`card ${activeFilter === cat ? 'active' : ''}`} onClick={() => handleCardClick(cat)}>
                        <div style={{fontSize:10, color: '#9ca3af', textTransform:'uppercase'}}>{cat}</div>
                        <div style={{fontSize:18, fontWeight:'bold', color: (totals[cat] || 0) >= 0 ? '#10B981' : '#EF4444'}}>
                            {(totals[cat] || 0).toLocaleString()} DH
                        </div>
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="form-section" ref={formRef}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                        <h3 style={{margin:0, color:'#EC4899'}}>Saisie: {formData.category}</h3>
                        <XCircle onClick={() => setIsFormOpen(false)} style={{cursor:'pointer', color:'#444'}} />
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div style={{display:'flex', gap:10, marginBottom:10}}>
                            <button type="button" onClick={() => setFormData({...formData, type:'income'})} style={{flex:1, background: formData.type === 'income' ? '#10B981' : '#333', border:'none', padding:10, borderRadius:8, color:'white', fontWeight:'bold'}}>Encaisser (+)</button>
                            <button type="button" onClick={() => setFormData({...formData, type:'expense'})} style={{flex:1, background: formData.type === 'expense' ? '#EF4444' : '#333', border:'none', padding:10, borderRadius:8, color:'white', fontWeight:'bold'}}>Sortie (-)</button>
                        </div>
                        <input className="input" type="number" placeholder="Montant DH" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} autoFocus />
                        <input className="input" type="text" placeholder="Motif (ex: Vente)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <textarea className="input" placeholder="Notes techniques..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} />
                        <button type="submit" style={{width:'100%', padding:15, background:'#EC4899', color:'white', border:'none', borderRadius:10, fontWeight:'bold'}}>VALIDER</button>
                    </form>
                </div>
            )}

            <div style={{background: '#111', padding: 15, borderRadius: 15, border: '1px solid #222'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                    <h3 style={{margin:0, fontSize:15}}>Mouvements du {new Date(selectedDate).toLocaleDateString('fr-FR')}</h3>
                    {activeFilter && <span className="badge" onClick={() => setActiveFilter(null)}>{activeFilter} <XCircle size={12}/></span>}
                </div>
                {displayTransactions.length === 0 ? <p style={{color:'#444', textAlign:'center', padding:'20px 0'}}>Aucun mouvement.</p> : 
                    displayTransactions.map(t => (
                        <div key={t.id} style={{padding: '12px 0', borderBottom: '1px solid #222', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{flex:1}}>
                                <div style={{fontSize:14, fontWeight:'bold'}}>{t.name} <small style={{color:'#EC4899'}}>({t.category})</small></div>
                                {t.notes && <div style={{fontSize:11, color:'#666', fontStyle:'italic', marginTop:5}}><FileText size={10} style={{display:'inline', marginRight:5}}/>{t.notes}</div>}
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                                <b style={{color: t.amount >= 0 ? '#10B981' : '#EF4444'}}>{t.amount} DH</b>
                                <Trash2 size={16} color="#333" cursor="pointer" onClick={() => handleDelete(t.id)} />
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}