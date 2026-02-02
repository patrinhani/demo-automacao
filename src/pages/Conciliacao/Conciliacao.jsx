import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../contexts/UserContext';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database'; // Sem 'remove' ou 'push' aqui
import './Conciliacao.css';

export default function Conciliacao() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState([]);
  
  // Estados para o Modal de Conciliação
  const [modalAberto, setModalAberto] = useState(false);
  const [faturaSelecionada, setFaturaSelecionada] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // Campos do formulário
  const [dataPagamento, setDataPagamento] = useState('');
  const [bancoDestino, setBancoDestino] = useState('');
  const [observacao, setObservacao] = useState('');

  // Carrega dados do Firebase
  useEffect(() => {
    if (user) {
      const faturasRef = ref(db, `users/${user.uid}/financeiro/faturas`);
      onValue(faturasRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lista = Array.isArray(data) ? data : Object.entries(data).map(([k, v]) => ({...v, firebaseKey: k}));
          // Garante que tenha indice se vier de array
          const listaTratada = lista.map((item, idx) => ({
             ...item, 
             firebaseKey: item.firebaseKey || idx 
          }));
          setFaturas(listaTratada);
        } else {
          setFaturas([]);
        }
      });
    }
  }, [user]);

  const abrirModalConciliacao = (fatura) => {
    setFaturaSelecionada(fatura);
    setDataPagamento(''); 
    setBancoDestino('');
    setObservacao('');
    setModalAberto(true);
  };

  const confirmarBaixa = async (e) => {
    e.preventDefault();
    if (!dataPagamento || !bancoDestino) {
      alert("ERRO: Preencha os campos obrigatórios.");
      return;
    }

    setLoadingSave(true);

    setTimeout(async () => {
      if (user && faturaSelecionada) {
        const updates = {};
        updates[`users/${user.uid}/financeiro/faturas/${faturaSelecionada.firebaseKey}/status`] = 'Conciliado';
        await update(ref(db), updates);
      }
      setLoadingSave(false);
      setModalAberto(false);
    }, 1500);
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
            <p>Módulo de Baixa Manual & Auditoria</p>
          </div>
          <div className="tech-profile" onClick={() => navigate('/perfil')}>
            <div className="profile-info">
              <span className="name">Financeiro</span>
              <span className="role">Operacional</span>
            </div>
            <div className="profile-avatar">FN</div>
          </div>
        </header>

        <div className="tech-scroll-content">
          
          <div className="conciliacao-alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Processo Obrigatório:</strong> Mantenha o 
              <span className="highlight" onClick={() => window.open('/banco', '_blank')}> Horizon Bank </span> aberto e confira o Excel linha a linha.
            </div>
          </div>

          {faturas.length === 0 ? (
            <div className="empty-state-tech">
              <div className="empty-icon">📂</div>
              <h3>Nenhuma pendência localizada</h3>
              <p>Acesse o <strong>Horizon Bank  Extrato</strong> para gerar a carga de trabalho ou solicite ao Admin (DevTools) novos dados.</p>
              <button className="btn-tech-outline" onClick={() => window.open('/banco', '_blank')}>
                Ir para o Banco ↗
              </button>
            </div>
          ) : (
            <div className="tech-card-table-wrapper">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Cliente / Descrição</th>
                    <th>Vencimento</th>
                    <th>Valor (R$)</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map((fatura) => (
                    <tr key={fatura.firebaseKey} className={fatura.status === 'Conciliado' ? 'row-conciliado' : ''}>
                      <td className="col-cliente">
                        <strong>{fatura.cliente}</strong>
                        {fatura.status === 'Pendente' && <div className="loading-line"></div>}
                      </td>
                      <td>{fatura.vencimento}</td>
                      <td className="col-valor">R$ {parseFloat(fatura.valor).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${fatura.status.toLowerCase()}`}>
                          {fatura.status}
                        </span>
                      </td>
                      <td>
                        {fatura.status === 'Pendente' && (
                          <button className="btn-action-tech" onClick={() => abrirModalConciliacao(fatura)}>
                            Conciliar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalAberto && (
        <div className="modal-overlay-tech">
          <div className="modal-glass">
            <div className="modal-header">
              <h3>Baixa Manual de Título</h3>
              <button className="close-btn" onClick={() => setModalAberto(false)}>×</button>
            </div>
            
            <div className="info-resumo-tech">
              <div className="info-row">
                <span>Sacado:</span>
                <strong>{faturaSelecionada?.cliente}</strong>
              </div>
              <div className="info-row highlight-val">
                <span>Valor Original:</span>
                <strong>R$ {faturaSelecionada?.valor?.toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={confirmarBaixa} className="form-tech">
              <div className="form-group-tech">
                <label>Data Efetiva (Verifique o Excel)*</label>
                <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} required />
              </div>
              <div className="form-group-tech">
                <label>Conta Destino*</label>
                <select value={bancoDestino} onChange={(e) => setBancoDestino(e.target.value)} required>
                  <option value="">-- Selecione --</option>
                  <option value="itaú">Horizon Bank (Principal)</option>
                  <option value="caixa">Caixa Econômica</option>
                </select>
              </div>
              <div className="form-group-tech">
                <label>Observação (Opcional)</label>
                <textarea rows="2" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </div>
              <div className="modal-actions-tech">
                <button type="button" onClick={() => setModalAberto(false)} className="btn-cancel-tech">Cancelar</button>
                <button type="submit" className="btn-save-tech" disabled={loadingSave}>
                  {loadingSave ? 'Validando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}