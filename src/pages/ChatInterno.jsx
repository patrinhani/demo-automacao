import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation(); // Para receber os dados do RH
  
  // --- ESTADOS ---
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Apenas para bolinhas vermelhas visuais (Som é com o NotificationPopup)
  const [naoLidas, setNaoLidas] = useState({}); 
  
  const scrollRef = useRef(null);

  // --- 1. AUTENTICAÇÃO ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- 2. CARREGAR USUÁRIOS + INTEGRAÇÃO RH ---
  useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, 'users');
    
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let lista = Object.keys(data)
          .map(id => ({ id, ...data[id] }))
          .filter(u => u.id !== user.uid);
        
        // --- LÓGICA DE INTEGRAÇÃO COM RH ---
        // Se viemos redirecionados do botão "Chamar", injetamos o usuário na lista
        if (location.state && location.state.chatTarget) {
            const target = location.state.chatTarget;
            
            // Verifica se o usuário já existe na lista real
            const existe = lista.find(u => u.id === target.id);
            
            if (!existe) {
                // Se não existe (é mock/fictício), adiciona no topo da lista
                lista = [target, ...lista];
            }
            
            // Seleciona o canal automaticamente (apenas se já não estiver nele)
            // Usamos um timeout pequeno para garantir que o estado 'lista' atualizou
            if (canalAtivo.id !== target.id) {
                setCanalAtivo({ 
                    id: target.id, 
                    nome: `👤 ${target.nome}`, 
                    desc: target.cargo 
                });
            }
        }

        setUsuarios(lista);
      }
    });
  }, [user, location.state]); // Reage se a navegação mudar

  // --- 3. MONITORAR "NÃO LIDAS" (APENAS VISUAL) ---
  useEffect(() => {
    if (!user) return;
    const chatsRef = ref(db, 'chats/direto');

    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const novasNaoLidas = { ...naoLidas };

      Object.keys(data).forEach((chatId) => {
        if (chatId.includes(user.uid)) {
          const msgs = Object.values(data[chatId]);
          const ultimaMsg = msgs[msgs.length - 1];
          const outroId = chatId.replace(user.uid, '').replace('_', '');

          // Se a msg não é minha e não estou no canal, marca badge
          if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
             // Lógica simples: se tem msg nova, soma 1 (ou mantém)
             // O NotificationPopup cuida do som e do aviso de "Nova Mensagem"
             if (!novasNaoLidas[outroId]) novasNaoLidas[outroId] = 1;
          }
        }
      });
      // Atualiza estado visual
      setNaoLidas(novasNaoLidas);
    });

    return () => unsubscribe();
  }, [user, canalAtivo.id]); 

  // --- 4. CARREGAR MENSAGENS DO CANAL ATUAL ---
  useEffect(() => {
    if (!user) return;

    // Limpa badge ao entrar no canal
    if (naoLidas[canalAtivo.id]) {
      setNaoLidas(prev => { const n = {...prev}; delete n[canalAtivo.id]; return n; });
    }

    let path = canalAtivo.id === 'geral' ? 'chats/geral' : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
    const unsubscribe = onValue(ref(db, path), (snapshot) => {
      const data = snapshot.val();
      setMensagens(data ? Object.entries(data).map(([k, v]) => ({ id: k, ...v })) : []);
    });
    return () => unsubscribe();
  }, [canalAtivo, user]); 

  // --- 5. SCROLL AUTOMÁTICO ---
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens]);

  // --- 6. ENVIAR MENSAGEM ---
  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;

    let path = canalAtivo.id === 'geral' ? 'chats/geral' : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
    const msgData = {
      usuario: user.displayName || user.email.split('@')[0],
      uid: user.uid,
      texto: novaMensagem,
      timestamp: Date.now(),
      avatar: '👤'
    };

    await set(push(ref(db, path)), msgData);
    setNovaMensagem('');
  };

  const formatarHora = (t) => t ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';

  // Helper para formatar nome na lista
  const formatarNomeLista = (nome) => nome ? nome.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Usuário';

  return (
    <div className="tech-layout-chat">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-chat glass-effect">
        <div className="header-left">
           <button className="mobile-menu-btn" onClick={() => setMenuAberto(!menuAberto)}>☰</button>
           <div style={{transform: 'scale(0.8)', display: 'flex', alignItems:'center'}}>
              {Logo ? <Logo /> : <strong>TechCorp</strong>}
           </div>
           <span className="divider">|</span>
           <span className="page-title">Chat</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Sair</button>
      </header>

      <div className="chat-container glass-effect">
        <aside className={`chat-sidebar ${menuAberto ? 'menu-aberto' : ''}`}>
          <div className="sidebar-title">
            Canais {menuAberto && <span onClick={() => setMenuAberto(false)} style={{float:'right'}}>✕</span>}
          </div>
          
          <div className="channels-list">
            <button 
              className={`channel-btn ${canalAtivo.id === 'geral' ? 'active' : ''}`}
              onClick={() => { setCanalAtivo({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' }); setMenuAberto(false); }}
            >
              <span className="channel-name">📢 Geral</span>
              <span className="channel-desc">Para todos</span>
            </button>

            <div style={{margin: '15px 10px 5px', fontSize: '0.7rem', color: '#94a3b8', textTransform:'uppercase', borderTop: '1px solid #ffffff1a', paddingTop: '10px'}}>
              Diretas
            </div>

            {usuarios.map(u => (
              <button 
                key={u.id} 
                className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`}
                onClick={() => { setCanalAtivo({ id: u.id, nome: u.nome || formatarNomeLista(u.email.split('@')[0]), desc: u.cargo }); setMenuAberto(false); }}
              >
                <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                  <div>
                    <span className="channel-name">👤 {formatarNomeLista(u.nome || u.email.split('@')[0])}</span>
                    <span className="channel-desc">{u.cargo}</span>
                  </div>
                  {naoLidas[u.id] > 0 && <div className="badge-notificacao">{naoLidas[u.id]}</div>}
                </div>
              </button>
            ))}
          </div>
          
          <div className="user-profile-mini">
            <div className="avatar-status">👤 <span className="status-dot"></span></div>
            <div className="user-info">
              <strong>{user?.displayName || 'Você'}</strong>
              <span>Online</span>
            </div>
          </div>
        </aside>

        {menuAberto && <div className="overlay-menu" onClick={() => setMenuAberto(false)}></div>}

        <main className="chat-area">
          <div className="chat-header">
            <h3>{canalAtivo.nome}</h3>
            <span>{mensagens.length} msg</span>
          </div>

          <div className="messages-scroll" ref={scrollRef}>
            {mensagens.length === 0 && (
              <div className="empty-chat">
                <span>👋</span>
                <p>Inicie a conversa em <strong>{canalAtivo.nome}</strong>!</p>
              </div>
            )}
            
            {mensagens.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.uid === user?.uid ? 'mine' : 'other'}`}>
                <div className="msg-avatar">{msg.avatar}</div>
                <div className="msg-content">
                  <div className="msg-top">
                    <span className="msg-user">{formatarNomeLista(msg.usuario)}</span>
                    <span className="msg-time">{formatarHora(msg.timestamp)}</span>
                  </div>
                  <p className="msg-text">{msg.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <form className="chat-input-area" onSubmit={enviarMensagem}>
            <input 
              type="text" 
              placeholder={`Mensagem para ${canalAtivo.nome}...`}
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="btn-send" disabled={!novaMensagem.trim()}>➤</button>
          </form>
        </main>
      </div>
    </div>
  );
}