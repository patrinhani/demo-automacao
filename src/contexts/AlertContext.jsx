import React, { createContext, useContext, useState } from 'react';
import './AlertContext.css';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    inputValue: '',
    onConfirm: null,
    onCancel: null
  });

  // Substitui o window.alert()
  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setModal({
          isOpen: true,
          title,
          message,
          type: 'alert',
          inputValue: '',
          onConfirm: () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            resolve(true);
          }
        });
      }, 100);
    });
  };

  // Substitui o window.confirm()
  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setModal({
          isOpen: true,
          title,
          message,
          type: 'confirm',
          inputValue: '',
          onConfirm: () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            resolve(false);
          }
        });
      }, 100);
    });
  };

  // Substitui o window.prompt()
  const showPrompt = (title, message) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setModal({
          isOpen: true,
          title,
          message,
          type: 'prompt',
          inputValue: '',
          onConfirm: (value) => {
            setModal(prev => ({ ...prev, isOpen: false }));
            resolve(value);
          },
          onCancel: () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            resolve(null);
          }
        });
      }, 100);
    });
  };

  // Função para disparar o Popup lateral de sucesso/erro
  const showToast = (title, message) => {
    window.dispatchEvent(new CustomEvent('manual-toast', { detail: { title, message } }));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setModal(prev => ({ ...prev, inputValue: val }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt, showToast }}>
      {children}
      
      {modal.isOpen && (
        <div className="custom-alert-overlay fade-in">
          <div className="custom-alert-box pop-in">
            <div className="alert-icon">
                {modal.type === 'confirm' || modal.type === 'prompt' ? '⚠️' : '🔔'}
            </div>
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>
            
            {modal.type === 'prompt' && (
               <input 
                 type="text"
                 value={modal.inputValue}
                 onChange={handleInputChange}
                 autoFocus
                 style={{
                   width: '100%', 
                   padding: '12px', 
                   marginTop: '15px', 
                   borderRadius: '8px', 
                   border: '1px solid #334155', 
                   background: 'rgba(15,23,42,0.8)', 
                   color: 'white',
                   fontSize: '1rem'
                 }}
                 placeholder="Escreva aqui..."
               />
            )}

            <div className="custom-alert-actions">
              {(modal.type === 'confirm' || modal.type === 'prompt') && (
                <button className="btn-alert-cancel" onClick={modal.onCancel}>Cancelar</button>
              )}
              <button 
                className="btn-alert-confirm" 
                onClick={() => modal.onConfirm(modal.type === 'prompt' ? modal.inputValue : true)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);