import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import Logo from '../components/Logo';
import './GestaoReembolsos.css';

export default function GestaoAprovacoes() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('ferias');
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. SEGURANÇA
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/');
      
      const userRef = ref(db, `users/${user.uid}`);
      get(userRef).then((snapshot) => {
          const userData = snapshot.val();
          // Lógica de proteção opcional
      });
    };
    checkUser();
  }, [navigate]);

  // HELPER DE STATUS (CORRIGIDO AQUI)
  const isPendente = (s) => {
      if (!s) return true;
      // Adicionado 'em_analise' na lista
      return ['pendente', 'em analise', 'em_analise', 'em análise', 'solicitado', 'aguardando', 'aberto'].includes(s.toLowerCase());
  };

  // 2. BUSCA INTELIGENTE DE DADOS
  useEffect(() => {
    setLoading(true);
    setDados([]); 
    
    let dbRef;
    
    // --- ROTEAMENTO DE PASTAS ---
    if (abaAtiva === 'viagens') {
        dbRef = ref(db, 'viagens'); 
    } else if (abaAtiva === 'reembolsos') {
        dbRef = ref(db, 'reembolsos'); 
    } else {
        dbRef = ref(db, `solicitacoes/${abaAtiva}`);
    }

    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      let lista = [];

      if (data) {
        if (abaAtiva === 'viagens') {
          // --- CASO ESPECIAL: VIAGENS ---
          Object.keys(data).forEach((uidUsuario) => {
            const viagensUser = data[uidUsuario];
            if (viagensUser) {
                Object.keys(viagensUser).forEach((chaveFirebase) => {
                  const viagem = viagensUser[chaveFirebase];
                  if (isPendente(viagem.status)) {
                    lista.push({ 
                        ...viagem, 
                        firebaseKey: chaveFirebase, 
                        uidOriginal: uidUsuario 
                    });
                  }
                });
            }
          });
        } else {
          // --- CASO PADRÃO ---
          lista = Object.entries(data)
            .map(([chaveFirebase, valor]) => ({ 
                ...valor, 
                firebaseKey: chaveFirebase,
                id: valor.protocolo || valor.id || chaveFirebase 
            }))
            .filter(item => isPendente(item.status));
        }
      }
      
      // Ordena por data
      lista.sort((a, b) => {
          const dA = new Date(a.createdAt || a.data_criacao || a.data_ida || 0);
          const dB = new Date(b.createdAt || b.data_criacao || b.data_ida || 0);
          return dB - dA;
      });

      setDados(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [abaAtiva]);

  // 3. AÇÃO DE APROVAR / REJEITAR
  const handleAvaliar = async (item, decisao) => {
    const textoAcao = decisao === 'aprovado' ? 'APROVAR' : 'REJEITAR';
    if (!window.confirm(`Deseja ${textoAcao} esta solicitação?`)) return;

    setDados(prev => prev.filter(d => d.firebaseKey !== item.firebaseKey));

    try {
      let itemRef;
      let updateData = {};
      const user = auth.currentUser;

      if (abaAtiva === 'viagens') {
          itemRef = ref(db, `viagens/${item.uidOriginal}/${item.firebaseKey}`);
          updateData = {
            status: decisao === 'aprovado' ? 'APROVADO' : 'REJEITADO',
            aprovadoPor: user.email,
            dataAprovacao: new Date().toISOString()
          };
      } else if (abaAtiva === 'reembolsos') {
          itemRef = ref(db, `reembolsos/${item.firebaseKey}`);
          updateData = { 
              status: decisao, 
              avaliadoPor: user.uid 
          };
      } else {
          itemRef = ref(db, `solicitacoes/${abaAtiva}/${item.firebaseKey}`);
          
          if (abaAtiva === 'helpdesk') {
              updateData = {
                  status: decisao === 'aprovado' ? 'em_andamento' : 'cancelado',
                  atendidoPor: user.uid
              };
          } else {
              updateData = { status: decisao, avaliadoPor: user.uid };
          }
      }

      await update(itemRef, updateData);
      
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar. A página será recarregada.");
      window.location.reload();
    }
  };

  return (
    <div className="gestao-layout">
      <div className="ambient-light light-1"></div>
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Central de Aprovações</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ↩</button>
      </header>

      <div className="gestao-container">
        <h2 className="page-title-neon">Pendências da Diretoria</h2>

        <div style={{display:'flex', gap:'10px', marginBottom:'20px', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={() => setAbaAtiva('ferias')} style={estiloAba(abaAtiva === 'ferias')}>🏖 Férias</button>
            <button onClick={() => setAbaAtiva('viagens')} style={estiloAba(abaAtiva === 'viagens')}>✈ Viagens</button>
            <button onClick={() => setAbaAtiva('helpdesk')} style={estiloAba(abaAtiva === 'helpdesk')}>🎧 Helpdesk</button>
            <button onClick={() => setAbaAtiva('reembolsos')} style={estiloAba(abaAtiva === 'reembolsos')}>💰 Reembolsos</button>
        </div>

        {loading ? (
            <div className="loading-container"><span className="tech-spinner">🔄</span><p>Carregando...</p></div>
        ) : dados.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:'3rem'}}>✅</span><p>Tudo limpo em {abaAtiva.toUpperCase()}!</p></div>
        ) : (
          <div className="grid-cards">
            {dados.map(item => (
              <div key={item.firebaseKey} className="card-aprovacao">
                <div className="card-header">
                  <span className="protocolo">
                    {(item.protocolo || item.id || 'ID').toString().substring(0,10).toUpperCase()}
                  </span>
                  <span className="data">{new Date(item.createdAt || item.data_criacao || item.dataInicio || Date.now()).toLocaleDateString()}</span>
                </div>
                
                <div className="card-body">
                  <h3>{item.solicitanteNome || item.nome || item.userEmail || 'Colaborador'}</h3>
                  <p className="cargo-info">{item.solicitanteCargo || item.categoria || (item.matricula ? `Mat: ${item.matricula}` : 'TechTeam')}</p>
                  
                  {abaAtiva === 'ferias' && (
                      <><div className="detalhe-row"><span>Início:</span><p>{item.inicio ? new Date(item.inicio).toLocaleDateString() : '---'}</p></div>
                        <div className="detalhe-row"><span>Dias:</span><p>{item.dias} dias</p></div></>
                  )}
                  
                  {abaAtiva === 'viagens' && (
                      <><div className="detalhe-row"><span>Rota:</span><p>{item.origem} ➝ {item.destino}</p></div>
                        <div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.adiantamento || '0,00'}</p></div></>
                  )}
                  
                  {abaAtiva === 'helpdesk' && (
                      <>
                        <div className="detalhe-row"><span>Assunto:</span><p><strong>{item.titulo || item.assunto}</strong></p></div>
                        <div className="detalhe-row"><span>Categoria:</span><p>{item.categoria}</p></div>
                        <div className="detalhe-row"><span>Prioridade:</span><span style={{color: ['alta','critica'].includes(item.prioridade) ? 'red' : 'inherit'}}>{item.prioridade}</span></div>
                      </>
                  )}
                  
                  {abaAtiva === 'reembolsos' && (
                      <><div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.valor}</p></div></>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-reject" onClick={() => handleAvaliar(item, 'rejeitado')}>✖ {abaAtiva === 'helpdesk' ? 'Cancelar' : 'Negar'}</button>
                  <button className="btn-approve" onClick={() => handleAvaliar(item, 'aprovado')}>✔ {abaAtiva === 'helpdesk' ? 'Atender' : 'Aprovar'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const estiloAba = (ativo) => ({
    padding: '10px 20px', borderRadius: '20px',
    background: ativo ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)',
    color: 'white', border: ativo ? '1px solid var(--neon-blue)' : '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', minWidth: '120px'
});