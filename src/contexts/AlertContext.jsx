import React, { createContext, useContext, useState } from 'react';
import './AlertContext.css';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' | 'confirm'
    onConfirm: null,
    onCancel: null
  });

  // Substitui o window.alert()
  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: 'alert',
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  // Substitui o window.confirm()
  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  // Função para disparar aquele Popup lateral de sucesso/erro
  const showToast = (title, message) => {
    window.dispatchEvent(new CustomEvent('manual-toast', { detail: { title, message } }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}
      
      {/* O HTML DO NOSSO MODAL CUSTOMIZADO */}
      {modal.isOpen && (
        <div className="custom-alert-overlay fade-in">
          <div className="custom-alert-box pop-in">
            <div className="alert-icon">
                {modal.type === 'confirm' ? '⚠️' : '🔔'}
            </div>
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>
            <div className="custom-alert-actions">
              {modal.type === 'confirm' && (
                <button className="btn-alert-cancel" onClick={modal.onCancel}>Cancelar</button>
              )}
              <button className="btn-alert-confirm" onClick={modal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);