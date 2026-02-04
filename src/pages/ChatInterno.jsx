import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set, get, update } from "firebase/database"; 
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

// --- CONSTANTES ---
const RESPOSTAS_AUTOMATICAS = [
  "Oi! Nossa, esqueci totalmente de bater o ponto ontem. Vou ajustar aqui, desculpa!",
  "Bom dia! Eu estava em reunião externa e acabei esquecendo. Pode ajustar pra mim?",
  "Opa, foi mal. Meu celular ficou sem bateria bem na hora da saída.",
  "Olá! Eu bati, mas acho que o sistema não pegou. Vou verificar.",
  "Oi RH, desculpa a falha. Tive que sair correndo pra pegar o ônibus e esqueci.",
  "Bom dia. Ontem fiz home office e me enrolei com o horário. Já vou justificar.",
  "Putz, de novo? Eu juro que bati! Deve ser bug do sistema kkk",
  "Oi, tudo bem? Foi mal, acabei esquecendo de registrar a volta do almoço.",
  "Olá! Estava sem internet no celular na hora da saída.",
  "Oi! Eu achei que tinha batido. Vou corrigir agora mesmo.",
  "Bom dia! Tive uma emergência médica e saí mais cedo, esqueci de avisar.",
  "Opa, desculpa. Fiquei focado no código e perdi a hora.",
  "Oi! O leitor biométrico não estava funcionando, por isso não registrou.",
  "Olá. Eu estava em call com cliente e passou batido. Perdão!",
  "Oi RH. Já estou providenciando a justificativa. Obrigado pelo aviso.",
  "Nossa, nem vi que não tinha registrado. Obrigado por avisar!",
  "Oi! Ontem foi feriado na minha cidade (home office), por isso não bati.",
  "Bom dia. O site estava fora do ar pra mim ontem. Vou abrir chamado.",
  "Oi! Esqueci meu crachá em casa ontem, por isso não registrou na catraca.",
  "Olá! Foi mal, sai para almoçar e esqueci de bater na volta. Já ajusto!"
];

