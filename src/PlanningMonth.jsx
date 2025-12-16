import React from 'react';
import moment from 'moment';

export default function PlanningMonth({ events, date, setDate, onEventClick }) {
  const startOfMonth = moment(date).startOf('month');
  
  // Remplir les jours vides
  const startDay = startOfMonth.day(); // 0 (Dimanche) à 6
  const blanks = Array(startDay === 0 ? 6 : startDay - 1).fill(null); 
  
  const daysInMonth = Array.from({ length: startOfMonth.daysInMonth() }, (_, i) => {
    return moment(startOfMonth).add(i, 'days');
  });

  const totalSlots = [...blanks, ...daysInMonth];

  const handlePrevMonth = () => setDate(moment(date).subtract(1, 'month').toDate());
  const handleNextMonth = () => setDate(moment(date).add(1, 'month').toDate());

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={handlePrevMonth} style={styles.arrowBtn}>◀</button>
        <h2 style={styles.title}>{startOfMonth.format('MMMM YYYY')}</h2>
        <button onClick={handleNextMonth} style={styles.arrowBtn}>▶</button>
      </div>

      <div style={styles.gridHeader}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} style={styles.dayName}>{d}</div>
        ))}
      </div>

      <div style={styles.grid}>
        {totalSlots.map((day, i) => {
            if (!day) return <div key={i} style={styles.dayCellEmpty}></div>;
            
            const dayEvents = events.filter(e => moment(e.start).isSame(day, 'day'));
            const isToday = day.isSame(moment(), 'day');

            return (
                <div key={i} style={{...styles.dayCell, borderColor: isToday ? '#EC4899' : '#27272a'}}>
                    <div style={{...styles.dateNumber, color: isToday ? '#EC4899' : 'white'}}>
                        {day.format('D')}
                    </div>
                    <div style={styles.dotsContainer}>
                        {dayEvents.slice(0, 5).map(ev => (
                            <div 
                                key={ev.id} 
                                onClick={(e) => {
                                    e.stopPropagation(); // Évite de cliquer sur le jour (si on ajoutait ça plus tard)
                                    onEventClick && onEventClick(ev); // --- CLIC ACTIVÉ ---
                                }}
                                style={{...styles.eventDot, background: ev.bgColor, cursor: 'pointer'}} 
                                title={ev.title}
                            ></div>
                        ))}
                        {dayEvents.length > 5 && <span style={{fontSize:10}}>+</span>}
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
  gridHeader: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', padding: '10px 0', borderBottom: '1px solid #27272a' },
  dayName: { fontSize: 14, fontWeight: 'bold', color: '#9ca3af' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflowY: 'auto' },
  dayCell: { borderRight: '1px solid #27272a', borderBottom: '1px solid #27272a', minHeight: 100, padding: 5, position: 'relative', border: '1px solid #27272a' },
  dayCellEmpty: { background: '#111', borderBottom: '1px solid #27272a', borderRight: '1px solid #27272a' },
  dateNumber: { fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  dotsContainer: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  eventDot: { width: 10, height: 10, borderRadius: '50%' }
};