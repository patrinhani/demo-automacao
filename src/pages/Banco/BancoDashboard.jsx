import React from 'react';

// Recebe a prop 'accessLevel' do pai
export default function BancoDashboard({ saldo, accessLevel }) {
  
  // Verifica se é Gestor (Admin)
  const isGestor = accessLevel === 'admin' || accessLevel === 'gestor';

  return (
    <div className="infinite-grid">
      
      {/* 1. CARD DE SALDO (Diferente para cada perfil) */}
      <div className="glass-card balance-card">
        <h3>Saldo em Conta</h3>
        
        {isGestor ? (
          // VISÃO DO GESTOR: Vê o dinheiro
          <>
            <div className="balance-amount">
              <small>R$</small> {saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </div>
            <div className="mini-stats">
              <span className="highlight-purple">⬆ Receitas: R$ 12.4k</span>
              <span className="highlight-red">⬇ Despesas: R$ 4.2k</span>
            </div>
          </>
        ) : (
          // VISÃO DO COLABORADOR: Vê apenas máscara
          <>
            <div className="balance-amount" style={{color:'#64748b', letterSpacing:'5px'}}>
              •••••••
            </div>
            <div className="yield-badge" style={{background:'rgba(255,255,255,0.1)', color:'#cbd5e1'}}>
              🔒 Visão Restrita (Operacional)
            </div>
          </>
        )}
      </div>

      {/* 2. CARD INVESTIMENTOS (Só Gestor vê valores) */}
      <div className="glass-card invest-card-mini">
        <h3>{isGestor ? "Investimentos" : "Status Operacional"}</h3>
        
        {isGestor ? (
           <>
             <div className="balance-amount highlight-purple">
               <small>R$</small> 450.500,00
             </div>
             <div className="yield-badge">🚀 +125% do CDI</div>
           </>
        ) : (
           <>
             <div className="balance-amount" style={{fontSize:'1.5rem', color:'#fff'}}>
               ✅ Regular
             </div>
             <div className="mini-stats" style={{flexDirection:'column', gap:'5px'}}>
               <span>Conciliações Pendentes: 12</span>
               <span>Lote Processado: 09:00h</span>
             </div>
           </>
        )}
      </div>

      {/* 3. CARD CARTÃO (Igual para ambos, mas sem limite para colaborador) */}
      <div className="glass-card credit-card-visual" style={{height:'100%', minHeight:'180px'}}>
        <div className="card-top">
          <span>Horizon Infinite</span>
          <span className="contactless">)))</span>
        </div>
        <div className="card-chip" style={{margin:'15px 0'}}></div>
        <div className="card-number">**** **** **** 8829</div>
        <div className="card-bottom">
          <div className="holder">TECHCORP LTDA</div>
          {/* Apenas gestor vê o limite disponível */}
          <div className="expiry">{isGestor ? 'LIMITE: 50k' : 'CORP MEMBER'}</div> 
        </div>
      </div>

      {/* 4. TABELA DE PENDÊNCIAS (Todos veem, pois precisam trabalhar nisso) */}
      <div className="glass-card full-width">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
            <h3 style={{margin:0, fontSize:'1.2rem', color:'#fff'}}>Pendências de Autorização</h3>
            {isGestor && <button className="btn-export" style={{fontSize:'0.8rem', padding:'5px 10px'}}>Aprovar Lote</button>}
        </div>
        
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <tbody>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <td style={{padding:'10px', color:'#cbd5e1'}}>30/01</td>
                <td style={{padding:'10px', color:'#fff', fontWeight:'500'}}>AWS SERVICES</td>
                <td style={{padding:'10px', color:'#f43f5e', textAlign:'right', fontWeight:'bold'}}>R$ 4.250,00</td>
                <td style={{padding:'10px', textAlign:'center'}}>
                   {isGestor ? <span className="tag-type D" style={{cursor:'pointer'}}>APROVAR</span> : <span className="tag-type">Aguard. Gerente</span>}
                </td>
            </tr>
            <tr>
                <td style={{padding:'10px', color:'#cbd5e1'}}>30/01</td>
                <td style={{padding:'10px', color:'#fff', fontWeight:'500'}}>DELL COMPUTADORES</td>
                <td style={{padding:'10px', color:'#f43f5e', textAlign:'right', fontWeight:'bold'}}>R$ 12.890,00</td>
                <td style={{padding:'10px', textAlign:'center'}}>
                   {isGestor ? <span className="tag-type D" style={{cursor:'pointer'}}>APROVAR</span> : <span className="tag-type">Aguard. Gerente</span>}
                </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}