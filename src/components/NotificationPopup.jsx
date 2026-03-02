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
  const location = useLocation(); 
  
  const audioRef = useRef(new Audio(`${CAMINHO_SOM}?v=${Date.now()}`));
  const timestampsRef = useRef({}); 
  const pathnameRef = useRef(location.pathname); 

  // Mantém a ref da rota sempre atualizada
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // --- 1. CONFIGURAÇÃO E DESBLOQUEIO DE ÁUDIO ---
  useEffect(() => {
    audioRef.current.load();
    audioRef.current.volume = 0.1; 

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
        }).catch(() => {});
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
    return nomeSujo.replace(/\./g, ' ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); 
  };

  // Função central para disparar as notificações na tela
  const dispararNotificacao = (titulo, texto, tipo = 'chat') => {
    // Não toca som nem exibe popup se estiver na tela de Login
    if (pathnameRef.current === '/' || pathnameRef.current === '/login') return; 

    if(audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Som não pôde ser tocado:", e));
    }

    setNotification({ title: titulo, msg: texto, type: tipo });
    
    // Auto-fechar após 5 segundos
    setTimeout(() => setNotification(null), 5000);
  };

  // --- 2. OUVINTE PARA NOTIFICAÇÕES MANUAIS (AlertContext) ---
  useEffect(() => {
    const handleManualToast = (e) => {
      // Recebe o evento disparado pelo AlertContext
      dispararNotificacao(e.detail.title, e.detail.message, 'system');
    };
    
    window.addEventListener('manual-toast', handleManualToast);
    return () => window.removeEventListener('manual-toast', handleManualToast);
  }, []);

  // --- 3. MONITORAMENTO GLOBAL DE CHATS (Firebase) ---
  useEffect(() => {
    if (!user) return;

    const chatsRef = ref(db, 'chats'); 
    let primeiraCarga = true;

    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Verifica Mensagens no GERAL
      if (data.geral) {
        const msgs = Object.values(data.geral);
        const ultima = msgs[msgs.length - 1];
        
        if (ultima && ultima.timestamp > (timestampsRef.current['geral'] || 0)) {
          timestampsRef.current['geral'] = ultima.timestamp;

          if (ultima.uid !== user.uid && !primeiraCarga) {
             const nome = formatarNome(ultima.usuario);
             dispararNotificacao(`📢 Geral: ${nome}`, ultima.texto, 'chat');
          }
        }
      }

      // Verifica Mensagens nos DIRETOS
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
                 dispararNotificacao(`👤 ${nome}`, ultima.texto, 'chat');
              }
            }
          }
        });
      }

      primeiraCarga = false;
    });

    return () => unsubscribe();
  }, [user]);

  // Ação ao clicar no popup
  const handlePopupClick = () => {
    setNotification(null);
    // Só redireciona para o chat se for uma mensagem. Se for do sistema, só fecha.
    if (notification?.type === 'chat') {
      navigate('/chat');
    }
  };

  if (!notification) return null;

  // Lógica para definir a cor e ícone consoante o tipo de aviso
  let icon = '💬';
  let isError = false;
  
  if (notification.type === 'system') {
    isError = notification.title.toLowerCase().includes('erro') || notification.title.includes('❌');
    icon = isError ? '❌' : '🔔';
  }

  return (
    <div className={`notification-toast ${notification.type} ${isError ? 'error' : ''}`} onClick={handlePopupClick}>
      <div className="notif-icon">{icon}</div>
      <div className="notif-content">
        <strong>{notification.title}</strong>
        <p>{notification.msg}</p>
      </div>
      <div className="notif-bar"></div>
    </div>
  );
}