import React, { useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';
import moment from 'moment';

const STAFF_LIST = ["Nabil", "Fahd", "Nezha"];

export default function Dashboard() {
    const [stats, setStats] = useState({ 
        appointmentsToday: 0, 
        groupedBookings: { "Nabil": [], "Fahd": [], "Nezha": [], "Autres": [] }
    });

    useEffect(() => { 
        loadDashboardData(); 
        const interval = setInterval(loadDashboardData, 30000); 
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            const res = await fetch('https://onhair.onrender.com/api/bookings');
            const data = await res.json();
            const bookings = data.data || [];
            const todayStr = moment().format('YYYY-MM-DD');

            const todayBookings = bookings.filter(b => {
                const bDate = b.date && b.date.includes('T') ? b.date.split('T')[0] : b.date;
                return bDate === todayStr;
            });

            const groups = { "Nabil": [], "Fahd": [], "Nezha": [], "Autres": [] };
            todayBookings.forEach(b => {
                const staffName = b.staff || "Autres";
                const matchingStaff = STAFF_LIST.find(s => staffName.toLowerCase().includes(s.toLowerCase()));
                if (matchingStaff) groups[matchingStaff].push(b);
                else groups["Autres"].push(b);
            });

            Object.keys(groups).forEach(key => groups[key].sort((a, b) => a.time.localeCompare(b.time)));

            setStats({
                appointmentsToday: todayBookings.length,
                groupedBookings: groups
            });
        } catch (e) { console.error("Erreur Dashboard:", e); }
    };

    return (
        <div className="dashboard-container">
            <style>{`
                .dashboard-container { padding: 40px; background: #050505; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; }
                .dash-header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #1a1a1a; padding-bottom: 20px; }
                .dash-title { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin: 0; background: linear-gradient(to right, #fff, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .staff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
                @media (max-width: 1100px) { .staff-grid { grid-template-columns: 1fr; } }

                .staff-card { background: #0a0a0a; border-radius: 24px; border: 1px solid #1a1a1a; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden; }
                .staff-card:hover { border-color: #ef4444; transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                
                .staff-header { padding: 25px; background: linear-gradient(180deg, #111 0%, #0a0a0a 100%); display: flex; flex-direction: column; gap: 5px; border-bottom: 1px solid #1a1a1a; }
                .staff-name { font-weight: 800; font-size: 20px; color: #fff; letter-spacing: 0.5px; }
                .staff-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ef4444; font-weight: 700; text-transform: uppercase; }

                .booking-list { padding: 20px; max-height: 500px; overflow-y: auto; }
                .booking-item { background: #111; padding: 16px; border-radius: 16px; margin-bottom: 12px; border: 1px solid #1a1a1a; transition: background 0.2s; }
                .booking-item:hover { background: #151515; }
                
                .booking-time { color: #d4af37; font-weight: 800; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
                .booking-client { font-weight: 600; font-size: 16px; color: #fff; text-transform: capitalize; }
                .booking-service { color: #555; font-size: 13px; margin-top: 5px; display: block; }

                .empty-state { padding: 60px 20px; text-align: center; color: #222; font-size: 14px; font-weight: 500; }
                .total-badge { background: #111; border: 1px solid #1a1a1a; padding: 8px 16px; border-radius: 100px; font-size: 12px; font-weight: 700; color: #666; }
                .total-badge b { color: #ef4444; margin-right: 4px; }
            `}</style>

            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Planning du Jour</h1>
                    <div style={{ color: '#444', fontSize: '14px', marginTop: '5px', fontWeight: 500 }}>
                        {moment().format('dddd D MMMM YYYY')}
                    </div>
                </div>
                <div className="total-badge">
                    <b>{stats.appointmentsToday}</b> RÉSERVATIONS AU TOTAL
                </div>
            </div>

            <div className="staff-grid">
                {STAFF_LIST.map(staffName => (
                    <div key={staffName} className="staff-card">
                        <div className="staff-header">
                            <div className="staff-meta">
                                <Users size={12} /> {stats.groupedBookings[staffName].length} RDV aujourd'hui
                            </div>
                            <span className="staff-name">{staffName}</span>
                        </div>
                        <div className="booking-list">
                            {stats.groupedBookings[staffName].length > 0 ? (
                                stats.groupedBookings[staffName].map((b, idx) => (
                                    <div key={idx} className="booking-item">
                                        <div className="booking-time">
                                            <Clock size={14} /> {b.time}
                                        </div>
                                        <div className="booking-client">{b.name}</div>
                                        <span className="booking-service">{b.service_name}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">Planning disponible</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom section for unassigned bookings */}
            {stats.groupedBookings["Autres"].length > 0 && (
                <div style={{ marginTop: '50px' }}>
                    <h3 style={{ fontSize: '12px', color: '#333', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Non Assignés</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {stats.groupedBookings["Autres"].map((b, idx) => (
                            <div key={idx} className="booking-item" style={{ borderLeft: '2px solid #ef4444' }}>
                                <div className="booking-time"><Clock size={14} /> {b.time}</div>
                                <div className="booking-client">{b.name}</div>
                                <span className="booking-service">{b.service_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}