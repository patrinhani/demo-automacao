import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue } from "firebase/database";
import './NotificationPopup.css';

// --- IMPORTAÇÃO DO SOM LOCAL ---
// IMPORTANTE: Troque 'notification.mp3' pelo nome exato do seu arquivo na pasta assets
import somAlerta from '../assets/ms-teams-notification.mp3'; 

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

            // Chama a função atualizada
            tocarSomLocal();

            setTimeout(() => setNotificacao(null), 5000);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [location.pathname]);

  // --- FUNÇÃO DE SOM LOCAL ATUALIZADA ---
  const tocarSomLocal = () => {
    try {
      // Usa a variável importada 'somAlerta' em vez de uma URL
      const audio = new Audio(somAlerta);
      
      audio.play().catch(erro => {
        console.warn("Som bloqueado pelo navegador (precisa de interação):", erro);
      });
    } catch (e) {
      console.error("Erro ao tocar som", e);
    }
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