import React, { useEffect, useState, useMemo, useRef } from 'react';
import moment from 'moment';
import 'moment/locale/fr'; 
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";
import { useGesture } from '@use-gesture/react';

moment.locale('fr');

const START_HOUR = 0; 
const END_HOUR = 23;

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const calculateEventLayout = (events) => { 
    const sortedEvents = [...events].sort((a, b) => { 
        if (a.start.getTime() !== b.start.getTime()) return a.start.getTime() - b.start.getTime(); 
        return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime()); 
    }); 
    const laidOutEvents = []; 
    for (const event of sortedEvents) { 
        let maxColumns = 1; 
        let columnIndex = 0; 
        for (const placedEvent of laidOutEvents) { 
            const startsBeforePlacedEnds = event.start.getTime() < placedEvent.end.getTime(); 
            const endsAfterPlacedStarts = event.end.getTime() > placedEvent.start.getTime(); 
            if (startsBeforePlacedEnds && endsAfterPlacedStarts) maxColumns = Math.max(maxColumns, placedEvent.layout.totalColumns + 1); 
        } 
        const placedInColumns = new Array(maxColumns).fill(false); 
        for (const placedEvent of laidOutEvents) { 
            const startsBeforePlacedEnds = event.start.getTime() < placedEvent.end.getTime(); 
            const endsAfterPlacedStarts = event.end.getTime() > placedEvent.start.getTime(); 
            if (startsBeforePlacedEnds && endsAfterPlacedStarts) placedInColumns[placedEvent.layout.columnIndex] = true; 
        } 
        for (let i = 0; i < maxColumns; i++) { if (!placedInColumns[i]) { columnIndex = i; break; } } 
        laidOutEvents.push({ ...event, layout: { totalColumns: maxColumns, columnIndex }}); 
    } 
    return laidOutEvents.map(event => { 
        let newTotalColumns = event.layout.totalColumns; 
        for (const otherEvent of laidOutEvents) { 
            if (otherEvent.layout.columnIndex > event.layout.columnIndex) { 
                const startsBeforeOtherEnds = event.start.getTime() < otherEvent.end.getTime(); 
                const endsAfterOtherStarts = event.end.getTime() > otherEvent.start.getTime(); 
                if (startsBeforeOtherEnds && endsAfterOtherStarts) newTotalColumns = Math.max(newTotalColumns, otherEvent.layout.totalColumns); 
            } 
        } 
        return { ...event, layout: { ...event.layout, totalColumns: newTotalColumns }}; 
    }); 
};

