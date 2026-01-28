import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import './NotificationPopup.css';

// Som "Plink" (Base64) - Curto e limpo
const SOM_BASE64 = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7c1/0xLe3+x2QTXj8/0QGL181NSueutjn//uQRAAABXMwdT0EYAAW4MHT9BGAAJJGl08gAAAAkwaXTyAAAAAmJqj/COAJpmn/we5wP+Cn/wU//7cXS/3Xj/WCPA/AwPAWASLLZIlxaraCBIDrj0J+Ev+Ln/7cI/3Cn/FwAAAAASkU////+7aeDf//uQRAAAABiZNB9CMAAGJk0H0IwAAXYMHT9BGABFwwdP0EYAAABvxPAgQAAAAASOAEAAIBCAQAAE7QAAADBwAAECgAAAAOAEAAIAXAAAAo4AAEAgAAAAAA//uQRAAAABiwNH1CMAAGLA0fUIwAAWJMHT9BGABYkwdP0EYAAAB3gQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAg//uQRAAAABiZNB9CMAAGJk0H0IwAAXYMHT9BGABFwwdP0EYAAAB3gQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAg//uQRAAAABiZNB9CMAAGJk0H0IwAAXYMHT9BGABFwwdP0EYAAAB3gQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAgAAAAAAgQAAg";

export default function NotificationPopup() {
  const [notification, setNotification] = useState(null); 
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const audioRef = useRef(new Audio(SOM_BASE64));
  const timestampsRef = useRef({}); 

  // --- 1. CONFIGURAÇÃO E DESBLOQUEIO ---
  useEffect(() => {
    audioRef.current.volume = 1.0;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Função que tenta destravar o áudio
    const unlockAudio = () => {
      if(audioRef.current) {
        audioRef.current.play().then(() => {
          // Se tocou, pausa e reseta. Sucesso!
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // Remove os listeners pois já conseguimos destravar
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          console.log("🔊 Áudio desbloqueado com sucesso!");
        }).catch((e) => {
          // Se falhar, NÃO remove os listeners. Tenta no próximo clique.
          console.log("Ainda bloqueado, aguardando interação...", e);
        });
      }
    };

    // Adiciona os ouvintes globais
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
      audioRef.current.play().catch(e => console.warn("Som bloqueado:", e));
    }

    setNotification({ title: titulo, msg: texto });
    
    // Limpa notificação anterior se houver timer rodando (opcional, mas bom)
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