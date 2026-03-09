import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, onValue, update, get } from 'firebase/database';
import Logo from '../components/Logo';
import { useAlert } from '../contexts/AlertContext'; // <-- Importado o AlertContext
import './GestaoReembolsos.css'; // Vamos criar esse CSS simples abaixo

export default function GestaoReembolsos() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert(); // <-- Inicializado o hook de alertas
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. VERIFICAR PERMISSÃO E BUSCAR DADOS ---
  useEffect(() => {
    const carregarDados = async () => {
      const user = auth.currentUser;
      if (!user) { navigate('/'); return; }

      // Verifica se é Admin/Gestor
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      
      const ehGestor = userData && (userData.role === 'admin' || userData.role === 'gestor');

      if (!ehGestor) {
        // <-- Substituído o alert nativo
        await showAlert("Acesso Negado", "Acesso restrito a gestores.");
        navigate('/dashboard');
        return;
      }

      // Busca TODAS as solicitações
      const reembolsosRef = ref(db, 'reembolsos');
      onValue(reembolsosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Transforma em array e filtra só as pendentes
          const lista = Object.entries(data)
            .map(([id, valor]) => ({ id, ...valor }))
            .filter(item => item.status === 'em_analise'); // Só queremos ver o que falta aprovar
            
          setSolicitacoes(lista);
        } else {
          setSolicitacoes([]);
        }
        setLoading(false);
      });
    };

    carregarDados();
  }, [navigate, showAlert]);

  // --- 2. AÇÕES DE APROVAÇÃO ---
  const handleAvaliar = async (id, decisao) => {
    // decisao deve ser 'aprovado' ou 'rejeitado'
    
    // <-- Substituído o window.confirm nativo
    const confirmou = await showConfirm("Atenção", `Tem certeza que deseja ${decisao.toUpperCase()} esta solicitação?`);
    if (!confirmou) return;

    try {
      const itemRef = ref(db, `reembolsos/${id}`);
      await update(itemRef, {
        status: decisao,
        avaliadoPor: auth.currentUser.uid,
        dataAvaliacao: new Date().toISOString()
      });
      // <-- Substituído o alert nativo
      await showAlert("Sucesso", `Solicitação ${decisao} com sucesso!`);
    } catch (error) {
      // <-- Substituído o alert nativo
      await showAlert("Erro", "Erro ao atualizar.");
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
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ↩
        </button>
      </header>

      <div className="gestao-container">
        <h2 className="page-title-neon">Solicitações Pendentes ({solicitacoes.length})</h2>

        {loading ? (
          <p className="loading-text">Carregando pedidos...</p>
        ) : solicitacoes.length === 0 ? (
          <div className="empty-state">
            <span style={{fontSize: '3rem'}}>🎉</span>
            <p>Tudo limpo! Nenhuma pendência por aqui.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {solicitacoes.map(item => (
              <div key={item.id} className="card-aprovacao">
                <div className="card-header">
                  <span className="protocolo">{item.protocolo}</span>
                  <span className="data">{new Date(item.data_criacao).toLocaleDateString()}</span>
                </div>
                
                <div className="card-body">
                  <h3>{item.nome}</h3>
                  <p className="cargo-info">Matrícula: {item.matricula}</p>
                  
                  <div className="detalhe-row">
                    <span>Motivo:</span>
                    <p>{item.motivo}</p>
                  </div>
                  
                  <div className="detalhe-row">
                    <span>Valor:</span>
                    <p className="valor-destaque">R$ {item.valor}</p>
                  </div>

                  <div className="detalhe-row">
                    <span>Centro de Custo:</span>
                    <span className="badge-cc">{item.centro_custo}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-reject" 
                    onClick={() => handleAvaliar(item.id, 'rejeitado')}
                  >
                    ✖ Reprovar
                  </button>
                  <button 
                    className="btn-approve" 
                    onClick={() => handleAvaliar(item.id, 'aprovado')}
                  >
                    ✔ Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}