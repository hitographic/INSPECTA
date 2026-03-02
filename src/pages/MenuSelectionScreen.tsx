import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Clipboard, Factory, FileCheck, Settings } from 'lucide-react';
import { authService } from '../utils/authService';
import { useApp } from '../contexts/AppContext';

const MenuSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const currentUser = authService.getCurrentUser();
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (clickCount >= 5) {
      if (authService.hasPermission('view_admin_panel')) {
        navigate('/admin');
      }
    }
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount, navigate]);

  const menuItems = [
    {
      id: 'sanitasi_besar',
      icon: Droplets,
      title: 'Sanitasi Besar',
      color: '#3B82F6',
      available: true
    },
    {
      id: 'kliping',
      icon: Clipboard,
      title: 'Kliping',
      color: '#10B981',
      available: true
    },
    {
      id: 'monitoring_area',
      icon: Factory,
      title: 'Monitoring Area',
      color: '#F1AA62',
      available: true
    },
    {
      id: 'audit_internal',
      icon: FileCheck,
      title: 'Audit Internal',
      color: '#8B5CF6',
      available: false
    }
  ];

  const handleMenuClick = (menuId: string, available: boolean) => {
    if (!available) {
      alert('Coming soon, yeay! 🎉');
      return;
    }

    const hasAccess = authService.hasMenuAccess(menuId);
    if (!hasAccess) {
      alert('Anda tidak memiliki akses ke menu ini. Silakan hubungi administrator.');
      return;
    }

    if (menuId === 'sanitasi_besar') {
      navigate('/plant-selection');
    } else if (menuId === 'kliping') {
      navigate('/plant-selection-kliping');
    } else if (menuId === 'monitoring_area') {
      navigate('/plant-selection-monitoring');
    }
  };

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser('');
    navigate('/');
  };

  return (
    <div className="container">
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1
            onClick={handleSecretClick}
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1F2937',
              marginBottom: '0.5rem',
              cursor: 'default',
              userSelect: 'none'
            }}
          >
            Pilih Menu
          </h1>
          <p style={{
            color: '#6B7280',
            fontSize: '0.875rem'
          }}>
            Selamat datang, {currentUser?.full_name}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasAccess = authService.hasMenuAccess(item.id);
            const isDisabled = !item.available || !hasAccess;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id, item.available)}
                style={{
                  background: isDisabled ? '#F3F4F6' : item.color,
                  color: isDisabled ? '#9CA3AF' : 'white',
                  border: 'none',
                  borderRadius: '1rem',
                  padding: '2rem 1rem',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isDisabled ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: isDisabled ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <Icon size={48} />
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {item.title}
                </span>
                {!item.available && (
                  <span style={{
                    fontSize: '0.75rem',
                    opacity: 0.8
                  }}>
                    Coming Soon
                  </span>
                )}
                {item.available && !hasAccess && (
                  <span style={{
                    fontSize: '0.75rem',
                    opacity: 0.8
                  }}>
                    No Access
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {authService.hasPermission('view_admin_panel') && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #E5E7EB'
          }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: '#6366F1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6366F1';
              }}
            >
              <Settings size={20} />
              Admin Panel
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#DC2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#EF4444';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuSelectionScreen;
