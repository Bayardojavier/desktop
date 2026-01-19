// desktop/src/Toolbar.jsx
import React, { useState } from 'react';
import TabsBar from './TabsBar';
import ActionButtons from './ActionButtons';

export default function Toolbar({ user, onLogout, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Modulos');

  const isAdmin = user?.rol === 'admin';

  // Definir pestañas según el rol
  const tabs = ['Modulos'];
  if (isAdmin) tabs.unshift('Usuarios'); // Pestaña "Usuarios" solo para admin

  return (
    <div style={{ 
      backgroundColor: '#007BFF', 
      minHeight: '100vh', 
      color: 'white', 
      fontFamily: 'Arial',
      paddingTop: '60px'
    }}>
      {/* Barra de pestañas */}
      <TabsBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Botones de acción según pestaña */}
      <ActionButtons
        activeTab={activeTab}
        isAdmin={isAdmin}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />

      {/* Logo o nombre de la empresa */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        fontSize: '24px' 
      }}>
        Absolute de Nicaragua
      </div>
    </div>
  );
}