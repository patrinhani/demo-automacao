import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import './Ferias.css';

export default function Ferias() {
  const navigate = useNavigate();
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

  // --- FUNÇÃO FINAL OTIMIZADA (Leve e Sem Bugs) ---
  const gerarPDF = async () => {
    setLoadingPDF(true);
    
    // Pequeno delay para garantir que o elemento está renderizado no DOM
    setTimeout(async () => {
      const element = formRef.current;
      
      try {
        const canvas = await html2canvas(element, {
          scale: 2, // Mantém boa qualidade
          backgroundColor: '#ffffff', // Força fundo branco se for transparente
          logging: false,
          useCORS: true
        });

        // TRUQUE DO TAMANHO: Usar JPEG com qualidade 0.7
        // Isso reduz o arquivo drasticamente (de MBs para KBs)
        const imgData = canvas.toDataURL('image/jpeg', 0.7); 
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Adiciona imagem JPEG comprimida
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        const nomeArquivo = `Solicitacao_Ferias_${dataInicio}.pdf`;
        pdf.save(nomeArquivo);

        // Alert removido! O usuário só vê o botão voltar ao normal.
        
      } catch (error) {
        console.error("Erro:", error);
      }

      setLoadingPDF(false);
    }, 500);
  };

  return (
    <div className="tech-layout-ferias">
      
      {/* LUZES DE FUNDO */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      {/* HEADER */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Programação de Férias</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="ferias-container-tech">
        
        <div className="page-header-tech">
          <h2>Agendamento</h2>
          <p>RH &gt; Portal do Colaborador &gt; Minhas Férias</p>
        </div>

        {/* CARD PERÍODO AQUISITIVO */}
        <div className="ferias-card-glass">
          <div className="card-header-flex">
            <div>
              <h4 className="card-title-tech">Período Aquisitivo</h4>
              <span className="card-subtitle-tech">Ciclo 2025 - 2026</span>
            </div>
            <div className="vencimento-box">
              <span>Vencimento Limite</span>
              <strong>02/12/2026</strong>
            </div>
          </div>
          
          <div className="tech-progress-container">
            <div className="tech-progress-bar"></div>
          </div>
          <div className="progress-label">
            30 DIAS DISPONÍVEIS
          </div>
        </div>

        <div className="layout-grid-ferias">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div className="ferias-card-glass">
            <h4 className="section-title-tech">Configurar Solicitação</h4>

            <form onSubmit={handleSubmit} className="ferias-form">
              <div className="form-group-tech">
                <label>Início das Férias</label>
                <input type="date" min={hoje} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required className={erroData ? 'input-error' : ''}/>
                {erroData ? <div className="error-msg-tech">{erroData}</div> : <small className="helper-text">*Permitido apenas seg, ter ou qua.</small>}
              </div>

              <div className="form-group-tech">
                <label>Quantidade de Dias</label>
                <select value={dias} onChange={(e) => setDias(e.target.value)}>
                  <option value={30}>30 Dias Corridos</option>
                  <option value={20}>20 Dias (Vender 10)</option>
                  <option value={15}>15 Dias (Fracionar)</option>
                </select>
              </div>

              <div className="checkbox-group-tech">
                <input type="checkbox" id="venderCheck" checked={venderDias} onChange={() => setVenderDias(!venderDias)} disabled={dias == 30} /> 
                <label htmlFor="venderCheck" onClick={() => dias != 30 && setVenderDias(!venderDias)}>Solicitar Abono Pecuniário (Vender Férias)</label>
              </div>

              <div className="prediction-box">
                <span>PREVISÃO DE RETORNO</span>
                <strong>{dataFim}</strong>
              </div>

              <button type="submit" className="btn-validar-tech">
                VALIDAR AGENDAMENTO
              </button>
            </form>
          </div>

          {/* COLUNA DIREITA: ESCALA */}
          <div className="ferias-card-glass fit-content">
            <h4 className="section-title-tech">Escala da Equipe</h4>
            {conflito && <div className="conflict-alert-tech"><strong>⚠ CONFLITO DETECTADO:</strong><br/>Limite de ausências excedido.</div>}
            <ul className="team-list-tech">
              <li className="team-item-tech"><div><strong>Carlos (TI)</strong><span>DevOps</span></div><span className="status-badge-tech ferias">FÉRIAS (JAN)</span></li>
              <li className="team-item-tech"><div><strong>Duda (Design)</strong><span>UX/UI</span></div><span className="status-badge-tech ferias">FÉRIAS (JUL)</span></li>
              <li className="team-item-tech"><div><strong>Ana (Gerente)</strong><span>Gestão</span></div><span className="status-badge-tech presente">PRESENTE</span></li>
              <li className="team-item-tech opacity-50"><div><strong>Você</strong><span>Analista</span></div><span>---</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- POPUP (MODAL DARK) --- */}
      {showModal && (
        <div className="modal-overlay-tech">
          <div className="modal-card-tech glass-effect">
            <div className="modal-icon">✅</div>
            <h3>Solicitação Realizada!</h3>
            
            <p>
              Sua pré-reserva foi enviada para o sistema. <br/>
              Para efetivar, imprima o formulário abaixo, colete a assinatura do seu gestor e entregue no RH (Sala 204).
            </p>

            <div className="modal-actions">
               <button onClick={handleCloseModal} disabled={loadingPDF} className="btn-secondary-tech">
                 Fechar
               </button>
               <button onClick={gerarPDF} disabled={loadingPDF} className="btn-primary-tech">
                 {loadingPDF ? 'Gerando...' : '🖨 Imprimir Formulário'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TEMPLATE PDF (Agora fica atrás do site, mas visível para o script) --- */}
      <div className="pdf-hidden-template">
         <div ref={formRef} style={{
            width: '210mm', minHeight: '297mm', background: 'white', padding: '20mm', boxSizing: 'border-box',
            fontFamily: 'Times New Roman, serif', color: 'black', border: '1px solid black'
         }}>
            <div style={{textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px'}}>
               <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px', transform: 'scale(1.5)'}}>
                  <Logo lightMode={true} />
               </div>
               <h2 style={{fontSize: '14pt', margin: '5px 0', fontWeight: 'normal'}}>DEPARTAMENTO DE RECURSOS HUMANOS</h2>
               <h3 style={{fontSize: '16pt', marginTop: '20px', textDecoration: 'underline'}}>SOLICITAÇÃO DE FÉRIAS</h3>
            </div>
            {/* ... Resto do template igual ... */}
            <div style={{marginBottom: '30px'}}>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>NOME:</strong> YAN RODRIGUES</p>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>CARGO:</strong> ANALISTA PLENO</p>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>DEPARTAMENTO:</strong> TECNOLOGIA DA INFORMAÇÃO</p>
               <p><strong>MATRÍCULA:</strong> 829304</p>
            </div>
            <div style={{marginBottom: '30px', border: '1px solid black', padding: '15px'}}>
               <h4 style={{marginTop: 0, backgroundColor: '#eee', padding: '5px'}}>DETALHES DA SOLICITAÇÃO</h4>
               <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                 <tbody>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>DATA DE INÍCIO:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{new Date(dataInicio).toLocaleDateString('pt-BR')}</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>QUANTIDADE DE DIAS:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{dias} DIAS</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>DATA DE RETORNO:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{dataFim}</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>ABONO PECUNIÁRIO (VENDA):</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{venderDias ? 'SIM (10 DIAS)' : 'NÃO'}</td></tr>
                 </tbody>
               </table>
            </div>
            <div style={{fontSize: '10pt', textAlign: 'justify', marginBottom: '40px', lineHeight: '1.5'}}>
               Declaro estar ciente de que a concessão das férias acima solicitadas está sujeita à aprovação da gerência.
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '80px'}}>
               <div style={{textAlign: 'center', width: '40%'}}><div style={{borderTop: '1px solid black', paddingTop: '5px'}}>ASSINATURA DO COLABORADOR</div></div>
               <div style={{textAlign: 'center', width: '40%'}}><div style={{borderTop: '1px solid black', paddingTop: '5px'}}>APROVAÇÃO DO GESTOR</div></div>
            </div>
         </div>
      </div>
    </div>
  );
}