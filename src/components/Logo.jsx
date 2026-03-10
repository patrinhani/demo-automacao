import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Logo({ size = 1, lightMode = false, iconOnly = false }) {
  const scale = size;
  const navigate = useNavigate();
  const location = useLocation(); // <-- Adicionado para pegar a rota atual
  
  const primaryColor = lightMode ? "#0ea5e9" : "#3b82f6";
  const secondaryColor = lightMode ? "#7c3aed" : "#8b5cf6";
  const textColor = lightMode ? "#1e293b" : "#ffffff";

  // Define as rotas onde o clique na logo não deve fazer nada
  const rotasBloqueadas = ['/', '/trocar-senha'];
  const isBloqueado = rotasBloqueadas.includes(location.pathname);

  // Função que gerencia o clique
  const handleLogoClick = () => {
    if (!isBloqueado) {
      navigate('/dashboard');
    }
  };

  return (
    <div 
      onClick={handleLogoClick}
      title={isBloqueado ? "TechCorp Solutions" : "Voltar para a Tela Inicial"}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        transform: `scale(${scale})`, 
        transformOrigin: 'center center', 
        cursor: isBloqueado ? 'default' : 'pointer' // Tira a "mãozinha" nas telas bloqueadas
      }}
    >
      
      {/* Ícone Tech Hexagonal com Gradiente */}
      <svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tech-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>
        
        <path 
          d="M20 2L37.32 12V32L20 42L2.68 32V12L20 2Z" 
          stroke="url(#tech-gradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        <path 
          d="M20 12V20M20 20L27 24M20 20L13 24" 
          stroke="url(#tech-gradient)" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="3" fill="url(#tech-gradient)" />
      </svg>

      {/* Texto da Logo (Só aparece se iconOnly for falso) */}
      {!iconOnly && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
          <span style={{ 
            color: textColor, 
            fontWeight: '800', 
            fontSize: '1.2rem', 
            letterSpacing: '-0.5px' 
          }}>
            TECH<span style={{ color: primaryColor }}>CORP</span>
          </span>
          <span style={{ 
            color: lightMode ? "#64748b" : "#94a3b8", 
            fontSize: '0.6rem', 
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            Solutions
          </span>
        </div>
      )}
    </div>
  );
}