import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Trash2, Save, ArrowRight, Calendar } from 'lucide-react';

const ENVELOPPES = [
    "Revenus",
    "Charges Fixes",
    "Les Produits",
    "Produit Sorali",
    "L'Esthétique",
    "Produit Esthétique"
];

export default function Caisse() {
    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState({});
    const [soldeTotal, setSoldeTotal] = useState(0);
    
    // --- NOUVEAU : GESTION DE LA DATE SÉLECTIONNÉE ---
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Formulaire
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Revenus',
        type: 'income'
    });

    useEffect(() => {
        loadData();
    }, [selectedDate]); // Re-calculate when date changes

    const loadData = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/expenses');
            const json = await res.json();
            const data = json.data || [];
            
            setTransactions(data);
            calculateTotals(data);
        } catch (err) {
            console.error(err);
        }
    };

    const calculateTotals = (data) => {
        const newTotals = {};
        ENVELOPPES.forEach(cat => newTotals[cat] = 0);

        data.forEach(t => {
            if (newTotals[t.category] !== undefined) {
                // LOGIQUE MODIFIÉE :
                // 1. "Revenus" : On affiche seulement le total de la DATE CHOISIE
                if (t.category === 'Revenus') {
                    if (t.date === selectedDate) {
                        newTotals['Revenus'] += t.amount;
                    }
                } else {
                    // 2. Autres Enveloppes : On garde le total global (Cagnotte)
                    newTotals[t.category] += t.amount;
                }
            }
        });

        // Solde Total = Toujours la somme de TOUT l'historique (Argent réel en caisse)
        const globalSum = data.reduce((acc, curr) => acc + curr.amount, 0);

        setTotals(newTotals);
        setSoldeTotal(globalSum);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) return alert("Remplissez tout !");

        const finalAmount = formData.type === 'expense' 
            ? -Math.abs(parseFloat(formData.amount)) 
            : Math.abs(parseFloat(formData.amount));

        const newTransaction = {
            category: formData.category,
            name: formData.description,
            amount: finalAmount,
            date: selectedDate // On utilise la date sélectionnée (pratique pour saisir des oublis d'hier)
        };

        try {
            await fetch('http://localhost:3000/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTransaction)
            });
            setFormData({ ...formData, amount: '', description: '' });
            loadData();
        } catch (err) {
            alert("Erreur de sauvegarde");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer cette transaction ?")) return;
        try {
            await fetch(`http://localhost:3000/api/expenses/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) { alert("Erreur"); }
    };

    // --- FILTRER LA LISTE PAR DATE ---
    const filteredTransactions = transactions.filter(t => t.date === selectedDate);

    return (
        <div className="caisse-container">
            <style>{`
                .caisse-container { padding: 30px; background: #000000; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; overflow-y: auto; }
                
                .caisse-header { 
                    margin-bottom: 30px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #27272a;
                }
                
                .cards-grid { 
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr); 
                    gap: 15px; 
                    margin-bottom: 30px; 
                }

                .main-content { display: flex; gap: 30px; align-items: flex-start; }
                .form-section { flex: 1; background: #18181b; padding: 25px; border-radius: 20px; border: 1px solid #27272a; }
                .history-section { flex: 1.5; background: #18181b; padding: 25px; border-radius: 20px; border: 1px solid #27272a; min-height: 500px; display:flex; flex-direction:column; }

                /* DATE PICKER STYLE */
                .date-selector {
                    background: #18181b;
                    color: white;
                    border: 1px solid #374151;
                    padding: 10px 15px;
                    border-radius: 8px;
                    outline: none;
                    cursor: pointer;
                    font-family: inherit;
                    font-weight: bold;
                }

                @media (max-width: 900px) {
                    .caisse-container { padding: 15px; }
                    .caisse-header { flex-direction: column; align-items: flex-start; gap: 20px; }
                    .header-actions { width: 100%; display: flex; flex-direction: column; gap: 10px; }
                    .total-card { width: 100%; box-sizing: border-box; }
                    .cards-grid { grid-template-columns: 1fr; } 
                    .main-content { flex-direction: column; }
                    .form-section, .history-section { width: 100%; box-sizing: border-box; }
                }
            `}</style>
            
            {/* --- HEADER --- */}
            <div className="caisse-header">
                <div>
                    <h1 style={{fontSize:28, fontWeight:'bold', display:'flex', alignItems:'center', gap:10, margin:0}}>
                        <Wallet size={32} color="#EC4899"/> Gestion de Caisse
                    </h1>
                    <div style={{color:'#9ca3af', marginTop:5}}>Sélectionnez une date pour voir l'historique</div>
                </div>

                <div className="header-actions" style={{display:'flex', gap:20, alignItems:'center'}}>
                    {/* SÉLECTEUR DE DATE */}
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <Calendar size={20} color="#EC4899"/>
                        <input 
                            type="date" 
                            className="date-selector"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="total-card" style={styles.totalCard}>
                        <div style={{fontSize:12, textTransform:'uppercase', opacity:0.8}}>Solde Total (Reel)</div>
                        <div style={{fontSize:28, fontWeight:'bold'}}>
                            {soldeTotal.toLocaleString()} <span style={{fontSize:14}}>DH</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ENVELOPES CARDS --- */}
            <div className="cards-grid">
                {ENVELOPPES.map(cat => (
                    <div key={cat} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardTitle}>
                                {cat} {cat === 'Revenus' ? '(Jour Sélectionné)' : ''}
                            </span>
                            {totals[cat] >= 0 ? <TrendingUp size={20} color="#10B981"/> : <TrendingDown size={20} color="#EF4444"/>}
                        </div>
                        <div style={{...styles.cardAmount, color: totals[cat] >= 0 ? '#10B981' : '#EF4444'}}>
                            {totals[cat]} <span style={{fontSize:14}}>DH</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="main-content">
                
                {/* --- FORMULAIRE --- */}
                <div className="form-section">
                    <h3 style={{marginTop:0, borderBottom:'1px solid #333', paddingBottom:10}}>
                        Opération pour le {new Date(selectedDate).toLocaleDateString('fr-FR')}
                    </h3>
                    
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.toggleContainer}>
                            <div 
                                onClick={() => setFormData({...formData, type: 'income'})}
                                style={{...styles.toggleBtn, background: formData.type === 'income' ? '#10B981' : '#27272a'}}
                            >
                                <TrendingUp size={16}/> Ajouter (+)
                            </div>
                            <div 
                                onClick={() => setFormData({...formData, type: 'expense'})}
                                style={{...styles.toggleBtn, background: formData.type === 'expense' ? '#EF4444' : '#27272a'}}
                            >
                                <TrendingDown size={16}/> Déduire (-)
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label>Enveloppe concernée</label>
                            <select 
                                style={styles.input} 
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                {ENVELOPPES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div style={styles.inputGroup}>
                            <label>Montant (DH)</label>
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                style={styles.input}
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label>Motif / Description</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Vente Produits..." 
                                style={styles.input}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <button type="submit" style={styles.submitBtn}>
                            <Save size={18}/> Valider l'opération
                        </button>
                    </form>
                </div>

                {/* --- HISTORIQUE (FILTRÉ PAR DATE) --- */}
                <div className="history-section">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', paddingBottom:10}}>
                        <h3 style={{margin:0}}>Mouvements du {selectedDate}</h3>
                        <span style={{fontSize:12, background:'#333', padding:'4px 8px', borderRadius:4}}>{filteredTransactions.length} Opérations</span>
                    </div>
                    
                    <div style={styles.transactionsList}>
                        {filteredTransactions.length === 0 && (
                            <div style={{opacity:0.5, textAlign:'center', marginTop:50}}>
                                Aucune transaction à cette date.
                            </div>
                        )}
                        
                        {filteredTransactions.map(t => (
                            <div key={t.id} style={styles.transactionItem}>
                                <div style={{display:'flex', gap:15, alignItems:'center'}}>
                                    <div style={{
                                        background: t.amount >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        padding: 10, borderRadius: '50%',
                                        color: t.amount >= 0 ? '#10B981' : '#EF4444'
                                    }}>
                                        {t.amount >= 0 ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                                    </div>
                                    <div>
                                        <div style={{fontWeight:'bold'}}>{t.name}</div>
                                        <div style={{fontSize:12, color:'#9ca3af', display:'flex', alignItems:'center', gap:5}}>
                                            {t.category}
                                        </div>
                                    </div>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:15}}>
                                    <div style={{fontWeight:'bold', color: t.amount >= 0 ? '#10B981' : '#EF4444'}}>
                                        {t.amount > 0 ? '+' : ''}{t.amount} DH
                                    </div>
                                    <button onClick={() => handleDelete(t.id)} style={styles.deleteBtn}>
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

const styles = {
    totalCard: {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        padding: '10px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
        color: 'white',
        minWidth: '200px'
    },
    card: { background: '#18181b', padding: 20, borderRadius: 16, border: '1px solid #27272a' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 13, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
    cardAmount: { fontSize: 24, fontWeight: 'bold' },
    
    form: { display: 'flex', flexDirection: 'column', gap: 15 },
    toggleContainer: { display: 'flex', gap: 10, marginBottom: 10 },
    toggleBtn: { flex: 1, padding: 12, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 'bold', transition:'0.2s' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
    input: { background: '#27272a', border: '1px solid #3f3f46', color: 'white', padding: 12, borderRadius: 8, outline: 'none', width:'100%', boxSizing:'border-box' },
    submitBtn: { marginTop: 10, background: 'white', color: 'black', padding: 12, borderRadius: 8, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 },

    transactionsList: { overflowY: 'auto', flex: 1, paddingRight: 5 },
    transactionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #27272a' },
    deleteBtn: { background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }
};