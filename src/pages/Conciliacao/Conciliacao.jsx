import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar'; // Sidebar voltou
import { useUser } from '../../contexts/UserContext';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import './Conciliacao.css';

export default function Conciliacao() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS PARA INTERAÇÃO ---
  const [busca, setBusca] = useState('');
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Campos do Modal de Baixa
  const [dataPagamento, setDataPagamento] = useState('');
  const [bancoDestino, setBancoDestino] = useState('');

  // 1. Busca dados ISOLADOS do usuário
  useEffect(() => {
    if (!user) return;

    // CAMINHO EXCLUSIVO DO USUÁRIO (Isolamento de Dados)
    const faturasRef = ref(db, `users/${user.uid}/financeiro/faturas`);
    
    const unsubscribe = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Transforma o objeto do Firebase em Array
        const lista = Array.isArray(data) ? data : Object.keys(data).map(key => ({
          firebaseKey: key, // Guarda a chave para poder atualizar depois
          ...data[key]
        }));
        
        // Ordena: Pendentes primeiro
        lista.sort((a, b) => (a.status === 'Pendente' ? -1 : 1));
        setFaturas(lista);
      } else {
        setFaturas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Filtro de Busca
  const faturasFiltradas = faturas.filter(fatura => {
    const termo = busca.toLowerCase();
    const valorString = fatura.valor ? fatura.valor.toString() : '';
    return (
      fatura.cliente.toLowerCase().includes(termo) ||
      (fatura.id && fatura.id.toLowerCase().includes(termo)) ||
      valorString.includes(termo)
    );
  });

  const solicitarBaixa = (fatura) => {
    setFaturaSelecionada(fatura);
    setDataPagamento('');
    setBancoDestino('');
    setShowModal(true);
  };

  const confirmarBaixa = async (e) => {
    e.preventDefault();
    if (!faturaSelecionada) return;

    // Determina a chave correta para atualização (pode ser índice de array ou chave de objeto)
    const key = faturaSelecionada.firebaseKey !== undefined ? faturaSelecionada.firebaseKey : faturas.indexOf(faturaSelecionada);

    const updates = {};
    updates[`users/${user.uid}/financeiro/faturas/${key}/status`] = 'Conciliado';
    updates[`users/${user.uid}/financeiro/faturas/${key}/dataBaixa`] = new Date().toISOString();
    
    try {
      await update(ref(db), updates);
      setShowModal(false);
      setFaturaSelecionada(null);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar baixa.");
    }
  };

  return (
    <div className="tech-layout">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <Sidebar />

      <main className="tech-main">
        <header className="tech-header">
          <div className="header-content">
            <h1>Conciliação Bancária</h1>
            <p>Auditoria e Baixa de Títulos (Visualização Privada)</p>
          </div>
          <div className="tech-profile">
            <div className="profile-info">
              <span className="name">Financeiro</span>
              <span className="role">Operacional</span>
            </div>
            <div className="profile-avatar">FN</div>
          </div>
        </header>

        <div className="tech-scroll-content">
          
          {/* BARRA DE BUSCA E ALERTAS */}
          <div className="conciliacao-alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Instrução:</strong> Utilize o <span className="highlight" onClick={() => window.open('/banco', '_blank')}>Extrato Bancário</span> para validar as datas de pagamento.
            </div>
          </div>

          <div className="search-bar-container" style={{marginBottom: '20px'}}>
            <input 
              type="text" 
              placeholder="🔍 Buscar por Cliente, ID ou Valor..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input-tech"
              style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: 'rgba(15,23,42,0.6)', color: 'white'}}
            />
          </div>

          {/* TABELA DE FATURAS */}
          <div className="tech-card-table-wrapper">
            {loading ? (
              <p style={{padding:'20px', color:'white'}}>Carregando...</p>
            ) : faturasFiltradas.length === 0 ? (
              <div className="empty-state-tech">
                <div className="empty-icon">📂</div>
                <h3>Lista Vazia</h3>
                <p>Nenhuma pendência encontrada. Gere novos dados no Banco ou DevTools.</p>
              </div>
            ) : (
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>ID Documento</th>
                    <th>Cliente / Sacado</th>
                    <th>Valor (R$)</th>
                    <th>Vencimento (Futuro)</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasFiltradas.map((fatura, idx) => (
                    <tr key={idx} className={fatura.status === 'Conciliado' ? 'row-conciliado' : ''}>
                      <td className="mono" style={{fontSize: '0.8rem', color:'#94a3b8'}}>{fatura.id}</td>
                      <td className="col-cliente"><strong>{fatura.cliente}</strong></td>
                      <td className="col-valor">
                        {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td>{new Date(fatura.vencimento).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <span className={`status-badge ${fatura.status.toLowerCase()}`}>
                          {fatura.status}
                        </span>
                      </td>
                      <td>
                        {fatura.status === 'Pendente' && (
                          <button className="btn-action-tech" onClick={() => solicitarBaixa(fatura)}>
                            Conciliar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DE BAIXA */}
      {showModal && faturaSelecionada && (
        <div className="modal-overlay-tech">
          <div className="modal-glass">
            <div className="modal-header">
              <h3>Realizar Baixa</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="info-resumo-tech">
              <div className="info-row">
                <span>Cliente:</span>
                <strong>{faturaSelecionada.cliente}</strong>
              </div>
              <div className="info-row highlight-val">
                <span>Valor:</span>
                <strong>R$ {faturaSelecionada.valor.toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={confirmarBaixa} className="form-tech">
              <div className="form-group-tech">
                <label>Data do Pagamento (Ver no Extrato)*</label>
                <input 
                  type="date" 
                  value={dataPagamento} 
                  onChange={(e) => setDataPagamento(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group-tech">
                <label>Conta de Entrada*</label>
                <select value={bancoDestino} onChange={(e) => setBancoDestino(e.target.value)} required>
                  <option value="">Selecione...</option>
                  <option value="horizon">Horizon Bank</option>
                  <option value="caixa">Caixa Econômica</option>
                </select>
              </div>
              <div className="modal-actions-tech">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel-tech">Cancelar</button>
                <button type="submit" className="btn-save-tech">Confirmar Baixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}