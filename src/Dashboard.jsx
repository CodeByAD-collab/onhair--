import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import moment from 'moment'; // CETTE LIGNE ÉTAIT MANQUANTE

export default function Dashboard() {
    const [stats, setStats] = useState({ 
        revenueToday: 0, 
        appointmentsToday: 0, 
        staffPerformance: [], 
        nextClient: null, 
        recentBookings: [] 
    });

    useEffect(() => { 
        loadDashboardData(); 
    }, []);

    const loadDashboardData = async () => {
        try {
            // Utilisation de l'adresse locale
            const res = await fetch('https://onhair.onrender.com/api/bookings');
            const data = await res.json();
            const bookings = data.data || [];
            
            // Correction de la date pour correspondre au fuseau horaire local (Maroc)
            const today = new Date();
            const offset = today.getTimezoneOffset();
            const localToday = new Date(today.getTime() - (offset * 60 * 1000));
            const todayStr = localToday.toISOString().split('T')[0];

            // Filtrage des réservations d'aujourd'hui
            const todayBookings = bookings.filter(b => {
                const bookingDate = b.date && b.date.includes('T') ? b.date.split('T')[0] : b.date;
                return bookingDate === todayStr;
            });

            // Calcul du chiffre d'affaires du jour
            const revenue = todayBookings.reduce((a, c) => a + (parseFloat(c.price) || 0), 0);
            
            // Performance du staff
            const staffCount = {};
            todayBookings.forEach(b => {
                if (b.staff) {
                    staffCount[b.staff] = (staffCount[b.staff] || 0) + 1;
                }
            });
            const staffPerf = Object.keys(staffCount).map(n => ({ name: n, count: staffCount[n] }));

            // Calcul du prochain client
            const nowTime = new Date().toTimeString().substring(0, 5);
            const nextC = todayBookings
                .filter(b => b.time >= nowTime)
                .sort((a, b) => a.time.localeCompare(b.time))[0];

            setStats({
                revenueToday: revenue,
                appointmentsToday: todayBookings.length,
                staffPerformance: staffPerf,
                nextClient: nextC,
                recentBookings: bookings.slice(0, 10) 
            });
        } catch (e) { 
            console.error("Erreur Dashboard:", e); 
        }
    };

    return (
        <div className="dashboard-container">
            <style>{`
                .dashboard-container { padding: 20px; background: #000; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; }
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
                .bottom-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
                
                @media (max-width: 900px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .bottom-grid { grid-template-columns: 1fr; }
                }

                .stat-card { background: #18181b; border-radius: 16px; padding: 20px; border: 1px solid #27272a; position: relative; overflow: hidden; }
                .table-container { overflow-x: auto; background: #18181b; padding: 15px; border-radius: 16px; border: 1px solid #27272a; }
                table { width: 100%; border-collapse: collapse; min-width: 500px; }
                th { text-align: left; color: #888; font-size: 12px; border-bottom: 1px solid #333; padding-bottom: 10px; text-transform: uppercase; }
                td { padding: 12px 0; border-bottom: 1px solid #27272a; font-size: 14px; }
                
                .progress-bg { height: 6px; background: #333; border-radius: 5px; width: 100%; margin-top: 5px; }
                .progress-bar { height: 100%; background: #EC4899; border-radius: 5px; transition: width 0.5s ease; }
            `}</style>

            <h1 style={{ marginTop: 0, marginBottom: 5 }}>Tableau de Bord</h1>
            <p style={{ color: '#666', marginBottom: 20 }}>Aujourd'hui chez OnHair</p>

            <div className="stats-grid">
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>CHIFFRE D'AFFAIRES (JOUR)</div>
                    <div className="card-value" style={{ fontSize: 32, fontWeight: 'bold', marginTop: 5 }}>{stats.revenueToday.toLocaleString()} MAD</div>
                    <TrendingUp size={80} color="white" style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.2 }} />
                </div>

                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ background: '#27272a', padding: 12, borderRadius: 10 }}>
                        <Calendar size={24} color="#EC4899" />
                    </div>
                    <div>
                        <div className="card-value" style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.appointmentsToday}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>Rendez-vous aujourd'hui</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 'bold', marginBottom: 5, display: 'flex', gap: 5, alignItems: 'center' }}>
                        <Clock size={14} /> PROCHAIN CLIENT
                    </div>
                    {stats.nextClient ? (
                        <>
                            <div style={{ fontWeight: 'bold', fontSize: 18 }}>{stats.nextClient.name}</div>
                            <div style={{ color: '#888', fontSize: 13 }}>{stats.nextClient.service_name} à {stats.nextClient.time}</div>
                        </>
                    ) : (
                        <div style={{ color: '#555', fontStyle: 'italic', marginTop: 10 }}>Aucun autre RDV prévu</div>
                    )}
                </div>
            </div>

            <div className="bottom-grid">
                <div className="stat-card">
                    <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Performance Staff (Jour)</h3>
                    {stats.staffPerformance.length === 0 ? (
                        <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>Aucune donnée aujourd'hui</div>
                    ) : (
                        stats.staffPerformance.map((s, i) => (
                            <div key={i} style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 14 }}>{s.name}</span>
                                    <span style={{ color: '#EC4899', fontWeight: 'bold', fontSize: 14 }}>{s.count} RDV</span>
                                </div>
                                <div className="progress-bg">
                                    <div 
                                        className="progress-bar" 
                                        style={{ width: `${(s.count / (stats.appointmentsToday || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="table-container">
                    <h3 style={{ marginTop: 0, marginBottom: 15, fontSize: 16 }}>Dernières Réservations</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>HEURE / DATE</th>
                                <th>CLIENT</th>
                                <th>SERVICE</th>
                                <th>STAFF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentBookings.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#555', padding: '20px' }}>Aucune réservation trouvée</td></tr>
                            ) : (
                                stats.recentBookings.map(b => (
                                    <tr key={b.id}>
                                        <td>
                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{b.time}</div>
                                            <div style={{ fontSize: 11, color: '#666' }}>{moment(b.date).format('DD/MM/YYYY')}</div>
                                        </td>
                                        <td>{b.name}</td>
                                        <td>
                                            <span style={{ background: '#27272a', padding: '4px 8px', borderRadius: 6, fontSize: 12, border: '1px solid #333' }}>
                                                {b.service_name}
                                            </span>
                                        </td>
                                        <td style={{ color: '#EC4899', fontWeight: 'bold' }}>{b.staff}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}