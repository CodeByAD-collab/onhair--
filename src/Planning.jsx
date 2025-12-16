import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import { Search, Plus, Scissors, ArrowLeft, Calendar, LayoutGrid, List } from 'lucide-react';

import PlanningDay from './PlanningDay';
import PlanningWeek from './PlanningWeek';
import PlanningMonth from './PlanningMonth';
import BookingModal from './BookingModal';
import BookingDetailsModal from './BookingDetailsModal';

moment.locale('fr');

const SERVICE_DURATIONS = {
    "Coloration": 120, "Mèches": 180, "Soin": 60, "Kératine": 90,
    "Mariage": 240, "Maquillage": 60, "Coupe": 45, "Brushing": 30, "Default": 30
};

export default function Planning({ onBack, role }) {
    const [events, setEvents] = useState([]);
    const [resources, setResources] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('day');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => { loadData(); }, [currentDate]);

    const loadData = async () => {
        try {
            const staffRes = await fetch('https://onhair.onrender.com/api/staff');
            const staffJson = await staffRes.json();
            const staffList = (staffJson && staffJson.data) ? staffJson.data : [];
            
            const validStaff = staffList.filter(s => s.name && !s.name.toUpperCase().includes("ASSIGNÉ"));
            const myStaffColumns = validStaff.map(s => ({
                id: s.name, title: s.name, role: s.special,
                emoji: (s.special && s.special.toLowerCase().includes('color')) ? '🎨' : '👤',
                color: s.color || '#EC4899'
            }));
            setResources(myStaffColumns);

            const bookRes = await fetch('https://onhair.onrender.com/api/bookings');
            const bookData = await bookRes.json();
            const rawBookings = (bookData && bookData.data) ? bookData.data : [];

            const formattedEvents = rawBookings.map(booking => {
                if (!booking.date || !booking.time) return null;
                const start = new Date(`${booking.date}T${booking.time}`);
                let duration = SERVICE_DURATIONS["Default"];
                Object.keys(SERVICE_DURATIONS).forEach(key => {
                    if (booking.service_name && booking.service_name.includes(key)) duration = SERVICE_DURATIONS[key];
                });
                const end = moment(start).add(duration, 'minutes').toDate();
                const assignedStaff = myStaffColumns.find(s => s.id === booking.staff);
                return {
                    id: booking.id, title: booking.name || 'Client', service: booking.service_name || 'Service',
                    bgColor: assignedStaff ? assignedStaff.color : '#374151', start, end, resourceId: booking.staff, 
                };
            }).filter(e => e !== null);
            setEvents(formattedEvents);
        } catch (err) { console.error(err); }
    };

    const handleCreateBooking = async (formData) => {
        try {
            await fetch('https://onhair.onrender.com/api/bookings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.clientName, phone: formData.phone, service_name: formData.service, staff: formData.staff, date: formData.date, time: formData.time, price: "0", status: "confirmed" })
            });
            setIsCreateModalOpen(false); loadData();
        } catch (err) { alert("Erreur sauvegarde"); }
    };

    const handleMoveEvent = async (eventId, newStart, newStaffId) => {
        const oldEvents = [...events];
        const updatedEvents = events.map(ev => ev.id == eventId ? { ...ev, start: newStart, end: moment(newStart).add(moment(ev.end).diff(ev.start), 'ms').toDate(), resourceId: newStaffId } : ev);
        setEvents(updatedEvents);
        try {
            await fetch(`https://onhair.onrender.com/api/bookings/${eventId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: moment(newStart).format('YYYY-MM-DD'), time: moment(newStart).format('HH:mm'), staff: newStaffId })
            });
        } catch (err) { alert("Erreur serveur"); setEvents(oldEvents); }
    };

    const handleDeleteEvent = async (id) => {
        try { await fetch(`https://onhair.onrender.com/api/bookings/${id}`, { method: 'DELETE' }); setSelectedEvent(null); loadData(); } catch (err) { alert("Erreur suppression"); }
    };

    return (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000000', zIndex: 9999, display:'flex', flexDirection:'column', fontFamily:'Inter, sans-serif', color:'white'}}>
            
            {/* CSS FOR MOBILE RESPONSIVENESS */}
            <style>{`
                .view-btn-text { display: inline; }
                .top-bar { padding: 0 30px; }
                .add-btn-text { display: inline; }

                @media (max-width: 768px) {
                    .view-btn-text { display: none; } /* Hide text on mobile */
                    .add-btn-text { display: none; } /* Hide text on mobile */
                    .top-bar { padding: 0 10px; } /* Smaller padding */
                    .app-title { display: none; } /* Hide title if space is tight */
                }
            `}</style>

            <div className="top-bar" style={{height: '60px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000000'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                    {role === 'superadmin' && (
                        <button onClick={onBack} style={{background:'#27272a', border:'none', color:'white', padding:8, borderRadius:8, cursor:'pointer'}}><ArrowLeft size={20}/></button>
                    )}
                    <div className="app-title" style={{fontWeight:800, fontSize:18}}>Calendry</div>
                </div>

                <div style={{display:'flex', background:'#27272a', padding:3, borderRadius:8, gap:2}}>
                    <button onClick={() => setCurrentView('day')} style={{...styles.viewBtn, background: currentView === 'day' ? '#52525b' : 'transparent', color: currentView === 'day' ? 'white' : '#9ca3af'}}>
                        <List size={16}/> <span className="view-btn-text">Jour</span>
                    </button>
                    <button onClick={() => setCurrentView('week')} style={{...styles.viewBtn, background: currentView === 'week' ? '#52525b' : 'transparent', color: currentView === 'week' ? 'white' : '#9ca3af'}}>
                        <LayoutGrid size={16}/> <span className="view-btn-text">Semaine</span>
                    </button>
                    <button onClick={() => setCurrentView('month')} style={{...styles.viewBtn, background: currentView === 'month' ? '#52525b' : 'transparent', color: currentView === 'month' ? 'white' : '#9ca3af'}}>
                        <Calendar size={16}/> <span className="view-btn-text">Mois</span>
                    </button>
                </div>

                <div>
                     <button onClick={() => setIsCreateModalOpen(true)} style={{background:'#EC4899', color:'white', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontWeight:'bold', display:'flex', gap:5, alignItems:'center'}}>
                        <Plus size={20}/> <span className="add-btn-text">Nouveau</span>
                     </button>
                </div>
            </div>

            <div style={{flex:1, position:'relative', overflow: 'hidden'}}>
                {currentView === 'day' && (
                    <PlanningDay events={events} resources={resources} date={currentDate} setDate={setCurrentDate} onEventMove={handleMoveEvent} onEventClick={setSelectedEvent} />
                )}
                {currentView === 'week' && (
                    <PlanningWeek events={events} date={currentDate} setDate={setCurrentDate} onEventClick={setSelectedEvent} />
                )}
                {currentView === 'month' && (
                    <PlanningMonth events={events} date={currentDate} setDate={setCurrentDate} onEventClick={setSelectedEvent} />
                )}
            </div>

            <BookingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} staffList={resources} onSave={handleCreateBooking} />
            <BookingDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onDelete={handleDeleteEvent} />
        </div>
    );
}

const styles = {
    viewBtn: { border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontWeight:'600', fontSize:13, display:'flex', alignItems:'center', gap:6 }
}