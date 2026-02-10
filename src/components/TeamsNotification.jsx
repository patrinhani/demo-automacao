import React from 'react';
import './TeamsNotification.css';

export default function TeamsNotification({ show, onClose, title, message }) {
  if (!show) return null;

  return (
    <div className="tech-toast slide-in-right">
      {/* Efeito de luz de fundo (Glow) */}
      <div className="tech-toast-glow"></div>

      <div className="tech-toast-header">
        <div className="tech-header-left">
            <span className="tech-icon">💬</span>
            <span className="tech-app-name">Chat Corporativo • Agora</span>
        </div>
        <button onClick={onClose} className="tech-close">×</button>
      </div>

      <div className="tech-content">
        <div className="tech-avatar-container">
            <div className="tech-avatar-img">🤖</div>
            <div className="tech-status-dot"></div>
        </div>
        
        <div className="tech-text">
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}