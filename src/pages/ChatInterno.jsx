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

// --- TRAVA GLOBAL ANTI-DUPLICIDADE ---
const mensagensProcessadasPelaIA = new Set();

// --- FILA GLOBAL DE REQUISIÇÕES (PROMISE QUEUE) ---
let filaGlobalIA = Promise.resolve();

const enfileirarIA = (tarefaAsync) => {
    filaGlobalIA = filaGlobalIA.then(async () => {
        try {
            await tarefaAsync();
        } catch(e) {
            console.error("Erro na fila da IA:", e);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    });
};

// --- FUNÇÃO DE DETECÇÃO DE 429 (QUOTA EXCEEDED) ---
const fetchComRetry = async (url, options, maxTentativas = 4) => {
    let tempoEspera = 2000; 
    
    for (let i = 0; i < maxTentativas; i++) {
        const response = await fetch(url, options);
        
        if (response.status !== 429) return response; 
        
        const responseClone = response.clone();
        try {
            const data = await responseClone.json();
            const errMsg = data?.error?.message || data?.error || '';
            
            const match = typeof errMsg === 'string' && errMsg.match(/retry in (\d+\.?\d*)s/i);
            if (match && match[1]) {
                tempoEspera = (parseFloat(match[1]) * 1000) + 2000; 
            }
        } catch (e) {
            console.error("Não foi possível ler o tempo de espera do Google. Usando padrão.");
        }
        
        console.warn(`⏳ Cota atingida (429). Tentativa ${i + 1}/${maxTentativas}. Aguardando ${Math.round(tempoEspera / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, tempoEspera));
        
        tempoEspera *= 1.5; 
    }
    return fetch(url, options); 
};

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(''); // <-- NOVO: Estado para guardar o nome real
  
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [historicoUsuarios, setHistoricoUsuarios] = useState([]); 
  const [usuariosExibidos, setUsuariosExibidos] = useState([]);
  
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  
  const [naoLidas, setNaoLidas] = useState({});
  const [ultimasInteracoes, setUltimasInteracoes] = useState({}); 
  const [termoBusca, setTermoBusca] = useState('');
  
  const [iaDigitando, setIaDigitando] = useState(false); 

  const processedInitialState = useRef(false);
  const scrollRef = useRef(null);

  // 1. AUTH (Atualizado para buscar o nome real no banco)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
          setUser(currentUser);
          
          // Busca o nome real do usuário no banco de dados
          get(ref(db, `users/${currentUser.uid}`)).then((snapshot) => {
              if (snapshot.exists()) {
                  setUserName(snapshot.val().nome || '');
              }
          });
      }
      else {
          navigate('/');
      }
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
  }, [user, location.state]); 

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
      const novosHistorico = []; 

      if (data) {
          Object.keys(data).forEach((chatId) => {
            if (chatId.includes(user.uid)) {
              const msgs = Object.values(data[chatId]);
              if (msgs.length > 0) {
                  const ultimaMsg = msgs[msgs.length - 1];
                  const outroId = chatId.replace(user.uid, '').replace('_', '');

                  novasInteracoes[outroId] = ultimaMsg.timestamp;

                  const msgDoOutro = msgs.slice().reverse().find(m => m.uid === outroId);
                  if (msgDoOutro) {
                      novosHistorico.push({
                          id: outroId,
                          nome: msgDoOutro.usuario,
                          cargo: 'Colaborador (Histórico)',
                          isMock: true 
                      });
                  }

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
      setHistoricoUsuarios(novosHistorico); 
    });
    return () => unsubscribe();
  }, [user, canalAtivo.id]); 

  // 4. FILTRO 
  useEffect(() => {
      const mapUsuarios = new Map();
      todosUsuarios.forEach(u => mapUsuarios.set(u.id, u));
      historicoUsuarios.forEach(u => {
          if (!mapUsuarios.has(u.id)) mapUsuarios.set(u.id, u);
      });
      const listaCombinada = Array.from(mapUsuarios.values());

      let lista = listaCombinada.filter(u => {
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
  }, [todosUsuarios, historicoUsuarios, ultimasInteracoes, termoBusca, canalAtivo]);

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
  }, [canalAtivo, user, naoLidas]); 

  useEffect(() => { 
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [mensagens, iaDigitando]);

  // --- 6. AUTO-REPLY DO ROBÔ ---
  useEffect(() => {
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;

      const ultimaMsg = mensagens[mensagens.length - 1];
      if (ultimaMsg.uid !== user.uid) return; 

      const mapUsuarios = new Map();
      todosUsuarios.forEach(u => mapUsuarios.set(u.id, u));
      historicoUsuarios.forEach(u => {
          if (!mapUsuarios.has(u.id)) mapUsuarios.set(u.id, u);
      });
      const usuarioAtual = Array.from(mapUsuarios.values()).find(u => u.id === canalAtivo.id);
      
      if (usuarioAtual && usuarioAtual.isMock === true) {
          const mockId = usuarioAtual.id;

          if (mensagensProcessadasPelaIA.has(ultimaMsg.id)) return;
          mensagensProcessadasPelaIA.add(ultimaMsg.id);

          const mockNome = usuarioAtual.nome.replace('👤 ', '');
          const meuId = user.uid;
          
          // <-- NOVO: Usa o nome real carregado do banco
          const meuNome = userName || user.displayName || user.email.split('@')[0] || "RH";

          enfileirarIA(async () => {
              setIaDigitando(true);

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
O(a) profissional de RH, chamado(a) ${meuNome}, está falando com você no chat interno da empresa. O problema sinalizado com o seu ponto é: ${erroTipo}.
Seus horários registrados nesse dia foram: Entrada: ${pontosReais.e || '---'}, Ida Almoço: ${pontosReais.si || '---'}, Volta Almoço: ${pontosReais.vi || '---'}, Saída: ${pontosReais.s || '---'}.
Regras inquebráveis:
1. Seu nome é estritamente ${mockNome}. Você está conversando com ${meuNome}. Dirija-se a essa pessoa pelo nome correto sempre que for necessário.
2. Fale com naturalidade, use português do Brasil coloquial de escritório (ex: "putz", "foi mal", "beleza", "vou ajustar").
3. Tente dar uma desculpa realista, ou assumir o erro, dialogando com a mensagem do RH. Mantenha o contexto.
4. Nunca diga que é uma IA ou um modelo de linguagem. Você é um funcionário real.
5. IMPORTANTE: Conclua sempre os seus pensamentos e termine as frases. NUNCA deixe uma frase pela metade.`;

                  let textoFinal = "Opa, tive um imprevisto. Pode me ajudar a ajustar?"; 

                  try {
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
                          if (response.status === 429) {
                              textoFinal = "Putz, acho que o sistema de chat está muito lento agora (limite excedido). Pode tentar me chamar de novo daqui a um tempinho?";
                          } else {
                              textoFinal = "Vish, minha internet deu uma oscilada feia e não consegui receber tudo direito. (Erro de Servidor)";
                          }
                      } else if (data.candidates && data.candidates[0].content) {
                          textoFinal = data.candidates[0].content.parts[0].text;
                      }
                  } catch (erroApi) {
                      console.error("Erro ao chamar a nossa API:", erroApi);
                      textoFinal = "Acho que a minha net caiu aqui, a mensagem não carregou... pode repetir?";
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
                  setIaDigitando(false);
              }
          });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensagens, canalAtivo, user, todosUsuarios, historicoUsuarios, userName]);

  // 7. ENVIAR 
  const enviarMensagem = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!novaMensagem.trim() || !user || iaDigitando) return; 

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    
    await set(push(ref(db, path)), {
      usuario: userName || user.displayName || user.email.split('@')[0], // <-- Usa o nome real do banco
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
      setIaDigitando(false); 
  };

  const formatarHora = (t) => t ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';
  
  const formatarNome = (n) => {
    if (!n) return 'User';
    let nomeLimpo = n.replace('👤 ', '').trim();

    // <-- NOVO: Regra retroativa para disfarçar mensagens que já estão no banco como "yan.rodrigues"
    if (nomeLimpo.toLowerCase() === 'yan.rodrigues') {
        nomeLimpo = 'Yan Moisés Rodrigues';
    }

    const partes = nomeLimpo.split(' ');
    if (partes.length > 1) {
        // Retorna o Primeiro e o Último nome (Ex: Yan Rodrigues)
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
            {menuAberto && <span onClick={() => setMenuAberto(false)} style={{float:'right', cursor:'pointer'}}>✕</span>}
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
              placeholder={iaDigitando ? `${formatarNome(canalAtivo.nome)} está a digitar...` : `Mensagem para ${canalAtivo.nome}...`}
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