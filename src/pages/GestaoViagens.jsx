import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import './GestaoViagens.css'; 

// --- IMPORTAÇÕES DO FIREBASE ---
import { db, auth } from '../firebase';
import { ref, push, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

export default function GestaoViagens() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('minhas_viagens'); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();
  
  const [voucherParaImpressao, setVoucherParaImpressao] = useState(null);
  const [user, setUser] = useState(null);
  const [viagens, setViagens] = useState([]);

  // NOVO: Estado para o Modal de Alerta
  const [alerta, setAlerta] = useState({ visivel: false, tipo: '', titulo: '', mensagem: '' });

  // --- EFEITO PARA CARREGAR DADOS DO FIREBASE ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const viagensRef = ref(db, `viagens/${currentUser.uid}`);
        
        onValue(viagensRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const listaViagens = Object.keys(data).map(key => ({
              firebaseKey: key, 
              ...data[key]
            })).reverse(); 
            setViagens(listaViagens);
          } else {
            setViagens([]);
          }
        });
      } else {
        setUser(null);
        setViagens([]); 
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const [formData, setFormData] = useState({
    projeto: '', centro_custo: '', motivo: '', origem: '', destino: '', data_ida: '', data_volta: '',
    precisa_hotel: 'nao', hotel_pref: '', adiantamento: '0'
  });

  const handleInputChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // --- SUBMIT ATUALIZADO ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setAlerta({
        visivel: true,
        tipo: 'erro',
        titulo: 'Sessão Expirada',
        mensagem: 'Erro: Usuário não identificado. Faça login novamente.'
      });
      return;
    }

    setLoading(true);

    const novaViagem = {
      id: `TRIP-${Math.floor(Math.random() * 10000)}`, 
      origem: formData.origem || 'São Paulo', 
      destino: formData.destino || 'Destino X',
      data_ida: formData.data_ida, 
      data_volta: formData.data_volta, 
      motivo: formData.motivo,
      status: 'PENDENTE', 
      custo: 'A Calcular', 
      voo: 'A Definir', 
      hotel: formData.precisa_hotel === 'sim' ? 'A Definir' : '-',
      createdAt: Date.now() 
    };

    push(ref(db, `viagens/${user.uid}`), novaViagem)
      .then(() => {
        setLoading(false);
        // NOVO: Chama o Modal de Sucesso
        setAlerta({
          visivel: true,
          tipo: 'sucesso',
          titulo: 'Solicitação Enviada',
          mensagem: `A viagem para ${novaViagem.destino} foi registrada e enviada para aprovação do gestor.`
        });
        
        setActiveTab('minhas_viagens');
        setStep(1);
        setFormData({
          projeto: '', centro_custo: '', motivo: '', origem: '', destino: '', data_ida: '', data_volta: '',
          precisa_hotel: 'nao', hotel_pref: '', adiantamento: '0'
        });
      })
      .catch((error) => {
        console.error("Erro ao salvar viagem:", error);
        setLoading(false);
        // NOVO: Chama o Modal de Erro
        setAlerta({
          visivel: true,
          tipo: 'erro',
          titulo: 'Erro na Solicitação',
          mensagem: 'Não foi possível salvar os dados. Verifique sua conexão e tente novamente.'
        });
      });
  };

  const gerarVoucher = async (viagem) => {
    setVoucherParaImpressao(viagem);
    setTimeout(async () => {
      if(printRef.current) {
        const element = printRef.current;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Voucher_${viagem.id}.pdf`);
      }
      setVoucherParaImpressao(null);
    }, 500);
  };

  return (
    <div className="viagens-layout">
      
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>

      {/* HEADER ESPECÍFICO */}
      <header className="viagens-header">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
          <div style={{transform: 'scale(0.8)'}}><Logo /></div> 
          <span style={{color:'white', marginLeft:'10px', fontWeight: 'bold', fontSize: '1.2rem'}}>Viagens</span>
        </div>
        <div className="tech-profile" onClick={() => navigate('/dashboard')}>
          <span style={{color:'#94a3b8', fontSize:'0.9rem'}}>Voltar ao Menu ↩</span>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="viagens-scroll-content">
        <div className="page-header-tech">
          <h2>Gestão de Viagens Corporativas</h2>
          <div className="breadcrumbs-tech">Serviços / Viagens / Solicitações</div>
        </div>

        <div className="travel-tabs-glass">
          <button className={`travel-tab-glass ${activeTab === 'minhas_viagens' ? 'active' : ''}`} onClick={() => setActiveTab('minhas_viagens')}>✈ Minhas Viagens</button>
          <button className={`travel-tab-glass ${activeTab === 'nova_solicitacao' ? 'active' : ''}`} onClick={() => setActiveTab('nova_solicitacao')}>➕ Nova Solicitação</button>
        </div>

        {/* ABA 1: LISTA */}
        {activeTab === 'minhas_viagens' && (
          <div className="trip-grid-tech" style={{animation: 'fadeIn 0.5s', width: '100%', maxWidth: '1000px'}}>
            {viagens.length === 0 ? (
              <div style={{color: 'white', textAlign: 'center', padding: '20px'}}>Nenhuma viagem encontrada. Crie uma nova solicitação!</div>
            ) : (
              viagens.map(trip => (
                <div key={trip.firebaseKey || trip.id} className="trip-card-glass">
                  <div className={`trip-status-neon ${trip.status.toLowerCase()}`}>{trip.status}</div>
                  <div className="trip-glass-header">
                    <span className="trip-route-tech">{trip.origem.slice(0,3).toUpperCase()} <span className="arrow">➝</span> {trip.destino.slice(0,3).toUpperCase()}</span>
                    <span className="trip-id-tech">{trip.id}</span>
                  </div>
                  <div className="trip-glass-body">
                    <div className="trip-row-tech">
                      <div><span className="trip-label-tech">IDA</span><span className="trip-value-tech">{trip.data_ida}</span></div>
                      <div style={{textAlign:'right'}}><span className="trip-label-tech">VOLTA</span><span className="trip-value-tech">{trip.data_volta}</span></div>
                    </div>
                    <div className="trip-row-tech"><div><span className="trip-label-tech">MOTIVO</span><span className="trip-value-tech">{trip.motivo}</span></div></div>
                    <div className="tags-container">
                      <div className="glass-tag">🏨 {trip.hotel}</div>
                      <div className="glass-tag">✈ {trip.voo}</div>
                    </div>
                  </div>
                  <div className="trip-glass-actions">
                    <button className="btn-neon-outline" onClick={() => gerarVoucher(trip)}>📄 Baixar Voucher</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA 2: WIZARD */}
        {activeTab === 'nova_solicitacao' && (
          <div className="wizard-glass-container" style={{animation: 'fadeIn 0.5s', width: '100%', maxWidth: '800px'}}>
            <div className="wizard-steps-neon">
              <div className={`step-item-neon ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div><div className="step-line"></div>
              <div className={`step-item-neon ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div><div className="step-line"></div>
              <div className={`step-item-neon ${step >= 3 ? 'active' : ''}`}>3</div>
            </div>
            <div className="step-label-display">
              {step === 1 && "Dados do Projeto"} {step === 2 && "Logística & Datas"} {step === 3 && "Revisão Final"}
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="wizard-form-grid-tech">
                  <div className="form-group-tech full-width"><label>Motivo *</label><input className="glass-input" name="motivo" value={formData.motivo} onChange={handleInputChange} required /></div>
                  <div className="form-group-tech"><label>Centro de Custo *</label><select className="glass-input" name="centro_custo" value={formData.centro_custo} onChange={handleInputChange} required><option value="">Selecione...</option><option value="1000">1000 - Comercial</option><option value="2000">2000 - TI</option></select></div>
                  <div className="form-group-tech"><label>Projeto (Opcional)</label><input className="glass-input" name="projeto" value={formData.projeto} onChange={handleInputChange} /></div>
                </div>
              )}
              {step === 2 && (
                <div className="wizard-form-grid-tech">
                  <div className="form-group-tech"><label>Origem *</label><input className="glass-input" name="origem" value={formData.origem} onChange={handleInputChange} required /></div>
                  <div className="form-group-tech"><label>Destino *</label><input className="glass-input" name="destino" value={formData.destino} onChange={handleInputChange} required /></div>
                  <div className="form-group-tech"><label>Ida *</label><input className="glass-input" name="data_ida" value={formData.data_ida} onChange={handleInputChange} type="date" required /></div>
                  <div className="form-group-tech"><label>Volta *</label><input className="glass-input" name="data_volta" value={formData.data_volta} onChange={handleInputChange} type="date" required /></div>
                  <div className="form-group-tech"><label>Hotel?</label><select className="glass-input" name="precisa_hotel" value={formData.precisa_hotel} onChange={handleInputChange}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
                  {formData.precisa_hotel === 'sim' && (<div className="form-group-tech"><label>Preferência</label><input className="glass-input" name="hotel_pref" value={formData.hotel_pref} onChange={handleInputChange} /></div>)}
                  <div className="form-group-tech full-width"><label>Adiantamento (R$)</label><input className="glass-input" name="adiantamento" type="number" value={formData.adiantamento} onChange={handleInputChange} /></div>
                </div>
              )}
              {step === 3 && (
                <div className="wizard-review-glass">
                  <h4 className="neon-text">Resumo</h4>
                  <div className="review-item"><strong>Motivo:</strong> <span>{formData.motivo}</span></div>
                  <div className="review-item"><strong>Rota:</strong> <span>{formData.origem} ➝ {formData.destino}</span></div>
                  <div className="review-item"><strong>Período:</strong> <span>{formData.data_ida} até {formData.data_volta}</span></div>
                  <div className="review-item"><strong>Adiantamento:</strong> <span className="highlight-money">R$ {formData.adiantamento}</span></div>
                </div>
              )}
              <div className="wizard-footer-tech">
                {step > 1 ? <button type="button" className="btn-glass-secondary" onClick={prevStep}>Anterior</button> : <div></div>}
                {step < 3 ? <button type="button" className="btn-neon-primary" onClick={nextStep}>Próximo</button> : <button type="submit" className="btn-neon-primary" disabled={loading}>{loading ? 'Enviando...' : 'Confirmar'}</button>}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* NOVO: MODAL DE ALERTA CUSTOMIZADO (Sucesso ou Erro) */}
      {alerta.visivel && (
        <div className="modal-overlay" onClick={() => setAlerta({ ...alerta, visivel: false })}>
          <div className="modal-content-tech alert-modal" onClick={e => e.stopPropagation()}>
            
            <div className={`alert-icon-box ${alerta.tipo}`}>
              {alerta.tipo === 'sucesso' ? '✓' : '✖'}
            </div>
            
            <h3 className="alert-title">{alerta.titulo}</h3>
            <p className="alert-msg">{alerta.mensagem}</p>
            
            <button className={`btn-alert ${alerta.tipo}`} onClick={() => setAlerta({ ...alerta, visivel: false })}>
              Confirmar
            </button>
            
          </div>
        </div>
      )}

      {/* PDF TEMPLATE */}
      <div className="print-hidden-wrapper">
        {voucherParaImpressao && (
        <div ref={printRef} className="print-voucher-page">
            <div className="voucher-header">
                <Logo lightMode={true} size={1.2} />
                <div style={{textAlign:'right'}}><h1 className="voucher-title">Voucher de Viagem</h1><p>#{voucherParaImpressao.id}</p></div>
            </div>
            <div className="voucher-section"><div className="voucher-sec-title">DADOS</div><div className="voucher-sec-content"><div className="v-item"><strong>Nome</strong><span>COLABORADOR</span></div><div className="v-item"><strong>Status</strong><span>CONFIRMADO</span></div></div></div>
            <div className="voucher-section"><div className="voucher-sec-title">ITINERÁRIO</div><div className="voucher-sec-content"><div className="v-item"><strong>Origem</strong><span>{voucherParaImpressao.origem}</span></div><div className="v-item"><strong>Destino</strong><span>{voucherParaImpressao.destino}</span></div><div className="v-item"><strong>Voo</strong><span>{voucherParaImpressao.voo}</span></div></div></div>
            <div style={{marginTop:'50px',textAlign:'center'}}>TechCorp Travel Solutions</div>
        </div>
        )}
      </div>
    </div>
  );
}