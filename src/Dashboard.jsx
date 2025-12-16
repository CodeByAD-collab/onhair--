import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({ revenueToday: 0, appointmentsToday: 0, staffPerformance: [], nextClient: null, recentBookings: [] });

    useEffect(() => { loadDashboardData(); }, []);

    const loadDashboardData = async () => {
        try {
            const res = await fetch('https://onhair.onrender.com/api/bookings');
            const data = await res.json();
            const bookings = data.data || [];
            const todayStr = new Date().toISOString().split('T')[0];
            const todayBookings = bookings.filter(b => b.date === todayStr);
            const revenue = todayBookings.reduce((a, c) => a + (parseFloat(c.price) || 0), 0);
            
            const staffCount = {};
            todayBookings.forEach(b => staffCount[b.staff] = (staffCount[b.staff] || 0) + 1);
            const staffPerf = Object.keys(staffCount).map(n => ({ name: n, count: staffCount[n] }));
            const nextC = todayBookings.filter(b => b.time >= new Date().toTimeString().substring(0,5)).sort((a,b) => a.time.localeCompare(b.time))[0];

            setStats({
                revenueToday: revenue,
                appointmentsToday: todayBookings.length,
                staffPerformance: staffPerf,
                nextClient: nextC,
                recentBookings: bookings.slice(0, 10)
            });
        } catch (e) { console.error(e); }
    };

    return (
        <div className="dashboard-container">
            <style>{`
                .dashboard-container { padding: 20px; }
                
                /* Default Grid (PC) */
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
                .bottom-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
                
                /* MOBILE STYLES (Max 900px) */
                @media (max-width: 900px) {
                    .stats-grid { grid-template-columns: 1fr; } /* Stack 1 column */
                    .bottom-grid { grid-template-columns: 1fr; } /* Stack 1 column */
                    .card-value { font-size: 24px !important; }
                    h1 { font-size: 24px !important; }
                }

                .stat-card { background: #18181b; border-radius: 16px; padding: 20px; border: 1px solid #27272a; position: relative; overflow: hidden; }
                .table-container { overflow-x: auto; background: #18181b; padding: 15px; border-radius: 16px; border: 1px solid #27272a; }
                table { width: 100%; border-collapse: collapse; min-width: 500px; }
                th { text-align: left; color: #888; font-size: 12px; border-bottom: 1px solid #333; padding-bottom: 10px; }
                td { padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 14px; }
            `}</style>

            <h1 style={{marginTop:0, marginBottom: 5}}>Tableau de Bord</h1>
            <p style={{color:'#666', marginBottom: 20}}>Aujourd'hui chez OnHair</p>

            <div className="stats-grid">
                {/* Revenue */}
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}}>
                    <div style={{fontSize:12, fontWeight:'bold', color:'rgba(255,255,255,0.8)'}}>CHIFFRE D'AFFAIRES (JOUR)</div>
                    <div className="card-value" style={{fontSize:32, fontWeight:'bold', marginTop:5}}>{stats.revenueToday} MAD</div>
                    <TrendingUp size={80} color="white" style={{position:'absolute', right:-10, bottom:-10, opacity:0.2}}/>
                </div>

                {/* RDV Count */}
                <div className="stat-card" style={{display:'flex', alignItems:'center', gap:15}}>
                    <div style={{background:'#27272a', padding:12, borderRadius:10}}><Calendar size={24} color="#EC4899"/></div>
                    <div>
                        <div className="card-value" style={{fontSize:28, fontWeight:'bold'}}>{stats.appointmentsToday}</div>
                        <div style={{fontSize:12, color:'#888'}}>Rendez-vous aujourd'hui</div>
                    </div>
                </div>

                {/* Next Client */}
                <div className="stat-card">
                    <div style={{color:'#8B5CF6', fontSize:12, fontWeight:'bold', marginBottom:5, display:'flex', gap:5, alignItems:'center'}}><Clock size={14}/> PROCHAIN CLIENT</div>
                    {stats.nextClient ? (
                        <>
                            <div style={{fontWeight:'bold', fontSize:18}}>{stats.nextClient.name}</div>
                            <div style={{color:'#888', fontSize:13}}>{stats.nextClient.service_name} à {stats.nextClient.time}</div>
                        </>
                    ) : <div style={{color:'#555', fontStyle:'italic'}}>Aucun autre RDV</div>}
                </div>
            </div>

            <div className="bottom-grid">
                {/* Performance */}
                <div className="stat-card">
                    <h3>Performance Staff (Jour)</h3>
                    {stats.staffPerformance.map((s, i) => (
                        <div key={i} style={{marginBottom:15}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                                <span>{s.name}</span>
                                <span style={{color:'#EC4899', fontWeight:'bold'}}>{s.count} RDV</span>
                            </div>
                            <div style={{height:6, background:'#333', borderRadius:5, width:'100%'}}>
                                <div style={{height:'100%', width:`${(s.count/stats.appointmentsToday)*100}%`, background:'#EC4899', borderRadius:5}}></div>
                            </div>
                        </div>
                    ))}
                    {stats.staffPerformance.length === 0 && <div style={{color:'#555'}}>Rien aujourd'hui</div>}
                </div>

                {/* Table */}
                <div className="table-container">
                    <h3>Dernières Réservations</h3>
                    <table>
                        <thead><tr><th>HEURE/CLIENT</th><th>SERVICE</th><th>STAFF</th></tr></thead>
                        <tbody>
                            {stats.recentBookings.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div style={{fontWeight:'bold'}}>{b.date} <span style={{color:'#666'}}>{b.time}</span></div>
                                        <div style={{fontSize:12}}>{b.name}</div>
                                    </td>
                                    <td><span style={{background:'#333', padding:'2px 6px', borderRadius:4, fontSize:11}}>{b.service_name}</span></td>
                                    <td style={{color:'#EC4899', fontWeight:'bold'}}>{b.staff}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}