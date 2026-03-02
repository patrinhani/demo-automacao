import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get, push } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo';
import { useAlert } from '../contexts/AlertContext'; // <-- IMPORTAÇÃO DO NOSSO CONTEXTO DE ALERTA
import './FolhaPonto.css';

export default function FolhaPonto() {
  const navigate = useNavigate();
  
  // <-- INICIALIZAÇÃO DOS ALERTAS CUSTOMIZADOS
  const { showAlert, showConfirm, showToast } = useAlert(); 

  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [registros, setRegistros] = useState({}); 
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataHoje, setDataHoje] = useState(new Date());
  
  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState('meu_ponto'); // 'meu_ponto', 'ajustes', 'gestao_rh'
  const [subAbaGestao, setSubAbaGestao] = useState('auditoria'); // 'auditoria', 'aprovacoes'
  
  const [isRH, setIsRH] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [listaPendencias, setListaPendencias] = useState([]);
  
  // Estado para o Modo Apresentação do Robô
  const [modoApresentacaoAtivo, setModoApresentacaoAtivo] = useState(false);

  // Estados do Formulário de Ajuste
  const [dataAjuste, setDataAjuste] = useState('');
  const [tipoMarcacao, setTipoMarcacao] = useState('entrada');
  const [horarioCorreto, setHorarioCorreto] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState([]);
  const [pendenciasAjuste, setPendenciasAjuste] = useState([]);

  const getDataKey = (date) => date.toISOString().split('T')[0];

  const gerarDataInconsistencia = (item) => {
      if (item._visualDate) return item._visualDate;
      const isCurrentUser = user && item.id === user.uid;
      const isYan = item.nome && item.nome.toLowerCase().includes('yan');

      if (isCurrentUser || isYan) {
          return new Date().toLocaleDateString('pt-BR');
      }
      
      const hoje = new Date();
      const diasAtras = Math.floor(Math.random() * 15) + 1; 
      const dataAleatoria = new Date(hoje.setDate(hoje.getDate() - diasAtras));
      return dataAleatoria.toLocaleDateString('pt-BR');
  };

  // Listener para Flag Global de Apresentação
  useEffect(() => {
    const demoRef = ref(db, 'configuracoes_globais/modo_apresentacao');
    const unsubscribeDemo = onValue(demoRef, (snapshot) => {
      setModoApresentacaoAtivo(!!snapshot.val());
    });
    return () => unsubscribeDemo();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return navigate('/');
      setUser(currentUser);

      const userRef = ref(db, `users/${currentUser.uid}`);
      get(userRef).then((snapshot) => {
          const userData = snapshot.val();
          if(userData) {
              setUserName(userData.nome || currentUser.email);
              const setor = (userData.setor || '').toLowerCase();
              const cargo = (userData.cargo || '').toLowerCase();
              const role = userData.role || '';
              
              if(setor.includes('recursos humanos') || setor.includes('rh') || cargo.includes('c.e.o') || cargo.includes('ceo') || role === 'admin') {
                  setIsRH(true);
              }

              if (cargo.includes('c.e.o') || cargo.includes('ceo') || cargo.includes('diretoria') || role === 'admin') {
                  setIsCEO(true);
              }
          }
      });

      // Listener do Ponto do Dia
      const dateKey = getDataKey(new Date());
      const pontoRef = ref(db, `ponto/${currentUser.uid}/${dateKey}`);
      onValue(pontoRef, (snapshot) => {
        const data = snapshot.val();
        setRegistros(data ? {
            entrada: data.entrada || null,
            almoco_ida: data.almoco_ida || null,
            almoco_volta: data.almoco_volta || null,
            saida: data.saida || null
        } : {});
      });

      // Listener dos Ajustes de Ponto
      const ajustesRef = ref(db, 'ajustes_ponto');
      onValue(ajustesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const listaFormatada = Object.entries(data).map(([key, val]) => ({
            id: key, ...val
          })).sort((a, b) => b.timestamp - a.timestamp);

          setMinhasSolicitacoes(listaFormatada.filter(item => item.userId === currentUser.uid));
          setPendenciasAjuste(listaFormatada.filter(item => item.status === 'Pendente'));
        } else {
          setMinhasSolicitacoes([]);
          setPendenciasAjuste([]);
        }
      });

    });
    return () => { clearInterval(timer); unsubscribeAuth(); };
  }, [navigate]);

  // Listener Auditoria RH
  useEffect(() => {
      if (!isRH) return;
      const rhRef = ref(db, 'rh/erros_ponto');
      const unsubscribe = onValue(rhRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const lista = Object.entries(data).map(([key, val]) => ({
                  id: key, ...val
              })).filter(item => {
                  if (item.status === 'Concluido') return false;
                  if (item.hiddenUntil && item.hiddenUntil > Date.now()) return false;
                  return true;
              });
              setListaPendencias(lista);
          } else {
              setListaPendencias([]);
          }
      });
      return () => unsubscribe();
  }, [isRH]);

  // Função para Disparar Automação RPA (RH)
  const executarAutomacaoRH = async () => {
    if (!user) return;
    const pendentes = listaPendencias.filter(p => p.status !== 'Respondido');
    
    try {
        await update(ref(db, `fila_automacao_rh/${user.uid}`), { 
            nome: userName || "Operador RH",
            timestamp: Date.now(),
            acao: "ANALISAR_INCONSISTENCIAS_PONTO",
            qtd_pendencias: pendentes.length 
        });
        
        if (pendentes.length === 0) {
            showAlert("Aviso", "Nenhuma pendência encontrada, mas o sinal de teste foi enviado ao Robô.");
        } else {
            showToast("Robô Acionado", `🤖 Processando ${pendentes.length} pendências...`);
        }
    } catch (error) {
        showAlert("Erro de Conexão", "Não foi possível enviar o comando ao Robô.");
    }
  };

  // Funções Ponto Normal
  const registrarPonto = async (tipo) => {
    if (!user) return;
    
    // Substituídos os alerts bloqueantes
    if (tipo === 'almoco_ida' && !registros.entrada) { showAlert("Ação Negada", "Você precisa registrar a ENTRADA antes de sair para o almoço."); return; }
    if (tipo === 'almoco_volta' && !registros.almoco_ida) { showAlert("Ação Negada", "Você não registrou a SAÍDA para o almoço."); return; }
    if (tipo === 'saida' && !registros.almoco_volta) { showAlert("Ação Negada", "Você precisa registrar o RETORNO do almoço antes da saída final."); return; }

    const horarioFormatado = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateKey = getDataKey(new Date());
    
    try {
      const updates = { [tipo]: horarioFormatado, userId: user.uid, data: dateKey, timestamp: Date.now() };
      await update(ref(db, `ponto/${user.uid}/${dateKey}`), updates);
      
      const casoRhRef = ref(db, `rh/erros_ponto/${user.uid}`);
      const casoSnap = await get(casoRhRef);
      if (casoSnap.exists()) {
          const casoData = casoSnap.val();
          if (casoData.status !== 'Concluido') {
             const novosPontos = { ...casoData.pontos, [tipo === 'entrada' ? 'e' : tipo === 'almoco_ida' ? 'si' : tipo === 'almoco_volta' ? 'vi' : 's']: horarioFormatado };
             await update(casoRhRef, { pontos: novosPontos, status: 'Respondido' });
          }
      }
      
      showToast("Ponto Registrado", `✅ Ponto registrado às ${horarioFormatado}`);
      
    } catch (error) { 
        showAlert("Erro", "Falha ao registrar ponto. Tente novamente."); 
    }
  };

  // Funções Ajuste de Ponto (Usuários Reais)
  const handleSubmitAjuste = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const novoAjuste = {
        userId: user.uid, userName, dataAjuste, tipoMarcacao, horarioCorreto, justificativa, status: 'Pendente', timestamp: Date.now()
      };
      await push(ref(db, 'ajustes_ponto'), novoAjuste);
      
      showToast("Enviado", "✅ Solicitação enviada para o Gestor!");
      
      setDataAjuste(''); setHorarioCorreto(''); setJustificativa('');
    } catch (error) { 
        showAlert("Erro", "Falha ao enviar a solicitação."); 
    }
  };

  // Aprovar ajuste de usuário REAL
  const aprovarAjuste = async (ajuste) => {
    // Adicionado Confirmação antes de executar
    const confirmou = await showConfirm("Aprovar Ajuste", `Confirma a alteração do horário de ${ajuste.userName} para as ${ajuste.horarioCorreto}?`);
    if (!confirmou) return;

    try {
      await update(ref(db, `ponto/${ajuste.userId}/${ajuste.dataAjuste}`), { [ajuste.tipoMarcacao]: ajuste.horarioCorreto });
      await update(ref(db, `ajustes_ponto/${ajuste.id}`), { status: 'Aprovado' });
      
      const erroRef = ref(db, `rh/erros_ponto/${ajuste.userId}`);
      const snap = await get(erroRef);
      if (snap.exists()) {
          await update(erroRef, { status: 'Concluido' });
      }

      showToast('Aprovado', '✅ Banco de horas corrigido automaticamente!');
    } catch (error) { 
        showAlert('Erro', 'Ocorreu um problema ao aprovar.'); 
    }
  };

  const reprovarAjuste = async (ajuste) => {
    const confirmou = await showConfirm("Reprovar Ajuste", `Tem certeza que deseja reprovar o pedido de ${ajuste.userName}?`);
    if (!confirmou) return;

    // Mantemos o prompt nativo aqui pois precisamos que o usuário digite o texto
    const motivo = prompt('Por favor, digite o motivo da reprovação:');
    
    if (motivo && motivo.trim() !== '') {
      try {
        await update(ref(db, `ajustes_ponto/${ajuste.id}`), { 
            status: 'Reprovado', 
            motivoReprovacao: motivo 
        });
        showToast('Reprovado', '❌ Ajuste rejeitado e colaborador notificado.');
      } catch (error) {
        showAlert('Erro', 'Não foi possível reprovar o ajuste.');
      }
    }
  };

  // Aprovar ponto de MOCK (Auditoria Robô)
  const aprovarPontoMock = async (item, pontosPropostos) => {
      const confirmou = await showConfirm("Concluir Auditoria", `Validar e registrar este espelho de ponto para ${item.nome}?`);
      if (!confirmou) return;

      try {
          await update(ref(db, `rh/erros_ponto/${item.id}`), { 
              pontos: pontosPropostos, 
              status: 'Concluido' 
          });
          showToast('Concluído', '✅ Espelho de ponto regularizado!');
      } catch (error) {
          showAlert('Erro', 'Falha ao regularizar o ponto do colaborador.');
      }
  };

  // Funções Auxiliares UI
  const formatarDataExtenso = (date) => date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const formatarNomeErro = (erro) => ({ 'Esquecimento Real': 'Ausência de Registro', 'Atraso Excessivo': 'Atraso Crítico', 'Falta Injustificada': 'Falta Não Justificada' }[erro] || erro);
  const formatarTipoAjuste = (tipo) => ({ 'entrada': 'Entrada', 'almoco_ida': 'Saída Almoço', 'almoco_volta': 'Retorno Almoço', 'saida': 'Saída' }[tipo] || tipo);

  const irParaChatComUsuario = (usuario) => {
      const mocksAtivos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
      if (!mocksAtivos.find(u => u.id === usuario.id)) {
          mocksAtivos.push({ id: usuario.id, nome: usuario.nome, cargo: usuario.cargo, email: usuario.nome ? `${usuario.nome.split(' ')[0].toLowerCase()}@techcorp.com` : 'user@tech.com' });
          localStorage.setItem('mocksAtivos', JSON.stringify(mocksAtivos));
      }
      
      update(ref(db, `rh/erros_ponto/${usuario.id}`), { status: 'Notificado' });
      
      navigate('/chat', { state: { chatTarget: { id: usuario.id, nome: usuario.nome, cargo: usuario.cargo } } });
  };

  // RENDERIZAÇÃO DA AÇÃO DA AUDITORIA
  const renderAcao = (item, pontosPropostos) => {
      if (item.id === user?.uid) return <span className="badge-bloqueado">🚫 Auto-gestão Bloqueada</span>;
      
      if (item.status === 'Respondido') return (
          <div style={{display:'flex', flexDirection:'column', gap:'5px', alignItems:'center'}}>
              <span style={{color: '#facc15', fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase'}}>⏳ Avaliar Correção</span>
              <button className="btn-approve" style={{padding: '6px 12px', fontSize: '12px'}} onClick={() => aprovarPontoMock(item, pontosPropostos)}>✔️ Aprovar</button>
          </div>
      );

      if (item.status === 'Notificado') return <span style={{color: '#facc15', fontSize:'0.8rem'}}>⏳ Aguardando...</span>;
      
      return <button className="btn-chamar" onClick={() => irParaChatComUsuario(item)}>💬 Chamar</button>;
  };

  return (
    <div className="tech-layout-ponto">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Controle de Ponto</span>
        </div>
        
        <div className="toggle-rh-container">
            <button className={`toggle-btn ${abaAtiva === 'meu_ponto' ? 'active' : ''}`} onClick={() => setAbaAtiva('meu_ponto')}>
                👤 Meu Ponto
            </button>
            <button className={`toggle-btn ${abaAtiva === 'ajustes' ? 'active' : ''}`} onClick={() => setAbaAtiva('ajustes')}>
                📝 Ajustes
            </button>
            {isRH && (
                <button className={`toggle-btn ${abaAtiva === 'gestao_rh' ? 'active' : ''}`} onClick={() => setAbaAtiva('gestao_rh')}>
                    👮 Gestão RH 
                    {(listaPendencias.filter(p => p.status !== 'Respondido').length + pendenciasAjuste.length + listaPendencias.filter(p => p.status === 'Respondido').length) > 0 && <span className="badge-alert">!</span>}
                </button>
            )}
        </div>
        
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ↩</button>
      </header>

      <div className="ponto-container">
        <div className="ponto-content">
            
            {/* ABA: MEU PONTO */}
            {abaAtiva === 'meu_ponto' && (
                <>
                    <div className="clock-card glass-effect">
                        <h2 className="time-display">{horaAtual.toLocaleTimeString('pt-BR')}</h2>
                        <p className="date-display">{formatarDataExtenso(dataHoje)}</p>
                        <div className="status-badge-ponto">Online • Sincronizado</div>
                    </div>
                    <div className="registers-grid">
                    {['entrada', 'almoco_ida', 'almoco_volta', 'saida'].map(tipo => {
                        const isLocked = () => {
                            if (registros[tipo]) return false; 
                            switch(tipo) {
                                case 'almoco_ida': return !registros.entrada;
                                case 'almoco_volta': return !registros.almoco_ida;
                                case 'saida': return !registros.almoco_volta;
                                default: return false;
                            }
                        };
                        const locked = isLocked();

                        return (
                            <div key={tipo} className={`register-card ${registros[tipo] ? 'filled' : ''} ${locked ? 'locked' : ''}`}>
                                <span className="card-label">{tipo.replace('_', ' ')}</span>
                                <div className="time-value">{registros[tipo] || '--:--'}</div>
                                <button 
                                    className="btn-register" onClick={() => registrarPonto(tipo)} 
                                    disabled={!!registros[tipo] || locked}
                                    style={locked ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
                                >
                                    {registros[tipo] ? 'Registrado' : locked ? 'Aguardando' : 'Registrar'}
                                </button>
                            </div>
                        );
                    })}
                    </div>
                </>
            )}

            {/* ABA: AJUSTES (COLABORADOR) */}
            {abaAtiva === 'ajustes' && (
                <div className="ajustes-wrapper glass-effect" style={{padding: '25px', borderRadius: '12px', textAlign: 'left', maxWidth: '800px', margin: '0 auto'}}>
                    <form onSubmit={handleSubmitAjuste} className="ajuste-form">
                        <h3>📝 Solicitar Correção de Batida</h3>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label>Data da Ocorrência:</label>
                                <input type="date" required value={dataAjuste} onChange={(e) => setDataAjuste(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Qual marcação deseja corrigir?</label>
                                <select required value={tipoMarcacao} onChange={(e) => setTipoMarcacao(e.target.value)}>
                                    <option value="entrada">Entrada</option>
                                    <option value="almoco_ida">Saída para Almoço</option>
                                    <option value="almoco_volta">Retorno do Almoço</option>
                                    <option value="saida">Saída</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Horário Correto:</label>
                                <input type="time" required value={horarioCorreto} onChange={(e) => setHorarioCorreto(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group" style={{marginBottom: '15px'}}>
                            <label>Justificativa:</label>
                            <textarea rows="3" placeholder="Ex: Esqueci de bater o ponto pois entrei direto em reunião com o cliente..." required value={justificativa} onChange={(e) => setJustificativa(e.target.value)}></textarea>
                        </div>
                        <button type="submit" className="btn-submit-ajuste">Enviar para Aprovação</button>
                    </form>

                    <div className="ajustes-lista" style={{marginTop: '30px'}}>
                        <h3>Minhas Solicitações</h3>
                        {minhasSolicitacoes.length === 0 ? <p style={{color: '#94a3b8'}}>Nenhuma solicitação encontrada.</p> : (
                            <table className="tech-table">
                                <thead><tr><th>Data</th><th>Marcação</th><th>Correção</th><th>Status</th></tr></thead>
                                <tbody>
                                    {minhasSolicitacoes.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.dataAjuste.split('-').reverse().join('/')}</td>
                                        <td>{formatarTipoAjuste(item.tipoMarcacao)}</td>
                                        <td>{item.horarioCorreto}</td>
                                        <td>
                                            <span className={`badge-status ${item.status.toLowerCase()}`}>{item.status}</span>
                                            {item.status === 'Reprovado' && <div style={{fontSize:'10px', color:'#ef4444', marginTop:'5px'}}>Motivo: {item.motivoReprovacao}</div>}
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ABA: GESTÃO RH */}
            {abaAtiva === 'gestao_rh' && isRH && (
                <div className="gestao-rh-container">
                    
                    {modoApresentacaoAtivo && (
                         <div className="banner-automacao-rh">
                           <div className="banner-automacao-rh-noise"></div>
                           
                           <div className="banner-automacao-rh-content">
                             <h2 className="banner-automacao-rh-title">
                               🤖 Automação RPA Disponível
                             </h2>
                             <p className="banner-automacao-rh-desc">
                               O Robô de RH está online e pronto para auditar. Existem <strong>{listaPendencias.filter(p => p.status !== 'Respondido').length} divergências</strong> na folha.
                             </p>
                           </div>
                           
                           <button onClick={executarAutomacaoRH} className="btn-magic-rh">
                             ⚡ Iniciar Auditoria
                           </button>
                         </div>
                    )}

                    <div className="ajuste-tabs">
                        <button className={`tab-btn ${subAbaGestao === 'auditoria' ? 'active' : ''}`} onClick={() => setSubAbaGestao('auditoria')}>
                            🔍 Auditoria Ponto {listaPendencias.filter(p => p.status !== 'Respondido').length > 0 && <span className="badge-alert" style={{marginLeft:'5px'}}>{listaPendencias.filter(p => p.status !== 'Respondido').length}</span>}
                        </button>
                        <button className={`tab-btn ${subAbaGestao === 'aprovacoes' ? 'active' : ''}`} onClick={() => setSubAbaGestao('aprovacoes')}>
                            📝 Aprovações de Ajuste {(pendenciasAjuste.length + listaPendencias.filter(p => p.status === 'Respondido').length) > 0 && <span className="badge-alert" style={{marginLeft:'5px'}}>{pendenciasAjuste.length + listaPendencias.filter(p => p.status === 'Respondido').length}</span>}
                        </button>
                    </div>

                    {/* Sub-aba: Auditoria */}
                    {subAbaGestao === 'auditoria' && (
                        <div className="tabela-rh-wrapper">
                            {listaPendencias.filter(item => item.status !== 'Respondido').length === 0 ? (
                                <p style={{color: '#94a3b8', padding: '20px'}}>Nenhuma auditoria pendente no momento.</p>
                            ) : (
                                <table className="tech-table">
                                    <thead><tr><th>Colaborador</th><th>Data</th><th>Ocorrência</th><th>Espelho</th><th>Ação</th></tr></thead>
                                    <tbody>
                                        {listaPendencias.filter(item => item.status !== 'Respondido').map(item => {
                                            const dataVisual = gerarDataInconsistencia(item);
                                            item._visualDate = dataVisual;

                                            let pontosVisuais = item.pontos || { e:'---', si:'---', vi:'---', s:'---' };
                                            
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="user-profile-container">
                                                            <div className="avatar-glow">{item.nome && item.nome[0] ? item.nome[0] : '?'}</div>
                                                            <div className="user-info-modern">
                                                                <strong>{item.nome}</strong>
                                                                <small>{item.cargo}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><div className="date-badge">{dataVisual}</div></td>
                                                    <td><div className="erro-badge">{formatarNomeErro(item.erro)}</div></td>
                                                    <td>
                                                        <div className="timeline-ponto">
                                                            <div className={`time-pill ${!pontosVisuais.e || pontosVisuais.e === '---' ? 'miss' : ''}`}><span className="lbl">E</span>{pontosVisuais.e || '---'}</div>
                                                            <div className="arrow">›</div>
                                                            <div className={`time-pill ${!pontosVisuais.si || pontosVisuais.si === '---' ? 'miss' : ''}`}><span className="lbl">SI</span>{pontosVisuais.si || '---'}</div>
                                                            <div className="arrow">›</div>
                                                            <div className={`time-pill ${!pontosVisuais.vi || pontosVisuais.vi === '---' ? 'miss' : ''}`}><span className="lbl">VI</span>{pontosVisuais.vi || '---'}</div>
                                                            <div className="arrow">›</div>
                                                            <div className={`time-pill ${!pontosVisuais.s || pontosVisuais.s === '---' ? 'miss' : ''}`}><span className="lbl">S</span>{pontosVisuais.s || '---'}</div>
                                                        </div>
                                                    </td>
                                                    <td>{renderAcao(item, pontosVisuais)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Sub-aba: Aprovações de Ajuste */}
                    {subAbaGestao === 'aprovacoes' && (
                        <div className="tabela-rh-wrapper">
                            {(pendenciasAjuste.length === 0 && listaPendencias.filter(item => item.status === 'Respondido').length === 0) ? (
                                <p style={{color: '#94a3b8', padding: '20px'}}>Tudo certo! Nenhuma pendência de ajuste.</p>
                            ) : (
                                <>
                                    {/* TABELA 1: PESSOAS REAIS */}
                                    {pendenciasAjuste.length > 0 && (
                                        <div style={{marginBottom: '30px'}}>
                                            <h4 style={{textAlign: 'left', margin: '0 0 15px 10px', color: '#e2e8f0'}}>Solicitações Manuais (Equipe Interna)</h4>
                                            <table className="tech-table">
                                                <thead><tr><th>Colaborador</th><th>Ocorrência</th><th>Justificativa</th><th>Ações</th></tr></thead>
                                                <tbody>
                                                {pendenciasAjuste.map(item => (
                                                    <tr key={item.id}>
                                                    <td><strong>{item.userName}</strong></td>
                                                    <td>
                                                        <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                                                            <span>📅 {item.dataAjuste.split('-').reverse().join('/')}</span>
                                                            <span style={{color: '#a855f7'}}>⏱️ {formatarTipoAjuste(item.tipoMarcacao)} ➜ {item.horarioCorreto}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{maxWidth: '200px', fontSize: '12px'}}>{item.justificativa}</td>
                                                    <td>
                                                        <div className="actions-flex">
                                                        <button className="btn-approve" onClick={() => aprovarAjuste(item)}>✔️ Aprovar</button>
                                                        <button className="btn-reject" onClick={() => reprovarAjuste(item)}>✖️ Reprovar</button>
                                                        </div>
                                                    </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* TABELA 2: MOCKS APROVADOS VIA CHAT */}
                                    {listaPendencias.filter(item => item.status === 'Respondido').length > 0 && (
                                        <div>
                                            <h4 style={{textAlign: 'left', margin: '0 0 15px 10px', color: '#e2e8f0'}}>Correções via Chat (Robôs)</h4>
                                            <table className="tech-table">
                                                <thead><tr><th>Colaborador</th><th>Data</th><th>Ocorrência</th><th>Espelho Sugerido</th><th>Ação</th></tr></thead>
                                                <tbody>
                                                    {listaPendencias.filter(item => item.status === 'Respondido').map(item => {
                                                        const dataVisual = gerarDataInconsistencia(item);
                                                        
                                                        let pontosVisuais = item.pontos || {};
                                                        if (item.erro !== 'Atraso Excessivo' && item.erro !== 'Falta Injustificada') {
                                                            pontosVisuais = {
                                                                e: (!item.pontos.e || item.pontos.e === '---') ? '08:00' : item.pontos.e,
                                                                si: (!item.pontos.si || item.pontos.si === '---') ? '12:00' : item.pontos.si,
                                                                vi: (!item.pontos.vi || item.pontos.vi === '---') ? '13:00' : item.pontos.vi,
                                                                s: (!item.pontos.s || item.pontos.s === '---') ? '17:00' : item.pontos.s,
                                                            };
                                                        }

                                                        return (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <div className="user-profile-container">
                                                                        <div className="avatar-glow">{item.nome && item.nome[0] ? item.nome[0] : '?'}</div>
                                                                        <div className="user-info-modern">
                                                                            <strong>{item.nome}</strong>
                                                                            <small>{item.cargo}</small>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td><div className="date-badge">{dataVisual}</div></td>
                                                                <td><div className="erro-badge">{formatarNomeErro(item.erro)}</div></td>
                                                                <td>
                                                                    <div className="timeline-ponto">
                                                                        <div className="time-pill"><span className="lbl">E</span>{pontosVisuais.e}</div>
                                                                        <div className="arrow">›</div>
                                                                        <div className="time-pill"><span className="lbl">SI</span>{pontosVisuais.si}</div>
                                                                        <div className="arrow">›</div>
                                                                        <div className="time-pill"><span className="lbl">VI</span>{pontosVisuais.vi}</div>
                                                                        <div className="arrow">›</div>
                                                                        <div className="time-pill"><span className="lbl">S</span>{pontosVisuais.s}</div>
                                                                    </div>
                                                                </td>
                                                                <td>{renderAcao(item, pontosVisuais)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}