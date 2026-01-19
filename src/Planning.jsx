import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { ArrowLeft, Plus } from 'lucide-react';
import PlanningDay from './PlanningDay';
import BookingModal from './BookingModal';

const API_BASE_URL = 'https://onhair.onrender.com';

export default function Planning({ onBack }) {
    const [events, setEvents] = useState([]);
    const [date, setDate] = useState(new Date());
    const [modalData, setModalData] = useState(null);
    
    // NEW: Global settings state
    const [settings, setSettings] = useState({
        startHour: 8, // Default if database is empty
        endHour: 20
    });

    // Modified load to get both Bookings AND Settings
    const load = useCallback(async () => {
        try {
            // 1. Load Settings
            const settingsRes = await fetch(`${API_BASE_URL}/api/settings`);
            const settingsJson = await settingsRes.json();
            if (settingsJson?.data) {
                setSettings(settingsJson.data);
            }

            // 2. Load Bookings
            const res = await fetch(`${API_BASE_URL}/api/bookings`);
            const json = await res.json();
            const formatted = (json?.data || []).map(b => ({
                id: b.id, 
                title: b.name, 
                start: new Date(`${b.date.split('T')[0]}T${b.time}`),
                end: moment(new Date(`${b.date.split('T')[0]}T${b.time}`)).add(b.duration || 30, 'm').toDate(),
                staff: b.staff, 
                phone: b.phone, 
                duration: b.duration, 
                service: b.service_name,
                status: b.status || 'confirmed'
            }));
            setEvents(formatted);
        } catch (e) { console.error("Error loading data:", e); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleMove = async (id, newStart) => {
        // Optimistic update (instant movement)
        const updated = events.map(ev => ev.id.toString() === id.toString() ? { ...ev, start: newStart, end: moment(newStart).add(ev.duration, 'm').toDate() } : ev);
        setEvents(updated);
        
        await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date: moment(newStart).format('YYYY-MM-DD'), 
                time: moment(newStart).format('HH:mm') 
            })
        });
    };

    const handleSave = async (data) => {
        const body = { 
            name: data.clientName, phone: data.phone, service_name: data.service, 
            staff: data.staff, date: data.date, time: data.time, 
            duration: data.duration, status: data.status || 'confirmed'
        };
        const url = data.id ? `${API_BASE_URL}/api/bookings/${data.id}` : `${API_BASE_URL}/api/bookings`;
        await fetch(url, { 
            method: data.id ? 'PATCH' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(body) 
        });
        load();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce rendez-vous ?")) return;
        await fetch(`${API_BASE_URL}/api/bookings/${id}`, { method: 'DELETE' });
        load();
    };

    return (
        <div style={{height: '100vh', display: 'flex', flexDirection: 'column', background: '#000'}}>
            {/* HEADER */}
            <div style={{padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222'}}>
                <button onClick={onBack} style={{background: 'none', border: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                    <ArrowLeft size={16}/> Dashboard
                </button>
                <div style={{color: 'white', fontWeight: 'bold'}}>ON h'AIR Planning</div>
                <button onClick={() => setModalData({date: new Date()})} style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>
                    <Plus size={16}/> Nouveau
                </button>
            </div>

            {/* CALENDAR - Passes startHour and endHour from settings */}
            <PlanningDay 
                events={events} 
                date={date} 
                setDate={setDate} 
                onEventMove={handleMove} 
                onEventClick={setModalData}
                startHour={settings.startHour}
                endHour={settings.endHour}
            />

            <BookingModal 
                isOpen={!!modalData} 
                initialData={modalData} 
                onClose={() => setModalData(null)} 
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
}