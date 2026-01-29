import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue, push, update, get } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo';
import './FolhaPonto.css';

// --- DADOS FICTÍCIOS DETALHADOS (Com os 4 pontos) ---
const CASOS_PROBLEMA_MOCK = [
  { id: 'mock_1', nome: "Lucas Mendes", cargo: "Dev. Júnior", setor: "TI", data: "28/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { id: 'mock_2', nome: "Mariana Costa", cargo: "Analista Fin. Jr", setor: "Financeiro", data: "28/01", erro: "Falta Injustificada", status: "Pendente", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { id: 'mock_3', nome: "Roberto Almeida", cargo: "Suporte N2", setor: "TI", data: "28/01", erro: "Atraso Excessivo", status: "Pendente", pontos: { e: '10:45', si: '13:00', vi: '14:00', s: '19:00' } },
  { id: 'mock_4', nome: "Fernanda Lima", cargo: "Assistente RH", setor: "RH", data: "28/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '---', vi: '---', s: '17:00' } },
  { id: 'mock_5', nome: "Carlos Eduardo", cargo: "DevOps", setor: "TI", data: "28/01", erro: "Hora Extra N/A", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '22:15' } },
  { id: 'mock_6', nome: "Juliana Paes", cargo: "Controller", setor: "Financeiro", data: "28/01", erro: "Falta Injustificada", status: "Pendente", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { id: 'mock_7', nome: "Bruno Souza", cargo: "Segurança Info", setor: "TI", data: "27/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { id: 'mock_8', nome: "Patrícia A.", cargo: "Gerente Cultura", setor: "RH", data: "27/01", erro: "Batida Duplicada", status: "Pendente", pontos: { e: '08:00', si: '08:02', vi: '12:00', s: '18:00' } },
  { id: 'mock_9', nome: "Ricardo O.", cargo: "Analista Fin. Sr", setor: "Financeiro", data: "27/01", erro: "Intervalo < 1h", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '12:35', s: '17:00' } },
  { id: 'mock_10', nome: "Amanda Silva", cargo: "P.O.", setor: "TI", data: "26/01", erro: "Falta Injustificada", status: "Pendente", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { id: 'mock_11', nome: "Felipe Neto", cargo: "Analista RH", setor: "RH", data: "26/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '---', vi: '---', s: '---' } },
  { id: 'mock_12', nome: "Larissa M.", cargo: "Aux. Financeiro", setor: "Financeiro", data: "26/01", erro: "Atraso Excessivo", status: "Pendente", pontos: { e: '11:00', si: '13:00', vi: '14:00', s: '18:00' } },
  { id: 'mock_13', nome: "Whindersson", cargo: "Dev Fullstack", setor: "TI", data: "25/01", erro: "Ponto Britânico", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' } },
  { id: 'mock_14', nome: "Tatá Werneck", cargo: "BP RH", setor: "RH", data: "25/01", erro: "Falta Injustificada", status: "Pendente", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { id: 'mock_15', nome: "Fausto Silva", cargo: "CFO", setor: "Financeiro", data: "25/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '09:00', si: '13:00', vi: '15:00', s: '---' } }
];

export default function FolhaPonto() {
  const navigate = useNavigate();
  
  // Estados Gerais
  const [dataHoje, setDataHoje] = useState(new Date());
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [registros, setRegistros] = useState({ entrada: null, almoco_ida: null, almoco_volta: null, saida: null });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Estados de Gestão (RH/CEO)
  const [isRH, setIsRH] = useState(false);
  const [modoGestao, setModoGestao] = useState(false);
  const [listaPendencias, setListaPendencias] = useState(CASOS_PROBLEMA_MOCK);

  const getDataKey = (date) => date.toISOString().split('T')[0];

  // 1. RELÓGIO E AUTENTICAÇÃO
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // A. Verificar Cargo (RH/CEO)
        const userRef = ref(db, `users/${currentUser.uid}`);
        get(userRef).then((snapshot) => {
            const userData = snapshot.val();
            if(userData) {
                const setor = (userData.setor || '').toLowerCase();
                const cargo = (userData.cargo || '').toLowerCase();
                const role = userData.role || '';
                
                // Lógica de Permissão
                if(setor.includes('recursos humanos') || setor.includes('rh') || cargo.includes('c.e.o') || role === 'admin') {
                    setIsRH(true);
                }
            }
        });

        // B. Buscar Pontos de Hoje
        const dateKey = getDataKey(new Date());
        const pontoRef = ref(db, `ponto/${currentUser.uid}/${dateKey}`);
        
        onValue(pontoRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setRegistros({
              entrada: data.entrada || null,
              almoco_ida: data.almoco_ida || null,
              almoco_volta: data.almoco_volta || null,
              saida: data.saida || null
            });
          }
          setLoading(false);
        });

      } else {
        navigate('/');
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribeAuth();
    };
  }, [navigate]);

  // 2. FUNÇÃO DE BATER PONTO (Usuário Comum)
  const registrarPonto = async (tipo) => {
    if (!user) return;
    const horarioFormatado = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateKey = getDataKey(new Date());
    const diaRef = ref(db, `ponto/${user.uid}/${dateKey}`);

    try {
      await update(diaRef, {
        [tipo]: horarioFormatado,
        userId: user.uid,
        data: dateKey,
        timestamp: Date.now()
      });
      alert(`Ponto de ${tipo.replace('_', ' ').toUpperCase()} registrado: ${horarioFormatado}`);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao registrar ponto.");
    }
  };

  // 3. FUNÇÕES DE GESTÃO (RH)
  const irParaChatComUsuario = (usuarioFicticio) => {
      // Navega para o chat passando o objeto do usuário no "state"
      // O ChatInterno vai ler esse state e adicionar o usuário na lista temporariamente
      navigate('/chat', { 
          state: { 
              chatTarget: {
                  id: usuarioFicticio.id,
                  nome: usuarioFicticio.nome,
                  cargo: usuarioFicticio.cargo,
                  email: `${usuarioFicticio.nome.split(' ')[0].toLowerCase()}@techportal.com`
              }
          } 
      });
      
      // Atualiza visualmente para "Notificado"
      setListaPendencias(prev => prev.map(p => p.id === usuarioFicticio.id ? {...p, status: 'Notificado'} : p));
  };

  const handleResolver = (id) => {
      if(window.confirm("Abonar falha e ajustar ponto manualmente?")) {
        setListaPendencias(prev => prev.filter(item => item.id !== id));
      }
  };

  const formatarDataExtenso = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
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
        
        {/* MENU DE ALTERNÂNCIA (SÓ PARA RH/CEO) */}
        {isRH ? (
            <div className="toggle-rh-container">
                <button 
                    className={`toggle-btn ${!modoGestao ? 'active' : ''}`} 
                    onClick={() => setModoGestao(false)}>
                    👤 Meu Ponto
                </button>
                <button 
                    className={`toggle-btn ${modoGestao ? 'active' : ''}`} 
                    onClick={() => setModoGestao(true)}>
                    👮 Gestão RH
                    {listaPendencias.length > 0 && <span className="badge-pendencia">{listaPendencias.length}</span>}
                </button>
            </div>
        ) : (
            <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ↩</button>
        )}
        
        {isRH && <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Sair</button>}
      </header>

      <div className="ponto-container">
        
        {/* --- MODO 1: BATER PONTO (VISUAL ORIGINAL) --- */}
        {!modoGestao && (
            <>
                <div className="clock-card glass-effect">
                  <h2 className="time-display">{horaAtual.toLocaleTimeString('pt-BR')}</h2>
                  <p className="date-display">{formatarDataExtenso(dataHoje)}</p>
                  <div className="status-badge-ponto">
                    {loading ? 'Sincronizando...' : 'Online • Sincronizado'}
                  </div>
                </div>

                <div className="registers-grid">
                  <div className={`register-card ${registros.entrada ? 'filled' : ''}`}>
                    <span className="card-label">Entrada</span>
                    <div className="time-value">{registros.entrada || '--:--'}</div>
                    <button className="btn-register" onClick={() => registrarPonto('entrada')} disabled={!!registros.entrada}>
                      {registros.entrada ? 'Registrado' : 'Registrar'}
                    </button>
                  </div>

                  <div className={`register-card ${registros.almoco_ida ? 'filled' : ''}`}>
                    <span className="card-label">Almoço (Ida)</span>
                    <div className="time-value">{registros.almoco_ida || '--:--'}</div>
                    <button className="btn-register" onClick={() => registrarPonto('almoco_ida')} disabled={!registros.entrada || !!registros.almoco_ida}>
                      {registros.almoco_ida ? 'Registrado' : 'Registrar'}
                    </button>
                  </div>

                  <div className={`register-card ${registros.almoco_volta ? 'filled' : ''}`}>
                    <span className="card-label">Almoço (Volta)</span>
                    <div className="time-value">{registros.almoco_volta || '--:--'}</div>
                    <button className="btn-register" onClick={() => registrarPonto('almoco_volta')} disabled={!registros.almoco_ida || !!registros.almoco_volta}>
                      {registros.almoco_volta ? 'Registrado' : 'Registrar'}
                    </button>
                  </div>

                  <div className={`register-card ${registros.saida ? 'filled' : ''}`}>
                    <span className="card-label">Saída</span>
                    <div className="time-value">{registros.saida || '--:--'}</div>
                    <button className="btn-register" onClick={() => registrarPonto('saida')} disabled={!registros.almoco_volta || !!registros.saida}>
                      {registros.saida ? 'Registrado' : 'Encerrar Dia'}
                    </button>
                  </div>
                </div>
            </>
        )}

        {/* --- MODO 2: GESTÃO RH (NOVA TABELA) --- */}
        {modoGestao && isRH && (
            <div className="gestao-rh-container">
                <div className="rh-header-section">
                    <h3>🔍 Inconsistências de Ontem</h3>
                    <p>Abaixo a lista de colaboradores que precisam de ajuste ou justificativa.</p>
                </div>

                <div className="tabela-rh-wrapper">
                    <table className="tech-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Ocorrência</th>
                                <th>Espelho do Dia (Entrada ➝ Saída)</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaPendencias.map((caso) => (
                                <tr key={caso.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-mini">{caso.nome[0]}</div>
                                            <div>
                                                <strong>{caso.nome}</strong>
                                                <br/><small>{caso.cargo}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="erro-badge">{caso.erro}</div>
                                        <small style={{color:'#94a3b8'}}>{caso.data}</small>
                                    </td>
                                    <td>
                                        {/* --- VISUALIZAÇÃO DOS 4 PONTOS --- */}
                                        <div className="timeline-ponto">
                                            <div className={`time-pill ${caso.pontos.e === '---' ? 'miss' : ''}`}>
                                                <span className="lbl">E</span> {caso.pontos.e}
                                            </div>
                                            <div className="arrow">➝</div>
                                            <div className={`time-pill ${caso.pontos.si === '---' ? 'miss' : ''}`}>
                                                <span className="lbl">S.I</span> {caso.pontos.si}
                                            </div>
                                            <div className="arrow">➝</div>
                                            <div className={`time-pill ${caso.pontos.vi === '---' ? 'miss' : ''}`}>
                                                <span className="lbl">V.I</span> {caso.pontos.vi}
                                            </div>
                                            <div className="arrow">➝</div>
                                            <div className={`time-pill ${caso.pontos.s === '---' ? 'miss' : ''}`}>
                                                <span className="lbl">S</span> {caso.pontos.s}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {caso.status === 'Pendente' ? (
                                                <button 
                                                  className="btn-chamar" 
                                                  onClick={() => irParaChatComUsuario(caso)}
                                                  title="Abrir chat com colaborador"
                                                >
                                                    💬 Chamar
                                                </button>
                                            ) : (
                                                <button className="btn-resolve-rh" onClick={() => handleResolver(caso.id)}>
                                                    ✅ Baixar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}