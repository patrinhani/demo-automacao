import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { ref, onValue, push, set, update } from "firebase/database"; 
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo'; 
import './ChatInterno.css';

// --- DIRETÓRIO CORPORATIVO OFICIAL (BASEADO NOS PDFS) ---
// Estes dados são carregados estaticamente para garantir consistência de cargos.
const TEAM_DIRECTORY = [
  // --- DIRETORIA ---
  { id: 'user_ceo', nome: "Guilherme Patrinhani Da Silva", cargo: "CEO", email: "guilherme.patrinhani@techcorp.com.br", avatar: 'G' },
  { id: 'user_cto', nome: "Gabriel Silva", cargo: "CTO", email: "gabriel.silva@techcorp.com.br", avatar: 'G' },
  { id: 'user_cfo', nome: "Joel Santos", cargo: "CFO", email: "joel.santos@techcorp.com.br", avatar: 'J' },

  // --- GESTÃO ---
  { id: 'user_agatha', nome: "Agatha Oliveira de Moraes", cargo: "Gerente de Pessoas e Cultura", email: "agatha.moraes@techcorp.com.br", avatar: 'A' },
  { id: 'user_carlos_augusto', nome: "Carlos Augusto Paladino do Amaral", cargo: "Controller", email: "carlos.amaral@techcorp.com.br", avatar: 'C' },
  { id: 'user_gabriel_gallo', nome: "Gabriel Aguera Bispo de Azevedo Gallo", cargo: "Business Partner (BP)", email: "gabriel.gallo@techcorp.com.br", avatar: 'G' },
  { id: 'user_karen', nome: "Karen Gentil Ferreira dos Santos", cargo: "Business Partner (BP)", email: "karen.santos@techcorp.com.br", avatar: 'K' },

  // --- RH ---
  { id: 'user_ana_beatriz', nome: "Ana Beatriz Alves Simá", cargo: "Analista de RH Pleno", email: "ana.sima@techcorp.com.br", avatar: 'A' },
  { id: 'user_ariane', nome: "Ariane dos Santos Souza", cargo: "Analista de RH Júnior", email: "ariane.souza@techcorp.com.br", avatar: 'A' },
  { id: 'user_auricia', nome: "Auricia Duarte de Araujo", cargo: "Analista de RH Pleno", email: "auricia.araujo@techcorp.com.br", avatar: 'A' },
  { id: 'user_erica', nome: "Erica Manoel Martinez", cargo: "Analista de RH Pleno", email: "erica.martinez@techcorp.com.br", avatar: 'E' },
  { id: 'user_indigo', nome: "Índigo Sote Ribeiro Rezende", cargo: "Assistente de RH", email: "indigo.rezende@techcorp.com.br", avatar: 'Í' },
  { id: 'user_jose_felipe', nome: "Jose Felipe Souza Santos", cargo: "Analista de RH Pleno", email: "jose.santos@techcorp.com.br", avatar: 'J' },
  { id: 'user_kaio', nome: "Kaio Cesar Melo Silva", cargo: "Analista de RH Pleno", email: "kaio.silva@techcorp.com.br", avatar: 'K' },
  { id: 'user_laryssa', nome: "Laryssa Roque da Silva", cargo: "Analista de RH Júnior", email: "laryssa.silva@techcorp.com.br", avatar: 'L' },
  { id: 'user_nicolly_paciencia', nome: "Nicolly da Cruz Paciência", cargo: "Assistente de RH", email: "nicolly.paciencia@techcorp.com.br", avatar: 'N' },
  { id: 'user_sabrina', nome: "Sabrina da Silva Monteiro Pedreira", cargo: "Analista de RH Júnior", email: "sabrina.pedreira@techcorp.com.br", avatar: 'S' },

  // --- FINANCEIRO ---
  { id: 'user_ana_caroline', nome: "Ana Caroline Mota Diniz", cargo: "Analista Financeiro Jr", email: "ana.diniz@techcorp.com.br", avatar: 'A' },
  { id: 'user_beatriz', nome: "Beatriz Yukari do Rosario", cargo: "Auxiliar Financeiro", email: "beatriz.rosario@techcorp.com.br", avatar: 'B' },
  { id: 'user_ellen', nome: "Ellen Cristina de Oliveira", cargo: "Analista Financeiro Sr", email: "ellen.oliveira@techcorp.com.br", avatar: 'E' },
  { id: 'user_guilherme_castro', nome: "Guilherme da Cruz Castro", cargo: "Analista Financeiro Jr", email: "guilherme.castro@techcorp.com.br", avatar: 'G' },
  { id: 'user_isabella', nome: "Isabella Bueno de Oliveira", cargo: "Analista Financeiro Jr", email: "isabella.oliveira@techcorp.com.br", avatar: 'I' },
  { id: 'user_julia', nome: "Julia Rodrigues do Nascimento", cargo: "Auxiliar Financeiro", email: "julia.nascimento@techcorp.com.br", avatar: 'J' },
  { id: 'user_kaique', nome: "Kaique Rodrigues dos Santos", cargo: "Auxiliar Financeiro", email: "kaique.santos@techcorp.com.br", avatar: 'K' },
  { id: 'user_livia', nome: "Livia Vitória Friederich Reis", cargo: "Analista Financeiro Jr", email: "livia.reis@techcorp.com.br", avatar: 'L' },
  { id: 'user_mariana_lopes', nome: "Mariana Fernandes Lopes", cargo: "Auxiliar Financeiro", email: "mariana.lopes@techcorp.com.br", avatar: 'M' },
  { id: 'user_nicolly_sa', nome: "Nicolly dos Santos Rufino de Sá", cargo: "Analista Financeiro Sr", email: "nicolly.sa@techcorp.com.br", avatar: 'N' },
  { id: 'user_vitoria', nome: "Vitoria Hially França Galvão", cargo: "Auxiliar Financeiro", email: "vitoria.galvao@techcorp.com.br", avatar: 'V' }
];

