import React from 'react';
import logo from './logo.jpg'; 
import { Users, Calendar, LogOut, LayoutDashboard, Wallet, User, X, MessageSquare, Settings, BarChart2 } from 'lucide-react';

export default function Sidebar({ viewMode, setViewMode, setIsLoggedIn, isMobile, closeMobileMenu, role }) {
    
    const navItems = [
        { id: 'planning', label: 'Planning', icon: Calendar, minRole: 'admin' },
        { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, minRole: 'superadmin' },
        { id: 'finance', label: 'Caisse', icon: Wallet, minRole: 'superadmin' },
        { id: 'staff', label: 'Staff', icon: Users, minRole: 'superadmin' },
        { id: 'clients', label: 'Clients', icon: User, minRole: 'superadmin' },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, minRole: 'superadmin' },
        { id: 'stats', label: 'Statistiques', icon: BarChart2, minRole: 'superadmin' },
        { id: 'settings', label: 'Paramètres', icon: Settings, minRole: 'superadmin' },
    ];

    return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '25px 15px', 
            borderRight: '1px solid #1a1a1a',
            boxSizing: 'border-box',
            background: '#050505'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <img src={logo} alt="OnHair" style={{ height: 40, borderRadius: 8 }} />
                {isMobile && (
                    <button onClick={closeMobileMenu} style={{background:'none', border:'none', color:'#666', cursor:'pointer'}}>
                        <X size={24} />
                    </button>
                )}
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
                {navItems.map((item) => {
                    // Role Check
                    if (item.minRole === 'superadmin' && role !== 'superadmin') return null;
                    
                    const active = viewMode === item.id;
                    return (
                        <div 
                            key={item.id}
                            onClick={() => { setViewMode(item.id); if(isMobile) closeMobileMenu(); }}
                            style={{
                                padding: '12px 16px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                transition: 'all 0.2s ease',
                                background: active ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                color: active ? '#ef4444' : '#a1a1aa',
                                fontWeight: active ? '700' : '600',
                                borderLeft: active ? '3px solid #ef4444' : '3px solid transparent'
                            }}
                        >
                            <item.icon size={18} />
                            <span style={{ fontSize: 14 }}>{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            <div 
                onClick={setIsLoggedIn}
                style={{
                    padding: '15px 16px',
                    marginTop: '20px',
                    borderTop: '1px solid #1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: 14
                }}
            >
                <LogOut size={18} /> Déconnexion
            </div>
        </div>
    );
}