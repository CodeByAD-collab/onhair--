import React from 'react';
import { Users, Calendar as CalIcon, LogOut, Scissors, LayoutDashboard, Wallet, User, X } from 'lucide-react';

export default function Sidebar({ viewMode, setViewMode, setIsLoggedIn, role, currentUser, isMobile, closeMobileMenu }) {
    const allMenuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de Bord' },
        { id: 'planning', icon: CalIcon, label: 'Planning' },
        { id: 'finance', icon: Wallet, label: 'Caisse' },
        { id: 'staff', icon: Users, label: 'Staff' },
        { id: 'clients', icon: User, label: 'Clients' } 
    ];

    const menuItems = role === 'admin' 
        ? allMenuItems.filter(item => item.id === 'planning') 
        : allMenuItems;

    const handleNav = (id) => {
        setViewMode(id);
        if (isMobile && closeMobileMenu) closeMobileMenu();
    };

    return (
        <div style={{
            background: '#151E2E', height: '100%', width: '100%', padding: 20,
            display: 'flex', flexDirection: 'column', color: 'white'
        }}>
            {/* Logo */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
                <h2 style={{margin:0, display:'flex', gap:10, alignItems:'center'}}>
                    <Scissors size={24} color="#EC4899"/> OnHair
                </h2>
                {isMobile && <button onClick={closeMobileMenu} style={{background:'none', border:'none', color:'white'}}><X/></button>}
            </div>

            {/* Menu */}
            <nav style={{flex:1, display:'flex', flexDirection:'column', gap:5}}>
                {menuItems.map(item => (
                    <div key={item.id} onClick={() => handleNav(item.id)}
                        style={{
                            padding: '12px 15px', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                            background: viewMode === item.id ? '#EC4899' : 'transparent',
                            fontWeight: viewMode === item.id ? 'bold' : 'normal',
                            color: viewMode === item.id ? 'white' : '#aaa'
                        }}
                    >
                        <item.icon size={20}/> {item.label}
                    </div>
                ))}
            </nav>

            <div onClick={() => setIsLoggedIn(false)} style={{marginTop:'auto', padding:15, cursor:'pointer', color:'#EF4444', display:'flex', gap:10}}>
                <LogOut/> Déconnexion
            </div>
        </div>
    );
}