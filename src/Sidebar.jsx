import React from 'react';
// On importe le logo qui est juste à côté du fichier
import logo from './logo.jpg'; 
import { Users, Calendar as CalIcon, LogOut, LayoutDashboard, Wallet, User, X } from 'lucide-react';

export default function Sidebar({ viewMode, setViewMode, setIsLoggedIn, role, currentUser, isMobile, closeMobileMenu }) {
    
    const handleLogout = () => {
        localStorage.removeItem('onhair_user');
        setIsLoggedIn(false);
    };

    return (
        <div style={{ background: '#151E2E', height: '100%', width: '100%', padding: 20, display: 'flex', flexDirection: 'column', color: 'white' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
                
                {/* --- LE LOGO --- */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                        src={logo} 
                        alt="OnHair Logo" 
                        style={{ height: '55px', width: 'auto', display: 'block' }} 
                    />
                </div>

                {isMobile && <button onClick={closeMobileMenu} style={{background:'none', border:'none', color:'white'}}><X/></button>}
            </div>

            <nav style={{flex:1, display:'flex', flexDirection:'column', gap:10}}>
                <div onClick={() => setViewMode('dashboard')} 
                    style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: viewMode === 'dashboard' ? '#EC4899' : 'transparent', color: 'white' }}>
                    <LayoutDashboard size={20}/> Tableau de Bord
                </div>
                
                <div onClick={() => setViewMode('planning')} 
                    style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: viewMode === 'planning' ? '#EC4899' : 'transparent', color: 'white' }}>
                    <CalIcon size={20}/> Planning
                </div>
                
                <div onClick={() => setViewMode('finance')} 
                    style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: viewMode === 'finance' ? '#EC4899' : 'transparent', color: 'white' }}>
                    <Wallet size={20}/> Caisse
                </div>
                
                <div onClick={() => setViewMode('staff')} 
                    style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: viewMode === 'staff' ? '#EC4899' : 'transparent', color: 'white' }}>
                    <Users size={20}/> Staff
                </div>
                
                <div onClick={() => setViewMode('clients')} 
                    style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: viewMode === 'clients' ? '#EC4899' : 'transparent', color: 'white' }}>
                    <User size={20}/> Clients
                </div>
            </nav>

            <div onClick={handleLogout} style={{marginTop:'auto', padding:15, cursor:'pointer', color:'#EF4444', display:'flex', gap:10, alignItems: 'center', fontWeight: 'bold'}}>
                <LogOut size={20}/> Déconnexion
            </div>
        </div>
    );
}