import { useState, useEffect } from 'react';
import './index.css';
import { Toaster, toast } from 'react-hot-toast';
import { Clock, Check, Moon, Sun, Globe, User, Users, Info, MapPin } from 'lucide-react';

// --- DATA ---
const SERVICES_DATA = [
  { category: "Coiffure", items: [ { id: 101, name: "Brushing", time: "30 min" }, { id: 102, name: "SHP + Masque + Brushing", time: "45 min" }, { id: 103, name: "SHP spécifique + Masque + Brush", time: "1h" }, { id: 104, name: "Wavy", time: "30 min" }, { id: 105, name: "Wavy + SHP + Masque", time: "45 min" }, { id: 106, name: "Coupe correction et pointes", time: "30 min" }, { id: 107, name: "Coupe transformation", time: "1h" }, { id: 108, name: "Coupe enfant", time: "30 min" }, { id: 109, name: "Consultation et diagnostique", time: "30 min" }, { id: 110, name: "Diagnostique et mèche test", time: "45 min" } ] },
  { category: "Coloration", items: [ { id: 201, name: "Coloration", time: "2h" }, { id: 202, name: "Coloration sans ammoniaque", time: "2h" }, { id: 203, name: "Coloration racines", time: "1h30" }, { id: 204, name: "Coloration racines sans ammoniaque", time: "1h30" }, { id: 205, name: "Rinçage et correction de couleur", time: "1h" }, { id: 206, name: "Reflets Highlight", time: "2h30" }, { id: 207, name: "Ombré", time: "3h" }, { id: 208, name: "Balayage", time: "3h" }, { id: 209, name: "Airtouch", time: "4h" } ] },
  { category: "Soins Cheveux", items: [ { id: 301, name: "Soin ON h’AIR", time: "1h" }, { id: 302, name: "Soin a base de PLEX", time: "1h" }, { id: 303, name: "Soin COLLAGENE", time: "1h30" }, { id: 304, name: "Soin PROTEINE", time: "1h30" }, { id: 305, name: "Soin BRUSHING permanent", time: "2h" }, { id: 306, name: "Soin semi permanent CURLY hair", time: "1h30" }, { id: 307, name: "Soin permanent CURLY hair", time: "2h" } ] },
  { category: "Épilation", items: [ { id: 401, name: "Duvet", time: "10 min" }, { id: 402, name: "Sourcil", time: "15 min" }, { id: 403, name: "Menton", time: "10 min" }, { id: 404, name: "Visage Complet", time: "30 min" }, { id: 405, name: "Bras", time: "20 min" }, { id: 406, name: "Demi jambe", time: "20 min" }, { id: 407, name: "Jambe complète", time: "40 min" }, { id: 408, name: "Aisselles", time: "15 min" }, { id: 409, name: "Maillot", time: "20 min" }, { id: 410, name: "Épilation complète", time: "1h" } ] },
  { category: "Massage", items: [ { id: 801, name: "Massage Relaxant", time: "30 min" }, { id: 802, name: "Massage Relaxant", time: "45 min" }, { id: 803, name: "Massage Relaxant", time: "1h" }, { id: 804, name: "Massage Nuque et épaules", time: "15 min" }, { id: 805, name: "Massage cranien et faciale", time: "15 min" }, { id: 806, name: "Massage des pieds", time: "15 min" } ] },
  { category: "Manucure & Pédicure", items: [ { id: 501, name: "Pose vernis normal", time: "20 min" }, { id: 502, name: "Pose vernis permanent", time: "45 min" }, { id: 503, name: "Manucure classique", time: "30 min" }, { id: 504, name: "Manucure SPA", time: "45 min" }, { id: 505, name: "Manucure BIAB", time: "1h" }, { id: 604, name: "Pédicure SPA", time: "1h" } ] }
];

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 11; i < 21; i++) {
    slots.push(`${i}:00`);
    slots.push(`${i}:30`);
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

function App() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("");
  const [staff, setStaff] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true); 

  // --- NEW CLIENT FIELDS ---
  const [clientName, setClientName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+212");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(null);
  
  // --- DATA FROM SERVER ---
  const [staffList, setStaffList] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  // Fetch Staff and Bookings on Load
  useEffect(() => {
    // 1. Get Staff
    fetch('https://onhair.onrender.com/api/staff')
        .then(res => res.json())
        .then(data => { if(data.data) setStaffList(data.data); })
        .catch(err => console.error("Erreur staff", err));

    // 2. Get All Bookings (to check availability)
    fetch('https://onhair.onrender.com/api/bookings')
        .then(res => res.json())
        .then(data => { if(data.data) setExistingBookings(data.data); })
        .catch(err => console.error("Erreur bookings", err));
  }, []);

  // --- AVAILABILITY LOGIC ---
  const isTimeSlotFull = (slotTime) => {
      // 1. Find all bookings for the selected Date & Time
      const bookingsAtThisTime = existingBookings.filter(b => 
          b.date === date && b.time === slotTime && b.status !== 'cancelled'
      );

      // 2. Count total staff
      const totalStaff = staffList.length;

      // 3. Logic: If bookings >= total staff, the slot is FULL
      // (If you have 0 staff in DB, we assume unlimited to avoid blocking)
      if (totalStaff === 0) return false;
      
      return bookingsAtThisTime.length >= totalStaff;
  };

  const toggleTheme = () => setDarkMode(!darkMode);
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);

    let finalPhone = `${phoneCode}${phoneNumber}`;
    if (phoneCode === "+212" && phoneNumber.startsWith("0")) {
        finalPhone = "+212" + phoneNumber.substring(1);
    }
    const clientTypeStr = isFirstTime ? " (Nouvelle Cliente)" : " (Cliente Habituée)";

    const bookingData = {
      name: clientName,
      phone: finalPhone,
      date: date,
      time: time,
      staff: staff || 'Non assigné',
      service_name: selectedService.name,
      notes: clientTypeStr
    };

    try {
      const res = await fetch('https://onhair.onrender.com/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        nextStep();
      } else {
        toast.error("Erreur serveur");
      }
    } catch (e) { 
      toast.error("Le serveur ne répond pas"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <div className="bg-gradient"></div>

      <div className="booking-card">
        
        {/* HEADER */}
        <div className="card-header">
            <div className="header-top">
                <div className="logo-area">
                    <span className="logo-text">ON H'AIR</span>
                    <span className="logo-sub">STUDIO</span>
                </div>
                <button className="theme-toggle" onClick={toggleTheme}>
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
            
            {step < 4 && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{width: `${step * 33.3}%`}}></div>
                </div>
            )}
        </div>

        <div className="card-body">
            {/* STEP 1: SERVICE */}
            {step === 1 && (
                <div className="fade-in">
                    <h2 className="step-title">Choisissez votre prestation</h2>
                    
                    <a href="https://onhair.ma/" target="_blank" rel="noopener noreferrer" className="pricing-banner">
                        <Info size={18} />
                        <span>Voir les tarifs sur <strong>onhair.ma</strong></span>
                        <Globe size={16} style={{marginLeft:'auto', opacity:0.6}}/>
                    </a>

                    <div className="scroll-area">
                      {SERVICES_DATA.map(cat => (
                          <div key={cat.category} className="category-group">
                              <h4 className="category-title">{cat.category}</h4>
                              <div className="services-grid">
                                  {cat.items.map(service => (
                                      <div 
                                        key={service.id} 
                                        className={`service-item ${selectedService?.id === service.id ? 'active' : ''}`} 
                                        onClick={() => setSelectedService(service)}
                                      >
                                          <div className="s-info">
                                              <span className="s-name">{service.name}</span>
                                              <span className="s-time"><Clock size={12}/> {service.time}</span>
                                          </div>
                                          <div className="s-select-icon">
                                            {selectedService?.id === service.id ? <Check size={16}/> : "+"}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                    </div>
                </div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
                <div className="fade-in">
                    <h2 className="step-title">Votre Créneau</h2>
                    
                    <div className="datetime-wrapper">
                        <div className="input-group">
                            <label><MapPin size={14}/> Date du rendez-vous</label>
                            <input 
                                type="date" 
                                className="modern-input" 
                                value={date} 
                                onChange={e => { setDate(e.target.value); setTime(""); }} 
                            />
                        </div>

                        <label className="label-spacer"><Clock size={14}/> Horaires disponibles</label>
                        <div className="time-grid-scroll">
                            {TIME_SLOTS.map(slot => {
                                const isFull = isTimeSlotFull(slot);
                                return (
                                    <button 
                                        key={slot} 
                                        className={`time-chip ${time === slot ? 'active' : ''} ${isFull ? 'disabled' : ''}`} 
                                        onClick={() => !isFull && setTime(slot)}
                                        disabled={isFull}
                                    >
                                        {slot}
                                        {isFull && <span style={{fontSize:9, display:'block', opacity:0.6}}>Complet</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 3 && (
                <div className="fade-in">
                    <h2 className="step-title">Vos Coordonnées</h2>

                    <div className="recap-box">
                        <div className="recap-row">
                            <span className="recap-label">Service</span>
                            <span className="recap-val">{selectedService?.name}</span>
                        </div>
                        <div className="recap-row">
                            <span className="recap-label">Date</span>
                            <span className="recap-val">{date} à {time}</span>
                        </div>
                    </div>

                    <div className="form-area">
                        <label className="form-label">Est-ce votre première visite ?</label>
                        <div className="toggle-row">
                            <button className={`toggle-btn ${isFirstTime === true ? 'active' : ''}`} onClick={() => setIsFirstTime(true)}>
                                <User size={16} /> Première fois
                            </button>
                            <button className={`toggle-btn ${isFirstTime === false ? 'active' : ''}`} onClick={() => setIsFirstTime(false)}>
                                <Users size={16} /> Cliente habituée
                            </button>
                        </div>

                        <label className="form-label">Nom Complet</label>
                        <input className="modern-input" placeholder="Ex: Sara Benali" value={clientName} onChange={e => setClientName(e.target.value)}/>

                        <label className="form-label">Numéro de Téléphone (WhatsApp)</label>
                        <div className="phone-input-container">
                            <input type="text" className="phone-code" value={phoneCode} onChange={e => setPhoneCode(e.target.value)} />
                            <input type="tel" className="phone-number" placeholder="6 12 34 56 78" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                        </div>

                        <label className="form-label">Préférence Coiffeur (Optionnel)</label>
                        <select className="modern-input" value={staff} onChange={e => setStaff(e.target.value)}>
                            <option value="">-- Premier disponible --</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.name}>{s.name} ({s.special})</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
                <div className="fade-in success-screen">
                    <div className="success-icon"><Check size={40} /></div>
                    <h2>Merci {clientName.split(' ')[0]} !</h2>
                    <p>Votre demande a été reçue.</p>
                    <p className="sub-success">Confirmation envoyée au <strong>{phoneCode}{phoneNumber}</strong>.</p>
                    <button className="btn-primary full-width" style={{marginTop:30}} onClick={() => window.location.reload()}>
                        Retour à l'accueil
                    </button>
                </div>
            )}
        </div>

        {/* FOOTER */}
        {step < 4 && (
            <div className="card-footer">
                {step > 1 ? <button className="btn-text" onClick={prevStep}>Retour</button> : <div></div>}
                <button 
                    className="btn-primary" 
                    onClick={step === 3 ? handleSubmit : nextStep} 
                    disabled={ (step === 1 && !selectedService) || (step === 2 && !time) || (step === 3 && (!clientName || !phoneNumber || isFirstTime === null || loading)) }
                >
                    {step === 3 ? (loading ? "Envoi..." : "Confirmer le RDV") : "Suivant"}
                </button>
            </div>
        )}
      </div>

      <style>{`
        :root {
            --primary: #d4af37;
            --bg-dark: #000000;
            --card-dark: #121212;
            --text-dark: #ffffff;
            --border-dark: #27272a;
            
            --bg-light: #f4f4f5;
            --card-light: #ffffff;
            --text-light: #18181b;
            --border-light: #e4e4e7;
        }

        .app-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Inter', sans-serif; position: relative; overflow: hidden; }
        .dark-mode { background-color: var(--bg-dark); color: var(--text-dark); }
        .light-mode { background-color: var(--bg-light); color: var(--text-light); }
        
        .bg-gradient { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0) 50%); z-index: 0; pointer-events: none; }

        .booking-card {
            width: 100%; max-width: 500px;
            background: var(--card-light);
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            z-index: 1; display: flex; flex-direction: column;
            height: 85vh; max-height: 800px;
            overflow: hidden; border: 1px solid var(--border-light);
            transition: all 0.3s ease;
        }
        .dark-mode .booking-card { background: var(--card-dark); border-color: var(--border-dark); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }

        .card-header { padding: 20px 25px; border-bottom: 1px solid; border-color: inherit; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .logo-text { font-weight: 900; letter-spacing: 1px; font-size: 18px; }
        .logo-sub { font-weight: 300; margin-left: 5px; opacity: 0.7; font-size: 14px; }
        .theme-toggle { background: transparent; border: 1px solid var(--border-light); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: inherit; }
        .dark-mode .theme-toggle { border-color: var(--border-dark); }
        
        .progress-bar-container { height: 4px; background: rgba(128,128,128,0.2); border-radius: 2px; overflow: hidden; }
        .progress-bar { height: 100%; background: var(--primary); transition: width 0.4s ease; }

        .card-body { flex: 1; overflow-y: auto; padding: 25px; position: relative; }
        .step-title { margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 700; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pricing-banner {
            display: flex; align-items: center; gap: 10px;
            background: linear-gradient(90deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%);
            border: 1px solid rgba(212,175,55,0.3);
            padding: 12px 15px; border-radius: 12px;
            margin-bottom: 25px; text-decoration: none; color: inherit;
            font-size: 14px; transition: transform 0.2s;
        }

        .category-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.6; margin: 25px 0 10px 0; }
        
        .service-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px; border-radius: 12px; margin-bottom: 10px;
            background: rgba(128,128,128,0.05); border: 1px solid transparent;
            cursor: pointer; transition: all 0.2s;
            /* FORCE COLOR FIX FOR DARK MODE */
            color: inherit;
        }
        .dark-mode .service-item { background: rgba(255,255,255,0.05); color: #fff; }
        .service-item:hover { background: rgba(128,128,128,0.08); }
        .service-item.active { border-color: var(--primary); background: rgba(212,175,55,0.05); }
        
        /* Specific override for service name to be visible */
        .s-name { font-weight: 500; display: block; margin-bottom: 4px; color: inherit; }
        
        .modern-input { width: 100%; padding: 14px; border-radius: 12px; font-size: 16px; background: transparent; border: 1px solid; border-color: inherit; color: inherit; outline: none; transition: border 0.2s; box-sizing: border-box; }
        .modern-input:focus { border-color: var(--primary); }
        .dark-mode .modern-input { border-color: var(--border-dark); background: #1a1a1a; }
        .light-mode .modern-input { border-color: var(--border-light); background: #fff; }

        .time-grid-scroll { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 300px; overflow-y: auto; }
        .time-chip { padding: 12px; border-radius: 10px; border: 1px solid rgba(128,128,128,0.2); background: transparent; color: inherit; cursor: pointer; }
        .time-chip.active { background: var(--primary); color: black; font-weight: 600; border-color: var(--primary); }
        
        /* DISABLED TIME SLOT */
        .time-chip.disabled { opacity: 0.3; cursor: not-allowed; background: rgba(128,128,128,0.1); border-color: transparent; }

        .recap-box { background: rgba(128,128,128,0.05); padding: 15px; border-radius: 12px; margin-bottom: 25px; border: 1px dashed rgba(128,128,128,0.3); }
        .phone-input-container { display: flex; gap: 10px; }
        .phone-code { width: 80px; text-align: center; }
        .phone-number { flex: 1; }

        .toggle-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .toggle-btn { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid rgba(128,128,128,0.2); background: transparent; color: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; }
        .toggle-btn.active { border-color: var(--primary); color: var(--primary); background: rgba(212,175,55,0.05); font-weight: 600; }
        .form-label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; margin-top: 15px; }

        .card-footer { padding: 20px 25px; border-top: 1px solid; border-color: inherit; display: flex; justify-content: space-between; align-items: center; }
        .btn-primary { background: var(--primary); color: black; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
        .btn-primary:active { transform: scale(0.96); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-text { background: transparent; border: none; color: inherit; opacity: 0.7; cursor: pointer; }

        .success-screen { text-align: center; padding-top: 40px; }
        .success-icon { width: 80px; height: 80px; background: var(--primary); color: black; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .sub-success { opacity: 0.6; font-size: 14px; margin-top: 10px; }
        .full-width { width: 100%; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 3px; }
      `}</style>
    </div>
  );
}

export default App;