import React, { useRef, useEffect } from 'react';
import moment from 'moment';
// We import the polyfill to make drag & drop work on phones
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";

const START_HOUR = 11;
const END_HOUR = 21;
const HOUR_HEIGHT = 100; 
const COLUMN_MIN_WIDTH = 200;

const timeSlots = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
  const h = START_HOUR + i;
  return `${h}:00`;
});

export default function PlanningDay({ events = [], resources = [], date, setDate, onEventMove, onEventClick }) {
  
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  // --- 1. FIX FOR PHONE DRAG AND DROP ---
  useEffect(() => {
    // This activates Drag & Drop on Touch Screens (Phones/Tablets)
    polyfill({
        dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride
    });
    
    // Fix to prevent scrolling while dragging on mobile
    const handleTouchMove = (e) => {
        if (document.querySelector(".dnd-poly-drag-image")) {
            e.preventDefault();
        }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => window.removeEventListener('touchmove', handleTouchMove);
  }, []);

  const handleScroll = () => { 
      if (headerRef.current && gridRef.current) {
          headerRef.current.scrollLeft = gridRef.current.scrollLeft; 
      }
  };

  const handleDragStart = (e, eventId) => {
    e.dataTransfer.setData("eventId", eventId);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  
  const handleDrop = (e, staffId) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    
    // Calculate new time
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top; 
    const hoursFromStart = offsetY / HOUR_HEIGHT;
    const newStartHour = START_HOUR + hoursFromStart;
    
    const newStartDate = new Date(date);
    newStartDate.setHours(Math.floor(newStartHour));
    newStartDate.setMinutes((newStartHour % 1) * 60);
    newStartDate.setSeconds(0);
    
    // Snap to 15 minutes
    const minutes = newStartDate.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    newStartDate.setMinutes(roundedMinutes);
    
    if (onEventMove) onEventMove(eventId, newStartDate, staffId);
  };

  const handlePrevDay = () => { if(!date) return; const d = new Date(date); d.setDate(date.getDate() - 1); setDate(d); };
  const handleNextDay = () => { if(!date) return; const d = new Date(date); d.setDate(date.getDate() + 1); setDate(d); };
  const getDisplayDate = () => { try { return moment(date).format('dddd, D MMMM'); } catch(e) { return ""; } };
  const formatTime = (d) => { try { return moment(d).format('HH:mm'); } catch(e) { return ""; } };

  const getEventStyle = (start, end) => {
    try {
        if (!start || !end) return { display: 'none' };
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate.getHours() < START_HOUR) return { display: 'none' };
        const totalStartHours = startDate.getHours() + (startDate.getMinutes() / 60);
        const top = (totalStartHours - START_HOUR) * HOUR_HEIGHT;
        const durationMs = endDate - startDate;
        const durationHours = durationMs / (1000 * 60 * 60);
        const height = durationHours * HOUR_HEIGHT;
        return { top: `${top}px`, height: `${height}px` };
    } catch (e) { return { display: 'none' }; }
  };

  const safeResources = Array.isArray(resources) ? resources : [];
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <div style={styles.container}>
      {/* Date Header */}
      <div style={styles.dateBar}>
         <button onClick={handlePrevDay} style={styles.arrowBtn}>◀</button>
         <h2 style={styles.dateTitle}>{getDisplayDate()}</h2>
         <button onClick={handleNextDay} style={styles.arrowBtn}>▶</button>
      </div>

      {/* Staff Header */}
      <div ref={headerRef} style={styles.headerWrapper}>
        <div style={styles.flexRow}>
          <div style={styles.timeHeaderSpacer}></div>
          {safeResources.map((staff) => (
            <div key={staff.id} style={styles.headerStaffCell}>
              <div style={{...styles.avatar, border: `2px solid ${staff.color || '#EC4899'}`}}>
                {staff.emoji || (staff.title ? staff.title.charAt(0) : '?')}
              </div>
              <span style={styles.staffName}>{staff.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Area */}
      <div ref={gridRef} onScroll={handleScroll} style={styles.scrollContainer}>
        <div style={styles.flexRow}>
          
          {/* Time Column */}
          <div style={styles.timeColumn}>
            {timeSlots.map(time => (<div key={time} style={styles.timeLabel}>{time}</div>))}
          </div>

          {/* Grid Body */}
          <div style={styles.gridBody}>
             <div style={styles.linesLayer}>
               {timeSlots.map((_, index) => (<div key={index} style={{...styles.gridLine, top: `${index * HOUR_HEIGHT}px`}}></div>))}
             </div>

             {/* Staff Columns */}
             {safeResources.map((staff) => (
               <div 
                 key={staff.id} 
                 style={styles.columnCell} 
                 onDragOver={handleDragOver} 
                 onDrop={(e) => handleDrop(e, staff.id)}
               >
                  {safeEvents
                    .filter(e => {
                        try {
                            const isCorrectStaff = e.resourceId === staff.id;
                            if(!e.start || !date) return false;
                            const eventDate = moment(e.start);
                            const screenDate = moment(date);
                            return isCorrectStaff && eventDate.isSame(screenDate, 'day');
                        } catch(err) { return false; }
                    })
                    .map((event) => (
                      <div 
                        key={event.id} 
                        draggable={true} 
                        onDragStart={(e) => handleDragStart(e, event.id)}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEventClick) onEventClick(event);
                        }}
                        style={{
                          ...styles.eventBlock,
                          // --- 2. FIX FOR COLOR ---
                          // We use the staff.color here instead of event.bgColor
                          // This ensures the color updates immediately when moved!
                          backgroundColor: staff.color || event.bgColor || '#555',
                          ...getEventStyle(event.start, event.end)
                        }}
                      >
                        <div style={styles.eventTitle}>{event.title}</div>
                        <div style={{opacity:0.8, fontSize:10}}>{event.service}</div>
                        <div style={styles.eventTime}>{formatTime(event.start)} - {formatTime(event.end)}</div>
                      </div>
                    ))
                  }
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000000', color: 'white', overflow: 'hidden' },
  
  dateBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderBottom: '1px solid #27272a', backgroundColor: '#000', gap: '20px', flexShrink: 0 },
  dateTitle: { margin: 0, fontSize: '18px', textTransform: 'capitalize' },
  arrowBtn: { background: '#27272a', border: 'none', color: 'white', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  
  headerWrapper: { overflow: 'hidden', borderBottom: '1px solid #27272a', backgroundColor: '#000', flexShrink: 0 },
  scrollContainer: { flex: 1, overflow: 'auto', position: 'relative' },
  flexRow: { display: 'flex', minWidth: '100%' },

  timeHeaderSpacer: { width: '50px', flexShrink: 0, borderRight: '1px solid #27272a', backgroundColor: '#000', position: 'sticky', left: 0, zIndex: 30 },
  timeColumn: { width: '50px', flexShrink: 0, backgroundColor: '#000', borderRight: '1px solid #27272a', position: 'sticky', left: 0, zIndex: 40, paddingTop: '0px' },
  timeLabel: { height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', fontSize: '11px', color: '#71717a', transform: 'translateY(-6px)' },

  headerStaffCell: { 
      flex: 1, 
      minWidth: `${COLUMN_MIN_WIDTH}px`, 
      padding: '10px', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', 
      borderRight: '1px solid #27272a' 
  },
  columnCell: { 
      flex: 1, 
      minWidth: `${COLUMN_MIN_WIDTH}px`, 
      borderRight: '1px solid #27272a', 
      position: 'relative', 
      height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` 
  },
  
  gridBody: { display: 'flex', flex: 1, position: 'relative' },
  linesLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: '#27272a', width: '100%' },
  
  eventBlock: { position: 'absolute', left: '4px', right: '4px', borderRadius: '6px', padding: '6px', zIndex: 10, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer', color:'white' },
  eventTitle: { fontWeight: 'bold', fontSize: '12px', marginBottom:'0px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  eventTime: { fontSize: '9px', opacity: 0.8 },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'18px' },
  staffName: { fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
};