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
  
  const [naoLidas, setNaoLidas] = useState({}); 
  
  const scrollRef = useRef(null);
  const timestampsRef = useRef({}); // Guarda o horário da última mensagem vista

  // --- 1. GERADOR DE SOM (Sintetizador) ---
  // Cria um som suave estilo "Teams/Notification" sem precisar de arquivo
  const tocarSomNotificacao = () => {
    try {
      // Cria o contexto de áudio
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return; // Navegador muito antigo
      
      const ctx = new AudioContext();

      // Se o áudio estiver suspenso (comum no Edge/Chrome), tenta retomar
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Configuração do "Bloop" (Senoide suave)
      const now = ctx.currentTime;
      osc.type = 'sine';
      
      // Frequência: Desliza de 500Hz para 800Hz (efeito "Tu-dum" rápido)
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);

      // Volume: Ataque rápido e decaimento suave
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01); // Volume máx 30%
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5); // Para após 0.5 segundos

    } catch (e) {
      console.error("Erro ao tocar som sintetizado:", e);
    }
  };

  // --- 2. CONFIGURAÇÃO INICIAL ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- 3. CARREGAR LISTA DE USUÁRIOS ---
  useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsuarios(Object.keys(data).map(id => ({ id, ...data[id] })).filter(u => u.id !== user.uid));
      }
    });
  }, [user]);

  // --- 4. MONITORAR MENSAGENS (LÓGICA DE NOTIFICAÇÃO) ---
  useEffect(() => {
    if (!user) return;

    const chatsRef = ref(db, 'chats/direto');
    let primeiraCarga = true;

    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      let deveTocar = false;
      const novasNaoLidas = { ...naoLidas };

      Object.keys(data).forEach((chatId) => {
        if (chatId.includes(user.uid)) {
          const msgs = Object.values(data[chatId]);
          if (msgs.length === 0) return;

          const ultimaMsg = msgs[msgs.length - 1];
          const outroId = chatId.replace(user.uid, '').replace('_', '');
          const ultimoVisto = timestampsRef.current[outroId] || 0;

          // Se a mensagem é nova (horário maior que o último visto)
          if (ultimaMsg.timestamp > ultimoVisto) {
            timestampsRef.current[outroId] = ultimaMsg.timestamp;

            // Se não sou eu e não estou no canal dessa pessoa
            if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
                // Se não for a primeira carga (histórico), é notificação real
                if (!primeiraCarga) {
                    console.log(`🔔 Nova mensagem de ${outroId}`);
                    novasNaoLidas[outroId] = (novasNaoLidas[outroId] || 0) + 1;
                    deveTocar = true;
                }
            }
          }
        }
      });

      if (deveTocar) {
        tocarSomNotificacao();
        setNaoLidas(novasNaoLidas);
      }
      primeiraCarga = false;
    });

    return () => unsubscribe();
  }, [user, canalAtivo.id]); 

  // --- 5. CARREGAR MENSAGENS DO CANAL ATUAL ---
  useEffect(() => {
    if (!user) return;

    // Limpa badge ao entrar
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

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens]);

  // --- 6. ENVIAR MENSAGEM ---
  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;

    let path = canalAtivo.id === 'geral' ? 'chats/geral' : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
    // Tocar som baixinho ao enviar para confirmar que áudio funciona (Feedback)
    // tocarSomNotificacao(); 

    const msgData = {
      usuario: user.displayName || user.email.split('@')[0],
      uid: user.uid,
      texto: novaMensagem,
      timestamp: Date.now(),
      avatar: '👤'
    };

    await set(push(ref(db, path)), msgData);
    
    if (canalAtivo.id !== 'geral') timestampsRef.current[canalAtivo.id] = msgData.timestamp;
    setNovaMensagem('');
  };

  const formatarHora = (t) => t ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';

  const usuariosOrdenados = [...usuarios].sort((a, b) => (timestampsRef.current[b.id] || 0) - (timestampsRef.current[a.id] || 0));

  return (
    // O onClick aqui garante o desbloqueio do áudio na primeira interação do usuário com a página
    <div className="tech-layout-chat" onClick={() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') ctx.resume();
        }
    }}>
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
           
           {/* BOTÃO DE TESTE DE SOM (Para debug, pode remover depois) */}
           <button 
             onClick={(e) => { e.stopPropagation(); tocarSomNotificacao(); }} 
             style={{
               marginLeft: '15px', 
               padding: '6px 12px', 
               background: 'rgba(59, 130, 246, 0.3)', 
               border: '1px solid #3b82f6', 
               borderRadius: '6px', 
               cursor: 'pointer', 
               color: '#fff', 
               fontSize: '0.75rem',
               display: 'flex',
               alignItems: 'center',
               gap: '5px'
             }}
           >
             🔊 Testar Som
           </button>
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
              onClick={() => { setCanalAtivo({ id: 'geral', nome: '📢 Geral' }); setMenuAberto(false); }}
            >
              <span className="channel-name">📢 Geral</span>
            </button>

            <div style={{margin: '15px 10px 5px', fontSize: '0.7rem', color: '#94a3b8', textTransform:'uppercase', borderTop: '1px solid #ffffff1a', paddingTop: '10px'}}>
              Diretas
            </div>

            {usuariosOrdenados.map(u => (
              <button 
                key={u.id} 
                className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`}
                onClick={() => { setCanalAtivo({ id: u.id, nome: u.nome, desc: u.cargo }); setMenuAberto(false); }}
              >
                <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                  <div><span className="channel-name">👤 {u.nome}</span><span className="channel-desc">{u.cargo}</span></div>
                  {naoLidas[u.id] > 0 && <div className="badge-notificacao">{naoLidas[u.id]}</div>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {menuAberto && <div className="overlay-menu" onClick={() => setMenuAberto(false)}></div>}

        <main className="chat-area">
          <div className="chat-header"><h3>{canalAtivo.nome}</h3><span>{mensagens.length} msg</span></div>

          <div className="messages-scroll" ref={scrollRef}>
            {mensagens.length === 0 && <div className="empty-chat"><span>👋</span><p>Inicie a conversa!</p></div>}
            
            {mensagens.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.uid === user?.uid ? 'mine' : 'other'}`}>
                <div className="msg-avatar">{msg.avatar}</div>
                <div className="msg-content">
                  <div className="msg-top"><span className="msg-user">{msg.usuario}</span><span className="msg-time">{formatarHora(msg.timestamp)}</span></div>
                  <p className="msg-text">{msg.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <form className="chat-input-area" onSubmit={enviarMensagem}>
            <input 
              type="text" 
              placeholder="Digite sua mensagem..."
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