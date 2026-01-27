import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue } from "firebase/database";
import './NotificationPopup.css';

export default function NotificationPopup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificacao, setNotificacao] = useState(null);
  
  const tempoInicial = useRef(Date.now());

  useEffect(() => {
    const chatsRef = ref(db, 'chats/direto');

    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const user = auth.currentUser;
      if (!user) return;

      Object.keys(data).forEach((chatId) => {
        if (chatId.includes(user.uid)) {
          const mensagens = Object.values(data[chatId]);
          const ultimaMsg = mensagens[mensagens.length - 1];

          if (
            ultimaMsg.timestamp > tempoInicial.current &&
            ultimaMsg.uid !== user.uid &&
            location.pathname !== '/chat'
          ) {
            tempoInicial.current = ultimaMsg.timestamp;
            
            setNotificacao({
              nome: ultimaMsg.usuario,
              texto: ultimaMsg.texto,
              avatar: ultimaMsg.avatar || '👤'
            });

            tocarSom();

            setTimeout(() => setNotificacao(null), 5000);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [location.pathname]);

  const tocarSom = () => {
    // --- OPÇÃO 1: SEU ARQUIVO LOCAL (Coloque na pasta 'public') ---
    const audioLocal = new Audio('/ms-teams-notification.mp3');
    
    // --- OPÇÃO 2: LINK ONLINE (Backup se o arquivo falhar) ---
    // const audioOnline = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

    // Tenta tocar o local. Se der erro, avisa no console.
    audioLocal.play().catch(erro => {
        console.warn("Som bloqueado ou arquivo não encontrado na pasta public:", erro);
    });
  };

  if (!notificacao) return null;

  return (
    <div className="notification-toast" onClick={() => {
      setNotificacao(null);
      navigate('/chat');
    }}>
      <div className="toast-icon">{notificacao.avatar}</div>
      <div className="toast-content">
        <strong>{notificacao.nome}</strong>
        <p>{notificacao.texto}</p>
      </div>
      <div className="toast-close">✖</div>
    </div>
  );
}