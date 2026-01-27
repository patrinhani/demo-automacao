import React from 'react';

// Aceita props 'size' para ajustar tamanho e 'lightMode' para PDF (fundo branco)
export default function Logo({ size = 1, lightMode = false }) {
  const scale = size;
  
  // Cores: Se for lightMode (para PDF), usa cores escuras. Senão, usa Neon.
  const primaryColor = lightMode ? "#0ea5e9" : "#3b82f6"; // Azul
  const secondaryColor = lightMode ? "#7c3aed" : "#8b5cf6"; // Roxo
  const textColor = lightMode ? "#1e293b" : "#ffffff";

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', transform: `scale(${scale})`, transformOrigin: 'left center' }}>
      
      {/* Ícone Tech Hexagonal com Gradiente */}
      {/* Aumentei a altura (height) e o viewBox para 44 para caber o ponto Y=42 com folga */}
<svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tech-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>
        
        {/* Forma Hexagonal Externa */}
        <path 
          d="M20 2L37.32 12V32L20 42L2.68 32V12L20 2Z" 
          stroke="url(#tech-gradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Circuito Interno */}
        <path 
          d="M20 12V20M20 20L27 24M20 20L13 24" 
          stroke="url(#tech-gradient)" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="3" fill="url(#tech-gradient)" />
      </svg>

      {/* Texto da Logo */}
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
    </div>
  );
}