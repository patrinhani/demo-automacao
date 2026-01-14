// src/components/Logo.jsx
import '../App.css';

export default function Logo({ lightMode = false, size = 1 }) {
  // Define as cores baseado se o fundo é claro ou escuro
  // lightMode = true -> Fundo branco (logo azul)
  // lightMode = false -> Fundo escuro (logo branco) - Padrão da Top Bar
  const primaryColor = lightMode ? 'var(--corp-blue)' : 'white';
  const secondaryColor = lightMode ? 'white' : 'var(--corp-blue)';

  // Fator de escala para aumentar/diminuir o logo
  const scale = size;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${12 * scale}px`, fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* ÍCONE SVG (Um bloco com gráfico de crescimento) */}
      <svg width={`${36 * scale}`} height={`${36 * scale}`} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fundo quadrado arredondado */}
        <rect x="2" y="2" width="32" height="32" rx="6" fill={primaryColor} stroke={primaryColor} strokeWidth="2"/>
        {/* Linha do gráfico */}
        <path d="M8 26L14 18L20 22L28 10" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Bolinha no topo do gráfico */}
        <circle cx="28" cy="10" r="2.5" fill={secondaryColor}/>
      </svg>

      {/* TEXTO DO LOGO */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ 
          color: primaryColor, 
          fontWeight: 800, 
          fontSize: `${1.3 * scale}rem`, 
          lineHeight: 1,
          letterSpacing: '1px'
        }}>
          TECHCORP
        </span>
        <span style={{ 
          color: primaryColor, 
          fontSize: `${0.65 * scale}rem`, 
          fontWeight: 600,
          opacity: 0.8, 
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          Solutions S.A.
        </span>
      </div>
    </div>
  );
}