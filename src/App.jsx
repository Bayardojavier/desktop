// desktop/src/App.jsx
import React, { useState, useEffect } from 'react';

export default function App({ user, handleLogout, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Inicio');

  // Siempre incluir "Inicio"
  const baseTabs = ['Inicio'];
  let dynamicTabs = [];

  if (!user) {
    dynamicTabs = ['Usuarios'];
  } else {
    dynamicTabs = ['Módulos'];
    if (user.rol === 'admin') {
      dynamicTabs.unshift('Usuarios');
    }
  }

  const tabs = [...baseTabs, ...dynamicTabs];

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab('Inicio');
    }
  }, [tabs, activeTab]);

  const getActions = () => {
    // Pestaña "Inicio" → funciones de edición estándar
    if (activeTab === 'Inicio') {
      return [
        { id: 'cortar', label: 'Cortar', icon: '✂️' },
        { id: 'copiar', label: 'Copiar', icon: '📋' },
        { id: 'pegar', label: 'Pegar', icon: '📄' },
        { id: 'deshacer', label: 'Deshacer', icon: '↩️' },
        { id: 'rehacer', label: 'Rehacer', icon: '↪️' },
        { id: 'buscar', label: 'Buscar', icon: '🔍' },
        { id: 'guardar', label: 'Guardar', icon: '💾' },
        { id: 'imprimir', label: 'Imprimir', icon: '🖨️' }
      ];
    }

    // Pestaña "Usuarios"
    if (activeTab === 'Usuarios') {
      if (!user) {
        return [{ id: 'login', label: 'Iniciar sesión', icon: '🔑' }];
      }
      if (user.rol === 'admin') {
        return [
          { id: 'crear-usuario', label: 'Crear Usuario', icon: '👤' },
          { id: 'logout', label: 'Cerrar Sesión', icon: '🚪' }
        ];
      }
      return [{ id: 'logout', label: 'Cerrar Sesión', icon: '🚪' }];
    }

    // Pestaña "Módulos"
    if (activeTab === 'Módulos' && user) {
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
    // Acciones de edición (solo feedback visual por ahora)
    if (['cortar', 'copiar', 'pegar', 'deshacer', 'rehacer', 'buscar', 'guardar', 'imprimir'].includes(id)) {
      alert(`Función "${id}" no implementada aún (solo UI)`);
      return;
    }

    // Acciones de negocio
    if (id === 'logout') {
      handleLogout();
    } else if (id === 'login') {
      // Ya deberías estar en Auth, pero por coherencia:
      onNavigate('login');
    } else if (id === 'crear-usuario') {
      onNavigate('CrearUsuario');
    } else {
      onNavigate(id);
    }
  };

  return (
    <div style={{
      backgroundColor: '#007BFF',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial',
      paddingTop: '70px'
    }}>
      {/* Barra de pestañas tipo Office */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'flex-start',
        padding: '8px 20px',
        borderBottom: '2px solid rgba(255,255,255,0.4)',
        zIndex: 100,
        gap: '4px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#0056b3' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '14px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              borderRadius: '4px',
              outline: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cinta de botones de acción */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: '20px',
        marginTop: '30px',
        padding: '0 30px'
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
              width: '110px',
              height: '100px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
          >
            <span style={{ fontSize: '24px', marginBottom: '6px' }}>{action.icon}</span>
            {action.label}
          </div>
        ))}
      </div>

      {/* Nombre de la empresa */}
      <div style={{
        textAlign: 'center',
        marginTop: '50px',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        Absolute de Nicaragua
      </div>
    </div>
  );
}