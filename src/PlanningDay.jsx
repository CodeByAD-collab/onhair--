import React, { useEffect, useState, useMemo, useRef } from 'react';
import moment from 'moment';
import 'moment/locale/fr'; 
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";
import { useGesture } from '@use-gesture/react';

moment.locale('fr');

// --- CHANGED: Now from midnight to 11 PM ---
const START_HOUR = 0; 
const END_HOUR = 23;

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const calculateEventLayout = (events) => { 
    const sortedEvents = [...events].sort((a, b) => { 
        if (a.start.getTime() !== b.start.getTime()) { 
            return a.start.getTime() - b.start.getTime(); 
        } 
        return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime()); 
    }); 
    const laidOutEvents = []; 
    for (const event of sortedEvents) { 
        let maxColumns = 1; 
        let columnIndex = 0; 
        for (const placedEvent of laidOutEvents) { 
            const startsBeforePlacedEnds = event.start.getTime() < placedEvent.end.getTime(); 
            const endsAfterPlacedStarts = event.end.getTime() > placedEvent.start.getTime(); 
            if (startsBeforePlacedEnds && endsAfterPlacedStarts) { 
                maxColumns = Math.max(maxColumns, placedEvent.layout.totalColumns + 1); 
            } 
        } 
        const placedInColumns = new Array(maxColumns).fill(false); 
        for (const placedEvent of laidOutEvents) { 
            const startsBeforePlacedEnds = event.start.getTime() < placedEvent.end.getTime(); 
            const endsAfterPlacedStarts = event.end.getTime() > placedEvent.start.getTime(); 
            if (startsBeforePlacedEnds && endsAfterPlacedStarts) { 
                placedInColumns[placedEvent.layout.columnIndex] = true; 
            } 
        } 
        for (let i = 0; i < maxColumns; i++) { 
            if (!placedInColumns[i]) { 
                columnIndex = i; 
                break; 
            } 
        } 
        laidOutEvents.push({ ...event, layout: { totalColumns: maxColumns, columnIndex }}); 
    } 
    return laidOutEvents.map(event => { 
        let newTotalColumns = event.layout.totalColumns; 
        for (const otherEvent of laidOutEvents) { 
            if (otherEvent.layout.columnIndex > event.layout.columnIndex) { 
                const startsBeforeOtherEnds = event.start.getTime() < otherEvent.end.getTime(); 
                const endsAfterOtherStarts = event.end.getTime() > otherEvent.start.getTime(); 
                if (startsBeforeOtherEnds && endsAfterOtherStarts) { 
                    newTotalColumns = Math.max(newTotalColumns, otherEvent.layout.totalColumns); 
                } 
            } 
        } 
        return { ...event, layout: { ...event.layout, totalColumns: newTotalColumns }}; 
    }); 
};

const WeekStripHeader = ({ currentDate, setDate }) => { 
    const today = moment(currentDate);
    const startOfWeek = today.clone().startOf('week'); 
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days')); 
    
    const getFrenchDayName = (dateObj) => {
        const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' });
        return dayName.replace('.', '').substring(0, 2).toUpperCase();
    };

    const getFrenchFullDate = (dateObj) => {
        const full = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return capitalize(full);
    };

    return ( 
        <div style={styles.headerContainer}> 
            <div style={styles.weekStrip}> 
                {days.map(day => ( 
                    <div key={day.format('YYYY-MM-DD')} style={styles.dayCell} onClick={() => setDate(day.toDate())}> 
                        <span style={styles.dayName}>{getFrenchDayName(day.toDate())}</span> 
                        <span style={{...styles.dayNumber, ...(today.isSame(day, 'day') && styles.activeDayNumber)}}>{day.format('D')}</span> 
                    </div> 
                ))} 
            </div> 
            <div style={styles.fullDateDisplay}>{getFrenchFullDate(today.toDate())}</div> 
        </div> 
    ); 
};

