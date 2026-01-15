import React from 'react';
import logo from './logo.jpg'; 
import { 
    Users, 
    Calendar as CalIcon, 
    LogOut, 
    LayoutDashboard, 
    Wallet, 
    User, 
    X, 
    MessageSquare 
} from 'lucide-react';

export default function Sidebar({ viewMode, setViewMode, setIsLoggedIn, isMobile, closeMobileMenu }) {
    
    const handleLogout = () => {
        localStorage.removeItem('onhair_user');
        setIsLoggedIn(false);
    };

    // Professional luxury style helper
    const getItemStyle = (mode) => ({
        padding: '14px 20px',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        background: viewMode === mode ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
        color: viewMode === mode ? '#ef4444' : '#a1a1aa',
        borderLeft: viewMode === mode ? '3px solid #ef4444' : '3px solid transparent',
    });

    const handleNavigation = (mode) => {
        setViewMode(mode);
        if (isMobile) closeMobileMenu();
    };

    return (
        <div style={{ 
            background: '#050505', 
            height: '100%', 
            width: '100%', 
            padding: '30px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            color: 'white', 
            borderRight: '1px solid #1a1a1a' 
        }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:50}}>
                
                {/* --- LOGO --- */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src={logo} 
                        alt="OnHair Logo" 
                        style={{ height: '50px', width: 'auto', display: 'block', borderRadius: '8px' }} 
                    />
                </div>

                {isMobile && (
                    <button onClick={closeMobileMenu} style={{background:'none', border:'none', color:'#a1a1aa'}}>
                        <X size={24}/>
                    </button>
                )}
            </div>

            <nav style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
                <div onClick={() => handleNavigation('dashboard')} style={getItemStyle('dashboard')}>
                    <LayoutDashboard size={18}/> Tableau de Bord
                </div>
                
                <div onClick={() => handleNavigation('planning')} style={getItemStyle('planning')}>
                    <CalIcon size={18}/> Planning
                </div>
                
                <div onClick={() => handleNavigation('finance')} style={getItemStyle('finance')}>
                    <Wallet size={18}/> Caisse
                </div>
                
                <div onClick={() => handleNavigation('staff')} style={getItemStyle('staff')}>
                    <Users size={18}/> Staff
                </div>
                
                <div onClick={() => handleNavigation('clients')} style={getItemStyle('clients')}>
                    <User size={18}/> Clients
                </div>

                {/* --- NEW WHATSAPP TAB --- */}
                <div onClick={() => handleNavigation('whatsapp')} style={getItemStyle('whatsapp')}>
                    <MessageSquare size={18}/> Gestion WhatsApp
                </div>
            </nav>

            {/* Logout Section */}
            <div 
                onClick={handleLogout} 
                style={{
                    marginTop:'auto', 
                    padding:'15px 20px', 
                    cursor:'pointer', 
                    color:'#ef4444', 
                    display:'flex', 
                    gap:'12px', 
                    alignItems: 'center', 
                    fontSize: '14px',
                    fontWeight: '700',
                    borderTop: '1px solid #1a1a1a',
                    opacity: 0.8
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
            >
                <LogOut size={18}/> Déconnexion
            </div>
        </div>
    );
}