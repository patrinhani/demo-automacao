import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import './NotificationPopup.css';

// CAMINHO DO ARQUIVO DE SOM NA PASTA PUBLIC
// Certifique-se de que o arquivo "notificacao.mp3" existe dentro da pasta "public"
const CAMINHO_SOM = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function NotificationPopup() {
  const [notification, setNotification] = useState(null); 
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Cria a referência de áudio apontando para o arquivo real
  const audioRef = useRef(new Audio(`${CAMINHO_SOM}?v=${Date.now()}`));
  const timestampsRef = useRef({}); 

  // --- 1. CONFIGURAÇÃO E DESBLOQUEIO ---
  useEffect(() => {
    // Tenta carregar o áudio para garantir que está pronto
    audioRef.current.load();
    audioRef.current.volume = 1.0;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Função que tenta destravar o áudio (Autoplay Policy)
    const unlockAudio = () => {
      if(audioRef.current) {
        // Tenta tocar e pausar imediatamente só para desbloquear
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // Remove os listeners pois já conseguimos destravar
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          console.log("🔊 Áudio desbloqueado com sucesso!");
        }).catch((e) => {
          // Se falhar (ex: usuário ainda não interagiu o suficiente), mantém os listeners
          // Não imprimimos erro aqui para não sujar o console, pois é esperado falhar no início
        });
      }
    };

    // Adiciona os ouvintes globais para destravar o som na primeira interação
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      unsubAuth();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Formata Nome: "joao.silva" -> "Joao Silva"
  const formatarNome = (nomeSujo) => {
    if (!nomeSujo) return 'Usuário';
    return nomeSujo
      .replace(/\./g, ' ') 
      .replace(/_/g, ' ')  
      .replace(/\b\w/g, l => l.toUpperCase()); 
  };

  const dispararNotificacao = (titulo, texto) => {
    // Tenta tocar o som
    if(audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Som não pôde ser tocado:", e));
    }

    setNotification({ title: titulo, msg: texto });
    
    // Limpa notificação anterior se houver timer rodando
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
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
        
        // Se timestamp da última msg > timestamp salvo localmente
        if (ultima && ultima.timestamp > (timestampsRef.current['geral'] || 0)) {
          timestampsRef.current['geral'] = ultima.timestamp;

          // Se não fui eu e não é histórico inicial
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
            // Remove meu ID para achar o ID do outro
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