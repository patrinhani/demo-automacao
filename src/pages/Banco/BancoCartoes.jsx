import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update, push } from 'firebase/database';
import './Banco.css'; // Garante que o CSS atualizado seja carregado

export default function BancoCartoes({ accessLevel, isCorporate }) {
  // Estados do Cartão
  const [limiteTotal, setLimiteTotal] = useState(50000);
  const [faturaAtual, setFaturaAtual] = useState(0);
  const [compras, setCompras] = useState([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Define tipo de cartão visualmente
  const cardType = isCorporate ? 'black' : 'standard';

  // Escuta dados do Cartão em Tempo Real
  useEffect(() => {
    const cartaoRef = ref(db, 'banco_mock/cartao');
    const unsubscribe = onValue(cartaoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLimiteTotal(Number(data.limiteTotal || 50000));
        setFaturaAtual(Number(data.faturaAtual || 0));
        
        if (data.compras) {
          const lista = Object.values(data.compras).sort((a, b) => new Date(b.data) - new Date(a.data));
          setCompras(lista);
        } else {
          setCompras([]);
        }
        setBloqueado(data.bloqueado || false);
      } else {
        // Dados iniciais se não existir
        update(cartaoRef, { limiteTotal: 50000, faturaAtual: 3240.50, bloqueado: false });
      }
    });
    return () => unsubscribe();
  }, []);

  // Função: Pagar Fatura
  const pagarFatura = async () => {
    if (faturaAtual <= 0) return;
    if (!window.confirm(`Confirma o pagamento de R$ ${faturaAtual.toLocaleString('pt-BR')}?`)) return;

    setLoadingPay(true);
    
    try {
      await update(ref(db, 'banco_mock/cartao'), { faturaAtual: 0 });
      await push(ref(db, 'banco_mock/transacoes'), {
        data: new Date().toISOString(),
        desc: "PGTO FATURA CARTAO",
        doc: "FAT-PGTO",
        valor: -faturaAtual,
        tipo: "D"
      });
      alert("Fatura paga com sucesso!");
    } catch (err) {
      alert("Erro ao processar pagamento.");
    } finally {
      setLoadingPay(false);
    }
  };

  const toggleBloqueio = () => {
    update(ref(db, 'banco_mock/cartao'), { bloqueado: !bloqueado });
  };

  const gerarCompraSimulada = () => {
    const valor = Math.floor(Math.random() * 500) + 50;
    const lojas = ["Uber", "Amazon AWS", "Starbucks", "Posto Shell", "Google Cloud", "iFood"];
    const loja = lojas[Math.floor(Math.random() * lojas.length)];
    
    const novaCompra = {
        data: new Date().toISOString(),
        loja: loja,
        valor: valor
    };

    push(ref(db, 'banco_mock/cartao/compras'), novaCompra);
    update(ref(db, 'banco_mock/cartao'), { faturaAtual: faturaAtual + valor });
  };

  const limiteDisponivel = limiteTotal - faturaAtual;
  const percentualUso = Math.min((faturaAtual / limiteTotal) * 100, 100);

  return (
    <div className="cartoes-container fade-in-up">
      
      {/* --- COLUNA ESQUERDA: O CARTÃO --- */}
      <div className="card-column">
        
        {/* Componente Visual do Cartão */}
        <div className={`realistic-card ${cardType} ${bloqueado ? 'is-blocked' : ''}`}>
          {bloqueado && (
            <div className="card-overlay-blocked">
              <span className="lock-icon">🔒</span>
              <span>BLOQUEADO</span>
            </div>
          )}
          
          <div className="card-front-content">
            <div className="card-header-row">
              <span className="bank-name">Horizon {isCorporate ? 'Infinite' : 'Gold'}</span>
              <span className="contactless-icon">))))</span>
            </div>

            <div className="chip-row">
              {/* CHIP REALISTA (CSS PURO) */}
              <div className="emv-chip">
                <div className="chip-line horiz"></div>
                <div className="chip-line vert"></div>
                <div className="chip-line vert right"></div>
                <div className="chip-line horiz bottom"></div>
              </div>
              {isCorporate && <span className="nfc-tag">NFC</span>}
            </div>

            <div className="card-number-row">
              {isCorporate ? '4455 9090 1234 8829' : '**** **** **** 8829'}
            </div>

            <div className="card-footer-row">
              <div className="card-holder-info">
                <label>TITULAR</label>
                <span>{isCorporate ? 'TECHCORP SOLUTIONS' : 'COLABORADOR'}</span>
              </div>
              <div className="card-expiry-info">
                <label>VALIDADE</label>
                <span>{isCorporate ? '12/30' : '05/28'}</span>
              </div>
              <div className="card-brand-logo">
                <div className="mastercard-circles">
                  <div className="circle c1"></div>
                  <div className="circle c2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Controle */}
        <div className="control-panel glass-card">
            <h4>Gestão Rápida</h4>
            <div className="control-actions">
                <button 
                    onClick={toggleBloqueio}
                    className={`btn-control ${bloqueado ? 'btn-unlock' : 'btn-lock'}`}
                >
                    {bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                </button>
                <button 
                    className="btn-control btn-password"
                    onMouseDown={() => setMostrarSenha(true)}
                    onMouseUp={() => setMostrarSenha(false)}
                    onMouseLeave={() => setMostrarSenha(false)}
                >
                    {mostrarSenha ? '1234' : '👁️ Ver Senha'}
                </button>
            </div>
            
            {/* Botão Dev (Apenas visualmente separado) */}
            <button onClick={gerarCompraSimulada} className="btn-dev-simulate">
                + Simular Compra (Dev)
            </button>
        </div>
      </div>

      {/* --- COLUNA DIREITA: FATURA E EXTRATO --- */}
      <div className="invoice-column">
        
        {/* Painel da Fatura */}
        <div className="invoice-card glass-card">
            <div className="invoice-header">
                <div className="invoice-info">
                    <h3>Fatura Atual (Aberta)</h3>
                    <h1 className={faturaAtual > 0 ? 'val-open' : 'val-paid'}>
                        R$ {faturaAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </h1>
                    <p>Vencimento: <strong>10/12/2026</strong></p>
                </div>
                <div className="limit-info">
                    <span className="limit-label">Limite Disponível</span>
                    <span className="limit-value">R$ {limiteDisponivel.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>

            {/* Barra de Progresso */}
            <div className="limit-progress-track">
                <div 
                    className="limit-progress-fill" 
                    style={{
                        width: `${percentualUso}%`,
                        background: percentualUso > 90 ? '#ef4444' : 'linear-gradient(90deg, #f59e0b, #d97706)'
                    }}
                ></div>
            </div>

            {/* Botão de Pagamento */}
            {accessLevel === 'admin' || accessLevel === 'financeiro' ? (
                <button 
                    className="btn-pay-action" 
                    onClick={pagarFatura} 
                    disabled={faturaAtual <= 0 || loadingPay}
                >
                    {loadingPay ? 'Processando...' : faturaAtual <= 0 ? 'Fatura Paga ✅' : 'PAGAR FATURA'}
                </button>
            ) : (
                <div className="permission-alert">
                    🔒 Pagamento restrito a gestores.
                </div>
            )}
        </div>

        {/* Histórico de Compras */}
        <div className="history-card glass-card">
            <h4>Últimos Lançamentos</h4>
            <div className="history-list-scroll">
                <table className="history-table">
                    <tbody>
                        {compras.length === 0 ? (
                            <tr><td className="empty-history">Nenhuma compra registrada.</td></tr>
                        ) : (
                            compras.map((compra, idx) => (
                                <tr key={idx}>
                                    <td className="col-date">{new Date(compra.data).toLocaleDateString()}</td>
                                    <td className="col-store">{compra.loja}</td>
                                    <td className="col-val">R$ {compra.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}