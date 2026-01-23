// desktop/src/ActionButtons.jsx
import React from 'react';

export default function ActionButtons({ activeTab, isAdmin, onLogout, onNavigate }) {
  // Definir acciones por pestaña
  const getActions = () => {
    if (activeTab === 'Usuarios' && isAdmin) {
      return [
        { id: 'login', label: 'Iniciar sesión', icon: '🔑' },
        { id: 'crear-usuario', label: 'Crear Usuario', icon: '👤' },
        { id: 'logout', label: 'Cerrar Sesión', icon: '🚪' }
      ];
    }

    if (activeTab === 'Modulos') {
      return [
        { id: 'ventas', label: 'Ventas', icon: '🛒' },
        { id: 'bodega', label: 'Bodega', icon: '📦' },
        { id: 'personal', label: 'Personal', icon: '👷' },
        { id: 'asistencia', label: 'Asistencia', icon: '📝' },
        { id: 'reportes', label: 'Reportes', icon: '📊' },
        { id: 'eventos', label: 'Eventos', icon: '🎉' }
      ];
    }

    return [];
  };

  const actions = getActions();

  const handleAction = (id) => {
    if (id === 'logout') {
      onLogout();
    } else if (id === 'crear-usuario') {
      onNavigate('CrearUsuario');
    } else {
      // Navegar a módulos
      onNavigate(id);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '20px'
    }}>
      {actions.map(action => (
        <div
          key={action.id}
          onClick={() => handleAction(action.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '130px',
            height: '130px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: '2px solid rgba(255,255,255,0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: '36px', marginBottom: '8px' }}>{action.icon}</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
            {action.label}
          </span>
        </div>
      ))}
    </div>
  );
}