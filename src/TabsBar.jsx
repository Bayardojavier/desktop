// desktop/src/TabsBar.jsx
import React from 'react';

export default function TabsBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '30px',
      borderBottom: '2px solid white'
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'transparent',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            fontWeight: activeTab === tab ? 'bold' : 'normal',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}