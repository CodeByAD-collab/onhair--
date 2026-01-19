import React, { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import 'moment/locale/fr';
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";

const HOUR_HEIGHT = 100;

export default function PlanningDay({ 
    events = [], 
    resources = [], 
    date, 
    setDate, 
    onEventMove, 
    onEventClick,
    startHour = 8,
    endHour = 20
}) {
    const [dragPreview, setDragPreview] = useState(null);
    const [now, setNow] = useState(new Date()); // State for the red line

    const START_HOUR = startHour;
    const END_HOUR = endHour;

    // Update the red line every minute
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride }); }, []);

    // Logic for the Red Line position
    const isToday = moment(date).isSame(moment(), 'day');
    const currentMoment = moment(now);
    const currentHours = currentMoment.hours() + currentMoment.minutes() / 60;
    const currentTimeTop = (currentHours - START_HOUR) * HOUR_HEIGHT;
    const showTimeLine = isToday && currentHours >= START_HOUR && currentHours <= END_HOUR;

    const calculateSnappedTime = (offsetY) => {
        const totalMinutesFromTop = (offsetY / HOUR_HEIGHT) * 60;
        const snappedMinutes = Math.round(totalMinutesFromTop / 15) * 15; 
        const absoluteMinutes = (START_HOUR * 60) + snappedMinutes;
        const h = Math.floor(absoluteMinutes / 60);
        const m = absoluteMinutes % 60;
        const top = (snappedMinutes / 60) * HOUR_HEIGHT;
        return { h, m, top, timeStr: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` };
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const snap = calculateSnappedTime(offsetY);
        setDragPreview({ top: snap.top, time: snap.timeStr });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragPreview(null);
        const eventId = e.dataTransfer.getData("eventId");
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const snap = calculateSnappedTime(offsetY);
        const newStart = moment(date).startOf('day').hours(snap.h).minutes(snap.m).seconds(0).toDate();
        if (onEventMove) onEventMove(eventId, newStart);
    };

    const safeEvents = useMemo(() => {
        const dStr = moment(date).format('YYYY-MM-DD');
        return (events || []).filter(ev => moment(ev.start).format('YYYY-MM-DD') === dStr);
    }, [events, date]);

    return (
        <div style={styles.container}>
            <div style={styles.weekStrip}>
                {[...Array(7)].map((_, i) => {
                    const d = moment(date).startOf('week').add(i, 'days');
                    const active = moment(date).isSame(d, 'day');
                    return (
                        <div key={i} onClick={() => setDate(d.toDate())} style={styles.dayCell}>
                            <span style={{color: '#aaa', fontSize: '10px'}}>{d.format('ddd').toUpperCase()}</span>
                            <span style={{...styles.dayNum, backgroundColor: active ? '#ef4444' : 'transparent'}}>{d.format('D')}</span>
                        </div>
                    );
                })}
            </div>

            <div style={styles.scroll}>
                <div style={styles.timeCol}>
                    {[...Array(END_HOUR - START_HOUR + 1)].map((_, i) => (
                        <div key={i} style={{height: HOUR_HEIGHT, fontSize: '11px', color: '#666', borderBottom: '1px solid #111'}}>
                            {(START_HOUR + i).toString().padStart(2, '0')}:00
                        </div>
                    ))}
                </div>
                
                <div style={{...styles.mainCol, height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px`}} 
                     onDragOver={handleDragOver} 
                     onDrop={handleDrop} 
                     onDragLeave={() => setDragPreview(null)}>
                    
                    {/* GRID LINES */}
                    {[...Array((END_HOUR - START_HOUR + 1) * 4)].map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute', top: i * (HOUR_HEIGHT / 4), left: 0, right: 0, 
                            height: '1px', borderTop: i % 4 === 0 ? '1px solid #222' : '1px dashed #111',
                            zIndex: 0
                        }} />
                    ))}

                    {/* REAL TIME LINE (THE RED LINE) */}
                    {showTimeLine && (
                        <div style={{...styles.currentTimeLine, top: `${currentTimeTop}px`}}>
                            <div style={styles.currentTimeBadge}>{currentMoment.format('HH:mm')}</div>
                        </div>
                    )}

                    {/* GHOST GUIDE (DRAG) */}
                    {dragPreview && (
                        <div style={{...styles.indicator, top: dragPreview.top}}>
                            <span style={styles.badge}>{dragPreview.time}</span>
                        </div>
                    )}

                    {/* EVENTS */}
                    {safeEvents.map(ev => {
                        const start = moment(ev.start);
                        const top = ((start.hours() - START_HOUR) + start.minutes() / 60) * HOUR_HEIGHT;
                        const height = (moment(ev.end).diff(start, 'minutes') / 60) * HOUR_HEIGHT;
                        const isCancelled = ev.status === 'cancelled';
                        if (start.hours() < START_HOUR || start.hours() > END_HOUR) return null;

                        return (
                            <div key={ev.id} draggable={!isCancelled} onClick={() => onEventClick(ev)} 
                                 onDragStart={(e) => e.dataTransfer.setData("eventId", ev.id)}
                                 style={{
                                     ...styles.event, 
                                     top, 
                                     height: height - 2, 
                                     borderLeft: `4px solid ${isCancelled ? '#444' : '#ef4444'}`, 
                                     backgroundColor: isCancelled ? '#1a1a1a' : '#27272a',
                                     opacity: isCancelled ? 0.6 : 1
                                 }}>
                                <div style={{fontWeight: 'bold', fontSize: '12px', textDecoration: isCancelled ? 'line-through' : 'none'}}>{ev.title}</div>
                                <div style={{fontSize: '10px', color: '#aaa'}}>{start.format('HH:mm')} - {moment(ev.end).format('HH:mm')}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000', color: 'white', overflow: 'hidden' },
    weekStrip: { display: 'flex', justifyContent: 'space-around', padding: '10px', borderBottom: '1px solid #222', flexShrink: 0 },
    dayCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' },
    dayNum: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', marginTop: '4px' },
    scroll: { flex: 1, overflowY: 'auto', display: 'flex', position: 'relative' },
    timeCol: { width: '60px', borderRight: '1px solid #111', backgroundColor: '#000', zIndex: 10 },
    mainCol: { flex: 1, position: 'relative', cursor: 'crosshair' },
    event: { position: 'absolute', left: '5px', right: '5px', borderRadius: '4px', padding: '6px', cursor: 'pointer', overflow: 'hidden', zIndex: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' },
    indicator: { position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: '#ef4444', zIndex: 100, pointerEvents: 'none' },
    badge: { position: 'absolute', right: '10px', top: '-22px', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
    // NEW STYLES FOR THE RED TIME LINE
    currentTimeLine: { position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: '#ef4444', zIndex: 50, pointerEvents: 'none', display: 'flex', alignItems: 'center' },
    currentTimeBadge: { backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', position: 'absolute', left: '5px', top: '-7px', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }
};