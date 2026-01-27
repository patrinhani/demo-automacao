import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import { db, auth } from '../firebase';
import { ref, push, get } from 'firebase/database';
import './Ferias.css';

export default function Ferias() {
  const navigate = useNavigate();
  const formRef = useRef();
  
  const [userData, setUserData] = useState({ nome: '', cargo: '', matricula: '' });
  const [dataInicio, setDataInicio] = useState('');
  const [dias, setDias] = useState(30);
  const [venderDias, setVenderDias] = useState(false);
  const [dataFim, setDataFim] = useState('---');
  const [substituto, setSubstituto] = useState('');
  const [contato, setContato] = useState('');
  const [observacao, setObservacao] = useState('');
  const [conflito, setConflito] = useState(false);
  const [erroData, setErroData] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchUser = async () => {
        const user = auth.currentUser;
        if(user) {
            const snap = await get(ref(db, `users/${user.uid}`));
            if(snap.exists()) setUserData(snap.val());
        }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (dataInicio && dias) {
      const date = new Date(dataInicio);
      const diaSemana = date.getUTCDay();

      if (diaSemana === 4 || diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
        setErroData("🚫 Inícios permitidos: Seg a Qua.");
        setDataFim('---');
        return;
      } else {
        setErroData('');
      }

      const dataFinal = new Date(date);
      dataFinal.setDate(dataFinal.getDate() + parseInt(dias));
      setDataFim(dataFinal.toLocaleDateString('pt-BR'));

      // Simulação de conflito visual
      const mes = date.getMonth();
      if (mes === 0 || mes === 6) setConflito(true);
      else setConflito(false);
    }
  }, [dataInicio, dias]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (erroData || conflito) return alert("Verifique os erros antes de enviar.");
    setLoading(true);

    try {
        await push(ref(db, 'solicitacoes/ferias'), {
            userId: auth.currentUser.uid,
            solicitanteNome: userData.nome || 'Usuário',
            solicitanteCargo: userData.cargo || 'Cargo',
            inicio: dataInicio,
            dias: dias,
            vender: venderDias,
            substituto: substituto,
            contatoEmergencia: contato,
            observacao: observacao,
            status: 'pendente',
            createdAt: new Date().toISOString()
        });

        setShowModal(true);
    } catch (error) {
        alert("Erro ao solicitar: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const gerarPDF = async () => {
    setLoadingPDF(true);
    setTimeout(async () => {
      const element = formRef.current;
      try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.8); 
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save(`Ferias_${dataInicio}.pdf`);
      } catch (error) {
        console.error("Erro PDF:", error);
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
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      {/* Container Principal (100% largura) */}
      <div className="ferias-container-tech">
        
        {/* Wrapper Centralizado (1200px máx) */}
        <div className="ferias-content-wrapper">
            
            <div className="page-header-techFe">
              <h2>Agendamento de Férias</h2>
              <p>Preencha os dados abaixo para análise da gestão.</p>
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
                <h4 className="section-title-tech">Dados da Solicitação</h4>

                <form onSubmit={handleSubmit} className="ferias-form">
                  
                  <div className="form-row-ferias">
                    <div className="form-group-tech" style={{flex: 1}}>
                        <label>Início das Férias *</label>
                        <input type="date" min={hoje} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required className={erroData ? 'input-error' : ''} />
                        {erroData && <div className="error-msg-tech">{erroData}</div>}
                    </div>
                    <div className="form-group-tech" style={{flex: 1}}>
                        <label>Duração *</label>
                        <select value={dias} onChange={(e) => setDias(e.target.value)}>
                            <option value={30}>30 Dias Corridos</option>
                            <option value={20}>20 Dias (Vender 10)</option>
                            <option value={15}>15 Dias (Fracionar)</option>
                        </select>
                    </div>
                  </div>

                  <div className="form-row-ferias">
                    <div className="form-group-tech" style={{flex: 1.5}}>
                        <label>Substituto *</label>
                        <input type="text" placeholder="Nome do colega" value={substituto} onChange={(e) => setSubstituto(e.target.value)} required />
                    </div>
                    <div className="form-group-tech" style={{flex: 1}}>
                        <label>Emergência *</label>
                        <input type="text" placeholder="(DD) Telefone" value={contato} onChange={(e) => setContato(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group-tech">
                    <label>Observações</label>
                    <textarea rows="2" placeholder="Opcional..." value={observacao} onChange={(e) => setObservacao(e.target.value)}></textarea>
                  </div>

                  <div className="checkbox-group-tech">
                    <input type="checkbox" id="venderCheck" checked={venderDias} onChange={() => setVenderDias(!venderDias)} disabled={dias == 30} /> 
                    <label htmlFor="venderCheck">Solicitar Abono Pecuniário (Venda)</label>
                  </div>

                  <div className="prediction-box">
                    <span>PREVISÃO DE RETORNO</span>
                    <strong>{dataFim}</strong>
                  </div>

                  <button type="submit" className="btn-validar-tech" disabled={loading}>
                    {loading ? 'Processando...' : 'ENVIAR SOLICITAÇÃO'}
                  </button>
                </form>
              </div>

              <div className="ferias-card-glass fit-content">
                <h4 className="section-title-tech">Escala da Equipe</h4>
                {conflito && <div className="alert-box-tech" style={{background: 'rgba(239, 68, 68, 0.2)', borderLeft: '3px solid #ef4444', color: '#fca5a5'}}>⚠ Conflito de datas detectado!</div>}
                <ul className="team-list-tech">
                  <li className="team-item-tech"><div><strong>Carlos (TI)</strong><span>DevOps</span></div><span className="status-badge-tech ferias">FÉRIAS (JAN)</span></li>
                  <li className="team-item-tech"><div><strong>Duda (Design)</strong><span>UX/UI</span></div><span className="status-badge-tech ferias">FÉRIAS (JUL)</span></li>
                  <li className="team-item-tech"><div><strong>Ana (Gerente)</strong><span>Gestão</span></div><span className="status-badge-tech presente">PRESENTE</span></li>
                </ul>
              </div>
            </div>

        </div> {/* Fim do Wrapper */}
      </div>

      {showModal && (
        <div className="modal-overlay-tech">
          <div className="modal-card-tech glass-effect">
            <div className="modal-icon">✅</div>
            <h3>Solicitação Enviada!</h3>
            <p>Seu gestor receberá o pedido para aprovação.</p>
            <div className="modal-actions">
               <button onClick={() => navigate('/dashboard')} className="btn-secondary-tech">Voltar</button>
               <button onClick={gerarPDF} disabled={loadingPDF} className="btn-primary-tech">
                 {loadingPDF ? 'Gerando...' : '🖨 Baixar Recibo'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF TEMPLATE */}
      <div className="pdf-hidden-template">
         <div ref={formRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '20mm', boxSizing: 'border-box', fontFamily: 'Times New Roman, serif', color: 'black', border: '1px solid black' }}>
            <div style={{textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px'}}>
               <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px', transform: 'scale(1.5)'}}><Logo lightMode={true} /></div>
               <h2 style={{fontSize: '14pt', margin: '5px 0', fontWeight: 'normal'}}>DEPARTAMENTO DE RECURSOS HUMANOS</h2>
               <h3 style={{fontSize: '16pt', marginTop: '20px', textDecoration: 'underline'}}>AVISO E RECIBO DE FÉRIAS</h3>
            </div>
            <div style={{marginBottom: '30px'}}>
               <p><strong>NOME:</strong> {userData.nome?.toUpperCase()}</p>
               <p><strong>CARGO:</strong> {userData.cargo?.toUpperCase()}</p>
            </div>
            <div style={{marginBottom: '30px', border: '1px solid black', padding: '15px'}}>
               <h4 style={{marginTop: 0, backgroundColor: '#eee', padding: '5px'}}>DADOS</h4>
               <p><strong>INÍCIO:</strong> {new Date(dataInicio).toLocaleDateString('pt-BR')}</p>
               <p><strong>DIAS:</strong> {dias}</p>
               <p><strong>RETORNO:</strong> {dataFim}</p>
               <p><strong>SUBSTITUTO:</strong> {substituto.toUpperCase()}</p>
            </div>
            <div style={{textAlign: 'center', marginTop: '80px'}}>___________________________________<br/>Assinatura</div>
         </div>
      </div>
    </div>
  );
}