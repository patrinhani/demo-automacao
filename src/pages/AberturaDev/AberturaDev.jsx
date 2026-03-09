import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Logo from '../../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import './AberturaDev.css';

export default function AberturaDev() {
  const navigate = useNavigate();
  const { isDev, user } = useUser();
  
  const [phase, setPhase] = useState('intro');
  const [bootSequence, setBootSequence] = useState(0);
  const canvasRef = useRef(null);

  // === MOTOR DA MATRIX OTIMIZADO (CANVAS) ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const chars = "01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789=+-<>".split('');
    const fontSize = 16;
    let columns = Math.floor(width / fontSize);

    let drops = [];
    let colors = [];
    // Cores TechCorp
    const themeColors = ['#38bdf8', '#a855f7', '#34d399'];

    // Inicializar as gotas espalhadas pelo ecrã
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * height / fontSize; 
      colors[x] = themeColors[Math.floor(Math.random() * themeColors.length)];
    }

    let animationFrameId;
    let lastDrawTime = 0;
    const fps = 35; // 35 FPS dá a velocidade cinematográfica perfeita sem pesar
    const interval = 1000 / fps;

    const draw = (timestamp) => {
      animationFrameId = requestAnimationFrame(draw);

      if (timestamp - lastDrawTime < interval) return;
      lastDrawTime = timestamp;

      // Desenha um retângulo semi-transparente para criar o efeito de rasto que desaparece
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'; // O azul escuro do fundo da sua app
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize}px "Courier New", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Letra colorida
        ctx.fillStyle = colors[i];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Ponta da linha ocasionalmente pisca a branco para o efeito "energia"
        if (Math.random() > 0.85) {
           ctx.fillStyle = '#ffffff';
           ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }

        // Envia a gota de volta para o topo aleatoriamente quando chega ao fundo
        if (drops[i] * fontSize > height && Math.random() > 0.95) {
          drops[i] = 0;
          colors[i] = themeColors[Math.floor(Math.random() * themeColors.length)];
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Executa apenas na montagem inicial

  const dispararSequenciaDeBoot = () => {
    if (phase !== 'intro') return;

    setPhase('glitch');

    setTimeout(() => {
      setPhase('terminal');
      
      setTimeout(() => setBootSequence(1), 1000);
      setTimeout(() => setBootSequence(2), 2500);
      setTimeout(() => setBootSequence(3), 4000);
      setTimeout(() => setBootSequence(4), 5000);
    }, 400);
  };

  useEffect(() => {
    if (!isDev) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        dispararSequenciaDeBoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isDev]);

  if (!isDev) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="abertura-layout" onClick={dispararSequenciaDeBoot}>
      
      {/* Elementos de Fundo - Grelha 3D */}
      <div className="cyber-grid-container">
        <div className="cyber-grid"></div>
      </div>
      
      {/* CANVAS MATRIX - Ultra otimizado */}
      <canvas ref={canvasRef} className="matrix-canvas" />

      <div className="vignette-overlay"></div>
      <div className="scanline"></div>

      <AnimatePresence mode="wait">
        {/* === FASE 1: INTRO === */}
        {phase === 'intro' && (
          <motion.div 
            key="intro"
            className="intro-screen"
            exit={{ opacity: 0, scale: 1.5, filter: "blur(15px)", transition: { duration: 0.4 } }}
          >
            <motion.div 
              className="big-logo-container"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              
              <div className="sci-fi-rings">
                <motion.div className="ring ring-1" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} />
                <motion.div className="ring ring-2" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} />
                <motion.div className="ring ring-3" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} />
              </div>

              <motion.div
                initial={{ scale: 0, filter: "brightness(3)", rotate: -90 }}
                animate={{ scale: 1, filter: "brightness(1)", rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 1.8 }}
                style={{ zIndex: 10 }}
              >
                <Logo lightMode={true} size={4} iconOnly={true} />
              </motion.div>

              <motion.h1 
                className="intro-title"
                initial={{ opacity: 0, y: 30, letterSpacing: "50px" }}
                animate={{ opacity: 1, y: 0, letterSpacing: "20px" }}
                transition={{ delay: 0.8, duration: 1.2, type: "spring" }}
              >
                TECHCORP
              </motion.h1>

              <motion.div 
                className="status-bar"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "300px" }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                <span className="status-text">CORE_SYS: ONLINE</span>
                <span className="status-text">ENV: PRODUCTION</span>
              </motion.div>
              
              <motion.div 
                className="blink-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ delay: 2.5, repeat: Infinity, duration: 1.2, times: [0, 0.2, 1] }}
              >
                 [&nbsp; OVERRIDE REQUIRED: PRESS ENTER TO INITIALIZE &nbsp;]
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* === FASE 2: GLITCH === */}
        {phase === 'glitch' && (
          <motion.div 
            key="glitch"
            className="glitch-screen"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 1, 0], 
              clipPath: [
                "inset(10% 0 80% 0)", 
                "inset(50% 0 20% 0)", 
                "inset(0 0 0 0)", 
                "inset(80% 0 10% 0)"
              ],
              backgroundColor: ["transparent", "#0ea5e9", "#ef4444", "#a855f7", "transparent"]
            }}
            transition={{ duration: 0.4, ease: "circIn" }}
          />
        )}

        {/* === FASE 3: TERMINAL === */}
        {phase === 'terminal' && (
          <motion.div 
            key="terminal"
            className="terminal-container"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
          >
            <div className="terminal-header">
               <div className="terminal-dots">
                 <span></span><span></span><span></span>
               </div>
               <div className="terminal-title">sysadmin@{user?.displayName?.replace(' ','').toLowerCase() || 'dev'}: ~</div>
               <div className="terminal-info">SEC: ENCRYPTED</div>
            </div>

            <div className="terminal-body">
              <motion.p className="line" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}}>Initializing TechCorp Enterprise OS v2.4.1...</motion.p>
              <motion.p className="line" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>Connecting to secure mainframe [192.168.0.104]...</motion.p>
              
              {bootSequence >= 1 && <motion.p className="line success" initial={{opacity: 0}} animate={{opacity: 1}}>&gt; Handshake success. User {user?.displayName || 'DEV_MASTER'} verified.</motion.p>}
              {bootSequence >= 2 && <motion.p className="line warning" initial={{opacity: 0}} animate={{opacity: 1}}>&gt; Injecting RPA Modules & Fetching Financial Mocks...</motion.p>}
              {bootSequence >= 3 && <motion.p className="line success" initial={{opacity: 0}} animate={{opacity: 1}}>&gt; Database Synced. All Systems Nominal.</motion.p>}
              
              {bootSequence >= 4 && (
                <motion.div 
                  className="start-sequence"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="radar-box">
                     <div className="radar-sweep"></div>
                  </div>
                  <div className="start-actions">
                    <p className="system-ready">ACCESS GRANTED</p>
                    <button className="btn-boot" onClick={() => navigate('/dashboard')}>
                      START DEMO [ EXECUTE ]
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}