import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set, get, update } from "firebase/database"; 
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

// --- LISTA FIXA (BACKUP/DEMO) ---
const TEAM_FIXO = [
  { id: "user_teste_demo", nome: "Cadastro Teste", cargo: "Usuário de Testes", email: "teste@techcorp.com.br" },
  { id: "user_patrinhani", nome: "Guilherme Patrinhani", cargo: "CEO", email: "guilherme@tech.com" },
];

// --- 🧠 INTELIGÊNCIA DO ROBÔ: RESPOSTAS POR CONTEXTO ---
const RESPOSTAS_CONTEXTUAIS = {

    // 1. FALTAS (O cara nem apareceu)

    "Falta Injustificada": [

        "Oi! Mil desculpas, eu passei muito mal ontem e acabei não conseguindo avisar. Tenho atestado.",
        "Bom dia! Tive um problema urgente com meu filho na escola e precisei sair correndo. Vou enviar o comprovante no ponto.",
        "Olá, tive um imprevisto pessoal grave ontem. Vou ver com minha gestora para abonar...",
        "Oi RH, meu carro quebrou no meio da estrada e fiquei sem sinal. Desculpa o sumiço!"

    ],

    // 2. MARCAÇÃO ÍMPAR - ESPECÍFICAS (O código vai escolher qual usar)

    "MI_Saida": [ // Falta só a saída (S)

        "Opa! Esqueci de bater a saída ontem, sai na correria para pegar o ônibus.",
        "Oi! Bati o ponto, mas acho que a digital não leu direito na saída. Saí às 18:00.",
        "Desculpa, esqueci totalmente de registrar a saída. Fiquei focado no deploy e passou.",
        "Vixi, fui embora e esqueci de bater o ponto na saída. Pode ajustar pra 17:30 por favor."

    ],

    "MI_Almoco": [ // Falta almoço (SI ou VI)

        "Bom dia! Esqueci de bater o ponto na hora do almoço. Fui e voltei no horário normal.",
        "Oi, acabei esquecendo de registrar a ida para o almoço. Pode corrigir por favor.",
        "Olá! O sistema não pegou minha batida de volta do almoço, mas eu voltei às 13:00.",
        "Putz, passei direto na catraca do almoço e esqueci de registrar. Foi mal!"

    ],

    "MI_Geral": [ // Só tem entrada e mais nada

        "Oi! Tive uma emergência e precisei sair logo depois de chegar. Esqueci de bater.",
        "Bom dia. O sistema travou depois da minha entrada e não consegui marcar mais nada.",
        "Oi, marquei a entrada, mas precisei ir ao médico de urgência e não bati a saída."

    ],

    // 3. OUTROS CASOS

    "Atraso Excessivo": [

        "Oi! O trânsito estava caótico hoje por causa da chuva. Desculpa o atraso.",
        "Bom dia! Tive um problema no metrô e demorou muito pra chegar.",
        "Olá, acabei dormindo demais porque o despertador não tocou. Vou compensar hoje!",
        "Tive que passar na farmácia antes de vir e acabei atrasando. Foi mal!"

    ],

    "Batida Duplicada": [

        "Oi! Acho que bati o dedo duas vezes sem querer na entrada. Pode desconsiderar uma por favor.",
        "O sistema travou e acho que registrou duplicado. Fui olhar agora e vi dois registros.",
        "Bom dia, apareceu duplicado pra mim. Foi erro meu na hora de passar o crachá."

    ],

    "Ponto Britânico": [

        "Oi! Eu tenho o costume de bater certinho no horário, mas vou variar os minutos como pediram.",
        "Não sabia que não podia bater exatamente no mesmo horário todo dia. Vou me atentar!",
        "É mania minha de esperar dar 17:00:00 pra bater. Vou mudar isso."

    ],

    "Hora Extra N/A": [

        "Oi! Tive que ficar até mais tarde ontem pra fechar aquele relatório urgente.",
        "O gestor pediu pra eu ficar um pouco mais pra ajudar no suporte. Esqueci de avisar.",
        "Fiquei finalizando a task do projeto novo. Não vai se repetir sem autorização."

    ],

    "default": [ 

        "Oi! Pode verificar meu ponto? Acho que tem algo errado.",
        "Olá, pode me ajudar com essa pendência no meu espelho de ponto? Obrigado.",
        "Opa, preciso justificar esse dia. Obrigado por avisar.",
        "Oi RH, desculpa a falha. Pode ajustar pra mim? por favor."

    ]

};

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [user, setUser] = useState(null);
  
  // Lista unificada
  const [todosUsuarios, setTodosUsuarios] = useState([]);
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

  // 2. CARREGAR LISTA DE USUÁRIOS (AGORA BUSCANDO MOCKS DO BANCO)
  useEffect(() => {
    if (!user) return;

    // A. Busca Usuários REAIS
    const usersRef = ref(db, 'users');
    
    // B. Busca Mocks do RH (Direto do banco, não do LocalStorage)
    // Assim, mesmo se o status for "Concluido", ele existe e aparece no histórico
    const mocksRef = ref(db, 'rh/erros_ponto');

    const unsubscribe = onValue(ref(db), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const dbUsers = data.users || {};
        const dbMocks = data.rh?.erros_ponto || {}; // Pega todos os casos RH

        // 1. Processa Reais
        let listaReais = Object.entries(dbUsers).map(([uid, u]) => ({
            id: uid,
            nome: u.nome || u.email, 
            email: u.email,
            cargo: u.cargo || 'Colaborador',
            setor: u.setor || 'Geral',
            isMock: false
        }));

        // 2. Processa Mocks (Transforma os casos do RH em "Usuários de Chat")
        let listaMocks = Object.entries(dbMocks).map(([id, m]) => ({
            id: id,
            nome: m.nome,
            cargo: m.cargo || 'Colaborador (RH)',
            email: 'mock@interno.com',
            isMock: true
        }));

        // 3. Combina Tudo
        let combinados = [...listaReais, ...TEAM_FIXO, ...listaMocks];

        // 4. Verifica se veio alguém pelo botão "Chamar" (Garante entrada imediata)
        const target = location.state?.chatTarget;
        if (target) {
            if (!combinados.find(u => u.id === target.id)) {
                combinados.push({ ...target, isMock: true });
            }
            // Abre o chat se estiver no 'Geral'
            if (canalAtivo.id === 'geral') {
                setCanalAtivo({ id: target.id, nome: `👤 ${target.nome}`, desc: target.cargo, isMock: true });
            }
        }

        // 5. Remove duplicatas e o próprio usuário
        const unicos = Array.from(new Map(combinados.map(item => [item.id, item])).values())
                            .filter(u => u.email !== user.email && u.id !== user.uid);

        setTodosUsuarios(unicos);
    });

    return () => unsubscribe();
  }, [user, location.state]); 

  // 3. MONITORAR MENSAGENS
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
              if (msgs.length > 0) { // Garante que tem mensagem
                  const ultimaMsg = msgs[msgs.length - 1];
                  const outroId = chatId.replace(user.uid, '').replace('_', '');

                  novasInteracoes[outroId] = ultimaMsg.timestamp;

                  if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
                    const lastRead = Number(localStorage.getItem(`last_read_${outroId}`) || 0);
                    if (ultimaMsg.timestamp > lastRead) {
                        novasNaoLidas[outroId] = (novasNaoLidas[outroId] || 0) + 1; 
                    }
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
          // Se tiver interação (histórico), ele aparece, INDEPENDENTE do status no RH
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
      setNaoLidas(prev => { const n = {...prev}; delete n[canalAtivo.id]; return n; });
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

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

  // --- 6. AUTO-REPLY DO ROBÔ (COM INTELIGÊNCIA DE PONTO) ---
  useEffect(() => {
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;

      const ultimaMsg = mensagens[mensagens.length - 1];
      if (ultimaMsg.uid !== user.uid) return; 

      const usuarioAtual = todosUsuarios.find(u => u.id === canalAtivo.id);
      
      if (usuarioAtual && usuarioAtual.isMock) {
          const mockId = usuarioAtual.id;
          
          const jaRespondeu = mensagens.some(msg => msg.uid === mockId);
          if (jaRespondeu) return; 

          const mockNome = usuarioAtual.nome.replace('👤 ', '');
          const meuId = user.uid;
          
          const tempoEspera = Math.floor(Math.random() * (7000 - 3000 + 1) + 3000);
          console.log(`🤖 Robô ${mockNome} vai responder em ${tempoEspera}ms`);

          const timer = setTimeout(async () => {
              // 1. BUSCA O ERRO E OS PONTOS PRA SABER O QUE RESPONDER
              let listaRespostas = RESPOSTAS_CONTEXTUAIS['default'];
              
              try {
                  const snapshot = await get(ref(db, `rh/erros_ponto/${mockId}`));
                  if (snapshot.exists()) {
                      const dadosMock = snapshot.val();
                      const erroTipo = dadosMock.erro; 
                      const p = dadosMock.pontos || {}; 
                      
                      if (erroTipo) {
                          if (erroTipo === 'Marcação Ímpar') {
                              // --- LÓGICA DE DETETIVE DE PONTO ---
                              const faltaEntrada = !p.e || p.e === '---';
                              const faltaSaida = !p.s || p.s === '---';
                              const faltaAlmoco = (!p.si || p.si === '---') || (!p.vi || p.vi === '---');

                              if (faltaAlmoco && !faltaSaida) {
                                  listaRespostas = RESPOSTAS_CONTEXTUAIS['MI_Almoco'];
                              } else if (faltaSaida) {
                                  listaRespostas = RESPOSTAS_CONTEXTUAIS['MI_Saida'];
                              } else if (faltaEntrada) {
                                  listaRespostas = RESPOSTAS_CONTEXTUAIS['default'];
                              } else {
                                  listaRespostas = RESPOSTAS_CONTEXTUAIS['MI_Geral'];
                              }
                          } 
                          else if (RESPOSTAS_CONTEXTUAIS[erroTipo]) {
                              listaRespostas = RESPOSTAS_CONTEXTUAIS[erroTipo];
                          }
                      }
                      
                      // Já marca como respondido
                      await update(ref(db, `rh/erros_ponto/${mockId}`), { status: 'Respondido' });
                  }
              } catch(e) { console.error("Erro ao buscar contexto:", e); }

              // 2. ESCOLHE RESPOSTA
              const resposta = listaRespostas[Math.floor(Math.random() * listaRespostas.length)];
              const path = `chats/direto/${[meuId, mockId].sort().join('_')}`;

              try {
                  await set(push(ref(db, path)), {
                      usuario: mockNome,
                      uid: mockId,
                      texto: resposta,
                      timestamp: Date.now(),
                      avatar: mockNome[0]
                  });
              } catch (e) { console.error("Erro envio Robô:", e); }

          }, tempoEspera);

          return () => clearTimeout(timer);
      }
  }, [mensagens, canalAtivo, user, todosUsuarios]);


  // 7. ENVIAR
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
                        background: u.isMock ? '#10b981' : '#3b82f6', 
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