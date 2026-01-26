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
  
  // Dados do usuário logado
  const [userData, setUserData] = useState({ nome: '', cargo: '', matricula: '' });

  // Campos do Formulário
  const [dataInicio, setDataInicio] = useState('');
  const [dias, setDias] = useState(30);
  const [venderDias, setVenderDias] = useState(false);
  const [dataFim, setDataFim] = useState('---');
  
  // NOVOS CAMPOS
  const [substituto, setSubstituto] = useState('');
  const [contato, setContato] = useState('');
  const [observacao, setObservacao] = useState('');

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

  // Calcula Data Fim
  useEffect(() => {
    if (dataInicio && dias) {
      const date = new Date(dataInicio);
      const dataFinal = new Date(date);
      dataFinal.setDate(dataFinal.getDate() + parseInt(dias));
      setDataFim(dataFinal.toLocaleDateString('pt-BR'));
    }
  }, [dataInicio, dias]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        await push(ref(db, 'solicitacoes/ferias'), {
            userId: auth.currentUser.uid,
            solicitanteNome: userData.nome || 'Usuário',
            solicitanteCargo: userData.cargo || 'Cargo',
            inicio: dataInicio,
            dias: dias,
            vender: venderDias,
            // NOVOS DADOS SALVOS
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

      <div className="ferias-container-tech">
        
        <div className="page-header-tech">
          <h2>Agendamento de Férias</h2>
          <p>Preencha os dados abaixo para análise da gestão.</p>
        </div>

        <div className="layout-grid-ferias">
          
          {/* FORMULÁRIO DE SOLICITAÇÃO */}
          <div className="ferias-card-glass">
            <h4 className="section-title-tech">Dados da Solicitação</h4>

            <form onSubmit={handleSubmit} className="ferias-form">
              
              {/* Linha 1: Datas */}
              <div className="form-row-ferias">
                <div className="form-group-tech" style={{flex: 1}}>
                    <label>Início das Férias *</label>
                    <input type="date" min={hoje} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
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

              {/* Linha 2: Responsáveis */}
              <div className="form-row-ferias">
                <div className="form-group-tech" style={{flex: 1.5}}>
                    <label>Substituto no Período *</label>
                    <input 
                        type="text" 
                        placeholder="Quem assume suas demandas?" 
                        value={substituto} 
                        onChange={(e) => setSubstituto(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group-tech" style={{flex: 1}}>
                    <label>Contato Emergência *</label>
                    <input 
                        type="text" 
                        placeholder="(11) 99999-9999" 
                        value={contato} 
                        onChange={(e) => setContato(e.target.value)} 
                        required 
                    />
                </div>
              </div>

              {/* Linha 3: Extras */}
              <div className="form-group-tech">
                <label>Observações para o Gestor</label>
                <textarea 
                    rows="2" 
                    placeholder="Ex: Projetos já entregues, pendências alinhadas..."
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                ></textarea>
              </div>

              <div className="checkbox-group-tech">
                <input type="checkbox" id="venderCheck" checked={venderDias} onChange={() => setVenderDias(!venderDias)} disabled={dias == 30} /> 
                <label htmlFor="venderCheck">Solicitar Abono Pecuniário (Venda de 10 dias)</label>
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

          {/* PAINEL INFORMATIVO */}
          <div className="ferias-card-glass fit-content">
            <h4 className="section-title-tech">Resumo do Período</h4>
            <div className="info-summary-tech">
                <div className="summary-item">
                    <span>Período Aquisitivo</span>
                    <strong>2024 - 2025</strong>
                </div>
                <div className="summary-item">
                    <span>Saldo Disponível</span>
                    <strong style={{color: 'var(--neon-green)'}}>30 Dias</strong>
                </div>
                <div className="summary-item">
                    <span>Vencimento Limite</span>
                    <strong>02/12/2026</strong>
                </div>
            </div>
            
            <div className="alert-box-tech">
                ℹ Lembre-se de alinhar com seu substituto as entregas pendentes antes de sair.
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL SUCESSO --- */}
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

      {/* --- PDF TEMPLATE (ATUALIZADO) --- */}
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
               <h3 style={{fontSize: '16pt', marginTop: '20px', textDecoration: 'underline'}}>AVISO E RECIBO DE FÉRIAS</h3>
            </div>
            
            <div style={{marginBottom: '30px'}}>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>NOME:</strong> {userData.nome?.toUpperCase()}</p>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>CARGO:</strong> {userData.cargo?.toUpperCase()}</p>
               <p style={{borderBottom: '1px solid #ccc', paddingBottom: '5px'}}><strong>MATRÍCULA:</strong> {userData.matricula || '---'}</p>
            </div>

            <div style={{marginBottom: '30px', border: '1px solid black', padding: '15px'}}>
               <h4 style={{marginTop: 0, backgroundColor: '#eee', padding: '5px'}}>DADOS DO AGENDAMENTO</h4>
               <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                 <tbody>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>INÍCIO DO GOZO:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{new Date(dataInicio).toLocaleDateString('pt-BR')}</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>DIAS SOLICITADOS:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{dias} DIAS</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>DATA DE RETORNO:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{dataFim}</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>SUBSTITUTO:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{substituto.toUpperCase()}</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>CONTATO DE EMERGÊNCIA:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{contato}</td></tr>
                    <tr><td style={{padding: '8px', borderBottom: '1px solid #999'}}><strong>ABONO PECUNIÁRIO:</strong></td><td style={{padding: '8px', borderBottom: '1px solid #999'}}>{venderDias ? 'SIM (10 DIAS)' : 'NÃO'}</td></tr>
                 </tbody>
               </table>
            </div>

            <div style={{fontSize: '10pt', textAlign: 'justify', marginBottom: '40px', lineHeight: '1.5'}}>
               Declaro estar ciente de que a concessão das férias acima solicitadas está sujeita à aprovação da gerência. 
               {observacao && <><br/><br/><strong>OBSERVAÇÕES:</strong> {observacao}</>}
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