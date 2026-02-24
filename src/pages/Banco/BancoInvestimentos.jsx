import React from 'react';

export default function BancoInvestimentos({ isCorporate }) {
  
  // Dados simulados baseados no perfil (Empresa ou Pessoa Física)
  const patrimonioTotal = isCorporate ? '1.850.400,00' : '45.200,50';
  
  const carteira = isCorporate ? [
    { id: 1, nome: 'CDB Horizon Liquidez', tipo: 'Renda Fixa', valor: '850.000,00', rendimento: '+R$ 8.500,00', icon: '🏦' },
    { id: 2, nome: 'Tesouro IPCA+ 2029', tipo: 'Renda Fixa', valor: '500.400,00', rendimento: '+R$ 3.200,00', icon: '📜' },
    { id: 3, nome: 'Fundo Multimercado PRO', tipo: 'Renda Variável', valor: '500.000,00', rendimento: '+R$ 1.150,00', icon: '📊' },
  ] : [
    { id: 1, nome: 'CDB Prefixado 110%', tipo: 'Renda Fixa', valor: '15.000,00', rendimento: '+R$ 150,00', icon: '🏦' },
    { id: 2, nome: 'Ações - Tech', tipo: 'Renda Variável', valor: '8.200,50', rendimento: '+R$ 340,00', icon: '📈' },
    { id: 3, nome: 'Reserva de Emergência', tipo: 'Liquidez Diária', valor: '22.000,00', rendimento: '+R$ 180,00', icon: '🛡️' },
  ];

  return (
    <div className="invest-container">
      
      {/* CABEÇALHO DE PATRIMÔNIO */}
      <div className="invest-header">
        <div className="total-asset">
          <span>Patrimônio Total ({isCorporate ? 'Corporativo' : 'Pessoal Premium'})</span>
          <h2>R$ {patrimonioTotal}</h2>
        </div>
        <button className="btn-new-invest">
          + Novo Investimento
        </button>
      </div>

      <h3 className="section-title">Minha Carteira</h3>
      
      {/* GRID DE CARDS (Aproveita as classes do Banco.css que já existiam) */}
      <div className="assets-grid">
        
        {carteira.map((item) => (
          <div key={item.id} className="glass-card asset-card">
            <div className="asset-icon">{item.icon}</div>
            
            <div className="asset-info">
              <h4>{item.nome}</h4>
              <span className="asset-type">{item.tipo}</span>
            </div>
            
            <div className="asset-values">
              <strong>R$ {item.valor}</strong>
              <span className="yield">{item.rendimento} (Este mês)</span>
            </div>
            
            <button className="btn-redeem">Resgatar Dinheiro</button>
          </div>
        ))}
        
        {/* CARD DE SUGESTÃO PARA INVESTIR */}
        <div className="glass-card asset-card" style={{ border: '1px dashed rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }}>
          <div className="asset-icon" style={{ opacity: 0.5 }}>➕</div>
          <div className="asset-info">
            <h4 style={{ color: '#94a3b8' }}>Descobrir Oportunidades</h4>
            <span className="asset-type">Ver catálogo do Horizon</span>
          </div>
        </div>

      </div>
    </div>
  );
}