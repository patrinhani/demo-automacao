import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import Logo from '../components/Logo';
import './FolhaPonto.css';

export default function FolhaPonto() {
  const navigate = useNavigate();
  
  // --- 1. DECLARAÇÃO DE ESTADOS (HOOKS) NO INÍCIO ---
  const [user, setUser] = useState(null);
  const [registros, setRegistros] = useState({}); 
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataHoje, setDataHoje] = useState(new Date()); // Variável para o HTML

  const [modoGestao, setModoGestao] = useState(false);
  const [isRH, setIsRH] = useState(false); // isRH declarado aqui!
  const [listaPendencias, setListaPendencias] = useState([]);

  const getDataKey = (date) => date.toISOString().split('T')[0];

  // --- 2. EFEITOS (USEEFFECT) DEPOIS DOS ESTADOS ---
  
  // Autenticação e Relógio
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

  // Carregar Lista RH do Firebase
  useEffect(() => {
      // Agora podemos usar isRH porque ele foi declarado lá em cima
      if (!isRH) return;

      const rhRef = ref(db, 'rh/erros_ponto');
      const unsubscribe = onValue(rhRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const lista = Object.entries(data)
                  .map(([key, valor]) => ({ id: key, ...valor }))
                  .filter(item => {
                      if (item.hiddenUntil && item.hiddenUntil > Date.now()) return false;
                      return item.status !== 'Resolvido (Chat)';
                  });
              setListaPendencias(lista);
          } else {
              setListaPendencias([]);
          }
      });
      return () => unsubscribe();
  }, [isRH]);

  // --- FUNÇÕES AUXILIARES ---
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
      // Atualiza status e navega
      update(ref(db, `rh/erros_ponto/${usuarioFicticio.id}`), { status: 'Notificado' });
      navigate('/chat', { state: { chatTarget: { id: usuarioFicticio.id, nome: usuarioFicticio.nome, cargo: usuarioFicticio.cargo } } });
  };

  const handleResolver = (id) => {
      if(window.confirm("Abonar falha e ajustar ponto manualmente?")) {
        update(ref(db, `rh/erros_ponto/${id}`), { status: 'Resolvido (Manual)' });
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