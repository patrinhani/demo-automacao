import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo';
import './FolhaPonto.css';

// --- 28 CASOS FICTÍCIOS PARA O RH ---
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
  { id: 'mock_15', nome: "Fausto Silva", cargo: "CFO", setor: "Financeiro", data: "25/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '09:00', si: '13:00', vi: '15:00', s: '---' } },
  { id: 'mock_16', nome: "João Kleber", cargo: "Estagiário TI", setor: "TI", data: "24/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '---', vi: '---', s: '---' } },
  { id: 'mock_17', nome: "Ana Maria", cargo: "Analista Contábil", setor: "Financeiro", data: "24/01", erro: "Batida Duplicada", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' } },
  { id: 'mock_18', nome: "Luciano Huck", cargo: "Gerente Vendas", setor: "Comercial", data: "24/01", erro: "Falta Injustificada", status: "Pendente", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { id: 'mock_19', nome: "Xuxa Meneghel", cargo: "Analista Mkt", setor: "Marketing", data: "23/01", erro: "Atraso Excessivo", status: "Pendente", pontos: { e: '10:30', si: '13:00', vi: '14:00', s: '18:00' } },
  { id: 'mock_20', nome: "Gugu Liberato", cargo: "Coord. Projetos", setor: "TI", data: "23/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '---' } },
  { id: 'mock_21', nome: "Ivete Sangalo", cargo: "Analista RH", setor: "RH", data: "23/01", erro: "Hora Extra N/A", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '21:00' } },
  { id: 'mock_22', nome: "Pelé Arantes", cargo: "Embaixador", setor: "Marketing", data: "22/01", erro: "Falta Injustificada", status: "Pendente", pontos: { e: '---', si: '---', vi: '---', s: '---' } },
  { id: 'mock_23', nome: "Silvio Santos", cargo: "Dono", setor: "Diretoria", data: "22/01", erro: "Ponto Britânico", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '17:00' } },
  { id: 'mock_24', nome: "Hebe Camargo", cargo: "Recepção", setor: "Adm", data: "22/01", erro: "Intervalo < 1h", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '12:15', s: '17:00' } },
  { id: 'mock_25', nome: "Ratinho", cargo: "Segurança", setor: "Infra", data: "21/01", erro: "Batida Duplicada", status: "Pendente", pontos: { e: '08:00', si: '08:01', vi: '---', s: '---' } },
  { id: 'mock_26', nome: "Eliana", cargo: "Secretária", setor: "Adm", data: "21/01", erro: "Marcação Ímpar", status: "Pendente", pontos: { e: '08:00', si: '---', vi: '---', s: '17:00' } },
  { id: 'mock_27', nome: "Celso Portiolli", cargo: "Trainee", setor: "TI", data: "21/01", erro: "Atraso Excessivo", status: "Pendente", pontos: { e: '09:45', si: '13:00', vi: '14:00', s: '17:00' } },
  { id: 'mock_28', nome: "Maisa Silva", cargo: "Jovem Aprendiz", setor: "RH", data: "20/01", erro: "Hora Extra N/A", status: "Pendente", pontos: { e: '08:00', si: '12:00', vi: '13:00', s: '18:30' } }
];

export default function FolhaPonto() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [registros, setRegistros] = useState({}); 
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataHoje, setDataHoje] = useState(new Date()); // Variável restaurada

  // Estados de Gestão
  const [modoGestao, setModoGestao] = useState(false);
  const [isRH, setIsRH] = useState(false);
  const [listaPendencias, setListaPendencias] = useState(CASOS_PROBLEMA_MOCK);

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
              if(setor.includes('recursos humanos') || setor.includes('rh') || cargo.includes('c.e.o') || role === 'admin') {
                  setIsRH(true);
              }
          }
      });

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
        } else {
            setRegistros({});
        }
      });
    });
    return () => { clearInterval(timer); unsubscribeAuth(); };
  }, [navigate]);

  const registrarPonto = async (tipo) => {
    if (!user) return;
    const horarioFormatado = horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateKey = getDataKey(new Date());
    const diaRef = ref(db, `ponto/${user.uid}/${dateKey}`);
    try {
      await update(diaRef, { [tipo]: horarioFormatado, userId: user.uid, data: dateKey, timestamp: Date.now() });
      alert(`Ponto de ${tipo.replace('_', ' ').toUpperCase()} registrado: ${horarioFormatado}`);
    } catch (error) { alert("Erro ao registrar ponto."); }
  };

  const irParaChatComUsuario = (usuarioFicticio) => {
      const mocksAtivos = JSON.parse(localStorage.getItem('mocksAtivos') || '[]');
      if (!mocksAtivos.find(u => u.id === usuarioFicticio.id)) {
          mocksAtivos.push({
              id: usuarioFicticio.id,
              nome: usuarioFicticio.nome,
              cargo: usuarioFicticio.cargo,
              email: `${usuarioFicticio.nome.split(' ')[0].toLowerCase()}@techportal.com`
          });
          localStorage.setItem('mocksAtivos', JSON.stringify(mocksAtivos));
      }
      navigate('/chat', { state: { chatTarget: { id: usuarioFicticio.id, nome: usuarioFicticio.nome, cargo: usuarioFicticio.cargo } } });
      setListaPendencias(prev => prev.map(p => p.id === usuarioFicticio.id ? {...p, status: 'Notificado'} : p));
  };

  const handleResolver = (id) => {
      if(window.confirm("Abonar falha e ajustar ponto manualmente?")) {
        // Remove da lista -> Contador diminui automaticamente
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

      {/* HEADER CORRIGIDO COM CENTRALIZAÇÃO E CLASSE ORIGINAL */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Controle de Ponto</span>
        </div>
        
        {/* BOTÕES CENTRALIZADOS (Ver CSS) */}
        {isRH && (
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
                    {/* BOLINHA VERMELHA CORRIGIDA */}
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
                        <thead>
                            <tr><th>Colaborador</th><th>Ocorrência</th><th>Espelho do Dia</th><th>Ação</th></tr>
                        </thead>
                        <tbody>
                            {listaPendencias.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-mini">{item.nome[0]}</div>
                                            <div><strong>{item.nome}</strong><br/><small>{item.cargo}</small></div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="erro-badge">{item.erro}</div>
                                        <small style={{color:'#94a3b8'}}>{item.data}</small>
                                    </td>
                                    <td>
                                        <div className="timeline-ponto">
                                            <div className={`time-pill ${item.pontos.e === '---' ? 'miss' : ''}`}><span className="lbl">E</span> {item.pontos.e}</div>
                                            <div className="arrow">➝</div>
                                            <div className={`time-pill ${item.pontos.si === '---' ? 'miss' : ''}`}><span className="lbl">S.I</span> {item.pontos.si}</div>
                                            <div className="arrow">➝</div>
                                            <div className={`time-pill ${item.pontos.vi === '---' ? 'miss' : ''}`}><span className="lbl">V.I</span> {item.pontos.vi}</div>
                                            <div className="arrow">➝</div>
                                            <div className={`time-pill ${item.pontos.s === '---' ? 'miss' : ''}`}><span className="lbl">S</span> {item.pontos.s}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {item.status === 'Pendente' ? (
                                                <button className="btn-chamar" onClick={() => irParaChatComUsuario(item)}>💬 Chamar</button>
                                            ) : (
                                                <button className="btn-resolve-rh" onClick={() => handleResolver(item.id)}>✅ Baixar</button>
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