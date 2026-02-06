import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo';
import './FolhaPonto.css';

export default function FolhaPonto() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [registros, setRegistros] = useState({}); 
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataHoje, setDataHoje] = useState(new Date());
  const [modoGestao, setModoGestao] = useState(false);
  
  const [isRH, setIsRH] = useState(false);
  const [isCEO, setIsCEO] = useState(false); // NOVO ESTADO: Identifica Chefia
  const [listaPendencias, setListaPendencias] = useState([]);

  const getDataKey = (date) => date.toISOString().split('T')[0];

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return navigate('/');
      setUser(currentUser);

      const userRef = ref(db, `users/${currentUser.uid}`);
      get(userRef).then((snapshot) => {
          const userData = snapshot.val();
          if(userData) {
              const setor = (userData.setor || '').toLowerCase();
              const cargo = (userData.cargo || '').toLowerCase();
              const role = userData.role || '';
              
              // Verifica se é RH
              if(setor.includes('recursos humanos') || setor.includes('rh') || cargo.includes('c.e.o') || role === 'admin') {
                  setIsRH(true);
              }

              // LÓGICA DE EXCEÇÃO (YAN E GUI): Se for CEO/Diretoria/Admin, pode tudo.
              if (cargo.includes('ceo') || cargo.includes('diretoria') || role === 'admin') {
                  setIsCEO(true);
              }
          }
      });

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
    });
    return () => { clearInterval(timer); unsubscribeAuth(); };
  }, [navigate]);

  useEffect(() => {
      if (!isRH) return;
      const rhRef = ref(db, 'rh/erros_ponto');
      const unsubscribe = onValue(rhRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const lista = Object.entries(data).map(([key, val]) => ({
                  id: key, 
                  ...val
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

  // REGISTRO DE PONTO (INTEGRADO AO RH)
  const registrarPonto = async (tipo) => {
    if (!user) return;
    const horarioFormatado = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateKey = getDataKey(new Date());
    
    try {
      const updates = { 
          [tipo]: horarioFormatado, 
          userId: user.uid, 
          data: dateKey, 
          timestamp: Date.now() 
      };
      
      await update(ref(db, `ponto/${user.uid}/${dateKey}`), updates);
      
      // Integração com RH: Atualiza o caso se existir e muda status para Respondido
      const casoRhRef = ref(db, `rh/erros_ponto/${user.uid}`);
      const casoSnap = await get(casoRhRef);
      if (casoSnap.exists()) {
          const casoData = casoSnap.val();
          if (casoData.status !== 'Concluido') {
             const novosPontos = { ...casoData.pontos, [tipo === 'entrada' ? 'e' : tipo === 'almoco_ida' ? 'si' : tipo === 'almoco_volta' ? 'vi' : 's']: horarioFormatado };
             await update(casoRhRef, { pontos: novosPontos, status: 'Respondido' });
          }
      }

      alert(`Ponto registrado: ${horarioFormatado}`);

    } catch (error) { alert("Erro ao registrar ponto."); }
  };

  const irParaChatComUsuario = (usuarioFicticio) => {
      const mocksAtivos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
      if (!mocksAtivos.find(u => u.id === usuarioFicticio.id)) {
          mocksAtivos.push({
              id: usuarioFicticio.id,
              nome: usuarioFicticio.nome,
              cargo: usuarioFicticio.cargo,
              email: usuarioFicticio.nome ? `${usuarioFicticio.nome.split(' ')[0].toLowerCase()}@techcorp.com` : 'user@tech.com'
          });
          localStorage.setItem('mocksAtivos', JSON.stringify(mocksAtivos));
      }
      update(ref(db, `rh/erros_ponto/${usuarioFicticio.id}`), { status: 'Notificado' });
      navigate('/chat', { state: { chatTarget: { id: usuarioFicticio.id, nome: usuarioFicticio.nome, cargo: usuarioFicticio.cargo } } });
  };

  const handleResolver = (id) => {
      update(ref(db, `rh/erros_ponto/${id}`), { status: 'Concluido' });
  };

  const formatarDataExtenso = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const renderAcao = (item) => {
      // --- REGRA DE SEGURANÇA (NOVO) ---
      // Se o usuário logado for o dono do erro, E ele não for CEO/Diretoria:
      // BLOQUEIA O BOTÃO.
      if (item.id === user.uid && !isCEO) {
          return (
              <span style={{color: '#ef4444', fontSize:'0.7rem', fontWeight:'bold', display:'block', maxWidth:'80px', textAlign:'center'}}>
                  🚫 Proibido Auto-abonar
              </span>
          );
      }

      if (item.status === 'Respondido') {
          return (
              <div style={{display:'flex', flexDirection:'column', gap:'5px', alignItems:'center'}}>
                  <span style={{color: '#4ade80', fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase'}}>✨ Ajustado</span>
                  <button className="btn-resolve-rh" onClick={() => handleResolver(item.id)}>✅ Baixar</button>
              </div>
          );
      }
      if (item.status === 'Notificado') {
          return <span style={{color: '#facc15', fontSize:'0.8rem'}}>⏳ Aguardando...</span>;
      }
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
        
        {isRH && (
            <div className="toggle-rh-container">
                <button className={`toggle-btn ${!modoGestao ? 'active' : ''}`} onClick={() => setModoGestao(false)}>
                    👤 Meu Ponto
                </button>
                <button className={`toggle-btn ${modoGestao ? 'active' : ''}`} onClick={() => setModoGestao(true)}>
                    👮 Gestão RH 
                    {listaPendencias.length > 0 && <span className="badge-alert">{listaPendencias.length}</span>}
                </button>
            </div>
        )}
        
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ↩</button>
      </header>

      <div className="ponto-container">
        {!modoGestao && (
            <>
                <div className="clock-card glass-effect">
                  <h2 className="time-display">{horaAtual.toLocaleTimeString('pt-BR')}</h2>
                  <p className="date-display">{formatarDataExtenso(dataHoje)}</p>
                  <div className="status-badge-ponto">Online • Sincronizado</div>
                </div>
                <div className="registers-grid">
                  {['entrada', 'almoco_ida', 'almoco_volta', 'saida'].map(tipo => (
                    <div key={tipo} className={`register-card ${registros[tipo] ? 'filled' : ''}`}>
                      <span className="card-label">{tipo.replace('_', ' ')}</span>
                      <div className="time-value">{registros[tipo] || '--:--'}</div>
                      <button className="btn-register" onClick={() => registrarPonto(tipo)} disabled={!!registros[tipo] || (tipo === 'almoco_ida' && !registros.entrada)}>
                        {registros[tipo] ? 'Registrado' : 'Registrar'}
                      </button>
                    </div>
                  ))}
                </div>
            </>
        )}

        {modoGestao && isRH && (
            <div className="gestao-rh-container">
                <div className="rh-header-section">
                    <h3>🔍 Auditoria de Inconsistências</h3>
                    <p>Pendências encontradas: <strong>{listaPendencias.length}</strong></p>
                </div>
                <div className="tabela-rh-wrapper">
                    <table className="tech-table">
                        <thead><tr><th>Colaborador</th><th>Ocorrência</th><th>Espelho</th><th>Ação</th></tr></thead>
                        <tbody>
                            {listaPendencias.map(item => {
                                let pontosVisuais = item.pontos || {};
                                if (item.status === 'Respondido') {
                                    if (item.erro === 'Atraso Excessivo' || item.erro === 'Falta Injustificada') {
                                        pontosVisuais = item.pontos;
                                    } else {
                                        pontosVisuais = {
                                            e: (!item.pontos.e || item.pontos.e === '---') ? '08:00' : item.pontos.e,
                                            si: (!item.pontos.si || item.pontos.si === '---') ? '12:00' : item.pontos.si,
                                            vi: (!item.pontos.vi || item.pontos.vi === '---') ? '13:00' : item.pontos.vi,
                                            s: (!item.pontos.s || item.pontos.s === '---') ? '17:00' : item.pontos.s,
                                        };
                                    }
                                }
                                if (item.erro === 'Esquecimento Real') {
                                   pontosVisuais = item.pontos || { e:'---', si:'---', vi:'---', s:'---' };
                                }
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar-mini">{item.nome && item.nome[0] ? item.nome[0] : '?'}</div>
                                                <div><strong>{item.nome}</strong><br/><small>{item.cargo}</small></div>
                                            </div>
                                        </td>
                                        <td><div className="erro-badge">{item.erro}</div></td>
                                        <td>
                                            <div className="timeline-ponto">
                                                <div className={`time-pill ${!pontosVisuais.e || pontosVisuais.e === '---' ? 'miss' : ''}`}><span className="lbl">E</span>{pontosVisuais.e || '---'}</div>
                                                <div className="arrow">→</div>
                                                <div className={`time-pill ${!pontosVisuais.si || pontosVisuais.si === '---' ? 'miss' : ''}`}><span className="lbl">SI</span>{pontosVisuais.si || '---'}</div>
                                                <div className="arrow">→</div>
                                                <div className={`time-pill ${!pontosVisuais.vi || pontosVisuais.vi === '---' ? 'miss' : ''}`}><span className="lbl">VI</span>{pontosVisuais.vi || '---'}</div>
                                                <div className="arrow">→</div>
                                                <div className={`time-pill ${!pontosVisuais.s || pontosVisuais.s === '---' ? 'miss' : ''}`}><span className="lbl">S</span>{pontosVisuais.s || '---'}</div>
                                            </div>
                                        </td>
                                        <td>{renderAcao(item)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}