const RESPOSTAS_AJUSTE = [
    "Prontinho! Já ajustei a batida lá no sistema.",
    "Oi! Desculpa a demora, acabei de corrigir o horário.",
    "Feito! Inseri a justificativa e o horário correto.",
    "Obrigado por avisar. Já regularizei meu ponto.",
    "Ajustado! Foi falha minha mesmo, desculpe."
];

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState({});
  const [ultimasInteracoes, setUltimasInteracoes] = useState({}); // NOVO: Armazena timestamp da última msg por usuário
  const scrollRef = useRef(null);

  // 1. AUTH & PERMISSÃO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
          setUser(currentUser);
      } else navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. CARREGAR USUÁRIOS
  useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, 'users');
    
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let listaReais = Object.keys(data).map(id => ({ id, ...data[id] })).filter(u => u.id !== user.uid);
        const mocksSalvos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
        const target = location.state?.chatTarget;

        let todosCandidatos = [...mocksSalvos, ...listaReais];
        if (target) todosCandidatos.push(target);

        const mapaPorNome = new Map();
        todosCandidatos.forEach(u => {
            if (u && u.nome) {
                mapaPorNome.set(u.nome.trim(), u);
            }
        });

        if (target) {
            if (canalAtivo.id === 'geral') {
                setCanalAtivo({ id: target.id, nome: `👤 ${target.nome}`, desc: target.cargo });
            }
        }
        setUsuarios(Array.from(mapaPorNome.values()));
      }
    });
  }, [user, location.state]); 

  // --- ROBÔ AUTO-REPLY ---
  useEffect(() => {
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;

      const ultimaMsg = mensagens[mensagens.length - 1];
      const mocksAtivos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
      const isMock = mocksAtivos.some(m => m.id === canalAtivo.id || m.nome === canalAtivo.nome.replace('👤 ', ''));

      if (ultimaMsg.uid === user.uid && isMock) {
          
          let mockId = canalAtivo.id; 
          const mockNome = canalAtivo.nome;
          const meuId = user.uid;

          if (!mockId || mockId === 'undefined') {
              const mockEncontrado = mocksAtivos.find(m => m.nome === mockNome.replace('👤 ', ''));
              if(mockEncontrado) mockId = mockEncontrado.id;
              else return;
          }

          const tempoEspera = Math.floor(Math.random() * (90000 - 15000 + 1) + 15000);
          console.log(`🤖 Resposta agendada para ${mockNome} (${mockId}) em ${tempoEspera/1000}s`);

          const timerId = setTimeout(async () => {
              const msgTexto = RESPOSTAS_AJUSTE[Math.floor(Math.random() * RESPOSTAS_AJUSTE.length)];
              const ids = [meuId, mockId].sort();
              const pathChat = `chats/direto/${ids[0]}_${ids[1]}`;
              
              try {
                  await set(push(ref(db, pathChat)), {
                      usuario: mockNome.replace('👤 ', ''),
                      uid: mockId,
                      texto: msgTexto,
                      timestamp: Date.now(),
                      avatar: '👤'
                  });

                  const mockRef = ref(db, `rh/erros_ponto/${mockId}`);
                  const snap = await get(mockRef);
                  if (snap.exists()) {
                      await update(mockRef, { status: 'Respondido', hiddenUntil: null });
                  }
              } catch (err) {
                  console.error("Erro no Auto-Reply:", err);
              }
          }, tempoEspera);

          return () => clearTimeout(timerId);
      }
  }, [mensagens]); 

  // 3. MONITORAMENTO (LÊ TODAS AS MENSAGENS E CALCULA ORDENAÇÃO)
  useEffect(() => {
    if (!user) return;
    const chatsRef = ref(db, 'chats/direto');
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const novasNaoLidas = { ...naoLidas };
      const novasInteracoes = {}; // Objeto para guardar o timestamp da última msg

      Object.keys(data).forEach((chatId) => {
        if (chatId.includes(user.uid)) {
          const msgs = Object.values(data[chatId]);
          const ultimaMsg = msgs[msgs.length - 1];
          const outroId = chatId.replace(user.uid, '').replace('_', '');
          
          // 1. Guarda o timestamp da última interação para ordenação
          novasInteracoes[outroId] = ultimaMsg.timestamp;

          // 2. Lógica de Notificações
          const lastReadTime = Number(localStorage.getItem(`last_read_${outroId}`) || 0);
          if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
             if (ultimaMsg.timestamp > lastReadTime) {
                 if (!novasNaoLidas[outroId]) novasNaoLidas[outroId] = 1;
             }
          }
        }
      });
      
      setNaoLidas(novasNaoLidas);
      setUltimasInteracoes(novasInteracoes); // Atualiza o estado de ordenação
    });
    return () => unsubscribe();
  }, [user, canalAtivo.id]); 

  // 4. CARREGAR MENSAGENS ATIVAS
  useEffect(() => {
    if (!user) return;
    if (naoLidas[canalAtivo.id]) {
      setNaoLidas(prev => { const n = {...prev}; delete n[canalAtivo.id]; return n; });
    }
    
    let targetId = canalAtivo.id;
    if (canalAtivo.id !== 'geral' && (!targetId || targetId === 'undefined')) {
        const found = usuarios.find(u => u.nome === canalAtivo.nome.replace('👤 ', ''));
        if (found) targetId = found.id;
    }

    if (canalAtivo.id !== 'geral' && !targetId) return;

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, targetId].sort().join('_')}`;

    const unsubscribe = onValue(ref(db, path), (snapshot) => {
      const data = snapshot.val();
      const msgsCarregadas = data ? Object.entries(data).map(([k, v]) => ({ id: k, ...v })) : [];
      setMensagens(msgsCarregadas);

      if (canalAtivo.id !== 'geral' && msgsCarregadas.length > 0) {
          const ultima = msgsCarregadas[msgsCarregadas.length - 1];
          localStorage.setItem(`last_read_${canalAtivo.id}`, ultima.timestamp + 1);
      }
    });
    return () => unsubscribe();
  }, [canalAtivo, user, usuarios]); 

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;
    
    let targetId = canalAtivo.id;
    if (canalAtivo.id !== 'geral' && (!targetId || targetId === 'undefined')) {
        const found = usuarios.find(u => u.nome === canalAtivo.nome.replace('👤 ', ''));
        if (found) targetId = found.id;
        else {
            alert("Erro: Não foi possível identificar o usuário.");
            return;
        }
    }

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, targetId].sort().join('_')}`;

    await set(push(ref(db, path)), {
      usuario: user.displayName || user.email.split('@')[0],
      uid: user.uid,
      texto: novaMensagem,
      timestamp: Date.now(),
      avatar: '👤'
    });
    setNovaMensagem('');
  };

  const formatarHora = (t) => t ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';
  const formatarNomeLista = (nome) => nome ? nome.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Usuário';

  return (
    <div className="tech-layout-chat">
      <div className="ambient-light light-1"></div>
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
            <button className={`channel-btn ${canalAtivo.id === 'geral' ? 'active' : ''}`} onClick={() => setCanalAtivo({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' })}>
              <span className="channel-name">📢 Geral</span><span className="channel-desc">Para todos</span>
            </button>
            <div style={{margin: '15px 10px 5px', fontSize: '0.7rem', color: '#94a3b8', textTransform:'uppercase', borderTop: '1px solid #ffffff1a', paddingTop: '10px'}}>Diretas</div>
            
            {/* LOGICA DE ORDENAÇÃO APLICADA AQUI */}
            {usuarios
              .sort((a, b) => {
                  const timeA = ultimasInteracoes[a.id] || 0;
                  const timeB = ultimasInteracoes[b.id] || 0;
                  return timeB - timeA; // Ordena decrescente (mais recente primeiro)
              })
              .map((u, index) => (
                <button key={`${u.id}-${index}`} className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`} onClick={() => setCanalAtivo({ id: u.id, nome: u.nome || formatarNomeLista(u.email.split('@')[0]), desc: u.cargo })}>
                  <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                    <div><span className="channel-name">👤 {formatarNomeLista(u.nome || u.email.split('@')[0])}</span><span className="channel-desc">{u.cargo}</span></div>
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
            {mensagens.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.uid === user?.uid ? 'mine' : 'other'}`}>
                <div className="msg-content">
                  <div className="msg-top"><span className="msg-user">{formatarNomeLista(msg.usuario)}</span><span className="msg-time">{formatarHora(msg.timestamp)}</span></div>
                  <p className="msg-text">{msg.texto}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form className="chat-input-area" onSubmit={enviarMensagem}>
            <input value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} className="chat-input" placeholder="Mensagem..." />
            <button type="submit" className="btn-send" disabled={!novaMensagem.trim()}>➤</button>
          </form>

        </main>
      </div>
    </div>
  );
}