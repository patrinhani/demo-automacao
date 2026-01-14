import '../App.css';

export default function Logo({ lightMode = false, size = 1 }) {
  const primaryColor = lightMode ? 'var(--corp-blue)' : 'white';
  const secondaryColor = lightMode ? 'white' : 'var(--corp-blue)';

  // Cálculos de tamanho nativos
  const iconSize = 36 * size;
  const titleSize = 1.3 * size;
  const subSize = 0.65 * size;
  const gap = 12 * size;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${gap}px`, fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SVG com tamanho explícito */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="32" height="32" rx="6" fill={primaryColor} stroke={primaryColor} strokeWidth="2"/>
        <path d="M8 26L14 18L20 22L28 10" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="10" r="2.5" fill={secondaryColor}/>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ 
          color: primaryColor, 
          fontWeight: 800, 
          fontSize: `${titleSize}rem`, 
          lineHeight: 1,
          letterSpacing: '1px'
        }}>
          TECHCORP
        </span>
        <span style={{ 
          color: primaryColor, 
          fontSize: `${subSize}rem`, 
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