import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set, get, update } from "firebase/database"; 
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

// --- LISTA FIXA ---
const TEAM_FIXO = [
  { id: "user_teste_demo", nome: "Cadastro Teste", cargo: "Usuário de Testes", email: "teste@techcorp.com.br" },
];

// --- FUNÇÃO DE EXPONENTIAL BACKOFF (FILA DE ESPERA) ---
const fetchComRetry = async (url, options, maxTentativas = 3) => {
    let tempoEspera = 2000; 
    
    for (let i = 0; i < maxTentativas; i++) {
        const response = await fetch(url, options);
        if (response.status !== 429) return response; 
        
        console.warn(`Limite da IA atingido. Tentativa ${i + 1}. A aguardar ${tempoEspera / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, tempoEspera));
        tempoEspera *= 2; 
    }
    return fetch(url, options); 
};

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [user, setUser] = useState(null);
  
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [usuariosExibidos, setUsuariosExibidos] = useState([]);
  
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  
  const [naoLidas, setNaoLidas] = useState({});
  const [ultimasInteracoes, setUltimasInteracoes] = useState({}); 
  const [termoBusca, setTermoBusca] = useState('');
  
  // NOVO ESTADO: Controla se a IA está digitando para travar o input e mostrar a animação
  const [iaDigitando, setIaDigitando] = useState(false); 

  const processedInitialState = useRef(false);
  const lastProcessedMsgRef = useRef(null);
  const scrollRef = useRef(null);

  // 1. AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. CARREGAR LISTA DE USUÁRIOS
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onValue(ref(db), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const dbUsers = data.users || {};
        const dbMocks = data.rh?.erros_ponto || {}; 

        let listaReais = Object.entries(dbUsers).map(([uid, u]) => ({
            id: uid,
            nome: u.nome || u.email, 
            email: u.email,
            cargo: u.cargo || 'Colaborador',
            setor: u.setor || 'Geral',
            isMock: false
        }));

        let listaMocks = Object.entries(dbMocks).map(([id, m]) => ({
            id: id,
            nome: m.nome,
            cargo: m.cargo || 'Colaborador (RH)',
            email: 'mock@interno.com',
            isMock: true
        }));

        let combinados = [...listaMocks, ...TEAM_FIXO, ...listaReais];

        const target = location.state?.chatTarget;
        if (target && !processedInitialState.current) {
            if (!combinados.find(u => u.id === target.id)) {
                combinados.push({ ...target, isMock: true });
            }
        }

        const unicos = Array.from(new Map(combinados.map(item => [item.id, item])).values())
                                         .filter(u => u.email !== user.email && u.id !== user.uid);

        setTodosUsuarios(unicos);
    });

    return () => unsubscribe();
  }, [user]); 

  // 2.5 PROCESSAR ESTADO INICIAL
  useEffect(() => {
      if (location.state?.chatTarget && !processedInitialState.current) {
          const target = location.state.chatTarget;
          setCanalAtivo({ 
              id: target.id, 
              nome: `👤 ${target.nome}`, 
              desc: target.cargo, 
              isMock: true 
          });
          processedInitialState.current = true;
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  // 3. MONITORAR MENSAGENS E NÃO LIDAS
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
              if (msgs.length > 0) {
                  const ultimaMsg = msgs[msgs.length - 1];
                  const outroId = chatId.replace(user.uid, '').replace('_', '');

                  novasInteracoes[outroId] = ultimaMsg.timestamp;

                  if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
                    const lastRead = Number(localStorage.getItem(`last_read_${outroId}`) || 0);
                    if (ultimaMsg.timestamp > lastRead) {
                        const count = msgs.filter(m => m.timestamp > lastRead).length;
                        novasNaoLidas[outroId] = count > 0 ? count : 0;
                    }
                  } else if (canalAtivo.id === outroId) {
                      novasNaoLidas[outroId] = 0;
                      localStorage.setItem(`last_read_${outroId}`, ultimaMsg.timestamp + 1);
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

  // 4. FILTRO
  useEffect(() => {
      let lista = todosUsuarios.filter(u => {
          if (termoBusca) {
              const t = termoBusca.toLowerCase();
              return (u.nome && u.nome.toLowerCase().includes(t)) || 
                     (u.cargo && u.cargo.toLowerCase().includes(t)) ||
                     (u.email && u.email.toLowerCase().includes(t));
          }
          return ultimasInteracoes[u.id] !== undefined || canalAtivo.id === u.id;
      });

      lista.sort((a, b) => {
          const timeA = ultimasInteracoes[a.id] || 0;
          const timeB = ultimasInteracoes[b.id] || 0;
          return timeB - timeA;
      });

      setUsuariosExibidos(lista);
  }, [todosUsuarios, ultimasInteracoes, termoBusca, canalAtivo]);

  // 5. CARREGAR CONVERSA
  useEffect(() => {
    if (!user) return;
    
    if (naoLidas[canalAtivo.id]) {
        setNaoLidas(prev => { 
            const n = {...prev}; 
            delete n[canalAtivo.id]; 
            return n; 
        });
    }

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
    const unsubscribe = onValue(ref(db, path), (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.entries(data).map(([k, v]) => ({ id: k, ...v })) : [];
      setMensagens(lista);
      
      if (lista.length > 0 && canalAtivo.id !== 'geral') {
          const ult = lista[lista.length-1];
          localStorage.setItem(`last_read_${canalAtivo.id}`, ult.timestamp + 1);
      }
    });
    return () => unsubscribe();
  }, [canalAtivo, user]); 

  // Rola para baixo sempre que chegar mensagem OU quando a IA começar a digitar
  useEffect(() => { 
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [mensagens, iaDigitando]);

  // --- 6. AUTO-REPLY DO ROBÔ (COM IA GEMINI PROTEGIDA VIA BACKEND) ---
  useEffect(() => {
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;

      const ultimaMsg = mensagens[mensagens.length - 1];
      
      if (ultimaMsg.uid !== user.uid) return; 

      const usuarioAtual = todosUsuarios.find(u => u.id === canalAtivo.id);
      
      if (usuarioAtual && usuarioAtual.isMock === true) {
          const mockId = usuarioAtual.id;

          if (lastProcessedMsgRef.current === ultimaMsg.id) return;
          lastProcessedMsgRef.current = ultimaMsg.id;

          const mockNome = usuarioAtual.nome.replace('👤 ', '');
          const meuId = user.uid;
          
          // ATIVA A TRAVA E A ANIMAÇÃO
          setIaDigitando(true);

          // AUMENTADO O TEMPO: Simula de 3 a 6 segundos lendo/digitando
          const tempoEspera = Math.floor(Math.random() * (3000) + 3000);

          const timer = setTimeout(async () => {
              try {
                  let erroTipo = "Dúvida sobre o ponto";
                  let pontosReais = {}; 

                  try {
                      const snapshot = await get(ref(db, `rh/erros_ponto/${mockId}`));
                      if (snapshot.exists()) {
                          const dadosMock = snapshot.val();
                          erroTipo = dadosMock.erro || erroTipo; 
                          pontosReais = dadosMock.pontos || {}; 
                          await update(ref(db, `rh/erros_ponto/${mockId}`), { status: 'Respondido' });
                      }
                  } catch(e) { console.error("Erro ao buscar contexto:", e); }

                  const historicoIA = [];
                  mensagens.forEach(m => {
                      const role = m.uid === mockId ? "model" : "user";
                      if (historicoIA.length > 0 && historicoIA[historicoIA.length - 1].role === role) {
                          historicoIA[historicoIA.length - 1].parts[0].text += " | " + m.texto;
                      } else {
                          historicoIA.push({ role: role, parts: [{ text: m.texto }] });
                      }
                  });

                  const instrucaoSistema = `Você é ${mockNome}, um funcionário brasileiro da empresa TechCorp. 
O RH está falando com você no chat interno da empresa. O problema sinalizado com o seu ponto é: ${erroTipo}.
Seus horários registrados nesse dia foram: Entrada: ${pontosReais.e || '---'}, Ida Almoço: ${pontosReais.si || '---'}, Volta Almoço: ${pontosReais.vi || '---'}, Saída: ${pontosReais.s || '---'}.
Regras inquebráveis:
1. Fale com naturalidade, use português do Brasil coloquial de escritório (ex: "putz", "foi mal", "beleza", "vou ajustar").
2. Tente dar uma desculpa realista, ou assumir o erro, dialogando com a mensagem do RH. Mantenha o contexto.
3. Nunca diga que é uma IA ou um modelo de linguagem. Você é um funcionário real.
4. IMPORTANTE: Conclua sempre os seus pensamentos e termine as frases. NUNCA deixe uma frase pela metade.`;

                  let textoFinal = "Opa, tive um imprevisto. Pode me ajudar a ajustar?"; 

                  try {
                      // FAZ A CHAMADA PARA A NOSSA PRÓPRIA API (O Backend na Vercel)
                      const response = await fetchComRetry('/api/chat', {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                              systemInstruction: { parts: [{ text: instrucaoSistema }] },
                              contents: historicoIA,
                              generationConfig: { 
                                  temperature: 0.7,
                                  maxOutputTokens: 1000 
                              }
                          })
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                          console.error("Erro retornado pelo Backend/Google:", data);
                          textoFinal = `🤖 [ERRO DE COMUNICAÇÃO]: ${data.error?.message || data.error || 'Erro desconhecido'}`;
                      } else if (data.candidates && data.candidates[0].content) {
                          textoFinal = data.candidates[0].content.parts[0].text;
                      }
                  } catch (erroApi) {
                      console.error("Erro ao chamar a nossa API:", erroApi);
                      textoFinal = "🤖 [ERRO INTERNO]: Não foi possível contactar o servidor.";
                  }

                  const path = `chats/direto/${[meuId, mockId].sort().join('_')}`;
                  await set(push(ref(db, path)), {
                      usuario: mockNome,
                      uid: mockId,
                      texto: textoFinal,
                      timestamp: Date.now(),
                      avatar: mockNome[0]
                  });
              } catch (e) {
                  console.error("Erro na requisição/salvamento do Robô:", e);
              } finally {
                  // DESATIVA A TRAVA MESMO SE DER ERRO, PARA NÃO BLOQUEAR O USUÁRIO PRA SEMPRE
                  setIaDigitando(false);
              }

          }, tempoEspera);

          return () => clearTimeout(timer);
      }
  }, [mensagens, canalAtivo, user, todosUsuarios]);

  // 7. ENVIAR 
  const enviarMensagem = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!novaMensagem.trim() || !user || iaDigitando) return; // Segurança extra aqui

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

  const handleSelectChat = (u) => {
      setCanalAtivo({ 
          id: u.id, 
          nome: `👤 ${u.nome}`, 
          desc: u.cargo, 
          isMock: u.isMock 
      });
      
      setNaoLidas(prev => { 
          const n = {...prev}; 
          delete n[u.id]; 
          return n; 
      });

      const agora = Date.now();
      localStorage.setItem(`last_read_${u.id}`, agora);

      setMenuAberto(false);
      
      // LIBERA O INPUT CASO TROQUE DE CHAT ENQUANTO A IA PENSAVA
      setIaDigitando(false); 
  };

  const formatarHora = (t) => t ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';
  
  const formatarNome = (n) => {
    if (!n) return 'User';
    const nomeLimpo = n.replace('👤 ', '').trim();
    const partes = nomeLimpo.split(' ');
    if (partes.length > 1) {
        return `${partes[0]} ${partes[partes.length - 1]}`;
    }
    return partes[0];
  };
  
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
                onClick={() => handleSelectChat(u)}
              >
                <div className="user-profile-chat">
                    <div className={`avatar-glow-chat ${u.isMock ? 'mock' : ''}`}>
                        {getAvatar(u.nome)}
                    </div>
                    
                    <div className="user-info-chat">
                        <strong>{formatarNome(u.nome)}</strong>
                        <small>{u.cargo}</small>
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
                  <p className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.texto}</p>
                </div>
              </div>
            ))}

            {/* ANIMAÇÃO DE DIGITANDO RENDERIZADA CONDICIONALMENTE */}
            {iaDigitando && canalAtivo.isMock && (
              <div className="message-bubble other">
                <div className="msg-content typing-indicator-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

          </div>

          <form className="chat-input-area" onSubmit={enviarMensagem}>
            <textarea 
              placeholder={iaDigitando ? `${formatarNome(canalAtivo.nome)} está digitando...` : `Mensagem para ${canalAtivo.nome}...`}
              value={novaMensagem}
              disabled={iaDigitando}
              onChange={(e) => {
                  setNovaMensagem(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviarMensagem(e);
                      e.target.style.height = 'auto'; 
                  }
              }}
              className="chat-input"
              rows={1}
            />
            <button 
              type="submit" 
              className="btn-send" 
              disabled={!novaMensagem.trim() || iaDigitando}
            >
              ➤
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}