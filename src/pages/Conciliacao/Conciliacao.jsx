import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import './Conciliacao.css';

export default function Conciliacao() {
  const [faturas, setFaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca dados do Firebase em tempo real
  useEffect(() => {
    const faturasRef = ref(db, 'financeiro/contasReceber');
    
    const unsubscribe = onValue(faturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte objeto do Firebase em Array
        const lista = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Ordena: Abertos primeiro
        lista.sort((a, b) => (a.status === 'Aberto' ? -1 : 1));
        setFaturas(lista);
      } else {
        setFaturas([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função para dar baixa (Atualiza no Firebase)
  const handleBaixa = (id) => {
    const updates = {};
    updates[`/financeiro/contasReceber/${id}/status`] = 'Pago';
    updates[`/financeiro/contasReceber/${id}/dataBaixa`] = new Date().toISOString();
    
    update(ref(db), updates)
      .catch(error => console.error("Erro ao dar baixa:", error));
  };

  return (
    <div className="conciliacao-container">
      <header className="page-header">
        <div className="header-title">
          <h1>🏦 Conciliação Bancária</h1>
          <p>Gestão de Recebíveis e Baixas Automáticas</p>
        </div>
        
        <div className="kpi-cards">
          <div className="kpi-card">
            <span>Pendentes</span>
            <strong>{faturas.filter(f => f.status === 'Aberto').length}</strong>
          </div>
          <div className="kpi-card success">
            <span>Processados Hoje</span>
            <strong>{faturas.filter(f => f.status === 'Pago').length}</strong>
          </div>
        </div>
      </header>

      <div className="glass-panel fade-in">
        {loading ? (
          <p className="loading-text">Carregando faturas...</p>
        ) : faturas.length === 0 ? (
          <p className="empty-text">Nenhuma fatura encontrada para conciliação.</p>
        ) : (
          <div className="table-responsive">
            <table className="tech-table">
              <thead>
                <tr>
                  <th>ID Fatura</th>
                  <th>Cliente</th>
                  <th>Valor (R$)</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map((fatura) => (
                  <tr key={fatura.id} className={fatura.status === 'Pago' ? 'row-pago' : ''}>
                    <td className="col-id">#{fatura.id.substring(0, 6)}...</td>
                    <td>{fatura.cliente}</td>
                    <td className="col-valor">
                      {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>{fatura.vencimento}</td>
                    <td>
                      <span className={`status-badge ${fatura.status.toLowerCase()}`}>
                        {fatura.status}
                      </span>
                    </td>
                    <td>
                      {fatura.status === 'Aberto' ? (
                        <button 
                          className="btn-action-neon" 
                          onClick={() => handleBaixa(fatura.id)}
                        >
                          DAR BAIXA
                        </button>
                      ) : (
                        <span className="check-icon">✅ Confirmado</span>
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
  );
}