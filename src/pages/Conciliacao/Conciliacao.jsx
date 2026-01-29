import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import Logo from '../../components/Logo';
import './Conciliacao.css';

export default function Conciliacao() {
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS PARA INTERAÇÃO MANUAL ---
  const [busca, setBusca] = useState('');
  const [faturaSelecionada, setFaturaSelecionada] = useState(null); // Item focado
  const [showModal, setShowModal] = useState(false); // Controle do Pop-up
  const [msgSucesso, setMsgSucesso] = useState(''); // Feedback visual

  // 1. Busca dados do Firebase (Simulação do ERP)
  useEffect(() => {
    const faturasRef = ref(db, 'financeiro/contasReceber');
    
    const unsubscribe = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Ordena: Pendentes primeiro para facilitar o trabalho
        lista.sort((a, b) => (a.status === 'Aberto' ? -1 : 1));
        setFaturas(lista);
      } else {
        setFaturas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Filtro (O humano digita o ID ou Valor do extrato aqui)
  const faturasFiltradas = faturas.filter(fatura => {
    const termo = busca.toLowerCase();
    const valorString = fatura.valor ? fatura.valor.toString() : '';
    return (
      fatura.cliente.toLowerCase().includes(termo) ||
      fatura.id.toLowerCase().includes(termo) ||
      valorString.includes(termo)
    );
  });

  // 3. Ação de Clique Inicial (Abre o Modal "Chato")
  const solicitarBaixa = (fatura) => {
    setFaturaSelecionada(fatura);
    setShowModal(true);
  };

  // 4. Confirmação (O clique real que dá baixa)
  const confirmarBaixa = () => {
    if (!faturaSelecionada) return;

    const updates = {};
    updates[`/financeiro/contasReceber/${faturaSelecionada.id}/status`] = 'Pago';
    updates[`/financeiro/contasReceber/${faturaSelecionada.id}/dataBaixa`] = new Date().toISOString();
    
    update(ref(db), updates)
      .then(() => {
        // Sucesso: Fecha modal e mostra feedback
        setShowModal(false);
        setMsgSucesso(`Pagamento de ${faturaSelecionada.cliente} confirmado!`);
        setFaturaSelecionada(null);
        
        // Remove aviso após 3s
        setTimeout(() => setMsgSucesso(''), 3000);
      })
      .catch(error => {
        console.error("Erro:", error);
        alert("Erro ao processar baixa.");
      });
  };

  return (
    <div className="tech-layout-conciliacao">
      {/* Luzes de Fundo */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      {/* Toast de Feedback (Aparece no topo) */}
      {msgSucesso && <div className="toast-success slide-in">✅ {msgSucesso}</div>}

      {/* --- MODAL DE CONFIRMAÇÃO (A parte "chata") --- */}
      {showModal && faturaSelecionada && (
        <div className="modal-overlay-tech">
          <div className="modal-content-glass">
            <h3>Confirmar Baixa?</h3>
            <p>
              Você está prestes a baixar a fatura de: <br/>
              <strong>{faturaSelecionada.cliente}</strong>
            </p>
            <div className="modal-info-row">
              <span>Valor: <strong>R$ {faturaSelecionada.valor}</strong></span>
              <span>ID: {faturaSelecionada.id.substring(0,6)}...</span>
            </div>
            <p className="warning-text">⚠️ Esta ação não pode ser desfeita facilmente.</p>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={confirmarBaixa}>Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      )}

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Financeiro</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="conciliacao-container-tech">
        <div className="page-header-tech">
          <h2>Conciliação Bancária</h2>
          <p>Localize o pagamento no extrato bancário e realize a baixa manual.</p>
        </div>

        {/* BUSCA MANUAL */}
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder="🔍 Buscar por Cliente, ID ou Valor (ex: 1500)..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="search-input-tech"
          />
        </div>

        {/* KPIs */}
        <div className="kpi-grid-tech">
          <div className="kpi-card-tech">
            <span>Pendentes</span>
            <strong>{faturas.filter(f => f.status === 'Aberto').length}</strong>
          </div>
          <div className="kpi-card-tech success">
            <span>Baixados Hoje</span>
            <strong>{faturas.filter(f => f.status === 'Pago').length}</strong>
          </div>
        </div>

        {/* TABELA DE DADOS */}
        <div className="glass-panel-tech fade-in">
          {loading ? (
            <p className="loading-text">Sincronizando faturas...</p>
          ) : faturasFiltradas.length === 0 ? (
            <p className="empty-text">Nenhuma fatura encontrada com esses dados.</p>
          ) : (
            <div className="table-responsive-tech">
              <table className="tech-table-modern">
                <thead>
                  <tr>
                    <th>ID Sistema</th>
                    <th>Cliente</th>
                    <th>Valor (R$)</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasFiltradas.map((fatura) => (
                    <tr key={fatura.id} className={fatura.status === 'Pago' ? 'row-pago' : ''}>
                      <td className="col-id">#{fatura.id.substring(0, 6)}...</td>
                      <td className="col-cliente">{fatura.cliente}</td>
                      <td className="col-valor">
                        {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td>{fatura.vencimento}</td>
                      <td>
                        <span className={`status-badge-tech ${fatura.status.toLowerCase()}`}>
                          {fatura.status}
                        </span>
                      </td>
                      <td>
                        {fatura.status === 'Aberto' ? (
                          <button 
                            className="btn-action-tech" 
                            onClick={() => solicitarBaixa(fatura)}
                          >
                            DAR BAIXA
                          </button>
                        ) : (
                          <span className="check-icon-tech">✅ Baixado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}