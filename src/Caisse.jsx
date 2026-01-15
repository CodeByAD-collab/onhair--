import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Trash2, XCircle, FileText, Plus, Minus, ArrowRight } from 'lucide-react';

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

    useEffect(() => { loadData(); }, [selectedDate]);

    const loadData = async () => {
        try {
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
        } catch (err) { console.error("Failed to load data:", err); }
    };

    const handleCardClick = (category) => {
        setActiveFilter(category);
        setFormData({ ...formData, category: category, name: '' });
        setIsFormOpen(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) return alert("Saisir un montant !");
        const finalAmount = formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount));
        const dataToSend = { amount: finalAmount, name: formData.name || formData.category, category: formData.category, date: selectedDate, notes: formData.notes };
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });
            if (response.ok) {
                setFormData({ amount: '', name: '', category: '', type: 'income', notes: '' });
                setIsFormOpen(false);
                loadData();
            }
        } catch (err) { alert("Erreur serveur."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce mouvement ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) loadData();
        } catch (err) { alert("Erreur suppression."); }
    };

    const displayTransactions = transactions.filter(t => t.date === selectedDate && (activeFilter ? t.category === activeFilter : true));

    return (
        <div className="caisse-container">
            <style>{`
                .caisse-container { padding: 40px; background: #000; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; max-width: 900px; margin: 0 auto; }
                .caisse-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .solde-panel { background: linear-gradient(135deg, #111 0%, #050505 100%); padding: 25px; border-radius: 24px; border: 1px solid #1a1a1a; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
                .solde-label { color: #52525b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
                .solde-value { color: #d4af37; font-size: 32px; font-weight: 900; }
                
                .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 40px; }
                .cat-card { background: #0a0a0a; padding: 20px; border-radius: 20px; border: 1px solid #1a1a1a; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .cat-card:hover { border-color: #ef4444; transform: scale(1.02); }
                .cat-card.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
                .cat-name { color: #52525b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; }
                .cat-amount { font-size: 20px; font-weight: 900; color: #fff; }

                .form-overlay { background: rgba(0,0,0,0.9); position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(10px); }
                .modern-form { background: #0a0a0a; width: 90%; maxWidth: 450px; padding: 30px; border-radius: 28px; border: 1px solid #1a1a1a; box-shadow: 0 40px 100px rgba(0,0,0,0.8); }
                .type-toggle { display: flex; gap: 10px; margin-bottom: 25px; background: #111; padding: 5px; border-radius: 14px; }
                .toggle-btn { flex: 1; padding: 12px; border-radius: 10px; border: none; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.3s; }
                
                .modern-input { background: #111; border: 1px solid #1a1a1a; color: white; padding: 16px; border-radius: 14px; width: 100%; margin-bottom: 15px; font-size: 16px; outline: none; }
                .modern-input:focus { border-color: #ef4444; }
                .submit-btn { width: 100%; padding: 18px; background: #ef4444; color: white; border: none; border-radius: 14px; font-weight: 900; cursor: pointer; }

                .history-panel { background: #050505; border-radius: 24px; border: 1px solid #1a1a1a; padding: 30px; }
                .history-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #111; }
                .history-item:last-child { border: none; }
            `}</style>

            <div className="caisse-header">
                <h1 style={{fontSize: '28px', fontWeight: '900', margin: 0}}>Caisse OnHair</h1>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
                       style={{background: '#0a0a0a', border: '1px solid #1a1a1a', color: 'white', padding: '10px 15px', borderRadius: '12px', outline: 'none'}} />
            </div>

            <div className="solde-panel">
                <div>
                    <div className="solde-label">Solde Global</div>
                    <div className="solde-value">{soldeTotal.toLocaleString()} DH</div>
                </div>
                <Wallet size={40} color="#1a1a1a" />
            </div>

            <div className="cards-grid">
                {ENVELOPPES.map(cat => (
                    <div key={cat} className={`cat-card ${activeFilter === cat ? 'active' : ''}`} onClick={() => handleCardClick(cat)}>
                        <div className="cat-name">{cat}</div>
                        <div className="cat-amount">{(totals[cat] || 0).toLocaleString()} <small style={{fontSize:'10px', color: '#52525b'}}>DH</small></div>
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="form-overlay" onClick={() => setIsFormOpen(false)}>
                    <div className="modern-form" onClick={e => e.stopPropagation()} ref={formRef}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom: 25}}>
                            <h3 style={{margin:0, color: '#fff'}}>{formData.category}</h3>
                            <XCircle onClick={() => setIsFormOpen(false)} style={{cursor:'pointer', color:'#3f3f46'}} />
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="type-toggle">
                                <button type="button" className="toggle-btn" onClick={() => setFormData({...formData, type:'income'})} style={{background: formData.type === 'income' ? '#10B981' : 'transparent', color: formData.type === 'income' ? 'black' : '#52525b'}}>Encaisser (+)</button>
                                <button type="button" className="toggle-btn" onClick={() => setFormData({...formData, type:'expense'})} style={{background: formData.type === 'expense' ? '#ef4444' : 'transparent', color: formData.type === 'expense' ? 'white' : '#52525b'}}>Sortie (-)</button>
                            </div>
                            <input className="modern-input" type="number" placeholder="Montant DH" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} autoFocus />
                            <input className="modern-input" type="text" placeholder="Motif de l'opération" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <button type="submit" className="submit-btn">VALIDER L'OPÉRATION</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="history-panel">
                <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
                    <h3 style={{margin:0, fontSize: '14px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '1px'}}>Flux de Trésorerie</h3>
                    {activeFilter && <span style={{color: '#ef4444', fontSize: '11px', fontWeight: '800', cursor: 'pointer'}} onClick={() => setActiveFilter(null)}>RÉINITIALISER</span>}
                </div>
                {displayTransactions.length === 0 ? <p style={{color:'#1a1a1a', textAlign:'center', padding:'40px 0'}}>Aucun mouvement pour cette date.</p> : 
                    displayTransactions.map(t => (
                        <div key={t.id} className="history-item">
                            <div>
                                <div style={{fontSize: '15px', fontWeight: '700'}}>{t.name}</div>
                                <div style={{fontSize: '11px', color: '#52525b', marginTop: '4px'}}>{t.category}</div>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:20}}>
                                <b style={{color: t.amount >= 0 ? '#10B981' : '#ef4444', fontSize: '16px', fontWeight: '900'}}>{t.amount > 0 ? '+' : ''}{t.amount} DH</b>
                                <Trash2 size={16} color="#1a1a1a" style={{cursor: 'pointer'}} onClick={() => handleDelete(t.id)} />
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}