import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Planning from './Planning';
import Staff from './Staff';
import Caisse from './Caisse'; 
import Clients from './Clients';
import WhatsAppSettings from './WhatsAppSettings';
import Settings from './Settings'; 
import Statistics from './Statistics'; 
import { Lock, Mail, Menu } from 'lucide-react';

export default function Admin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [viewMode, setViewMode] = useState('planning');
    const [role, setRole] = useState(''); 
    const [currentUser, setCurrentUser] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    // Track responsiveness
    useEffect(() => {
        const savedUser = localStorage.getItem('onhair_session');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setRole(userData.role);
            setCurrentUser(userData.name);
            setIsLoggedIn(true);
        }

        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) setIsMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        const userEmail = email.toLowerCase().trim();
        const userPass = password.trim();
        let auth = null;

        if (userEmail === 'onhairmaroc@gmail.com' && userPass === 'onhair2025') {
            auth = { role: 'superadmin', name: 'Direction' };
        } else if (userEmail === 'nezhaelghazouani829@gmail.com' && userPass === 'nezha2025') {
            auth = { role: 'admin', name: 'Nezha' };
        } 

        if (auth) {
            setRole(auth.role);
            setCurrentUser(auth.name);
            setIsLoggedIn(true);
            localStorage.setItem('onhair_session', JSON.stringify(auth));
        } else {
            setError("Identifiants incorrects");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('onhair_session');
        setIsLoggedIn(false);
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isLoggedIn) {
        return (
            <div style={styles.loginPage}>
                <div style={styles.loginCard}>
                    <h2 style={{color:'white', textAlign:'center', marginBottom:25}}>OnHair Admin</h2>
                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.inputBox}>
                            <Mail size={18} color="#666"/>
                            <input type="email" placeholder="Email" style={styles.input} value={email} onChange={e=>setEmail(e.target.value)} />
                        </div>
                        <div style={styles.inputBox}>
                            <Lock size={18} color="#666"/>
                            <input type="password" placeholder="Mot de passe" style={styles.input} value={password} onChange={e=>setPassword(e.target.value)} />
                        </div>
                        {error && <p style={{color:'#ef4444', fontSize:13, textAlign:'center'}}>{error}</p>}
                        <button type="submit" style={styles.loginBtn}>Connexion</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.adminLayout}>
            <style>{`
                .sidebar-container {
                    width: 260px;
                    height: 100vh;
                    background: #050505;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 1000;
                    flex-shrink: 0;
                }
                @media (max-width: 1024px) {
                    .sidebar-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        transform: translateX(${isMobileMenuOpen ? '0' : '-101%'});
                    }
                }
                .main-content {
                    flex: 1;
                    height: 100vh;
                    overflow-y: auto;
                    background: #000;
                    display: flex;
                    flex-direction: column;
                }
                .overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 999;
                    backdrop-filter: blur(4px);
                }
            `}</style>

            {isMobile && isMobileMenuOpen && <div className="overlay" onClick={() => setIsMobileMenuOpen(false)} />}

            <div className="sidebar-container">
                <Sidebar 
                    viewMode={viewMode} 
                    setViewMode={setViewMode} 
                    setIsLoggedIn={handleLogout}
                    isMobile={isMobile}
                    closeMobileMenu={() => setIsMobileMenuOpen(false)}
                    role={role}
                />
            </div>

            <div className="main-content">
                {isMobile && (
                    <div style={styles.mobileHeader}>
                        <button onClick={() => setIsMobileMenuOpen(true)} style={styles.menuBtn}>
                            <Menu size={28} color="white" />
                        </button>
                        <span style={{fontWeight:'700', fontSize:18}}>OnHair</span>
                        <div style={{width:28}}></div>
                    </div>
                )}

                <div style={{ padding: isMobile ? '15px' : '30px', flex: 1 }}>
                    {viewMode === 'planning' && <Planning role={role} />}
                    
                    {role === 'superadmin' ? (
                        <>
                            {viewMode === 'dashboard' && <Dashboard />}
                            {viewMode === 'finance' && <Caisse />}
                            {viewMode === 'staff' && <Staff />}
                            {viewMode === 'clients' && <Clients />}
                            {viewMode === 'whatsapp' && <WhatsAppSettings />}
                            {viewMode === 'stats' && <Statistics />}
                            {viewMode === 'settings' && <Settings />}
                        </>
                    ) : (
                        viewMode !== 'planning' && (
                            <div style={{textAlign:'center', marginTop:100}}>
                                <h3>Accès non autorisé</h3>
                                <p style={{color:'#666'}}>Vous n'avez pas les permissions pour voir cette page.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    adminLayout: { display: 'flex', width: '100vw', height: '100vh', background: '#000', color: 'white', overflow: 'hidden' },
    mobileHeader: { height: 60, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
    menuBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 5 },
    loginPage: { height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loginCard: { background: '#0a0a0a', padding: 40, borderRadius: 15, width: '90%', maxWidth: 360, border: '1px solid #1a1a1a' },
    form: { display: 'flex', flexDirection: 'column', gap: 15 },
    inputBox: { background: '#000', border: '1px solid #333', borderRadius: 8, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10 },
    input: { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: 16 },
    loginBtn: { background: '#ef4444', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontWeight: '700', cursor: 'pointer', marginTop: 10 }
};