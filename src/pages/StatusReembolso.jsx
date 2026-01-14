import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';

export default function StatusReembolso() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Pega os dados que vieram do formulário (ou usa dados fake se acessar direto)
  const dados = location.state || { 
    protocolo: 'REQ-2024-9999', 
    valor: '0,00', 
    data: new Date().toLocaleDateString() 
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Ir para o Início ↩</div>
      </header>

      <div className="main-wrapper" style={{maxWidth: '800px'}}>
        
        {/* MENSAGEM DE SUCESSO */}
        <div style={{textAlign: 'center', padding: '40px 20px'}}>
          <div style={{
            width: '80px', height: '80px', background: '#28a745', color: 'white', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', margin: '0 auto 20px auto', boxShadow: '0 4px 10px rgba(40,167,69,0.3)'
          }}>
            ✓
          </div>
          <h2 style={{color: '#28a745', margin: '0'}}>Solicitação Enviada!</h2>
          <p style={{color: '#666', fontSize: '1.1rem'}}>
            Protocolo: <strong>{dados.protocolo}</strong>
          </p>
        </div>

        {/* DETALHES DO PROCESSO */}
        <div className="form-content" style={{borderTop: '1px solid #eee'}}>
          <h3 style={{color: '#004a80', marginTop: 0}}>Acompanhamento do Processo</h3>
          
          {/* LINHA DO TEMPO (CSS INLINE PARA SIMPLIFICAR) */}
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '30px', position: 'relative'}}>
            {/* Linha cinza de fundo */}
            <div style={{position: 'absolute', top: '15px', left: '0', width: '100%', height: '3px', background: '#e0e0e0', zIndex: 0}}></div>
            
            {/* ETAPA 1: ENVIADO (ATIVO) */}
            <div style={{zIndex: 1, textAlign: 'center', flex: 1}}>
              <div style={{width: '30px', height: '30px', background: '#004a80', color: 'white', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>1</div>
              <div style={{marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold', color: '#004a80'}}>Enviado</div>
              <div style={{fontSize: '0.8rem', color: '#666'}}>{dados.data}</div>
            </div>

            {/* ETAPA 2: EM ANÁLISE (ATIVO) */}
            <div style={{zIndex: 1, textAlign: 'center', flex: 1}}>
              <div style={{width: '30px', height: '30px', background: '#e6b800', color: 'white', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>2</div>
              <div style={{marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold', color: '#e6b800'}}>Em Análise</div>
              <div style={{fontSize: '0.8rem', color: '#666'}}>RH / Financeiro</div>
            </div>

            {/* ETAPA 3: APROVADO (PENDENTE) */}
            <div style={{zIndex: 1, textAlign: 'center', flex: 1, opacity: 0.5}}>
              <div style={{width: '30px', height: '30px', background: '#ccc', color: 'white', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>3</div>
              <div style={{marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold'}}>Aprovação</div>
            </div>

            {/* ETAPA 4: PAGAMENTO (PENDENTE) */}
            <div style={{zIndex: 1, textAlign: 'center', flex: 1, opacity: 0.5}}>
              <div style={{width: '30px', height: '30px', background: '#ccc', color: 'white', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>4</div>
              <div style={{marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold'}}>Pagamento</div>
            </div>
          </div>

          {/* CARD DE RESUMO */}
          <div style={{background: '#f9f9f9', padding: '20px', borderRadius: '6px', marginTop: '40px', border: '1px solid #eee'}}>
            <strong style={{display: 'block', marginBottom: '10px', color: '#333'}}>Resumo da Solicitação:</strong>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem'}}>
              <span>Valor Declarado:</span>
              <strong>R$ {dados.valor}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '5px'}}>
              <span>Status Atual:</span>
              <span style={{color: '#e6b800', fontWeight: 'bold', background: '#fff3cd', padding: '2px 8px', borderRadius: '4px'}}>AGUARDANDO APROVAÇÃO</span>
            </div>
            <p style={{fontSize: '0.8rem', color: '#666', marginTop: '15px', fontStyle: 'italic'}}>
              O prazo médio para análise é de 5 dias úteis. Você receberá uma notificação por e-mail quando o status mudar.
            </p>
          </div>

          <div className="actions" style={{justifyContent: 'center'}}>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Voltar ao Menu Principal</button>
            <button className="btn-primary" onClick={() => navigate('/solicitacao')}>Nova Solicitação</button>
          </div>

        </div>
      </div>
    </div>
  );
}