const WeekStripHeader = ({ currentDate, setDate }) => { 
    const today = moment(currentDate);
    const startOfWeek = today.clone().startOf('week'); 
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days')); 
    const getFrenchDayName = (dateObj) => dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 2).toUpperCase();
    const getFrenchFullDate = (dateObj) => capitalize(dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
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

export default function PlanningDay({ events = [], resources = [], date, setDate, onEventMove, onEventClick }) {
    const [hourHeight, setHourHeight] = useState(100);
    const [currentTimePos, setCurrentTimePos] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null); 
    const [touchStartY, setTouchStartY] = useState(null);
    const isToday = moment(date).isSame(moment(), 'day');

    // Real-time Red Line calculation
    useEffect(() => {
        const updateLine = () => {
            const now = moment();
            const totalHours = now.hours() + (now.minutes() / 60);
            setCurrentTimePos((totalHours - START_HOUR) * hourHeight);
        };
        updateLine();
        const interval = setInterval(updateLine, 60000);
        return () => clearInterval(interval);
    }, [hourHeight]);

    useEffect(() => { 
        polyfill({ dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride }); 
        const handleTouchMove = (e) => { if (document.querySelector(".dnd-poly-drag-image")) e.preventDefault(); }; 
        window.addEventListener('touchmove', handleTouchMove, { passive: false }); 
        return () => window.removeEventListener('touchmove', handleTouchMove); 
    }, []);

    // Swipe Navigation logic
    const handlePrevDay = () => { if(!date) return; const d = new Date(date); d.setDate(date.getDate() - 1); setDate(d); };
    const handleNextDay = () => { if(!date) return; const d = new Date(date); d.setDate(date.getDate() + 1); setDate(d); };
    const handleTouchStart = (e) => { if (e.touches.length === 1) { setTouchStartX(e.touches[0].clientX); setTouchStartY(e.touches[0].clientY); } };
    const handleTouchEnd = (e) => { 
        if (touchStartX === null || touchStartY === null) return; 
        const deltaX = e.changedTouches[0].clientX - touchStartX; 
        const deltaY = e.changedTouches[0].clientY - touchStartY; 
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) { deltaX > 0 ? handlePrevDay() : handleNextDay(); } 
        setTouchStartX(null); setTouchStartY(null); 
    };

    // Drag and Drop Logic
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
        const newStartDate = new Date(date); 
        newStartDate.setHours(Math.floor(START_HOUR + hoursFromStart)); 
        newStartDate.setMinutes(Math.round(((START_HOUR + hoursFromStart) % 1) * 4) * 15); 
        if (onEventMove) onEventMove(eventId, newStartDate, originalEvent.resourceId); 
    };

    const safeEvents = useMemo(() => {
        const rawEvents = Array.isArray(events) ? events : [];
        const targetDateStr = moment(date).format('YYYY-MM-DD');
        return rawEvents.filter(ev => moment(ev.start).format('YYYY-MM-DD') === targetDateStr);
    }, [events, date]);

    const resourceMap = new Map((Array.isArray(resources) ? resources : []).map(r => [r.id, r]));
    const laidOutEvents = useMemo(() => calculateEventLayout(safeEvents), [safeEvents]);

    const getEventStyle = (start, end) => { 
        const startDate = new Date(start); 
        const totalStartHours = startDate.getHours() + (startDate.getMinutes() / 60); 
        const top = (totalStartHours - START_HOUR) * hourHeight; 
        const height = ((new Date(end) - startDate) / (1000 * 60 * 60)) * hourHeight; 
        return { top: `${top}px`, height: `${height - 2}px` }; 
    };

    const scrollContainerRef = useRef(null);
    useGesture({ 
        onWheel: ({ event, delta: [, dy], ctrlKey }) => { if (ctrlKey) { event.preventDefault(); setHourHeight(h => Math.max(30, Math.min(300, h - dy))); } }, 
        onPinch: ({ event, offset: [d] }) => { event.preventDefault(); setHourHeight(Math.max(30, Math.min(300, d * 100))); } 
    }, { target: scrollContainerRef, eventOptions: { passive: false } });

    return (
        <div style={styles.container}>
            <WeekStripHeader currentDate={date} setDate={setDate} />
            <div ref={scrollContainerRef} style={styles.scrollContainer} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                <div style={styles.flexRow}>
                    <div style={styles.timeColumn}> 
                        {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                            <div key={i} style={{...styles.timeLabel, height: `${hourHeight}px`}}>
                                {(START_HOUR + i).toString().padStart(2, '0')}:00
                            </div>
                        ))} 
                    </div>
                    <div style={{...styles.mainColumn, height: `${(END_HOUR - START_HOUR + 1) * hourHeight}px`}} onDragOver={handleDragOver} onDrop={handleDrop}>
                        <div style={styles.linesLayer}> 
                            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                                <div key={i} style={{...styles.gridLine, top: `${i * hourHeight}px`}}></div>
                            ))} 
                        </div>

                        {/* --- RED TIME INDICATOR --- */}
                        {isToday && (
                            <div style={{...styles.timeLine, top: `${currentTimePos}px`}}>
                                <div style={styles.timeDot}></div>
                            </div>
                        )}

                        {laidOutEvents.map((event) => {
                            const resource = resourceMap.get(event.resourceId); 
                            const { totalColumns, columnIndex } = event.layout;
                            return (
                                <div key={event.id} draggable={true} onDragStart={(e) => handleDragStart(e, event.id)} onClick={() => onEventClick && onEventClick(event)}
                                    style={{ ...styles.eventBlock, backgroundColor: resource?.color ? `${resource.color}25` : '#55555540', borderLeft: `3px solid ${resource?.color || '#555'}`, ...getEventStyle(event.start, event.end), width: `calc(${100 / totalColumns}% - 6px)`, left: `calc(${columnIndex * (100 / totalColumns)}% + 3px)` }}>
                                    <div style={styles.eventContent}>
                                        <div style={styles.eventTitle}>{event.title}</div>
                                        <div style={{...styles.staffNameInEvent, color: resource?.color || 'white'}}>{resource?.title}</div>
                                    </div>
                                    <div style={styles.eventTime}>{moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</div>
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
    dayName: { fontSize: '12px', color: '#a1a1aa' }, 
    dayNumber: { fontSize: '16px', fontWeight: '600', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }, 
    activeDayNumber: { backgroundColor: '#ef4444', color: 'white' }, 
    fullDateDisplay: { textAlign: 'center', fontWeight: '600', fontSize: '18px' }, 
    scrollContainer: { flex: 1, overflowY: 'auto', position: 'relative', touchAction: 'pan-y' }, 
    flexRow: { display: 'flex', minWidth: '100%' }, 
    timeColumn: { width: '60px', flexShrink: 0, borderRight: '1px solid #27272a', position: 'sticky', left: 0, zIndex: 40, backgroundColor: '#000' }, 
    timeLabel: { textAlign: 'center', fontSize: '11px', color: '#71717a', transform: 'translateY(-10px)' }, 
    mainColumn: { flex: 1, position: 'relative' }, 
    linesLayer: { position: 'absolute', inset: 0, zIndex: 0 }, 
    gridLine: { position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: '#1a1a1a' }, 
    timeLine: { position: 'absolute', left: 0, right: 0, height: '2px', backgroundColor: '#ef4444', zIndex: 100, pointerEvents: 'none' },
    timeDot: { position: 'absolute', left: '-4px', top: '-4px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #000' },
    eventBlock: { position: 'absolute', borderRadius: '6px', padding: '6px 8px', zIndex: 10, overflow: 'hidden', cursor: 'pointer', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, 
    eventTitle: { fontWeight: 'bold', fontSize: '13px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }, 
    staffNameInEvent: { fontSize: '11px', fontWeight: '500' }, 
    eventTime: { fontSize: '10px', opacity: 0.8 }
};