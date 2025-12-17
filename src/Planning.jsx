import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import { ArrowLeft, Calendar, LayoutGrid, List, Plus } from 'lucide-react';

import PlanningDay from './PlanningDay';
import PlanningWeek from './PlanningWeek';
import PlanningMonth from './PlanningMonth';
import BookingModal from './BookingModal';

moment.locale('fr');

export default function Planning({ onBack, role }) {
    const [events, setEvents] = useState([]);
    const [resources, setResources] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('day');
    const [modalInitialData, setModalInitialData] = useState(null);

    const loadData = useCallback(async (dateToLoad) => {
        try {
            const staffRes = await fetch('https://onhair.onrender.com/api/staff');
            const staffJson = await staffRes.json();
            const staffList = (staffJson?.data) ? staffJson.data : [];
            const validStaff = staffList.filter(s => s.name && !s.name.toUpperCase().includes("ASSIGNÉ"));
            const myStaffColumns = validStaff.map(s => ({ id: s.name, title: s.name, role: s.special, emoji: (s.special?.toLowerCase().includes('color')) ? '🎨' : '👤', color: s.color || '#EC4899' }));
            setResources(myStaffColumns);
            const formattedDate = moment(dateToLoad).format('YYYY-MM-DD');
            const bookRes = await fetch(`https://onhair.onrender.com/api/bookings?date=${formattedDate}`);
            const bookData = await bookRes.json();
            const rawBookings = (bookData?.data) ? bookData.data : [];
            const formattedEvents = rawBookings.map(booking => {
                if (!booking.date || !booking.time) return null;
                const start = new Date(`${booking.date}T${booking.time}`);
                const duration = booking.duration || 60;
                const end = moment(start).add(duration, 'minutes').toDate();
                return { id: booking.id, title: booking.name || 'Client', service: booking.service_name || 'Service', start, end, resourceId: booking.staff, phone: booking.phone, duration: duration };
            }).filter(e => e !== null);
            setEvents(formattedEvents);
        } catch (err) { console.error("Failed to load data:", err); setEvents([]); }
    }, []);

    // --- FIX: Vider les événements immédiatement quand la date change ---
    useEffect(() => {
        setEvents([]); // Étape 1: Vider l'écran
        const timer = setTimeout(() => {
            loadData(currentDate); // Étape 2: Charger les nouvelles données
        }, 50); // Petit délai pour laisser l'interface se mettre à jour
        return () => clearTimeout(timer); // Nettoyage
    }, [currentDate, loadData]);

    const handleSaveBooking = async (formData) => {
        const dataToSend = { name: formData.clientName, phone: formData.phone, service_name: formData.service, staff: formData.staff, date: formData.date, time: formData.time, duration: formData.duration, price: "0", status: "confirmed" };
        const url = formData.id ? `https://onhair.onrender.com/api/bookings/${formData.id}` : 'https://onhair.onrender.com/api/bookings';
        const method = formData.id ? 'PATCH' : 'POST';
        try { await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) }); } 
        catch (err) { alert("Erreur serveur"); }
        setModalInitialData(null);
        loadData(currentDate);
    };

    const handleMoveEvent = async (eventId, newStart, newStaffId) => {
        const eventToMove = events.find(ev => ev.id == eventId);
        if (!eventToMove) return;
        setEvents(prev => prev.map(ev => ev.id == eventId ? { ...ev, start: newStart, end: moment(newStart).add(ev.duration, 'minutes').toDate(), resourceId: newStaffId } : ev));
        try { await fetch(`https://onhair.onrender.com/api/bookings/${eventId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: moment(newStart).format('YYYY-MM-DD'), time: moment(newStart).format('HH:mm'), staff: newStaffId }) }); } 
        catch (err) { alert("Erreur serveur"); loadData(currentDate); }
    };

    // --- MODIFIÉ: La fonction pour supprimer est maintenant passée au modal ---
    const handleDeleteEvent = async (id) => {
        try { 
            await fetch(`https://onhair.onrender.com/api/bookings/${id}`, { method: 'DELETE' }); 
            setModalInitialData(null); 
            loadData(currentDate); 
        } 
        catch (err) { alert("Erreur suppression"); }
    };
    
    const handleGridClick = (clickedDate) => { setModalInitialData({ date: clickedDate }); };
    const handleEventClick = (event) => { setModalInitialData({ id: event.id, clientName: event.title, phone: event.phone, service: event.service, staff: event.resourceId, date: event.start, duration: event.duration }); };

    return (
        <div style={{position: 'fixed', inset: 0, background: '#000000', zIndex: 9999, display:'flex', flexDirection:'column', fontFamily:'Inter, sans-serif', color:'white'}}>
            <style>{`.view-btn-text, .add-btn-text, .app-title { display: inline; } .top-bar { padding: 0 30px; } @media (max-width: 768px) { .view-btn-text, .add-btn-text, .app-title { display: none; } .top-bar { padding: 0 10px; } }`}</style>
            <div className="top-bar" style={{height: '60px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000000'}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>{role === 'superadmin' && (<button onClick={onBack} style={{background:'#27272a', border:'none', color:'white', padding:8, borderRadius:8, cursor:'pointer'}}><ArrowLeft size={20}/></button>)}<div className="app-title" style={{fontWeight:800, fontSize:18}}>Calendrier</div></div>
                <div style={{display:'flex', background:'#27272a', padding:3, borderRadius:8, gap:2}}>
                    <button onClick={() => setCurrentView('day')} style={{...styles.viewBtn, background: currentView === 'day' ? '#52525b' : 'transparent', color: currentView === 'day' ? 'white' : '#9ca3af'}}><List size={16}/> <span className="view-btn-text">Jour</span></button>
                    <button onClick={() => setCurrentView('week')} style={{...styles.viewBtn, background: currentView === 'week' ? '#52525b' : 'transparent', color: currentView === 'week' ? 'white' : '#9ca3af'}}><LayoutGrid size={16}/> <span className="view-btn-text">Semaine</span></button>
                    <button onClick={() => setCurrentView('month')} style={{...styles.viewBtn, background: currentView === 'month' ? '#52525b' : 'transparent', color: currentView === 'month' ? 'white' : '#9ca3af'}}><Calendar size={16}/> <span className="view-btn-text">Mois</span></button>
                </div>
                <div><button onClick={() => setModalInitialData({ date: new Date() })} style={{background:'#EC4899', color:'white', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontWeight:'bold', display:'flex', gap:5, alignItems:'center'}}><Plus size={20}/> <span className="add-btn-text">Nouveau</span></button></div>
            </div>
            <div style={{flex:1, position:'relative', overflow: 'hidden'}}>
                {currentView === 'day' && <PlanningDay events={events} resources={resources} date={currentDate} setDate={setCurrentDate} onEventMove={handleMoveEvent} onEventClick={handleEventClick} onGridClick={handleGridClick} />}
                {currentView === 'week' && <PlanningWeek events={events} date={currentDate} setDate={setCurrentDate} onEventClick={handleEventClick} />}
                {currentView === 'month' && <PlanningMonth events={events} date={currentDate} setDate={setCurrentDate} onEventClick={handleEventClick} />}
            </div>
            {/* --- MODIFIÉ: On passe la fonction onDelete au Modal --- */}
            <BookingModal isOpen={!!modalInitialData} onClose={() => setModalInitialData(null)} staffList={resources} onSave={handleSaveBooking} initialData={modalInitialData} onDelete={handleDeleteEvent} />
        </div>
    );
}

const styles = { viewBtn: { border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontWeight:'600', fontSize:13, display:'flex', alignItems:'center', gap:6 }};