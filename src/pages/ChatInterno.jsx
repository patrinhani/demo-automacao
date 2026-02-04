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

const RESPOSTAS_PRONTAS = {
  ponto: [
    { titulo: "🕒 Marcação Ímpar", texto: "Olá,\nIdentificamos uma marcação ímpar no seu espelho de ponto referente ao dia XX/XX. Por favor, verifique se houve esquecimento de batida e realize o ajuste ou justificativa no sistema para evitar descontos.\n\nAtenciosamente,\nRH." },
    { titulo: "🕒 Falta Injustificada", texto: "Olá,\nNão identificamos registros de ponto no dia XX/XX. Caso tenha sido uma falta justificada ou trabalho externo, por favor anexe o comprovante ou realize o ajuste manual no sistema.\n\nAtenciosamente,\nRH." },
    { titulo: "🕒 Atraso Excessivo", texto: "Olá,\nIdentificamos um atraso superior à tolerância no dia XX/XX. Por favor, lembre-se de justificar no sistema caso tenha ocorrido algum imprevisto.\n\nObrigado,\nRH." },
    { titulo: "🕒 Batida Duplicada", texto: "Olá,\nConstam batidas duplicadas no seu ponto. Favor solicitar a desconsideração do registro incorreto via sistema.\n\nAtt,\nRH." }
  ],
  atestado: [
    { titulo: "✅ Atestado Aprovado", texto: "Gestor,\nInformamos que o(a) colaborador(a) apresentou atestado médico referente ao período informado. O registro já foi cadastrado no sistema.\n\nObrigada,\nGestão de Atestados." },
    { titulo: "❌ Reprovado: Ilegível", texto: "Olá,\nO documento não será aceito pois está ilegível. Caso possua o documento correto, peça ao seu gestor que abra um chamado de retificação.\n\nObrigado,\nGestão de Atestados." }
  ]
};

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [isRH, setIsRH] = useState(false);
  const [modalModelosAberto, setModalModelosAberto] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState({});
  const scrollRef = useRef(null);

  // 1. AUTH & PERMISSÃO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
          setUser(currentUser);
          const userRef = ref(db, `users/${currentUser.uid}`);
          get(userRef).then((snap) => {
              const dados = snap.val();
              if (dados) {
                  const setor = (dados.setor || '').toLowerCase();
                  const cargo = (dados.cargo || '').toLowerCase();
                  if (setor.includes('rh') || setor.includes('recursos') || cargo.includes('c.e.o')) {
                      setIsRH(true);
                  }
              }
          });
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

        // Deduplicação por NOME
        const mapaPorNome = new Map();
        todosCandidatos.forEach(u => {
            if (u && u.nome) mapaPorNome.set(u.nome.trim(), u);
        });

        // Auto-seleção do chat
        if (target) {
            if (canalAtivo.id !== target.id && canalAtivo.id === 'geral') {
                setCanalAtivo({ id: target.id, nome: `👤 ${target.nome}`, desc: target.cargo });
            }
        }
        setUsuarios(Array.from(mapaPorNome.values()));
      }
    });
  }, [user, location.state]); 

  // --- ROBÔ AUTO-REPLY (LÓGICA BLINDADA) ---
  useEffect(() => {
      // Condições iniciais
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;

      const ultimaMsg = mensagens[mensagens.length - 1];

      // Verifica se é Mock do RH
      const mocksAtivos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
      const isMock = mocksAtivos.find(m => m.id === canalAtivo.id);

      // Se a última mensagem foi MINHA (RH) e para um MOCK
      if (ultimaMsg.uid === user.uid && isMock) {
          
          // Captura os dados no momento exato (snapshot do estado)
          const mockId = canalAtivo.id; 
          const mockNome = canalAtivo.nome;
          const meuId = user.uid;

          // Validação crítica
          if (!mockId || mockId === 'undefined') {
              console.error("ERRO: ID inválido para resposta automática.");
              return;
          }

          // Tempo de resposta (3 a 8 segundos para ser rápido no teste)
          const tempoEspera = Math.floor(Math.random() * (8000 - 3000 + 1) + 3000);
          console.log(`🤖 Resposta agendada para ${mockNome} (${mockId}) em ${tempoEspera/1000}s`);

          const timerId = setTimeout(async () => {
              // 1. Enviar mensagem no chat
              const msgTexto = RESPOSTAS_AJUSTE[Math.floor(Math.random() * RESPOSTAS_AJUSTE.length)];
              const ids = [meuId, mockId].sort();
              const pathChat = `chats/direto/${ids[0]}_${ids[1]}`;
              
              try {
                  await set(push(ref(db, pathChat)), {
                      usuario: mockNome.replace('👤 ', ''),
                      uid: mockId, // Garante que usa o ID capturado
                      texto: msgTexto,
                      timestamp: Date.now(),
                      avatar: '👤'
                  });

                  // 2. Atualizar status na folha de ponto
                  const mockRef = ref(db, `rh/erros_ponto/${mockId}`);
                  const snap = await get(mockRef);
                  if (snap.exists()) {
                      await update(mockRef, { 
                          status: 'Respondido', 
                          hiddenUntil: null // Garante visibilidade
                      });
                      console.log(`✅ Status de ${mockNome} atualizado para 'Respondido'.`);
                  }
              } catch (err) {
                  console.error("Erro no Auto-Reply:", err);
              }

          }, tempoEspera);

          return () => clearTimeout(timerId);
      }
  }, [mensagens]); // Removi 'canalAtivo' e 'user' das dependências para evitar re-execução em loop se o componente renderizar

  // 3. MONITORAMENTO DE MENSAGENS
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
          if (ultimaMsg.uid !== user.uid && canalAtivo.id !== outroId) {
             if (!novasNaoLidas[outroId]) novasNaoLidas[outroId] = 1;
          }
        }
      });
      setNaoLidas(novasNaoLidas);
    });
    return () => unsubscribe();
  }, [user, canalAtivo.id]); 

  // 4. CARREGAR MSG DO CANAL
  useEffect(() => {
    if (!user) return;
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

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;
    let path = canalAtivo.id === 'geral' ? 'chats/geral' : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;
    await set(push(ref(db, path)), {
      usuario: user.displayName || user.email.split('@')[0],
      uid: user.uid,
      texto: novaMensagem,
      timestamp: Date.now(),
      avatar: '👤'
    });
    setNovaMensagem('');
  };

  const usarModelo = (texto) => {
      setNovaMensagem(texto); 
      setModalModelosAberto(false);
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
            {usuarios.map(u => (
              <button key={u.id} className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`} onClick={() => setCanalAtivo({ id: u.id, nome: u.nome || formatarNomeLista(u.email.split('@')[0]), desc: u.cargo })}>
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
            {isRH && <button type="button" className="btn-modelos" onClick={() => setModalModelosAberto(true)} title="Modelos">📋</button>}
            <input value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} className="chat-input" placeholder="Mensagem..." />
            <button type="submit">➤</button>
          </form>
        </main>
      </div>

      {modalModelosAberto && (
          <div className="modal-overlay" onClick={() => setModalModelosAberto(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>Modelos</h3>
                  <div className="modelos-list">
                      {Object.values(RESPOSTAS_PRONTAS).flat().map((modelo, i) => (
                          <div key={i} className="modelo-item" onClick={() => usarModelo(modelo.texto)}>
                              <strong>{modelo.titulo}</strong>
                          </div>
                      ))}
                  </div>
                  <button className="close-modal" onClick={() => setModalModelosAberto(false)}>Fechar</button>
              </div>
          </div>
      )}
    </div>
  );
}