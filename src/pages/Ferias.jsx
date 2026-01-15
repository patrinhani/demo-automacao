import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';

export default function Ferias() {
  const navigate = useNavigate();
  
  // Ref para o documento que será impresso
  const formRef = useRef();

  // --- LÓGICA ---
  const [dataInicio, setDataInicio] = useState('');
  const [dias, setDias] = useState(30);
  const [venderDias, setVenderDias] = useState(false);
  const [dataFim, setDataFim] = useState('---');
  const [conflito, setConflito] = useState(false);
  const [erroData, setErroData] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

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
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/dashboard');
  };

  // --- FUNÇÃO PARA GERAR O PDF ---
  const gerarPDF = async () => {
    setLoadingPDF(true);

    setTimeout(async () => {
      const element = formRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const nomeArquivo = `Solicitacao_Ferias_${dataInicio}.pdf`;
      pdf.save(nomeArquivo);

      setLoadingPDF(false);
      alert("Formulário baixado! Não esqueça de assinar.");
    }, 500);
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
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 42, 77, 0.6)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalCard: {
      background: 'white',
      padding: '40px',
      borderRadius: '12px',
      width: '450px',
      maxWidth: '90%',
      textAlign: 'center',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      animation: 'fadeIn 0.3s ease-out'
    }
  };

  return (
    <div className="app-container">
      
      <header style={{background: 'linear-gradient(to right, #002a4d, #004a80)', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #e6b800'}}>
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
          </div>
        </div>
      </div>

      {/* --- POPUP (MODAL) --- */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{fontSize: '4rem', marginBottom: '20px'}}>✅</div>
            <h3 style={{color: '#004a80', margin: '0 0 15px 0'}}>Solicitação Realizada!</h3>
            
            <p style={{color: '#555', lineHeight: '1.6', marginBottom: '25px'}}>
              Sua pré-reserva foi enviada para o sistema. <br/>
              Para efetivar, imprima o formulário abaixo, colete a assinatura do seu gestor e entregue no RH (Sala 204).
            </p>

            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
               <button 
                 onClick={handleCloseModal}
                 disabled={loadingPDF}
                 style={{padding: '12px 25px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
               >
                 Fechar
               </button>
               <button 
                 onClick={gerarPDF}
                 disabled={loadingPDF}
                 style={{padding: '12px 25px', background: '#004a80', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: loadingPDF ? 0.7 : 1}}
               >
                 {loadingPDF ? 'Gerando...' : '🖨 Imprimir Formulário'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TEMPLATE OCULTO DO FORMULÁRIO (PARA O PDF)
          Este HTML não aparece na tela, mas é usado pelo JS
          ======================================================= */}
      <div style={{position: 'absolute', top: '-10000px', left: 0}}>
         <div ref={formRef} style={{
            width: '210mm', minHeight: '297mm', background: 'white', padding: '20mm', boxSizing: 'border-box',
            fontFamily: 'Times New Roman, serif', color: 'black', border: '1px solid black'
         }}>
            
            {/* CABEÇALHO DO PDF (Agora Limpo, só com Logo) */}
            <div style={{textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px'}}>
               {/* Logo Centralizada e Aumentada */}
               <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px', transform: 'scale(1.5)'}}>
                  <Logo lightMode={true} />
               </div>

               <h2 style={{fontSize: '14pt', margin: '5px 0', fontWeight: 'normal'}}>DEPARTAMENTO DE RECURSOS HUMANOS</h2>
               <h3 style={{fontSize: '16pt', marginTop: '20px', textDecoration: 'underline'}}>SOLICITAÇÃO DE FÉRIAS</h3>
            </div>

            {/* DADOS DO COLABORADOR */}
            <div style={{marginBottom: '30px'}}>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>NOME:</strong> YAN RODRIGUES</p>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>CARGO:</strong> ANALISTA PLENO</p>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>DEPARTAMENTO:</strong> TECNOLOGIA DA INFORMAÇÃO</p>
               <p><strong>MATRÍCULA:</strong> 829304</p>
            </div>

            {/* DETALHES DAS FÉRIAS */}
            <div style={{marginBottom: '30px', border: '1px solid black', padding: '15px'}}>
               <h4 style={{marginTop: 0, backgroundColor: '#eee', padding: '5px'}}>DETALHES DA SOLICITAÇÃO</h4>
               
               <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                 <tbody>
                    <tr>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>DATA DE INÍCIO:</strong></td>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}>{new Date(dataInicio).toLocaleDateString('pt-BR')}</td>
                    </tr>
                    <tr>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>QUANTIDADE DE DIAS:</strong></td>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}>{dias} DIAS</td>
                    </tr>
                    <tr>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>DATA DE RETORNO:</strong></td>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}>{dataFim}</td>
                    </tr>
                    <tr>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>ABONO PECUNIÁRIO (VENDA):</strong></td>
                       <td style={{padding: '8px', borderBottom: '1px solid #999'}}>{venderDias ? 'SIM (10 DIAS)' : 'NÃO'}</td>
                    </tr>
                 </tbody>
               </table>
            </div>

            {/* TERMO DE ACEITE */}
            <div style={{fontSize: '10pt', textAlign: 'justify', marginBottom: '40px', lineHeight: '1.5'}}>
               Declaro estar ciente de que a concessão das férias acima solicitadas está sujeita à aprovação da gerência, 
               respeitando a escala do setor e as disposições da CLT. Comprometo-me a não iniciar o gozo das férias 
               antes da assinatura oficial do Aviso de Férias.
            </div>

            {/* ASSINATURAS */}
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '80px'}}>
               <div style={{textAlign: 'center', width: '40%'}}>
                  <div style={{borderTop: '1px solid black', paddingTop: '5px'}}>ASSINATURA DO COLABORADOR</div>
                  <div style={{fontSize: '9pt', marginTop: '5px'}}>Data: ____/____/______</div>
               </div>

               <div style={{textAlign: 'center', width: '40%'}}>
                  <div style={{borderTop: '1px solid black', paddingTop: '5px'}}>APROVAÇÃO DO GESTOR</div>
                  <div style={{fontSize: '9pt', marginTop: '5px'}}>Data: ____/____/______</div>
               </div>
            </div>

            <div style={{marginTop: '50px', fontSize: '8pt', textAlign: 'center', color: '#666'}}>
               TechCorp Solutions - Documento Interno v2.4 - Gerado via Portal do Colaborador
            </div>

         </div>
      </div>

    </div>
  );
}