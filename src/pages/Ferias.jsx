import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db, auth } from '../firebase'; // Importação do Firebase
import { ref, push, set } from "firebase/database"; // Funções de escrita
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
  const [salvando, setSalvando] = useState(false); // Novo estado de loading

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (dataInicio && dias) {
      const date = new Date(dataInicio);
      const diaSemana = date.getUTCDay();

      // Regra: Não começar quinta(4), sexta(5), sábado(6) ou domingo(0)
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

      // Simulação de conflito (apenas visual)
      const mes = date.getMonth();
      if (mes === 0 || mes === 6) setConflito(true);
      else setConflito(false);
    }
  }, [dataInicio, dias]);

  // --- SALVAR NO FIREBASE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (erroData) return alert("Corrija a data antes de continuar.");
    if (conflito) return alert("ERRO DE CONFLITO: Escolha outra data.");

    const user = auth.currentUser;
    if (!user) return alert("Usuário não autenticado.");

    setSalvando(true);

    try {
      // Cria uma referência única para esta solicitação
      const feriasRef = ref(db, `ferias/${user.uid}`);
      const novaSolicitacaoRef = push(feriasRef);

      // Salva os dados
      await set(novaSolicitacaoRef, {
        dataInicio: dataInicio,
        dias: parseInt(dias),
        dataFim: dataFim,
        venderDias: venderDias,
        status: 'pendente', // pendente, aprovado, rejeitado
        solicitadoEm: new Date().toISOString()
      });

      // Sucesso: Abre o modal para imprimir
      setShowModal(true);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar solicitação.");
    } finally {
      setSalvando(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/dashboard');
  };

  const gerarPDF = async () => {
    setLoadingPDF(true);
    setTimeout(async () => {
      const element = formRef.current;
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.7); 
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Solicitacao_Ferias_${dataInicio}.pdf`);
      } catch (error) {
        console.error("Erro:", error);
      }
      setLoadingPDF(false);
    }, 500);
  };

  return (
    <div className="tech-layout-ferias">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Programação de Férias</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</button>
      </header>

      <div className="ferias-container-tech">
        <div className="page-header-tech">
          <h2>Agendamento</h2>
          <p>RH &gt; Portal do Colaborador &gt; Minhas Férias</p>
        </div>

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
          <div className="progress-label">30 DIAS DISPONÍVEIS</div>
        </div>

        <div className="layout-grid-ferias">
          <div className="ferias-card-glass">
            <h4 className="section-title-tech">Configurar Solicitação</h4>
            <form onSubmit={handleSubmit} className="ferias-form">
              <div className="form-group-tech">
                <label>Início das Férias</label>
                <input type="date" min={hoje} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required className={erroData ? 'input-error' : ''}/>
                {erroData && <div className="error-msg-tech">{erroData}</div>}
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

              <button type="submit" className="btn-validar-tech" disabled={salvando}>
                {salvando ? 'Salvando...' : 'VALIDAR AGENDAMENTO'}
              </button>
            </form>
          </div>

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

      {showModal && (
        <div className="modal-overlay-tech">
          <div className="modal-card-tech glass-effect">
            <div className="modal-icon">✅</div>
            <h3>Solicitação Realizada!</h3>
            <p>Seus dados foram salvos no sistema. Opcionalmente, você pode imprimir o comprovante abaixo.</p>
            <div className="modal-actions">
               <button onClick={handleCloseModal} disabled={loadingPDF} className="btn-secondary-tech">Fechar</button>
               <button onClick={gerarPDF} disabled={loadingPDF} className="btn-primary-tech">{loadingPDF ? 'Gerando...' : '🖨 Imprimir PDF'}</button>
            </div>
          </div>
        </div>
      )}

      {/* O Template do PDF continua aqui, igual ao anterior... */}
      <div className="pdf-hidden-template">
         <div ref={formRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '20mm', boxSizing: 'border-box', fontFamily: 'Times New Roman, serif', color: 'black', border: '1px solid black' }}>
            <div style={{textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px'}}>
               <h2 style={{fontSize: '14pt', margin: '5px 0', fontWeight: 'normal'}}>DEPARTAMENTO DE RECURSOS HUMANOS</h2>
               <h3 style={{fontSize: '16pt', marginTop: '20px', textDecoration: 'underline'}}>SOLICITAÇÃO DE FÉRIAS</h3>
            </div>
            <div style={{marginBottom: '30px', border: '1px solid black', padding: '15px'}}>
               <h4 style={{marginTop: 0, backgroundColor: '#eee', padding: '5px'}}>DETALHES DA SOLICITAÇÃO</h4>
               <p><strong>DATA DE INÍCIO:</strong> {new Date(dataInicio).toLocaleDateString('pt-BR')}</p>
               <p><strong>DIAS:</strong> {dias}</p>
               <p><strong>RETORNO:</strong> {dataFim}</p>
            </div>
            <div style={{textAlign: 'center', marginTop: '50px'}}>___________________________________<br/>Assinatura</div>
         </div>
      </div>
    </div>
  );
}