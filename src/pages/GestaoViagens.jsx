import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import '../App.css';
import './GestaoViagens.css';

export default function GestaoViagens() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('minhas_viagens'); // 'minhas_viagens' | 'nova_solicitacao'
  const [step, setStep] = useState(1); // 1, 2, 3
  const [loading, setLoading] = useState(false);
  const printRef = useRef();
  
  // Estado para armazenar qual voucher será impresso
  const [voucherParaImpressao, setVoucherParaImpressao] = useState(null);

  // Mock de Viagens Anteriores
  const [viagens, setViagens] = useState([
    { 
      id: 'TRIP-9021', 
      origem: 'São Paulo (GRU)', destino: 'Rio de Janeiro (SDU)', 
      data_ida: '10/11/2024', data_volta: '12/11/2024', 
      motivo: 'Visita Cliente Petrobras', 
      status: 'APROVADO', custo: 'R$ 1.250,00',
      voo: 'LA3402', hotel: 'Windsor Barra'
    },
    { 
      id: 'TRIP-8840', 
      origem: 'São Paulo (CGH)', destino: 'Brasília (BSB)', 
      data_ida: '05/10/2024', data_volta: '06/10/2024', 
      motivo: 'Reunião Regulatória', 
      status: 'CONCLUÍDO', custo: 'R$ 2.100,00',
      voo: 'G3 1440', hotel: 'B Hotel'
    }
  ]);

  // Form Data do Wizard
  const [formData, setFormData] = useState({
    projeto: '', centro_custo: '', motivo: '',
    origem: '', destino: '', data_ida: '', data_volta: '',
    precisa_hotel: 'nao', hotel_pref: '',
    adiantamento: '0'
  });

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Cria a nova viagem
      const novaViagem = {
        id: `TRIP-${Math.floor(Math.random() * 10000)}`,
        origem: formData.origem || 'São Paulo',
        destino: formData.destino || 'Destino X',
        data_ida: formData.data_ida,
        data_volta: formData.data_volta,
        motivo: formData.motivo,
        status: 'PENDENTE',
        custo: 'A Calcular',
        voo: 'A Definir', hotel: formData.precisa_hotel === 'sim' ? 'A Definir' : '-'
      };
      
      setViagens([novaViagem, ...viagens]);
      setLoading(false);
      alert('Solicitação de viagem enviada para aprovação do gestor!');
      setActiveTab('minhas_viagens');
      setStep(1); // Reset
    }, 1500);
  };

  const gerarVoucher = async (viagem) => {
    setVoucherParaImpressao(viagem);
    // Delay para renderizar o hidden div
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
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="page-header">
          <h2>Gestão de Viagens Corporativas</h2>
          <div className="breadcrumbs">Serviços &gt; Viagens &gt; Solicitações</div>
        </div>

        {/* TABS DE NAVEGAÇÃO */}
        <div className="travel-tabs">
          <button 
            className={`travel-tab-btn ${activeTab === 'minhas_viagens' ? 'active' : ''}`}
            onClick={() => setActiveTab('minhas_viagens')}
          >
            ✈ Minhas Viagens
          </button>
          <button 
            className={`travel-tab-btn ${activeTab === 'nova_solicitacao' ? 'active' : ''}`}
            onClick={() => setActiveTab('nova_solicitacao')}
          >
            ➕ Nova Solicitação
          </button>
        </div>

        {/* === ABA 1: DASHBOARD DE VIAGENS === */}
        {activeTab === 'minhas_viagens' && (
          <div className="trip-grid" style={{animation: 'fadeIn 0.3s'}}>
            {viagens.map(trip => (
              <div key={trip.id} className="trip-card">
                <div className="trip-status" style={{color: trip.status === 'APROVADO' ? 'green' : trip.status === 'CONCLUÍDO' ? 'blue' : 'orange'}}>
                  {trip.status}
                </div>
                <div className="trip-header">
                  <span className="trip-route">{trip.origem.slice(0,3).toUpperCase()} ➝ {trip.destino.slice(0,3).toUpperCase()}</span>
                  <span className="trip-id">{trip.id}</span>
                </div>
                <div className="trip-body">
                  <div className="trip-row">
                    <div><span className="trip-label">IDA</span><span className="trip-value">{trip.data_ida}</span></div>
                    <div style={{textAlign:'right'}}><span className="trip-label">VOLTA</span><span className="trip-value">{trip.data_volta}</span></div>
                  </div>
                  <div className="trip-row">
                    <div><span className="trip-label">MOTIVO</span><span className="trip-value">{trip.motivo}</span></div>
                  </div>
                  <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    <div style={{background:'#f1f3f5', padding:'5px 10px', borderRadius:'4px', fontSize:'0.8rem'}}>🏨 {trip.hotel}</div>
                    <div style={{background:'#f1f3f5', padding:'5px 10px', borderRadius:'4px', fontSize:'0.8rem'}}>✈ {trip.voo}</div>
                  </div>
                </div>
                <div className="trip-actions">
                  <button className="btn-secondary" onClick={() => gerarVoucher(trip)}>
                    📄 Baixar Voucher
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === ABA 2: WIZARD DE SOLICITAÇÃO === */}
        {activeTab === 'nova_solicitacao' && (
          <div className="wizard-container" style={{animation: 'fadeIn 0.3s'}}>
            
            {/* Indicador de Passos */}
            <div className="wizard-steps">
              <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1 <span className="step-label">Dados</span></div>
              <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2 <span className="step-label">Logística</span></div>
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3 <span className="step-label">Revisão</span></div>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* PASSO 1: DADOS BÁSICOS */}
              {step === 1 && (
                <div className="wizard-form-grid">
                  <div className="form-group full-width">
                    <label>Motivo da Viagem *</label>
                    <input name="motivo" value={formData.motivo} onChange={handleInputChange} type="text" placeholder="Ex: Reunião com Cliente X" required />
                  </div>
                  <div className="form-group">
                    <label>Centro de Custo *</label>
                    <select name="centro_custo" value={formData.centro_custo} onChange={handleInputChange} required>
                      <option value="">Selecione...</option>
                      <option value="1000">1000 - Comercial</option>
                      <option value="2000">2000 - TI / Infra</option>
                      <option value="3000">3000 - Diretoria</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Projeto (PEP) - Opcional</label>
                    <input name="projeto" value={formData.projeto} onChange={handleInputChange} type="text" placeholder="Ex: PROJ-2024-001" />
                  </div>
                </div>
              )}

              {/* PASSO 2: LOGÍSTICA */}
              {step === 2 && (
                <div className="wizard-form-grid">
                  <div className="form-group">
                    <label>Origem *</label>
                    <input name="origem" value={formData.origem} onChange={handleInputChange} type="text" placeholder="Cidade/Aeroporto" required />
                  </div>
                  <div className="form-group">
                    <label>Destino *</label>
                    <input name="destino" value={formData.destino} onChange={handleInputChange} type="text" placeholder="Cidade/Aeroporto" required />
                  </div>
                  <div className="form-group">
                    <label>Data Ida *</label>
                    <input name="data_ida" value={formData.data_ida} onChange={handleInputChange} type="date" required />
                  </div>
                  <div className="form-group">
                    <label>Data Volta *</label>
                    <input name="data_volta" value={formData.data_volta} onChange={handleInputChange} type="date" required />
                  </div>
                  
                  <div className="form-group">
                    <label>Precisa de Hotel?</label>
                    <select name="precisa_hotel" value={formData.precisa_hotel} onChange={handleInputChange}>
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                  
                  {formData.precisa_hotel === 'sim' && (
                    <div className="form-group">
                      <label>Preferência Hotel</label>
                      <input name="hotel_pref" value={formData.hotel_pref} onChange={handleInputChange} type="text" placeholder="Ex: Próximo ao centro..." />
                    </div>
                  )}

                  <div className="form-group full-width">
                     <label>Solicitar Adiantamento (R$)</label>
                     <input name="adiantamento" type="number" value={formData.adiantamento} onChange={handleInputChange} placeholder="0,00" />
                     <small style={{color:'#666'}}>* Sujeito à aprovação para valores acima de R$ 500,00</small>
                  </div>
                </div>
              )}

              {/* PASSO 3: REVISÃO */}
              {step === 3 && (
                <div className="wizard-form-grid">
                  <div className="full-width" style={{background:'#f8f9fa', padding:'20px', borderRadius:'8px'}}>
                    <h4 style={{marginTop:0, color:'#333'}}>Resumo da Solicitação</h4>
                    <p><strong>Motivo:</strong> {formData.motivo}</p>
                    <p><strong>Rota:</strong> {formData.origem} ➝ {formData.destino}</p>
                    <p><strong>Período:</strong> {formData.data_ida} até {formData.data_volta}</p>
                    <p><strong>Hotel:</strong> {formData.precisa_hotel === 'sim' ? 'Sim' : 'Não'}</p>
                    <p><strong>Adiantamento:</strong> R$ {formData.adiantamento}</p>
                    
                    <div style={{marginTop:'20px', padding:'10px', background:'#fff3cd', border:'1px solid #ffeeba', color:'#856404', fontSize:'0.9rem'}}>
                      ⚠ Ao confirmar, a solicitação será enviada ao seu gestor imediato. Certifique-se de que o orçamento do projeto comporta esta despesa.
                    </div>
                  </div>
                </div>
              )}

              {/* RODAPÉ DO WIZARD (BOTÕES) */}
              <div className="wizard-footer">
                {step > 1 ? (
                  <button type="button" className="btn-secondary" onClick={prevStep}>Anterior</button>
                ) : (
                  <div></div> /* Espaçador */
                )}

                {step < 3 ? (
                  <button type="button" className="btn-primary" onClick={nextStep}>Próximo Passo</button>
                ) : (
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Enviando...' : '✅ Confirmar Solicitação'}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}
      </div>

      {/* =================================================================
          TEMPLATE DE IMPRESSÃO (VOUCHER)
         ================================================================= */}
      <div className="print-hidden-wrapper">
        {voucherParaImpressao && (
        <div ref={printRef} className="print-voucher-page">
            <div className="voucher-header">
                <Logo lightMode={true} size={1.2} />
                <div style={{textAlign:'right'}}>
                   <h1 className="voucher-title">Voucher de Viagem</h1>
                   <p style={{margin:0, color:'#666'}}>Solicitação #{voucherParaImpressao.id}</p>
                </div>
            </div>

            <div className="voucher-section">
                <div className="voucher-sec-title">DADOS DO PASSAGEIRO</div>
                <div className="voucher-sec-content">
                    <div className="v-item"><strong>Nome Completo</strong><span>GUILHERME SILVA</span></div>
                    <div className="v-item"><strong>Documento</strong><span>123.456.789-00</span></div>
                    <div className="v-item"><strong>Centro de Custo</strong><span>2000 - TI</span></div>
                    <div className="v-item"><strong>Status</strong><span>CONFIRMADO</span></div>
                </div>
            </div>

            <div className="voucher-section">
                <div className="voucher-sec-title">AÉREO / TRANSPORTE</div>
                <div className="voucher-sec-content">
                    <div className="v-item"><strong>Origem</strong><span>{voucherParaImpressao.origem}</span></div>
                    <div className="v-item"><strong>Destino</strong><span>{voucherParaImpressao.destino}</span></div>
                    <div className="v-item"><strong>Ida</strong><span>{voucherParaImpressao.data_ida}</span></div>
                    <div className="v-item"><strong>Volta</strong><span>{voucherParaImpressao.data_volta}</span></div>
                    <div className="v-item"><strong>Voo / Reserva</strong><span>{voucherParaImpressao.voo}</span></div>
                </div>
            </div>

            <div className="voucher-section">
                <div className="voucher-sec-title">HOSPEDAGEM</div>
                <div className="voucher-sec-content">
                    <div className="v-item"><strong>Hotel</strong><span>{voucherParaImpressao.hotel}</span></div>
                    <div className="v-item"><strong>Endereço</strong><span>Consultar recepção</span></div>
                </div>
            </div>

            <div style={{marginTop:'50px', textAlign:'center', fontSize:'10pt', color:'#666'}}>
                <p>Em caso de divergência ou emergência, contate a agência parceira: (11) 4004-0000</p>
                <p>TechCorp Travel Solutions - {new Date().getFullYear()}</p>
            </div>
        </div>
        )}
      </div>

    </div>
  );
}