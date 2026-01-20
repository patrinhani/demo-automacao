import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue, push } from "firebase/database";
import Logo from '../components/Logo'; // Se der erro, comente esta linha
import './ChatInterno.css';

export default function ChatInterno() {
  const navigate = useNavigate();
  const [canalAtivo, setCanalAtivo] = useState('geral');
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [usuario, setUsuario] = useState('Você'); 
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Ref para a área scrollável
  const scrollRef = useRef(null);

  const canais = [
    { id: 'geral', nome: '📢 Geral', desc: 'Assuntos corporativos' },
    { id: 'ti-dev', nome: '💻 TI & Dev', desc: 'Bugs e Café' },
    { id: 'rh-people', nome: '👥 RH', desc: 'Dúvidas e Benefícios' },
    { id: 'projetos', nome: '🚀 Projetos', desc: 'Planejamento' },
  ];

  // 1. LISTENER FIREBASE
  useEffect(() => {
    const chatRef = ref(db, `chats/${canalAtivo}`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const listaMensagens = data 
        ? Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
        : [];
      
      setMensagens(listaMensagens);
    });

    return () => unsubscribe();
  }, [canalAtivo]);

  // 2. SCROLL AUTOMÁTICO (CORRIGIDO)
  // Em vez de rolar a tela toda, rolamos apenas o container 'messages-scroll'
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    const chatRef = ref(db, `chats/${canalAtivo}`);
    push(chatRef, {
      usuario: usuario,
      texto: novaMensagem,
      timestamp: Date.now(),
      avatar: '👤'
    });
    setNovaMensagem('');
  };

  const formatarHora = (timestamp) => {
    if(!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const mudarCanal = (id) => {
    setCanalAtivo(id);
    setMenuAberto(false);
  };

  return (
    <div className="tech-layout-chat">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      {/* HEADER */}
      <header className="tech-header-chat glass-effect">
        <div className="header-left">
           {/* Botão Hamburger (Mobile) */}
           <button 
             className="mobile-menu-btn" 
             onClick={() => setMenuAberto(!menuAberto)}
           >
             ☰
           </button>

           <div style={{transform: 'scale(0.8)', display: 'flex', alignItems:'center'}}>
              {/* Se o componente Logo falhar, use um texto simples */}
              {Logo ? <Logo /> : <strong>Empresa</strong>}
           </div>
           
           <span className="divider">|</span>
           <span className="page-title">Chat</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Sair
        </button>
      </header>

      <div className="chat-container glass-effect">
        
        {/* SIDEBAR */}
        <aside className={`chat-sidebar ${menuAberto ? 'menu-aberto' : ''}`}>
          <div className="sidebar-title">
            Canais 
            {menuAberto && <span onClick={() => setMenuAberto(false)} style={{float:'right', cursor:'pointer'}}>✕</span>}
          </div>
          
          <div className="channels-list">
            {canais.map(canal => (
              <button 
                key={canal.id} 
                className={`channel-btn ${canalAtivo === canal.id ? 'active' : ''}`}
                onClick={() => mudarCanal(canal.id)}
              >
                <span className="channel-name">{canal.nome}</span>
                <span className="channel-desc">{canal.desc}</span>
              </button>
            ))}
          </div>
          
          <div className="user-profile-mini">
            <div className="avatar-status">
              👤 <span className="status-dot"></span>
            </div>
            <div className="user-info">
              <strong>{usuario}</strong>
              <span>Online</span>
            </div>
          </div>
        </aside>

        {/* OVERLAY MOBILE */}
        {menuAberto && (
          <div 
            style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:90}} 
            onClick={() => setMenuAberto(false)}
          ></div>
        )}

        {/* ÁREA CENTRAL */}
        <main className="chat-area">
          <div className="chat-header">
            <h3>{canais.find(c => c.id === canalAtivo)?.nome}</h3>
            <span>{mensagens.length} msg</span>
          </div>

          {/* LISTA DE MENSAGENS COM REF DE SCROLL */}
          <div className="messages-scroll" ref={scrollRef}>
            {mensagens.length === 0 && (
              <div className="empty-chat">
                <span>👋</span>
                <p>Comece a conversa em #{canalAtivo}!</p>
              </div>
            )}
            
            {mensagens.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.usuario === usuario ? 'mine' : 'other'}`}>
                <div className="msg-avatar">{msg.avatar}</div>
                <div className="msg-content">
                  <div className="msg-top">
                    <span className="msg-user">{msg.usuario}</span>
                    <span className="msg-time">{formatarHora(msg.timestamp)}</span>
                  </div>
                  <p className="msg-text">{msg.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* INPUT */}
          <form className="chat-input-area" onSubmit={enviarMensagem}>
            <input 
              type="text" 
              placeholder={`Enviar em #${canalAtivo}...`}
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              className="chat-input"
            />
            <button 
              type="submit" 
              className="btn-send"
              disabled={!novaMensagem.trim()}
            >
              ➤
            </button>
          </form>
        </main>

      </div>
    </div>
  );
}