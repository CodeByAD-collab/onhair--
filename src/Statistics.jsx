import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Users, UserCheck, UserX, TrendingUp, Calendar, Briefcase } from 'lucide-react';

export default function Statistics() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://onhair.onrender.com/api/bookings')
            .then(res => res.json())
            .then(json => {
                setData(json.data || []);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    // LOGIC CALCULATIONS
    const totalBookings = data.length;
    const confirmed = data.filter(b => b.status === 'confirmed').length;
    const noShows = data.filter(b => b.status === 'cancelled').length;

    // Staff breakdown logic
    const staffStats = data.reduce((acc, b) => {
        const name = b.staff || 'Non assigné';
        if (!acc[name]) acc[name] = { total: 0, ok: 0, fail: 0 };
        acc[name].total++;
        if (b.status === 'confirmed') acc[name].ok++;
        if (b.status === 'cancelled') acc[name].fail++;
        return acc;
    }, {});

    if (loading) return <div style={styles.loader}>Chargement des données...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{margin:0, fontSize:32}}><span style={{color:'#ef4444'}}>ON</span> STATISTICS</h1>
                <p style={{color:'#444', marginTop:5}}>Analyse de performance en temps réel</p>
            </div>

            {/* MAIN NUMBERS ROW */}
            <div style={styles.grid}>
                <div style={styles.statCard}>
                    <div style={styles.iconBox}><Users color="#fff"/></div>
                    <div>
                        <div style={styles.statLabel}>Total Clients</div>
                        <div style={styles.statNumber}>{totalBookings}</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{...styles.iconBox, background:'#10b981'}}><UserCheck color="#fff"/></div>
                    <div>
                        <div style={styles.statLabel}>Présents / Confirmés</div>
                        <div style={styles.statNumber}>{confirmed}</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{...styles.iconBox, background:'#ef4444'}}><UserX color="#fff"/></div>
                    <div>
                        <div style={styles.statLabel}>Absents (Ne sont pas venus)</div>
                        <div style={{...styles.statNumber, color:'#ef4444'}}>{noShows}</div>
                    </div>
                </div>
            </div>

            {/* STAFF BREAKDOWN SECTION */}
            <h3 style={{marginTop:50, marginBottom:20, fontSize:20}}>Performance par Staff</h3>
            <div style={styles.grid}>
                {Object.keys(staffStats).map(name => (
                    <div key={name} style={styles.staffCard}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                            <span style={{fontWeight:'bold', fontSize:18}}>{name}</span>
                            <Briefcase size={16} color="#ef4444"/>
                        </div>
                        <div style={styles.staffRow}>
                            <span>Confirmés</span>
                            <span style={{color:'#10b981', fontWeight:'bold'}}>{staffStats[name].ok}</span>
                        </div>
                        <div style={styles.staffRow}>
                            <span>Annulés</span>
                            <span style={{color:'#ef4444', fontWeight:'bold'}}>{staffStats[name].fail}</span>
                        </div>
                        <div style={{...styles.staffRow, borderTop:'1px solid #111', marginTop:10, paddingTop:10}}>
                            <span>Total</span>
                            <span style={{fontWeight:'bold'}}>{staffStats[name].total}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: { background: '#000', minHeight: '100vh', padding: '40px', color: 'white', fontFamily: 'Inter, sans-serif' },
    header: { marginBottom: '40px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '30px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' },
    iconBox: { width: '50px', height: '50px', borderRadius: '12px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: '13px', color: '#444', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' },
    statNumber: { fontSize: '32px', fontWeight: '900', marginTop: '5px' },
    staffCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '25px', borderRadius: '20px' },
    staffRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#aaa' },
    loader: { background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold' }
};