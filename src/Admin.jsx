import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Planning from './Planning';
import Staff from './Staff';
import Caisse from './Caisse'; 
import Clients from './Clients';
import { Lock, Mail, Menu } from 'lucide-react';

export default function Admin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [viewMode, setViewMode] = useState('planning');
    const [role, setRole] = useState(''); 
    const [currentUser, setCurrentUser] = useState('');
    
    // Mobile State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // --- ÉTAPE 1 : VÉRIFIER SI L'UTILISATEUR EST DÉJÀ CONNECTÉ AU DÉMARRAGE ---
    useEffect(() => {
        const savedUser = localStorage.getItem('onhair_session');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setRole(userData.role);
            setCurrentUser(userData.name);
            setIsLoggedIn(true);
        }

        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
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
        
        let authenticatedUser = null;

        if (userEmail === 'onhairmaroc@gmail.com' && userPass === 'onhair2025') {
            authenticatedUser = { role: 'superadmin', name: 'Direction' };
        } 
        else if (userEmail === 'nezhaelghazouani829@gmail.com' && userPass === 'nezha2025') {
            authenticatedUser = { role: 'admin', name: 'Nezha' };
        } 

        if (authenticatedUser) {
            setRole(authenticatedUser.role);
            setCurrentUser(authenticatedUser.name);
            setViewMode('planning'); 
            setIsLoggedIn(true);
            
            // --- ÉTAPE 2 : ENREGISTRER LA SESSION ---
            localStorage.setItem('onhair_session', JSON.stringify(authenticatedUser));
        } else {
            setError("Email ou mot de passe incorrect");
        }
    };

    // --- ÉTAPE 3 : FONCTION DE DÉCONNEXION ---
    const handleLogout = () => {
        localStorage.removeItem('onhair_session'); // Efface la mémoire
        setIsLoggedIn(false);
        setRole('');
        setCurrentUser('');
    };

    if (!isLoggedIn) {
        return (
            <div style={styles.loginContainer}>
                <div style={styles.loginCard}>
                    <h2 style={{textAlign:'center', marginBottom:10, color:'white'}}>OnHair Admin</h2>
                    <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:15}}>
                        <div style={styles.inputWrapper}>
                            <Mail size={18} color="#9CA3AF"/>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                style={styles.input} 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div style={styles.inputWrapper}>
                            <Lock size={18} color="#9CA3AF"/>
                            <input 
                                type="password" 
                                placeholder="Mot de passe" 
                                style={styles.input} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <div style={{color:'#ef4444', fontSize:14, textAlign:'center'}}>{error}</div>}
                        <button type="submit" style={styles.loginBtn}>Se Connecter</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                html, body { overflow-x: hidden; width: 100%; position: relative; }
                .admin-container { display: flex; height: 100vh; width: 100vw; background: black; color: white; overflow: hidden; }
                .sidebar-wrapper { width: 260px; background: #151E2E; flex-shrink: 0; }
                .mobile-header { display: none; }
                @media (max-width: 768px) {
                    .admin-container { flex-direction: column; }
                    .sidebar-wrapper { position: fixed; top: 0; bottom: 0; width: 280px; left: -300px; transition: left 0.3s ease; z-index: 5000; box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
                    .sidebar-wrapper.open { left: 0; }
                    .mobile-header { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; background: #151E2E; border-bottom: 1px solid #374151; flex-shrink: 0; }
                    .menu-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 4000; }
                    input, select, textarea { font-size: 16px !important; }
                }
            `}</style>

            {isMobile && isMobileMenuOpen && (
                <div className="menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
                <Sidebar 
                    viewMode={viewMode} 
                    setViewMode={setViewMode} 
                    setIsLoggedIn={handleLogout} // MODIFIÉ : On utilise handleLogout ici
                    role={role}
                    currentUser={currentUser} 
                    isMobile={isMobile}
                    closeMobileMenu={() => setIsMobileMenuOpen(false)}
                />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="mobile-header">
                    <button onClick={() => setIsMobileMenuOpen(true)} style={{background:'transparent', border:'none', color:'white'}}>
                        <Menu size={28} />
                    </button>
                    <span style={{fontWeight:'bold', fontSize:18}}>OnHair</span>
                    <div style={{width:28}}></div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
                    {viewMode === 'dashboard' && role === 'superadmin' && <Dashboard />}
                    {viewMode === 'finance' && role === 'superadmin' && <Caisse />}
                    {viewMode === 'staff' && role === 'superadmin' && <Staff />}
                    {viewMode === 'clients' && role === 'superadmin' && <Clients />}
                    
                    {viewMode === 'planning' && (
                        <Planning role={role} onBack={() => setViewMode('dashboard')} />
                    )}
                    
                    {viewMode !== 'planning' && role === 'admin' && (
                        <div style={{padding:50, textAlign:'center'}}>Accès Refusé</div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    loginContainer: { height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' },
    loginCard: { background:'#18181b', padding:40, borderRadius:16, width:350, border:'1px solid #333' },
    inputWrapper: { background:'#000', border:'1px solid #333', borderRadius:8, padding:'12px 15px', display:'flex', alignItems:'center', gap:10 },
    input: { background:'transparent', border:'none', color:'white', outline:'none', width:'100%', fontSize: '16px' },
    loginBtn: { background: '#EC4899', color:'white', border:'none', padding:12, borderRadius:8, width:'100%', marginTop:10, fontWeight:'bold' }
};