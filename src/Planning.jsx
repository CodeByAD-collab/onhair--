import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import { ArrowLeft, Calendar, LayoutGrid, List, Plus } from 'lucide-react';

import PlanningDay from './PlanningDay';
import PlanningWeek from './PlanningWeek';
import PlanningMonth from './PlanningMonth';
import BookingModal from './BookingModal';

moment.locale('fr');

// === CONFIGURATION: Your Live Server URL ===
const API_BASE_URL = 'https://onhair.onrender.com';

export default function Planning({ onBack, role }) {
    const [events, setEvents] = useState([]);
    const [resources, setResources] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('day');
    const [modalInitialData, setModalInitialData] = useState(null);

    const loadData = useCallback(async () => {
        try {
            // FIXED: Using correct API path
            const staffRes = await fetch(`${API_BASE_URL}/api/staff`);
            const staffJson = await staffRes.json();
            const staffList = staffJson?.data || [];
            
            const validStaff = staffList.filter(s => s.name && !s.name.toUpperCase().includes("ASSIGNÉ"));
            const myStaffColumns = validStaff.map(s => ({ 
                id: s.name, 
                title: s.name, 
                role: s.special, 
                emoji: (s.special?.toLowerCase().includes('color')) ? '🎨' : '👤', 
                color: s.color || '#EC4899' 
            }));
            setResources(myStaffColumns);

            // FIXED: Using correct API path
            const bookRes = await fetch(`${API_BASE_URL}/api/bookings`);
            const bookData = await bookRes.json();
            const rawBookings = bookData?.data || [];
            
            const formattedEvents = rawBookings.map(booking => {
                if (!booking.date || !booking.time) return null;
                const start = new Date(`${booking.date.split('T')[0]}T${booking.time}`);
                const duration = parseInt(booking.duration) || 60;
                const end = moment(start).add(duration, 'minutes').toDate();
                return { 
                    id: booking.id, 
                    title: booking.name || 'Client', 
                    service: booking.service_name || 'Service', 
                    start, 
                    end, 
                    resourceId: booking.staff, 
                    phone: booking.phone, 
                    duration: duration,
                    notes: booking.notes // Added notes
                };
            }).filter(e => e !== null);
            
            setEvents(formattedEvents);
        } catch (err) { 
            console.error("Failed to load data:", err); 
            setEvents([]); 
        }
    }, []);

    // NOTE: This now reloads data only when the component mounts for the first time
    // The calendar views will handle date changes internally without a full reload
    useEffect(() => {
        loadData(); 
    }, [loadData]);

    const handleSaveBooking = async (formData) => {
        const dataToSend = { 
            name: formData.clientName, 
            phone: formData.phone, 
            service_name: formData.service, 
            staff: formData.staff, 
            date: formData.date, 
            time: formData.time, 
            duration: formData.duration,
            notes: formData.notes
        };
        
        // FIXED: Using correct API path
        const url = formData.id ? `${API_BASE_URL}/api/bookings/${formData.id}` : `${API_BASE_URL}/api/bookings`;
        const method = formData.id ? 'PATCH' : 'POST';
        
        try { 
            const response = await fetch(url, { 
                method, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(dataToSend) 
            }); 
            if (!response.ok) throw new Error("Erreur lors de la sauvegarde");
        } 
        catch (err) { alert("Erreur serveur : " + err.message); }
        
        setModalInitialData(null);
        loadData(); // Reload all data
    };

    const handleMoveEvent = async (eventId, newStart, newStaffId) => {
        const eventToMove = events.find(ev => ev.id == eventId);
        if (!eventToMove) return;

        setEvents(prev => prev.map(ev => ev.id == eventId ? { ...ev, start: newStart, end: moment(newStart).add(ev.duration, 'minutes').toDate(), resourceId: newStaffId } : ev));

        try { 
            // FIXED: Using correct API path
            await fetch(`${API_BASE_URL}/api/bookings/${eventId}`, { 
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    date: moment(newStart).format('YYYY-MM-DD'), 
                    time: moment(newStart).format('HH:mm'), 
                    staff: newStaffId 
                }) 
            }); 
        } 
        catch (err) { 
            alert("Erreur serveur lors du déplacement"); 
            loadData(); 
        }
    };

    const handleDeleteEvent = async (id) => {
        try { 
            // FIXED: Using correct API path
            await fetch(`${API_BASE_URL}/api/bookings/${id}`, { method: 'DELETE' }); 
            setModalInitialData(null); 
            loadData(); 
        } 
        catch (err) { alert("Erreur suppression"); }
    };
    
    const handleGridClick = (clickedDate) => { setModalInitialData({ date: clickedDate }); };
    const handleEventClick = (event) => { 
        setModalInitialData({ 
            id: event.id, 
            clientName: event.title, 
            phone: event.phone, 
            service: event.service, 
            staff: event.resourceId, 
            date: event.start, 
            duration: event.duration,
            notes: event.notes
        }); 
    };

    return (
        <div style={{position: 'fixed', inset: 0, background: '#000000', zIndex: 100, display:'flex', flexDirection:'column', fontFamily:'Inter, sans-serif', color:'white'}}>
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
                {currentVView === 'month' && <PlanningMonth events={events} date={currentDate} setDate={setCurrentDate} onEventClick={handleEventClick} />}
            </div>
            <BookingModal isOpen={!!modalInitialData} onClose={() => setModalInitialData(null)} staffList={resources} onSave={handleSaveBooking} initialData={modalInitialData} onDelete={handleDeleteEvent} />
        </div>
    );
}

const styles = { viewBtn: { border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontWeight:'600', fontSize:13, display:'flex', alignItems:'center', gap:6 }};