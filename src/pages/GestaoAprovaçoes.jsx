import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import Logo from '../components/Logo';
import './GestaoReembolsos.css'; // Usando o mesmo CSS

export default function GestaoAprovacoes() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('ferias'); // ferias | viagens | helpdesk | reembolsos
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. SEGURANÇA
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/');

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      const ehCEO = userData && (userData.cargo?.includes('C.E.O') || userData.role === 'admin' || userData.role === 'gestor');

      if (!ehCEO) {
        alert("Acesso restrito.");
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  // 2. ESCUTAR BANCO DE DADOS
  useEffect(() => {
    // Lógica para saber em qual nó buscar
    let caminho = '';
    
    if (abaAtiva === 'reembolsos') {
        caminho = 'reembolsos'; // Nó antigo na raiz
    } else {
        caminho = `solicitacoes/${abaAtiva}`; // Nós novos agrupados
    }

    const dbRef = ref(db, caminho);

    setLoading(true);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Transforma e filtra. 
        // Nota: Reembolsos usam status 'em_analise', os novos usam 'pendente'.
        const lista = Object.entries(data)
          .map(([id, valor]) => ({ id, ...valor }))
          .filter(item => {
              if (abaAtiva === 'reembolsos') return item.status === 'em_analise';
              return item.status === 'pendente';
          });
        setDados(lista);
      } else {
        setDados([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [abaAtiva]);

  // 3. APROVAR / REPROVAR
  const handleAvaliar = async (id, decisao) => {
    // Decisão: 'aprovado' ou 'rejeitado'
    if (!window.confirm(`Confirma ${decisao.toUpperCase()} esta solicitação?`)) return;

    try {
      let itemRef;
      if (abaAtiva === 'reembolsos') {
          itemRef = ref(db, `reembolsos/${id}`);
      } else {
          itemRef = ref(db, `solicitacoes/${abaAtiva}/${id}`);
      }

      await update(itemRef, {
        status: decisao,
        avaliadoPor: auth.currentUser.uid,
        dataAvaliacao: new Date().toISOString()
      });
      alert("Status atualizado!");
    } catch (error) {
      alert("Erro ao atualizar: " + error.message);
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

        {/* ABAS DE NAVEGAÇÃO */}
        <div style={{display:'flex', gap:'10px', marginBottom:'20px', justifyContent:'center', flexWrap:'wrap'}}>
            <button onClick={() => setAbaAtiva('ferias')} style={estiloAba(abaAtiva === 'ferias')}>🏖 Férias</button>
            <button onClick={() => setAbaAtiva('viagens')} style={estiloAba(abaAtiva === 'viagens')}>✈ Viagens</button>
            <button onClick={() => setAbaAtiva('helpdesk')} style={estiloAba(abaAtiva === 'helpdesk')}>🎧 TI / Helpdesk</button>
            <button onClick={() => setAbaAtiva('reembolsos')} style={estiloAba(abaAtiva === 'reembolsos')}>💰 Reembolsos</button>
        </div>

        {loading ? <p className="loading-text">Carregando...</p> : dados.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:'3rem'}}>✅</span><p>Tudo em dia em {abaAtiva.toUpperCase()}!</p></div>
        ) : (
          <div className="grid-cards">
            {dados.map(item => (
              <div key={item.id} className="card-aprovacao">
                <div className="card-header">
                  <span className="protocolo">{abaAtiva === 'reembolsos' ? item.protocolo : abaAtiva.toUpperCase()}</span>
                  <span className="data">
                      {new Date(item.createdAt || item.data_criacao || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="card-body">
                  <h3>{item.solicitanteNome || item.nome || 'Colaborador'}</h3>
                  <p className="cargo-info">{item.solicitanteCargo || (item.matricula ? `Mat: ${item.matricula}` : '')}</p>
                  
                  {/* RENDERIZAÇÃO CONDICIONAL */}
                  {abaAtiva === 'ferias' && (
                      <>
                        <div className="detalhe-row"><span>Início:</span><p>{new Date(item.inicio).toLocaleDateString()}</p></div>
                        <div className="detalhe-row"><span>Dias:</span><p>{item.dias} dias</p></div>
                        <div className="detalhe-row"><span>Vender:</span><p>{item.vender ? 'Sim' : 'Não'}</p></div>
                      </>
                  )}

                  {abaAtiva === 'viagens' && (
                      <>
                        <div className="detalhe-row"><span>Rota:</span><p>{item.origem} ➝ {item.destino}</p></div>
                        <div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Adiantamento:</span><p className="valor-destaque">R$ {item.adiantamento}</p></div>
                      </>
                  )}

                  {abaAtiva === 'helpdesk' && (
                      <>
                        <div className="detalhe-row"><span>Assunto:</span><p>{item.assunto}</p></div>
                        <div className="detalhe-row"><span>Categoria:</span><p>{item.categoria}</p></div>
                        <div className="detalhe-row"><span>Prioridade:</span><span style={{color: item.prioridade === 'Alta' ? 'red' : 'inherit'}}>{item.prioridade}</span></div>
                      </>
                  )}

                  {abaAtiva === 'reembolsos' && (
                      <>
                        <div className="detalhe-row"><span>Motivo:</span><p>{item.motivo}</p></div>
                        <div className="detalhe-row"><span>Centro Custo:</span><p>{item.centro_custo}</p></div>
                        <div className="detalhe-row"><span>Valor:</span><p className="valor-destaque">R$ {item.valor}</p></div>
                      </>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-reject" onClick={() => handleAvaliar(item.id, 'rejeitado')}>✖ Negar</button>
                  <button className="btn-approve" onClick={() => handleAvaliar(item.id, 'aprovado')}>✔ Aprovar</button>
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
    padding: '10px 20px',
    borderRadius: '20px',
    background: ativo ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: '0.3s',
    minWidth: '120px'
});