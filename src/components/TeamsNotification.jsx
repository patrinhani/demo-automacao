import React, { useEffect } from 'react';
import './TeamsNotification.css'; // Vamos criar o CSS abaixo

export default function TeamsNotification({ show, onClose, title, message }) {
  if (!show) return null;

  return (
    <div className="teams-toast slide-in-right">
      <div className="teams-toast-header">
        <div className="teams-icon">T</div>
        <span className="teams-app-name">Microsoft Teams</span>
        <button onClick={onClose} className="teams-close">×</button>
      </div>
      <div className="teams-content">
        <div className="teams-avatar-mock">🤖</div>
        <div className="teams-text">
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      </div>
      <div className="teams-footer">
        <button className="teams-btn-reply" onClick={onClose}>Responder</button>
      </div>
    </div>
  );
}