const RESPOSTAS_AUTOMATICAS = [
    "Oi! Tudo bem? Já verifico isso para você.",
    "Olá! Recebi sua mensagem, assim que possível te retorno.",
    "Opa, estou em reunião agora, mas já te chamo.",
    "Combinado! Fico no aguardo."
];

export default function ChatInterno() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  
  // Listas
  const [listaCompleta, setListaCompleta] = useState(TEAM_DIRECTORY);
  const [listaExibida, setListaExibida] = useState(TEAM_DIRECTORY);
  
  // Estado do Chat
  const [canalAtivo, setCanalAtivo] = useState({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' });
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState({});
  const [termoBusca, setTermoBusca] = useState('');

  const scrollRef = useRef(null);
  const timeoutsRef = useRef({});

  // 1. AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
          setUser(currentUser);
      } else {
          navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. GARANTIR QUE O USUÁRIO LOGADO ESTÁ NA LISTA
  useEffect(() => {
      if (!user) return;

      setListaCompleta(prevLista => {
          // Verifica se o usuário logado já está na lista oficial (pelo email)
          const euNaLista = prevLista.find(u => u.email === user.email);
          
          if (!euNaLista) {
              // Se não estiver (ex: Yan logou com Google), adiciona ele para não ficar de fora
              const meuPerfil = {
                  id: user.uid,
                  nome: user.displayName || "Eu",
                  cargo: "Colaborador",
                  email: user.email,
                  avatar: (user.displayName || "E")[0].toUpperCase()
              };
              // Adiciona no topo, mas não altera a constante original
              return [meuPerfil, ...prevLista];
          }
          return prevLista;
      });
  }, [user]);

  // 3. GERENCIAR "CHAMAR" (Deep Link da Folha de Ponto)
  useEffect(() => {
      const target = location.state?.chatTarget;
      
      if (target) {
          // Procura na lista completa
          const usuarioAlvo = listaCompleta.find(u => u.nome === target.nome || u.id === target.id);
          
          if (usuarioAlvo) {
              // Se achou na lista oficial, usa os dados oficiais
              setTimeout(() => {
                  setCanalAtivo({ id: usuarioAlvo.id, nome: `👤 ${usuarioAlvo.nome}`, desc: usuarioAlvo.cargo });
              }, 100);
          } else {
              // Se for alguém novo (ex: um mock gerado dinamicamente que não está na lista oficial), adiciona temporariamente
              const novoUsuario = {
                  id: target.id,
                  nome: target.nome,
                  cargo: target.cargo || 'Colaborador',
                  email: target.email || 'N/A',
                  avatar: target.nome[0].toUpperCase()
              };
              setListaCompleta(prev => [novoUsuario, ...prev]);
              setTimeout(() => {
                  setCanalAtivo({ id: target.id, nome: `👤 ${target.nome}`, desc: target.cargo });
              }, 100);
          }
      }
  }, [location.state, listaCompleta]); // Dependência ajustada para reagir a mudanças

  // 4. SISTEMA DE BUSCA (Filtro Local)
  useEffect(() => {
      if (termoBusca.trim() === '') {
          // Ordena alfabeticamente quando não há busca
          const ordenada = [...listaCompleta].sort((a, b) => a.nome.localeCompare(b.nome));
          setListaExibida(ordenada);
      } else {
          const termo = termoBusca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          const filtrados = listaCompleta.filter(u => {
              const nome = u.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const cargo = u.cargo.toLowerCase();
              return nome.includes(termo) || cargo.includes(termo);
          });
          setListaExibida(filtrados);
      }
  }, [termoBusca, listaCompleta]);

  // 5. CARREGAR MENSAGENS
  useEffect(() => {
    if (!user) return;
    
    // Marca como lida ao abrir
    if (naoLidas[canalAtivo.id]) {
      setNaoLidas(prev => { const n = {...prev}; delete n[canalAtivo.id]; return n; });
    }

    let path = canalAtivo.id === 'geral' 
        ? 'chats/geral' 
        : `chats/direto/${[user.uid, canalAtivo.id].sort().join('_')}`;

    const unsubscribe = onValue(ref(db, path), (snapshot) => {
      const data = snapshot.val();
      const msgsCarregadas = data ? Object.entries(data).map(([k, v]) => ({ id: k, ...v })) : [];
      setMensagens(msgsCarregadas);
    });
    return () => unsubscribe();
  }, [canalAtivo, user]); 

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [mensagens]);

  // 6. ENVIAR MENSAGEM
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

  // 7. ROBÔ AUTO-REPLY
  useEffect(() => {
      if (!user || canalAtivo.id === 'geral' || mensagens.length === 0) return;
      const lastMsg = mensagens[mensagens.length - 1];
      
      // Se eu mandei a mensagem para alguém da lista
      if (lastMsg.uid === user.uid) {
          const isUserFromList = listaCompleta.some(u => u.id === canalAtivo.id);
          
          if(isUserFromList) {
              const targetId = canalAtivo.id;
              const targetName = canalAtivo.nome.replace('👤 ', '');
              
              if(timeoutsRef.current[targetId]) clearTimeout(timeoutsRef.current[targetId]);

              // Responde aleatoriamente entre 3 e 8 segundos
              const time = Math.random() * 5000 + 3000; 
              
              timeoutsRef.current[targetId] = setTimeout(async () => {
                  const reply = RESPOSTAS_AUTOMATICAS[Math.floor(Math.random() * RESPOSTAS_AUTOMATICAS.length)];
                  const ids = [user.uid, targetId].sort();
                  
                  await set(push(ref(db, `chats/direto/${ids[0]}_${ids[1]}`)), {
                      usuario: targetName,
                      uid: targetId,
                      texto: reply,
                      timestamp: Date.now(),
                      avatar: '👤'
                  });
              }, time);
          }
      }
  }, [mensagens, listaCompleta]);

  const formatarHora = (t) => t ? new Date(t).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '';
  const formatarNome = (nome) => {
      if(!nome) return 'User';
      const parts = nome.split(' ');
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length-1]}` : parts[0];
  };

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
            Diretório ({listaExibida.length})
            {menuAberto && <span onClick={() => setMenuAberto(false)} style={{float:'right'}}>✕</span>}
          </div>

          <div className="chat-search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                  type="text" 
                  className="chat-search-input" 
                  placeholder="Pesquisar colega..." 
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
              />
          </div>

          <div className="channels-list custom-scroll">
            <button className={`channel-btn ${canalAtivo.id === 'geral' ? 'active' : ''}`} onClick={() => setCanalAtivo({ id: 'geral', nome: '📢 Geral', desc: 'Mural Corporativo' })}>
              <span className="channel-name">📢 Geral</span><span className="channel-desc">Para todos</span>
            </button>
            
            <div style={{margin: '15px 10px 5px', fontSize: '0.7rem', color: '#94a3b8', textTransform:'uppercase', borderTop: '1px solid #ffffff1a', paddingTop: '10px'}}>
                Colaboradores
            </div>
            
            {listaExibida.map((u) => (
                <button 
                    key={u.id} 
                    className={`channel-btn ${canalAtivo.id === u.id ? 'active' : ''}`} 
                    onClick={() => setCanalAtivo({ id: u.id, nome: `👤 ${u.nome}`, desc: u.cargo })}
                >
                  <div style={{display:'flex', alignItems:'center', width:'100%'}}>
                    <div className="contact-avatar-small" style={{
                        marginRight:'10px', 
                        background: '#3b82f6', 
                        width:'32px', 
                        height:'32px', 
                        borderRadius:'50%', 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center', 
                        fontSize:'0.9rem', 
                        fontWeight:'bold',
                        color: 'white'
                    }}>
                        {u.avatar || u.nome[0]}
                    </div>
                    <div style={{flex:1, overflow:'hidden', textAlign:'left'}}>
                        <span className="channel-name" style={{display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                            {formatarNome(u.nome)}
                        </span>
                        <span className="channel-desc" style={{display:'block', fontSize:'0.7rem', color:'#9ca3af', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                            {u.cargo}
                        </span>
                    </div>
                    {naoLidas[u.id] > 0 && <div className="badge-notificacao">{naoLidas[u.id]}</div>}
                  </div>
                </button>
            ))}
            
            {listaExibida.length === 0 && <div style={{padding:'20px', textAlign:'center', color:'#666', fontSize:'0.8rem'}}>Ninguém encontrado.</div>}
          </div>
        </aside>

        {menuAberto && <div className="overlay-menu" onClick={() => setMenuAberto(false)}></div>}

        <main className="chat-area">
          <div className="chat-header"><h3>{canalAtivo.nome}</h3><span>{mensagens.length} msg</span></div>
          <div className="messages-scroll" ref={scrollRef}>
            {mensagens.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.uid === user?.uid ? 'mine' : 'other'}`}>
                <div className="msg-content">
                  <div className="msg-top"><span className="msg-user">{formatarNome(msg.usuario)}</span><span className="msg-time">{formatarHora(msg.timestamp)}</span></div>
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