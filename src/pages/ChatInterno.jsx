import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

export default function ChatInterno() {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Estados para Notificação e Ordem
  const [ultimasAtividades, setUltimasAtividades] = useState({}); 
  const [naoLidas, setNaoLidas] = useState({}); 
  
  const scrollRef = useRef(null);
  const audioContextRef = useRef(null); 

  // --- 1. AUTENTICAÇÃO E SOM ---
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const tocarNotificacao = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // --- 2. CARREGAR LISTA DE USUÁRIOS ---
  useEffect(() => {
    if (!user) return;

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.keys(data)
          .map(id => ({ id, ...data[id] }))
          .filter(u => u.id !== user.uid);
        setUsuarios(lista);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- 3. MONITORAR MENSAGENS (NOTIFICAÇÃO) ---
  useEffect(() => {
    if (!user) return;

    const chatsRef = ref(db, 'chats/direto');
    
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const atividadesTemp = {};
      const novasNaoLidas = { ...naoLidas };
      let tocouSom = false;

      Object.keys(data).forEach((chatId) => {
        if (chatId.includes(user.uid)) {
          const msgs = Object.values(data[chatId]);
          const ultimaMsg = msgs[msgs.length - 1];
          const outroId = chatId.replace(user.uid, '').replace('_', '');

          atividadesTemp[outroId] = ultimaMsg.timestamp;

          if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
             if (ultimaMsg.timestamp > (ultimasAtividades[outroId] || 0)) {
                novasNaoLidas[outroId] = (novasNaoLidas[outroId] || 0) + 1;
                tocouSom = true;
             }
          }
        }
      });

      setUltimasAtividades(prev => ({ ...prev, ...atividadesTemp }));
      
      if (tocouSom) {
        setNaoLidas(novasNaoLidas);
        tocarNotificacao();
      }
    });

    return () => unsubscribe();
  }, [user, canalAtivo.id]); 

  // --- 4. CARREGAR MENSAGENS DO CANAL ---
  useEffect(() => {
    if (!user) return;

    if (naoLidas[canalAtivo.id]) {
      setNaoLidas(prev => {
        const nova = { ...prev };
        delete nova[canalAtivo.id];
        return nova;
      });
    }

    let path = '';
    if (canalAtivo.id === 'geral') {
      path = 'chats/geral';
    } else {
      const ids = [user.uid, canalAtivo.id].sort();
      path = `chats/direto/${ids[0]}_${ids[1]}`;
    }
    
    const chatRef = ref(db, path);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const listaMensagens = data 
        ? Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
        : [];
      setMensagens(listaMensagens);
    });

    return () => unsubscribe();
  }, [canalAtivo, user]); 

  // --- 5. SCROLL E ENVIO ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;

    let path = '';
    if (canalAtivo.id === 'geral') {
      path = 'chats/geral';
    } else {
      const ids = [user.uid, canalAtivo.id].sort();
      path = `chats/direto/${ids[0]}_${ids[1]}`;
    }

    const novaMsgRef = push(ref(db, path));
    await set(novaMsgRef, {
      usuario: user.displayName || user.email.split('@')[0],
      uid: user.uid,
      texto: novaMensagem,
      timestamp: Date.now(),
      avatar: '👤'
    });
    
    if (canalAtivo.id !== 'geral') {
      setUltimasAtividades(prev => ({...prev, [canalAtivo.id]: Date.now()}));
    }
    
    setNovaMensagem('');
  };

  const formatarHora = (timestamp) => {
    if(!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const selecionarCanal = (canal) => {
    setCanalAtivo(canal);
    setMenuAberto(false);
  };

  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    const tempoA = ultimasAtividades[a.id] || 0;
    const tempoB = ultimasAtividades[b.id] || 0;
    return tempoB - tempoA;
  });

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
            Canais 
            {menuAberto && <span onClick={() => setMenuAberto(false)} style={{float:'right', cursor:'pointer'}}>✕</span>}
          </div>
          
          <div className="channels-list">
            <button 
              className={`channel-btn ${canalAtivo.id === 'geral' ? 'active' : ''}`}
              onClick={() => selecionarCanal({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' })}
            >
              <span className="channel-name">📢 Geral</span>
              <span className="channel-desc">Para todos</span>
            </button>

            <div style={{margin: '15px 10px 5px', fontSize: '0.7rem', color: '#94a3b8', textTransform:'uppercase', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px'}}>
              Mensagens Diretas
            </div>

            {usuariosOrdenados.map(u => (
              <button 
                key={u.id} 
                className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`}
                onClick={() => selecionarCanal({ id: u.id, nome: u.nome, desc: u.cargo })}
              >
                <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                  <div>
                    <span className="channel-name">👤 {u.nome}</span>
                    <span className="channel-desc">{u.cargo}</span>
                  </div>
                  
                  {naoLidas[u.id] > 0 && (
                    <div className="badge-notificacao">
                      {naoLidas[u.id]}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="user-profile-mini">
            <div className="avatar-status">
              👤 <span className="status-dot"></span>
            </div>
            <div className="user-info">
              <strong>{user?.displayName || 'Você'}</strong>
              <span>Online</span>
            </div>
          </div>
        </aside>

        {menuAberto && (
          <div 
            style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:90}} 
            onClick={() => setMenuAberto(false)}
          ></div>
        )}

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
                    <span className="msg-user">{msg.usuario}</span>
                    <span className="msg-time">{formatarHora(msg.timestamp)}</span>
                  </div>
                  <p className="msg-text">{msg.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ÁREA DE INPUT AJUSTADA */}
          <form className="chat-input-area" onSubmit={enviarMensagem}>
            <input 
              type="text" 
              placeholder={`Mensagem para ${canalAtivo.nome}...`}
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="btn-send" disabled={!novaMensagem.trim()}>
              ➤
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}