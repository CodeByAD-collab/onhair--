// APP.JSX - UPDATED WITH PROFESSIONAL WHATSAPP TEXT
import { useState, useEffect } from 'react';
import './index.css'; 
import { Toaster, toast } from 'react-hot-toast';
import { Clock, Check, Moon, Sun, Globe, User, MapPin, Mail, ExternalLink } from 'lucide-react';
import logo from './assets/logo.png'; 

const OWNER_PHONE = "212678915564"; 

const SERVICES_DATA = [
  { category: "Coiffure", items: [ { id: 101, name: "Brushing", time: "30 min", min: 30 }, { id: 102, name: "SHP + Masque + Brushing", time: "45 min", min: 45 }, { id: 103, name: "SHP spécifique + Masque + Brush", time: "1h", min: 60 }, { id: 104, name: "Wavy", time: "30 min", min: 30 }, { id: 105, name: "Wavy + SHP + Masque", time: "45 min", min: 45 }, { id: 106, name: "Coupe correction et pointes", time: "30 min", min: 30 }, { id: 107, name: "Coupe transformation", time: "1h", min: 60 }, { id: 108, name: "Coupe enfant", time: "30 min", min: 30 }, { id: 109, name: "Consultation et diagnostique", time: "30 min", min: 30 }, { id: 110, name: "Diagnostique et mèche test", time: "45 min", min: 45 } ] },
  { category: "Coloration", items: [ { id: 201, name: "Coloration", time: "2h", min: 120 }, { id: 202, name: "Coloration sans ammoniaque", time: "2h", min: 120 }, { id: 203, name: "Coloration racines", time: "1h30", min: 90 }, { id: 204, name: "Coloration racines sans ammoniaque", time: "1h30", min: 90 }, { id: 205, name: "Rinçage et correction de couleur", time: "1h", min: 60 }, { id: 206, name: "Reflets Highlight", time: "2h30", min: 150 }, { id: 207, name: "Ombré", time: "3h", min: 180 }, { id: 208, name: "Balayage", time: "3h", min: 180 }, { id: 209, name: "Airtouch", time: "4h", min: 240 } ] },
  { category: "Soins Cheveux", items: [ { id: 301, name: "Soin ON h’AIR", time: "1h", min: 60 }, { id: 302, name: "Soin a base de PLEX", time: "1h", min: 60 }, { id: 303, name: "Soin COLLAGENE", time: "1h30", min: 90 }, { id: 304, name: "Soin PROTEINE", time: "1h30", min: 90 }, { id: 305, name: "Soin BRUSHING permanent", time: "2h", min: 120 }, { id: 306, name: "Soin semi permanent CURLY hair", time: "1h30", min: 90 }, { id: 307, name: "Soin permanent CURLY hair", time: "2h", min: 120 } ] },
  { category: "Manucure", items: [ 
      { id: 501, name: "Pose vernis normal", time: "20 min", min: 20 }, { id: 502, name: "Pose vernis permanent", time: "40 min", min: 40 }, 
      { id: 503, name: "Manucure classique", time: "45 min", min: 45 }, { id: 504, name: "Manucure SPA", time: "1h", min: 60 }, 
      { id: 505, name: "Manucure BIAB", time: "1h30", min: 90 }, { id: 506, name: "Extension de gel", time: "2h", min: 120 }, 
      { id: 507, name: "Remplissage de gel", time: "1h30", min: 90 } 
  ] },
  { category: "Pédicure", items: [ 
      { id: 601, name: "Pose vernis normal (Pied)", time: "20 min", min: 20 }, { id: 602, name: "Pose vernis permanent (Pied)", time: "40 min", min: 40 }, 
      { id: 603, name: "Pédicure classique", time: "45 min", min: 45 }, { id: 604, name: "Pédicure SPA", time: "1h", min: 60 }, 
      { id: 605, name: "Pédicure BIAB", time: "1h30", min: 90 }, { id: 606, name: "Extention de Gel (Pied)", time: "2h", min: 120 }, 
      { id: 607, name: "Remplissage de Gel (Pied)", time: "1h30", min: 90 } 
  ] },
  { category: "Extra Ongles", items: [ 
      { id: 701, name: "Nail Art", time: "20 min", min: 20 }, { id: 702, name: "French", time: "20 min", min: 20 }, 
      { id: 703, name: "Babyboomer", time: "30 min", min: 30 }, { id: 704, name: "Faux Ongles avec permanent", time: "1h", min: 60 }, 
      { id: 705, name: "Chrome", time: "15 min", min: 15 }, { id: 706, name: "Dépose", time: "30 min", min: 30 } 
  ] },
  { category: "Soin de Visage", items: [ 
      { id: 901, name: "Soin purifiant", time: "1h", min: 60 }, { id: 902, name: "Soin éclat", time: "1h", min: 60 }, 
      { id: 903, name: "Soin hydratant", time: "1h", min: 60 } 
  ] },
  { category: "Épilation", items: [ { id: 401, name: "Duvet", time: "10 min", min: 10 }, { id: 402, name: "Sourcil", time: "15 min", min: 15 }, { id: 403, name: "Menton", time: "10 min", min: 10 }, { id: 404, name: "Visage Complet", time: "30 min", min: 30 }, { id: 405, name: "Bras", time: "20 min", min: 20 }, { id: 406, name: "Demi jambe", time: "20 min", min: 20 }, { id: 407, name: "Jambe complète", time: "40 min", min: 40 }, { id: 408, name: "Aisselles", time: "15 min", min: 15 }, { id: 410, name: "Épilation complète", time: "1h", min: 60 } ] },
  { category: "Massage", items: [ { id: 801, name: "Massage Relaxant 30min", time: "30 min", min: 30 }, { id: 802, name: "Massage Relaxant 45min", time: "45 min", min: 45 }, { id: 803, name: "Massage Relaxant 1h", time: "1h", min: 60 }, { id: 804, name: "Massage Nuque et épaules", time: "15 min", min: 15 }, { id: 805, name: "Massage cranien et faciale", time: "15 min", min: 15 }, { id: 806, name: "Massage des pieds", time: "15 min", min: 15 } ] },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 10; i < 21; i++) {
    slots.push(`${i}:00`); slots.push(`${i}:30`);
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("");
  const [staff, setStaff] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true); 

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [existingBookings, setExistingBookings] = useState([]);

  useEffect(() => {
    fetch('https://onhair.onrender.com/api/bookings').then(res => res.json()).then(data => { if(data.data) setExistingBookings(data.data); });
  }, [step]);

  const toggleService = (service) => {
    setSelectedServices(prev => prev.find(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]);
  };

  const isTimeSlotFull = (slotTime) => {
      const bookingsAtThisTime = existingBookings.filter(b => b.date === date && b.time === slotTime && b.status !== 'cancelled');
      return bookingsAtThisTime.length >= 3;
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    const serviceNames = selectedServices.map(s => s.name).join(", ");
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.min, 0);
    const chosenStaff = staff || 'Premier disponible';

    // FIRST VISIT TEXT LOGIC
    const firstVisitNote = isFirstTime 
      ? "Je précise qu'il s'agit de ma première visite dans votre établissement." 
      : "Je suis une cliente habituée de votre établissement.";

    // THE PROFESSIONAL TEXT FORMAT YOU REQUESTED
    const waMessage = `Objet : Demande de réservation - ${serviceNames}

Bonjour,
Je souhaiterais prendre rendez-vous chez ON H'AIR STUDIO pour bénéficier d'un soin.

*Mes coordonnées :*
Nom : ${fullName}
Téléphone : ${phoneNumber}
Email : ${email || 'Non fourni'}

*Détails souhaités :*
Prestation : ${serviceNames}
Date : ${date}
Heure : ${time}
Professionnel : ${chosenStaff}

${firstVisitNote}

Dans l'attente de votre confirmation, je vous prie d'agréer mes salutations distinguées.

Cordialement,
${fullName}`;

    const bookingData = {
      name: fullName, phone: phoneNumber, email, date, time,
      staff: chosenStaff, service_name: serviceNames,
      duration: totalDuration.toString(),
      notes: isFirstTime ? "Nouvelle Cliente" : "Habituée"
    };

    try {
      const res = await fetch('https://onhair.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
          setStep(4);
          const waUrl = `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(waMessage)}`;
          window.open(waUrl, '_blank');
      } else toast.error("Erreur réseau");
    } catch (e) { toast.error("Serveur éteint"); }
    finally { setLoading(false); }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Toaster position="top-center" />
      <div className="bg-gradient"></div>
      <div className="booking-card">
        <div className="card-header">
            <div className="header-top">
                <div style={{display:'flex', flexDirection:'column'}}>
                   <img src={logo} alt="Logo" style={{ height: '35px', width: 'auto' }} />
                   <a href="https://onhair.ma/" target="_blank" rel="noreferrer" style={{fontSize:'11px', color:'#EC4899', textDecoration:'none', marginTop:4, display:'flex', alignItems:'center', gap:3}}>
                     www.onhair.ma <ExternalLink size={10}/>
                   </a>
                </div>
                <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            </div>
            {step < 4 && <div className="progress-bar-container"><div className="progress-bar" style={{width: `${step * 33.3}%`}}></div></div>}
        </div>

        <div className="card-body">
            {step === 1 && (
                <div className="fade-in">
                    <h2 className="step-title">Choisissez vos prestations</h2>
                    <div className="scroll-area">
                      {SERVICES_DATA.map(cat => (
                          <div key={cat.category} className="category-group">
                              <h4 className="category-title">{cat.category}</h4>
                              <div className="services-grid">
                                  {cat.items.map(service => {
                                      const isSelected = selectedServices.find(s => s.id === service.id);
                                      return (
                                        <div key={service.id} className={`service-item ${isSelected ? 'active' : ''}`} onClick={() => toggleService(service)}>
                                            <div className="s-info"><span className="s-name">{service.name}</span><span className="s-time"><Clock size={12}/> {service.time}</span></div>
                                            <div className="s-select-icon">{isSelected ? <Check size={16} color="#d4af37"/> : "+"}</div>
                                        </div>
                                      )
                                  })}
                              </div>
                          </div>
                      ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="fade-in">
                    <h2 className="step-title">Votre Créneau</h2>
                    <div className="datetime-wrapper">
                        <div className="input-group">
                            <label><MapPin size={14}/> Date</label>
                            <input type="date" className="modern-input" value={date} onChange={e => { setDate(e.target.value); setTime(""); }} />
                        </div>
                        <div className="time-grid-scroll" style={{marginTop:20}}>
                            {TIME_SLOTS.map(slot => (
                                <button key={slot} className={`time-chip ${time === slot ? 'active' : ''} ${isTimeSlotFull(slot) ? 'disabled' : ''}`} onClick={() => !isTimeSlotFull(slot) && setTime(slot)} disabled={isTimeSlotFull(slot)}>{slot}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="fade-in">
                    <h2 className="step-title">Vos Coordonnées</h2>
                    <div className="recap-box">
                        {selectedServices.map(s => <div key={s.id} className="recap-row"><span className="recap-label">• {s.name}</span><span className="recap-val">{s.time}</span></div>)}
                        <div className="recap-row" style={{marginTop:10, paddingTop:10, borderTop:'1px solid rgba(128,128,128,0.2)'}}>
                            <span className="recap-label">Date</span><span className="recap-val">{date} à {time}</span>
                        </div>
                    </div>
                    <div className="form-area">
                        <div className="toggle-row">
                            <button className={`toggle-btn ${isFirstTime === true ? 'active' : ''}`} onClick={() => setIsFirstTime(true)}>Première fois</button>
                            <button className={`toggle-btn ${isFirstTime === false ? 'active' : ''}`} onClick={() => setIsFirstTime(false)}>Habituée</button>
                        </div>
                        <div style={{display:'flex', flexDirection:'column', gap:12}}>
                           <div className="input-group">
                              <label style={{fontSize:10, color:'#aaa', marginBottom:4, display:'block'}}>NOM ET PRÉNOM</label>
                              <input className="modern-input" style={{width:'100%'}} placeholder="Entrez votre nom complet" value={fullName} onChange={e => setFullName(e.target.value)}/>
                           </div>
                           
                           <div style={{display:'flex', gap:10}}>
                              <div style={{flex:1}}>
                                <label style={{fontSize:10, color:'#aaa', marginBottom:4, display:'block'}}>TÉLÉPHONE</label>
                                <div style={{display:'flex', gap:5}}>
                                  <div className="modern-input" style={{width:60, textAlign:'center', fontSize:12, padding:'10px 5px'}}>+212</div>
                                  <input className="modern-input" style={{flex:1}} placeholder="6 00 00 00 00" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                              </div>
                           </div>

                           <div className="input-group">
                              <label style={{fontSize:10, color:'#aaa', marginBottom:4, display:'block'}}>EMAIL (OPTIONNEL)</label>
                              <input className="modern-input" type="email" style={{width:'100%'}} placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)}/>
                           </div>
                        </div>

                        <label className="form-label" style={{marginTop: 15}}>Choix du Professionnel</label>
                        <select className="modern-input" style={{fontSize: '13px', color: 'white', backgroundColor: '#18181b', width:'100%'}} value={staff} onChange={e => setStaff(e.target.value)}>
                            <option value="" style={{color: 'black'}}>-- Premier disponible --</option>
                            <option value="Nabil" style={{color: 'black'}}>Nabil — Coiffeur Styliste</option>
                            <option value="Fahd" style={{color: 'black'}}>Fahd — Expert Coiffure</option>
                            <option value="Nezha" style={{color: 'black'}}>Nezha — Esthéticienne experte</option>
                        </select>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="fade-in success-screen">
                    <Check size={60} color="#d4af37" style={{margin:'0 auto'}} />
                    <h2 style={{marginTop:20}}>C'est noté !</h2>
                    <p>Merci {fullName.split(' ')[0]}, votre RDV est enregistré et WhatsApp a été ouvert.</p>
                    <button className="btn-primary" style={{marginTop:30, width:'100%'}} onClick={() => window.location.reload()}>Retour</button>
                </div>
            )}
        </div>

        {step < 4 && (
            <div className="card-footer">
                {step > 1 ? <button className="btn-text" onClick={() => setStep(step - 1)}>Retour</button> : <div></div>}
                <button className="btn-primary" onClick={step === 3 ? handleSubmit : () => setStep(step + 1)} disabled={(step === 1 && selectedServices.length === 0) || (step === 2 && !time) || (step === 3 && (!fullName || !phoneNumber || isFirstTime === null || loading))}>
                    {step === 3 ? (loading ? "Envoi..." : "Confirmer la Réservation") : "Suivant"}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
