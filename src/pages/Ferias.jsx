import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo'; // <--- 1. IMPORTAMOS A LOGO DE VOLTA

export default function Ferias() {
  const navigate = useNavigate();
  
  // --- LÓGICA DO FORMULÁRIO (Mantida Igual) ---
  const [dataInicio, setDataInicio] = useState('');
  const [dias, setDias] = useState(30);
  const [venderDias, setVenderDias] = useState(false);
  const [dataFim, setDataFim] = useState('---');
  const [conflito, setConflito] = useState(false);
  const [erroData, setErroData] = useState('');
  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (dataInicio && dias) {
      const date = new Date(dataInicio);
      const diaSemana = date.getUTCDay();

      if (diaSemana === 4 || diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
        setErroData("🚫 REGRA DO RH: Inícios de férias permitidos apenas de Segunda a Quarta-feira.");
        setDataFim('---');
        return;
      } else {
        setErroData('');
      }

      const dataFinal = new Date(date);
      dataFinal.setDate(dataFinal.getDate() + parseInt(dias));
      setDataFim(dataFinal.toLocaleDateString('pt-BR'));

      const mes = date.getMonth();
      if (mes === 0 || mes === 6) setConflito(true);
      else setConflito(false);
    }
  }, [dataInicio, dias]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (erroData) return alert("Corrija a data antes de continuar.");
    if (conflito) return alert("ERRO DE CONFLITO: O colaborador 'Carlos do TI' já possui férias neste período.");
    alert("Solicitação gerada! Imprima, assine e leve ao RH (Sala 204).");
  };

  // --- ESTILOS INTERNOS ---
  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#333'
    },
    card: {
      background: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      marginBottom: '25px',
      border: '1px solid #f0f0f0'
    },
    progressBarContainer: {
      height: '12px',
      background: '#e9ecef',
      borderRadius: '6px',
      overflow: 'hidden',
      marginTop: '15px'
    },
    progressBar: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, #004a80 0%, #0088cc 100%)',
      borderRadius: '6px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: '25px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: erroData ? '2px solid #dc3545' : '1px solid #ced4da',
      borderRadius: '6px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      marginTop: '5px',
      outline: 'none',
      transition: 'border 0.2s'
    },
    badge: (tipo) => ({
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      backgroundColor: tipo === 'ferias' ? '#fff3cd' : '#d4edda',
      color: tipo === 'ferias' ? '#856404' : '#155724'
    }),
    teamItem: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '12px 0', 
      borderBottom: '1px solid #f0f0f0'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: '#004a80',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'background 0.2s',
      letterSpacing: '0.5px'
    }
  };

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header style={{background: 'linear-gradient(to right, #002a4d, #004a80)', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #e6b800'}}>
        
        {/* <--- 2. AQUI ESTÁ A LOGO DE VOLTA */}
        <div style={{transform: 'scale(0.9)', transformOrigin: 'left'}}> 
           <Logo />
        </div>

        <div onClick={() => navigate('/dashboard')} style={{cursor: 'pointer', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '4px', fontSize: '0.9rem', transition: '0.2s'}}>
          Voltar ao Menu ↩
        </div>
      </header>

      <div style={styles.container}>
        
        <div style={{marginBottom: '30px'}}>
          <h2 style={{margin: '0 0 5px 0', color: '#004a80'}}>Programação de Férias</h2>
          <div style={{color: '#666', fontSize: '0.9rem'}}>RH &gt; Portal do Colaborador &gt; Minhas Férias</div>
        </div>

        {/* CARD DO PERÍODO AQUISITIVO */}
        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <h4 style={{margin: 0, color: '#333'}}>Período Aquisitivo</h4>
              <span style={{fontSize: '0.8rem', color: '#777'}}>2025 - 2026</span>
            </div>
            <div style={{textAlign: 'right'}}>
              <span style={{fontSize: '0.85rem', color: '#666', display: 'block'}}>Vencimento</span>
              <strong style={{color: '#004a80'}}>02/12/2026</strong>
            </div>
          </div>
          
          <div style={styles.progressBarContainer}>
            <div style={styles.progressBar}></div>
          </div>
          <div style={{marginTop: '8px', fontSize: '0.8rem', color: '#004a80', fontWeight: 'bold'}}>
            30 DIAS DISPONÍVEIS
          </div>
        </div>

        {/* GRID DE DUAS COLUNAS */}
        <div style={styles.grid}>
          
          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div style={styles.card}>
            <h4 style={{marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#333'}}>
              Configurar Solicitação
            </h4>

            <form onSubmit={handleSubmit}>
              <div style={{marginBottom: '20px'}}>
                <label style={{fontWeight: '600', fontSize: '0.9rem', color: '#444'}}>Início das Férias</label>
                <input 
                  type="date" 
                  min={hoje} 
                  style={styles.input}
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  required 
                />
                
                {erroData && (
                  <div style={{color: '#dc3545', fontSize: '0.85rem', marginTop: '8px', padding: '8px', background: '#ffe6e6', borderRadius: '4px', borderLeft: '3px solid #dc3545'}}>
                    {erroData}
                  </div>
                )}
                
                {!erroData && (
                  <small style={{color: '#666', fontSize: '0.8rem', marginTop: '5px', display: 'block'}}>
                    *Permitido apenas seg, ter ou qua.
                  </small>
                )}
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{fontWeight: '600', fontSize: '0.9rem', color: '#444'}}>Quantidade de Dias</label>
                <select 
                  style={styles.input}
                  value={dias} 
                  onChange={(e) => setDias(e.target.value)}
                >
                  <option value={30}>30 Dias Corridos</option>
                  <option value={20}>20 Dias (Vender 10)</option>
                  <option value={15}>15 Dias (Fracionar)</option>
                </select>
              </div>

              <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <input 
                  type="checkbox" 
                  checked={venderDias} 
                  onChange={() => setVenderDias(!venderDias)} 
                  disabled={dias == 30} 
                  style={{width: '18px', height: '18px', accentColor: '#004a80'}}
                /> 
                <label style={{fontSize: '0.9rem', color: '#333', cursor: 'pointer'}} onClick={() => dias != 30 && setVenderDias(!venderDias)}>
                  Solicitar Abono Pecuniário (Vender Férias)
                </label>
              </div>

              <div style={{marginTop: '25px', padding: '15px', background: '#e9ecef', borderRadius: '6px', textAlign: 'center'}}>
                <span style={{display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '5px', textTransform: 'uppercase'}}>Previsão de Retorno</span>
                <strong style={{fontSize: '1.4rem', color: '#004a80'}}>{dataFim}</strong>
              </div>

              <button type="submit" style={styles.button}>
                VALIDAR AGENDAMENTO
              </button>
            </form>
          </div>

          {/* COLUNA DIREITA: AGENDA E CONFLITOS */}
          <div style={{...styles.card, height: 'fit-content'}}>
            <h4 style={{marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#333'}}>
              Escala da Equipe
            </h4>
            
            {conflito && (
              <div style={{
                background: '#fff3cd', 
                color: '#856404', 
                padding: '15px', 
                borderRadius: '6px', 
                fontSize: '0.85rem', 
                marginBottom: '20px', 
                border: '1px solid #ffeeba'
              }}>
                <strong>⚠ CONFLITO DETECTADO:</strong><br/>
                O limite de ausências simultâneas do setor (1 pessoa) será excedido.
              </div>
            )}

            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
              <li style={styles.teamItem}>
                <div>
                  <strong style={{display: 'block', fontSize: '0.9rem'}}>Carlos (TI)</strong>
                  <span style={{fontSize: '0.75rem', color: '#666'}}>DevOps</span>
                </div>
                <span style={styles.badge('ferias')}>FÉRIAS (JAN)</span>
              </li>

              <li style={styles.teamItem}>
                <div>
                  <strong style={{display: 'block', fontSize: '0.9rem'}}>Duda (Design)</strong>
                  <span style={{fontSize: '0.75rem', color: '#666'}}>UX/UI</span>
                </div>
                <span style={styles.badge('ferias')}>FÉRIAS (JUL)</span>
              </li>

              <li style={styles.teamItem}>
                <div>
                  <strong style={{display: 'block', fontSize: '0.9rem'}}>Ana (Gerente)</strong>
                  <span style={{fontSize: '0.75rem', color: '#666'}}>Gestão</span>
                </div>
                <span style={styles.badge('presente')}>PRESENTE</span>
              </li>

              <li style={{...styles.teamItem, borderBottom: 'none', opacity: 0.5}}>
                <div>
                  <strong style={{display: 'block', fontSize: '0.9rem'}}>Você</strong>
                  <span style={{fontSize: '0.75rem', color: '#666'}}>Analista</span>
                </div>
                <span style={{fontSize: '0.8rem'}}>---</span>
              </li>
            </ul>

            <div style={{marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.75rem', color: '#666', lineHeight: '1.4', fontStyle: 'italic'}}>
              * A política da empresa bloqueia férias simultâneas no mesmo squad.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}