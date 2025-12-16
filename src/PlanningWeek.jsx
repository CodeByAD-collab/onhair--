import React from 'react';
import moment from 'moment';

export default function PlanningWeek({ events, date, setDate, onEventClick }) {
  const startOfWeek = moment(date).startOf('isoWeek');
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return moment(startOfWeek).add(i, 'days');
  });

  const handlePrevWeek = () => {
    setDate(moment(date).subtract(1, 'week').toDate());
  };

  const handleNextWeek = () => {
    setDate(moment(date).add(1, 'week').toDate());
  };

  return (
    <div style={styles.container}>
      {/* Header Navigation */}
      <div style={styles.header}>
        <button onClick={handlePrevWeek} style={styles.arrowBtn}>◀</button>
        <h2 style={styles.title}>
            Semaine du {startOfWeek.format('D MMM')} au {moment(startOfWeek).add(6, 'days').format('D MMM')}
        </h2>
        <button onClick={handleNextWeek} style={styles.arrowBtn}>▶</button>
      </div>

      {/* Grid Semaine */}
      <div style={styles.grid}>
        {weekDays.map((day, index) => {
            const dayEvents = events.filter(e => moment(e.start).isSame(day, 'day'));
            const isToday = day.isSame(moment(), 'day');

            return (
                <div key={index} style={{...styles.dayColumn, backgroundColor: isToday ? '#1f2937' : 'transparent'}}>
                    <div style={styles.dayHeader}>
                        <div style={styles.dayName}>{day.format('dddd')}</div>
                        <div style={styles.dayNumber}>{day.format('D')}</div>
                    </div>
                    
                    <div style={styles.eventsList}>
                        {dayEvents.map(ev => (
                            <div 
                                key={ev.id} 
                                onClick={() => onEventClick && onEventClick(ev)} // --- CLIC ACTIVÉ ---
                                style={{
                                    ...styles.eventCard, 
                                    borderLeft: `3px solid ${ev.bgColor}`,
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={styles.eventTime}>{moment(ev.start).format('HH:mm')}</div>
                                <div style={styles.eventTitle}>{ev.title}</div>
                            </div>
                        ))}
                        {dayEvents.length === 0 && <div style={{opacity:0.3, fontSize:12, padding:10}}>Aucun RDV</div>}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', color: 'white' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', borderBottom: '1px solid #27272a', gap: 20 },
  title: { fontSize: 18, textTransform: 'capitalize', margin: 0 },
  arrowBtn: { background: '#27272a', border: 'none', color: 'white', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' },
  grid: { display: 'flex', flex: 1, overflow: 'auto' },
  dayColumn: { flex: 1, minWidth: 120, borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column' },
  dayHeader: { textAlign: 'center', padding: '10px', borderBottom: '1px solid #27272a', background: '#111' },
  dayName: { fontSize: 12, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 5 },
  dayNumber: { fontSize: 20, fontWeight: 'bold' },
  eventsList: { flex: 1, padding: 5, overflowY: 'auto' },
  eventCard: { background: '#27272a', marginBottom: 5, padding: 8, borderRadius: 4, fontSize: 12, transition: 'background 0.2s' },
  eventTime: { fontWeight: 'bold', color: '#d1d5db' },
  eventTitle: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
};