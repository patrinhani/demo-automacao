import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set, get, update } from "firebase/database"; 
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

// --- LISTA FIXA (BACKUP) ---
const TEAM_FIXO = [
  { id: "user_teste_demo", nome: "Cadastro Teste", cargo: "Usuário de Testes", email: "teste@techcorp.com.br" },
  { id: "user_patrinhani", nome: "Guilherme Patrinhani", cargo: "CEO", email: "guilherme@tech.com" },
  { id: "user_yan", nome: "Yan Rodrigues", cargo: "Dev Fullstack", email: "yan@tech.com" },
  // ... (outros fixos se quiser)
];

// --- RESPOSTAS DO ROBÔ ---
const RESPOSTAS_ROBO = [
    "Oi! Nossa, esqueci totalmente de bater o ponto ontem. Vou ajustar aqui, desculpa!",
    "Bom dia! Eu estava em reunião externa e acabei esquecendo. Pode ajustar pra mim?",
    "Opa, foi mal. Meu celular ficou sem bateria bem na hora da saída.",
    "Olá! Eu bati, mas acho que o sistema não pegou. Vou verificar.",
    "Oi RH, desculpa a falha. Tive que sair correndo pra pegar o ônibus e esqueci.",
    "Prontinho! Já ajustei a batida lá no sistema.",
    "Oi! Desculpa a demora, acabei de corrigir o horário.",
    "Feito! Inseri a justificativa e o horário correto."
];

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation(); // Recebe dados do RH
  
  const [user, setUser] = useState(null);
  
  // Lista unificada (Fixos + Mocks do RH)
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  // Lista filtrada na tela
  const [usuariosExibidos, setUsuariosExibidos] = useState([]);
  
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  
  const [naoLidas, setNaoLidas] = useState({});
  const [ultimasInteracoes, setUltimasInteracoes] = useState({}); 
  const [termoBusca, setTermoBusca] = useState('');

  const scrollRef = useRef(null);

  // 1. AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. CARREGAR LISTA DE USUÁRIOS (FIXOS + MOCKS RH)
  useEffect(() => {
    if (!user) return;

    // A. Carrega Mocks do RH (LocalStorage)
    const mocksSalvos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
    // Adiciona flag isMock para o robô saber quem é
    const mocksFormatados = mocksSalvos.map(m => ({ ...m, isMock: true, cargo: m.cargo || 'Colaborador (RH)' }));

    // B. Combina com lista fixa
    let combinados = [...TEAM_FIXO, ...mocksFormatados];

    // C. Verifica se veio alguém pelo botão "Chamar" do RH
    const target = location.state?.chatTarget;
    if (target) {
        // Se ele não estiver na lista (ex: acabou de ser gerado), adiciona
        if (!combinados.find(u => u.id === target.id)) {
            combinados.push({ ...target, isMock: true });
        }
        
        // Abre o chat automaticamente se for a primeira vez renderizando com esse state
        if (canalAtivo.id === 'geral') {
            setCanalAtivo({ id: target.id, nome: `👤 ${target.nome}`, desc: target.cargo, isMock: true });
        }
    }

    // Remove duplicatas e o próprio usuário
    const unicos = Array.from(new Map(combinados.map(item => [item.id, item])).values())
                        .filter(u => u.email !== user.email);

    setTodosUsuarios(unicos);
  }, [user, location.state]);

  // 3. MONITORAR MENSAGENS E ORDENAÇÃO
  useEffect(() => {
    if (!user) return;
    const chatsRef = ref(db, 'chats/direto');
    
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      const novasInteracoes = {};
      const novasNaoLidas = { ...naoLidas };

      if (data) {
          Object.keys(data).forEach((chatId) => {
            if (chatId.includes(user.uid)) {
              const msgs = Object.values(data[chatId]);
              const ultimaMsg = msgs[msgs.length - 1];
              const outroId = chatId.replace(user.uid, '').replace('_', '');

              // Guarda timestamp para ordenar
              novasInteracoes[outroId] = ultimaMsg.timestamp;

              // Badge de não lida
              if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
                 const lastRead = Number(localStorage.getItem(`last_read_${outroId}`) || 0);
                 if (ultimaMsg.timestamp > lastRead) {
                     novasNaoLidas[outroId] = (novasNaoLidas[outroId] || 0) + 1; 
                 }
              }
            }
          });
      }
      setUltimasInteracoes(novasInteracoes);
      setNaoLidas(novasNaoLidas);
    });
    return () => unsubscribe();
  }, [user, canalAtivo.id]);

  // 4. FILTRO INTELIGENTE (Busca ou Quem já falou)
  useEffect(() => {
      let lista = todosUsuarios.filter(u => {
          // Se tem busca, filtra pelo nome/cargo
          if (termoBusca) {
              const t = termoBusca.toLowerCase();
              return (u.nome && u.nome.toLowerCase().includes(t)) || 
                     (u.cargo && u.cargo.toLowerCase().includes(t));
          }
          
          // Se não tem busca, mostra só quem já tem interação OU é o canal ativo
          return ultimasInteracoes[u.id] !== undefined || canalAtivo.id === u.id;
      });

      // Ordena por mensagem mais recente
      lista.sort((a, b) => {
          const timeA = ultimasInteracoes[a.id] || 0;
          const timeB = ultimasInteracoes[b.id] || 0;
          return timeB - timeA;
      });

      setUsuariosExibidos(lista);
  }, [todosUsuarios, ultimasInteracoes, termoBusca, canalAtivo]);

  // 5. CARREGAR MENSAGENS ATUAIS
  useEffect(() => {
    if (!user) return;

    if (naoLidas[canalAtivo.id]) {
      setNaoLidas(prev => { const n = {...prev}; delete n[canalAtivo.id]; return n; });
    }

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
    const unsubscribe = onValue(ref(db, path), (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.entries(data).map(([k, v]) => ({ id: k, ...v })) : [];
      setMensagens(lista);
      
      // Marca lido
      if (lista.length > 0 && canalAtivo.id !== 'geral') {
          const ult = lista[lista.length-1];
          localStorage.setItem(`last_read_${canalAtivo.id}`, ult.timestamp + 1);
      }
    });
    return () => unsubscribe();
  }, [canalAtivo, user]); 

  // Scroll
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

  // --- 6. AUTO-REPLY DO ROBÔ (A LÓGICA DO LUCAS) ---
  useEffect(() => {
      // Condições para o robô responder:
      // 1. Não estamos no geral
      // 2. Tem mensagem
      // 3. O usuário atual do chat é um MOCK (tem a flag isMock ou está na lista de mocks)
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;

      const ultimaMsg = mensagens[mensagens.length - 1];
      
      // OBRIGATÓRIO: A última mensagem tem que ser MINHA (do user logado).
      // Se a última mensagem for do robô (ID dele), ele NÃO responde de novo.
      if (ultimaMsg.uid !== user.uid) return;

      // Descobre se o canal ativo é um mock
      const usuarioAtual = todosUsuarios.find(u => u.id === canalAtivo.id);
      
      if (usuarioAtual && usuarioAtual.isMock) {
          const mockId = usuarioAtual.id;
          const mockNome = usuarioAtual.nome.replace('👤 ', ''); // Limpa o nome
          const meuId = user.uid;
          
          // Tempo aleatório entre 3s e 7s (rápido para testar, mas humano)
          const tempoEspera = Math.floor(Math.random() * (7000 - 3000 + 1) + 3000);

          console.log(`🤖 Robô ${mockNome} vai responder em ${tempoEspera}ms`);

          const timer = setTimeout(async () => {
              const resposta = RESPOSTAS_ROBO[Math.floor(Math.random() * RESPOSTAS_ROBO.length)];
              const path = `chats/direto/${[meuId, mockId].sort().join('_')}`;

              try {
                  await set(push(ref(db, path)), {
                      usuario: mockNome,
                      uid: mockId, // Importante: ID do mock para não ser igual ao meu
                      texto: resposta,
                      timestamp: Date.now(),
                      avatar: mockNome[0]
                  });
                  
                  // Tenta atualizar status no RH (opcional, ignora erro se falhar)
                  try {
                      const mockRef = ref(db, `rh/erros_ponto/${mockId}`);
                      const snap = await get(mockRef);
                      if (snap.exists()) await update(mockRef, { status: 'Respondido' });
                  } catch(e) { /* ignora erro de permissão no RH */ }

              } catch (e) { console.error("Erro Robô:", e); }
          }, tempoEspera);

          return () => clearTimeout(timer);
      }
  }, [mensagens, canalAtivo, user, todosUsuarios]);


  // 7. ENVIAR (USUÁRIO REAL)
  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
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
  const formatarNome = (n) => n ? n.split(' ')[0] : 'User';
  const getAvatar = (n) => n ? n[0].toUpperCase() : 'U';

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
            Conversas
            {menuAberto && <span onClick={() => setMenuAberto(false)} style={{float:'right'}}>✕</span>}
          </div>
          
          <div className="chat-search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                  type="text" 
                  className="chat-search-input" 
                  placeholder="Buscar ou iniciar..." 
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
              />
          </div>

          <div className="channels-list custom-scroll">
            <button 
              className={`channel-btn ${canalAtivo.id === 'geral' ? 'active' : ''}`}
              onClick={() => { setCanalAtivo({ id: 'geral', nome: '📢 Geral', desc: 'Mural' }); setMenuAberto(false); }}
            >
              <span className="channel-name">📢 Geral</span>
            </button>

            <div style={{margin: '15px 10px 5px', fontSize: '0.7rem', color: '#94a3b8', textTransform:'uppercase', borderTop: '1px solid #ffffff1a', paddingTop: '10px'}}>
              Recentes
            </div>

            {usuariosExibidos.map(u => (
              <button 
                key={u.id} 
                className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`}
                onClick={() => { setCanalAtivo({ id: u.id, nome: `👤 ${u.nome}`, desc: u.cargo, isMock: u.isMock }); setMenuAberto(false); }}
              >
                <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div className="contact-avatar-small" style={{
                        background: u.isMock ? '#10b981' : '#3b82f6', // Verde para Mocks, Azul para Reais
                        width: '32px', height: '32px', borderRadius: '50%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', fontWeight: 'bold', fontSize: '0.9rem'
                    }}>
                        {getAvatar(u.nome)}
                    </div>
                    <div style={{textAlign:'left'}}>
                        <div className="channel-name">{formatarNome(u.nome)}</div>
                        <div className="channel-desc" style={{fontSize: '0.7rem', opacity: 0.7}}>{u.cargo}</div>
                    </div>
                  </div>
                  {naoLidas[u.id] > 0 && <div className="badge-notificacao">{naoLidas[u.id]}</div>}
                </div>
              </button>
            ))}
            
            {usuariosExibidos.length === 0 && (
                <div style={{padding:'20px', color:'#666', fontSize:'0.8rem', textAlign:'center'}}>
                    {termoBusca ? 'Ninguém encontrado.' : 'Nenhuma conversa iniciada.\nBusque alguém para começar.'}
                </div>
            )}
          </div>
        </aside>

        {menuAberto && <div className="overlay-menu" onClick={() => setMenuAberto(false)}></div>}

        <main className="chat-area">
          <div className="chat-header"><h3>{canalAtivo.nome}</h3></div>

          <div className="messages-scroll" ref={scrollRef}>
            {mensagens.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.uid === user?.uid ? 'mine' : 'other'}`}>
                <div className="msg-content">
                  <div className="msg-top">
                    <span className="msg-user">{formatarNome(msg.usuario)}</span>
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