export default function PlanningDay({ events = [], resources = [], date, setDate, onEventMove, onEventClick, onGridClick }) {
    const [hourHeight, setHourHeight] = useState(100);
    const [touchStartX, setTouchStartX] = useState(null); 
    const [touchStartY, setTouchStartY] = useState(null);
    
    useEffect(() => { 
        polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride }); 
        const handleTouchMove = (e) => { 
            if (document.querySelector(".dnd-poly-drag-image")) { e.preventDefault(); } 
        }; 
        window.addEventListener('touchmove', handleTouchMove, { passive: false }); 
        return () => window.removeEventListener('touchmove', handleTouchMove); 
    }, []);

    const handlePrevDay = () => { if(!date) return; const d = new Date(date); d.setDate(date.getDate() - 1); setDate(d); };
    const handleNextDay = () => { if(!date) return; const d = new Date(date); d.setDate(date.getDate() + 1); setDate(d); };

    const handleTouchStart = (e) => { 
        if (e.touches.length === 1) { 
            const firstTouch = e.touches[0]; 
            setTouchStartX(firstTouch.clientX); 
            setTouchStartY(firstTouch.clientY); 
        } 
    };

    const handleTouchEnd = (e) => { 
        if (touchStartX === null || touchStartY === null) return; 
        const lastTouch = e.changedTouches[0]; 
        const deltaX = lastTouch.clientX - touchStartX; 
        const deltaY = lastTouch.clientY - touchStartY; 
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) { 
            const SWIPE_THRESHOLD = 50; 
            if (deltaX > SWIPE_THRESHOLD) { handlePrevDay(); } 
            else if (deltaX < -SWIPE_THRESHOLD) { handleNextDay(); } 
        } 
        setTouchStartX(null); 
        setTouchStartY(null); 
    };

    const safeEvents = useMemo(() => {
        const rawEvents = Array.isArray(events) ? events : [];
        if (!date) return rawEvents;
        const targetDateStr = moment(date).format('YYYY-MM-DD');
        return rawEvents.filter(ev => moment(ev.start).format('YYYY-MM-DD') === targetDateStr);
    }, [events, date]);

    const resourceMap = new Map((Array.isArray(resources) ? resources : []).map(r => [r.id, r]));
    const laidOutEvents = useMemo(() => calculateEventLayout(safeEvents), [safeEvents]);

    const handleDragStart = (e, eventId) => { e.dataTransfer.setData("eventId", eventId); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    const handleDrop = (e) => { 
        e.preventDefault(); 
        const eventId = e.dataTransfer.getData("eventId"); 
        const originalEvent = safeEvents.find(ev => ev.id.toString() === eventId); 
        if (!originalEvent) return; 
        const rect = e.currentTarget.getBoundingClientRect(); 
        const offsetY = e.clientY - rect.top; 
        const hoursFromStart = offsetY / hourHeight; 
        const newStartHour = START_HOUR + hoursFromStart; 
        const newStartDate = new Date(date); 
        newStartDate.setHours(Math.floor(newStartHour)); 
        newStartDate.setMinutes((newStartHour % 1) * 60); 
        newStartDate.setSeconds(0); 
        const minutes = newStartDate.getMinutes(); 
        const roundedMinutes = Math.round(minutes / 15) * 15; 
        newStartDate.setMinutes(roundedMinutes); 
        if (onEventMove) onEventMove(eventId, newStartDate, originalEvent.resourceId); 
    };

    const formatTime = (d) => { try { return moment(d).format('HH:mm'); } catch(e) { return ""; } };
    
    const getEventStyle = (start, end) => { 
        try { 
            if (!start || !end) return { display: 'none' }; 
            const startDate = new Date(start); 
            const endDate = new Date(end); 
            // Calculate position based on START_HOUR
            const totalStartHours = startDate.getHours() + (startDate.getMinutes() / 60); 
            const top = (totalStartHours - START_HOUR) * hourHeight; 
            const durationMs = endDate - startDate; 
            const durationHours = durationMs / (1000 * 60 * 60); 
            const height = durationHours * hourHeight; 
            return { top: `${top}px`, height: `${height - 2}px` }; 
        } catch (e) { return { display: 'none' }; } 
    };

    const scrollContainerRef = useRef(null);
    useGesture({ 
        onWheel: ({ event, delta: [, dy], ctrlKey }) => { 
            if (ctrlKey) { 
                event.preventDefault(); 
                setHourHeight(h => Math.max(30, Math.min(300, h - dy))); 
            } 
        }, 
        onPinch: ({ event, offset: [d] }) => { 
            event.preventDefault(); 
            setHourHeight(Math.max(30, Math.min(300, d * 100))); 
        } 
    }, { target: scrollContainerRef, eventOptions: { passive: false } });

    return (
        <div style={styles.container}>
            <WeekStripHeader currentDate={date} setDate={setDate} />
            <div ref={scrollContainerRef} style={styles.scrollContainer} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div style={styles.flexRow}>
                    <div style={styles.timeColumn}> 
                        {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
                            const hour = START_HOUR + i;
                            // Format as 00:00, 01:00, etc.
                            const label = hour < 10 ? `0${hour}:00` : `${hour}:00`;
                            return (
                                <div key={label} style={{...styles.timeLabel, height: `${hourHeight}px`}}>
                                    {label}
                                </div>
                            );
                        })} 
                    </div>
                    <div style={{...styles.mainColumn, height: `${(END_HOUR - START_HOUR + 1) * hourHeight}px`}} onDragOver={handleDragOver} onDrop={handleDrop}>
                        <div style={styles.linesLayer}> 
                            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, index) => (
                                <div key={index} style={{...styles.gridLine, top: `${index * hourHeight}px`}}></div>
                            ))} 
                        </div>
                        {laidOutEvents.map((event) => {
                            const resource = resourceMap.get(event.resourceId); 
                            const { totalColumns, columnIndex } = event.layout;
                            const width = `calc(${100 / totalColumns}% - 6px)`; 
                            const left = `calc(${columnIndex * (100 / totalColumns)}% + 3px)`;
                            return (
                                <div key={event.id} draggable={true} onDragStart={(e) => handleDragStart(e, event.id)} onClick={(e) => { e.stopPropagation(); if (onEventClick) onEventClick(event); }} onTouchStart={(e) => {e.stopPropagation(); if (e.touches.length > 1) e.preventDefault()}}
                                    style={{ ...styles.eventBlock, backgroundColor: resource?.color ? `${resource.color}25` : '#55555540', borderLeft: `3px solid ${resource?.color || '#555'}`, ...getEventStyle(event.start, event.end), width, left }}>
                                    <div style={styles.eventContent}><div style={styles.eventTitle}>{event.title}</div><div style={{...styles.staffNameInEvent, color: resource?.color || 'white'}}>{resource?.title}</div></div>
                                    <div style={styles.eventTime}>{formatTime(event.start)} - {formatTime(event.end)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = { 
    container: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000000', color: 'white', overflow: 'hidden' }, 
    headerContainer: { padding: '10px 0', borderBottom: '1px solid #27272a', flexShrink: 0 }, 
    weekStrip: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '10px', padding: '0 10px' }, 
    dayCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '8px' }, 
    dayName: { fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }, 
    dayNumber: { fontSize: '16px', fontWeight: '600', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }, 
    activeDayNumber: { backgroundColor: '#ef4444', color: 'white' }, 
    fullDateDisplay: { textAlign: 'center', fontWeight: '600', fontSize: '18px', textTransform: 'capitalize' }, 
    scrollContainer: { flex: 1, overflowY: 'auto', position: 'relative', touchAction: 'pan-y' }, 
    flexRow: { display: 'flex', minWidth: '100%' }, 
    // FIXED: Adjusted timeColumn for better visibility
    timeColumn: { width: '60px', flexShrink: 0, backgroundColor: '#000', borderRight: '1px solid #27272a', position: 'sticky', left: 0, zIndex: 40, paddingTop: '0px' }, 
    // FIXED: Added paddingTop and adjusted label alignment so 00:00 isn't hidden
    timeLabel: { textAlign: 'center', fontSize: '12px', color: '#71717a', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '0px', transform: 'translateY(-10px)' }, 
    mainColumn: { flex: 1, position: 'relative' }, 
    linesLayer: { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }, 
    gridLine: { position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: '#27272a' }, 
    eventBlock: { position: 'absolute', borderRadius: '6px', padding: '6px 8px', zIndex: 10, overflow: 'hidden', cursor: 'pointer', color:'white', transition: 'all 0.2s ease', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, 
    eventContent: {}, 
    eventTitle: { fontWeight: 'bold', fontSize: '13px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }, 
    staffNameInEvent: { fontSize: '11px', opacity: 0.9, fontWeight: '500', marginTop: '2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }, 
    eventTime: { fontSize: '10px', opacity: 0.8, marginTop: '4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink: 0 }
};