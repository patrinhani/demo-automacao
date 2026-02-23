import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import './NotificationPopup.css';

// CAMINHO DO ARQUIVO DE SOM NA PASTA PUBLIC
const CAMINHO_SOM = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function NotificationPopup() {
  const [notification, setNotification] = useState(null); 
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation(); // Pega a rota atual
  
  const audioRef = useRef(new Audio(`${CAMINHO_SOM}?v=${Date.now()}`));
  const timestampsRef = useRef({}); 
  const pathnameRef = useRef(location.pathname); // Guarda a rota sem re-renderizar o useEffect do Firebase

  // Mantém a ref da rota sempre atualizada
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // --- 1. CONFIGURAÇÃO E DESBLOQUEIO ---
  useEffect(() => {
    audioRef.current.load();
    // 👇 VOLUME REDUZIDO PARA 30% PARA FICAR MAIS SUAVE E HARMONIOSO
    audioRef.current.volume = 0.3; 

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const unlockAudio = () => {
      if(audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          console.log("🔊 Áudio desbloqueado com sucesso!");
        }).catch((e) => {
          // Mantém silencioso se falhar no início
        });
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      unsubAuth();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const formatarNome = (nomeSujo) => {
    if (!nomeSujo) return 'Usuário';
    return nomeSujo
      .replace(/\./g, ' ') 
      .replace(/_/g, ' ')  
      .replace(/\b\w/g, l => l.toUpperCase()); 
  };

  const dispararNotificacao = (titulo, texto) => {
    // 👇 BLOQUEIO DE TELA: Não toca som nem exibe popup se estiver no Login
    if (pathnameRef.current === '/' || pathnameRef.current === '/login') {
      return; 
    }

    if(audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Som não pôde ser tocado:", e));
    }

    setNotification({ title: titulo, msg: texto });
    
    setTimeout(() => setNotification(null), 5000);
  };

  // --- 2. MONITORAMENTO GLOBAL ---
  useEffect(() => {
    if (!user) return;

    const chatsRef = ref(db, 'chats'); 
    let primeiraCarga = true;

    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // --- Verifica GERAL ---
      if (data.geral) {
        const msgs = Object.values(data.geral);
        const ultima = msgs[msgs.length - 1];
        
        if (ultima && ultima.timestamp > (timestampsRef.current['geral'] || 0)) {
          timestampsRef.current['geral'] = ultima.timestamp;

          if (ultima.uid !== user.uid && !primeiraCarga) {
             const nome = formatarNome(ultima.usuario);
             dispararNotificacao(`📢 Geral: ${nome}`, ultima.texto);
          }
        }
      }

      // --- Verifica DIRETOS ---
      if (data.direto) {
        Object.keys(data.direto).forEach((chatId) => {
          if (chatId.includes(user.uid)) {
            const msgs = Object.values(data.direto[chatId]);
            const ultima = msgs[msgs.length - 1];
            const outroId = chatId.replace(user.uid, '').replace('_', '');
            
            if (ultima && ultima.timestamp > (timestampsRef.current[outroId] || 0)) {
              timestampsRef.current[outroId] = ultima.timestamp;

              if (ultima.uid !== user.uid && !primeiraCarga) {
                 const nome = formatarNome(ultima.usuario);
                 dispararNotificacao(`👤 ${nome}`, ultima.texto);
              }
            }
          }
        });
      }

      primeiraCarga = false;
    });

    return () => unsubscribe();
  }, [user]);

  const handlePopupClick = () => {
    setNotification(null);
    navigate('/chat');
  };

  if (!notification) return null;

  return (
    <div className="notification-toast" onClick={handlePopupClick}>
      <div className="notif-icon">💬</div>
      <div className="notif-content">
        <strong>{notification.title}</strong>
        <p>{notification.msg}</p>
      </div>
      <div className="notif-bar"></div>
    </div>
  );
}