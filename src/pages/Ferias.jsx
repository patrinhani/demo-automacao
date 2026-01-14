import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';

export default function SolicitacaoFerias() {
  const navigate = useNavigate();
  
  // Estado do formulário
  const [dataInicio, setDataInicio] = useState('');
  const [dias, setDias] = useState(30);
  const [venderDias, setVenderDias] = useState(false);
  const [dataFim, setDataFim] = useState('---');
  const [conflito, setConflito] = useState(false);

  // Regra de negócio: Calcular data fim
  useEffect(() => {
    if (dataInicio && dias) {
      const date = new Date(dataInicio);
      
      // Regra chata: Não pode começar quinta ou sexta (CLT/Empresa)
      const diaSemana = date.getDay(); // 0 = Dom, 6 = Sab
      if (diaSemana === 4 || diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
        alert("REGRA DO RH: Para otimizar o fluxo, inícios de férias são permitidos apenas de Segunda a Quarta-feira.");
        setDataInicio('');
        return;
      }

      // Adiciona os dias
      date.setDate(date.getDate() + parseInt(dias));
      setDataFim(date.toLocaleDateString('pt-BR'));

      // Simula conflito aleatório se escolher janeiro
      const mes = new Date(dataInicio).getMonth(); // 0 = Janeiro
      if (mes === 0 || mes === 6) { // Jan ou Julho
        setConflito(true);
      } else {
        setConflito(false);
      }
    }
  }, [dataInicio, dias]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conflito) {
      alert("ERRO DE CONFLITO: O colaborador 'Carlos do TI' já possui férias agendadas neste período. Converse com seu gestor.");
      return;
    }
    alert("Solicitação enviada! Imprima o formulário, colete a assinatura do gestor e entregue no RH físico (Sala 204).");
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="main-wrapper" style={{maxWidth: '900px'}}>
        <div className="page-header">
          <h2>Programação de Férias</h2>
          <div className="breadcrumbs">RH &gt; Minhas Férias</div>
        </div>

        {/* VISUAL DO PERÍODO AQUISITIVO */}
        <div className="card-box" style={{background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
          <h4 style={{marginBottom: '15px'}}>Período Aquisitivo (2025-2026)</h4>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px'}}>
            <span>Início: 02/01/2025</span>
            <span>Limite Legal: 02/12/2026</span>
          </div>
          
          <div style={{width: '100%', height: '20px', background: '#e9ecef', borderRadius: '10px', overflow: 'hidden'}}>
            {/* Barra de progresso verde */}
            <div style={{width: '80%', height: '100%', background: 'linear-gradient(90deg, #28a745, #218838)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem'}}>
              12/12 Meses Trabalhados - Direito Adquirido
            </div>
          </div>
          <div style={{marginTop: '10px', textAlign: 'right', fontWeight: 'bold', color: '#004a80'}}>
            Saldo Disponível: 30 dias
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px'}}>
          
          {/* FORMULÁRIO */}
          <div className="card-box" style={{background: 'white', padding: '25px', borderRadius: '8px'}}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Data de Início Desejada</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  required 
                />
                <small style={{color: '#666', fontSize: '0.75rem'}}>*Proibido iniciar em Quintas, Sextas ou Vésperas de Feriado.</small>
              </div>

              <div className="form-group">
                <label>Quantidade de Dias</label>
                <select className="form-input" value={dias} onChange={(e) => setDias(e.target.value)}>
                  <option value={30}>30 Dias Corridos</option>
                  <option value={20}>20 Dias (Vender 10)</option>
                  <option value={15}>15 Dias (Fracionar)</option>
                </select>
              </div>

              <div className="form-group" style={{background: '#f8f9fa', padding: '15px', borderRadius: '4px', border: '1px solid #ddd'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                  <input 
                    type="checkbox" 
                    checked={venderDias} 
                    onChange={() => setVenderDias(!venderDias)} 
                    disabled={dias === 30}
                  /> 
                  <strong>Solicitar Abono Pecuniário (Vender Férias)</strong>
                </label>
                {dias === 30 && <small style={{display:'block', color: 'red', marginTop:'5px'}}>*Para vender, selecione 20 dias.</small>}
              </div>

              <div style={{marginTop: '20px', padding: '15px', background: '#e2e3e5', borderRadius: '4px'}}>
                <div><strong>Previsão de Retorno:</strong></div>
                <div style={{fontSize: '1.2rem', color: '#333'}}>{dataFim}</div>
              </div>

              <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '20px'}}>
                Validar e Enviar Solicitação
              </button>
            </form>
          </div>

          {/* CALENDÁRIO DA EQUIPE (O CONFLITO) */}
          <div className="card-box" style={{background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd'}}>
            <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px'}}>Agenda da Equipe</h4>
            
            {conflito && (
              <div style={{background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '15px', border: '1px solid #f5c6cb'}}>
                <strong>⚠ Conflito Detectado:</strong> O limite de ausências simultâneas do setor foi atingido.
              </div>
            )}

            <ul style={{listStyle: 'none', padding: 0}}>
              <li style={{marginBottom: '10px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between'}}>
                <span>👤 Ana (Gerente)</span>
                <span style={{color: '#999'}}>Presente</span>
              </li>
              <li style={{marginBottom: '10px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between'}}>
                <span>👤 Carlos (TI)</span>
                <span style={{color: 'orange', fontWeight: 'bold'}}>Férias (Jan)</span>
              </li>
              <li style={{marginBottom: '10px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between'}}>
                <span>👤 Yan (Dev)</span>
                <span style={{color: '#999'}}>Presente</span>
              </li>
              <li style={{marginBottom: '10px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between'}}>
                <span>👤 Duda (Design)</span>
                <span style={{color: 'orange', fontWeight: 'bold'}}>Férias (Jul)</span>
              </li>
            </ul>

            <div style={{marginTop: '20px', fontSize: '0.75rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px'}}>
              *A política da empresa permite no máximo 1 pessoa da mesma equipe de férias simultaneamente.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}