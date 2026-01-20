import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import './GestaoViagens.css'; // O CSS novo que vamos criar abaixo

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
      data_ida: '2024-11-10', data_volta: '2024-11-12', 
      motivo: 'Visita Cliente Petrobras', 
      status: 'APROVADO', custo: 'R$ 1.250,00',
      voo: 'LA3402', hotel: 'Windsor Barra'
    },
    { 
      id: 'TRIP-8840', 
      origem: 'São Paulo (CGH)', destino: 'Brasília (BSB)', 
      data_ida: '2024-10-05', data_volta: '2024-10-06', 
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
        // Força fundo branco no canvas para o PDF não sair transparente/escuro
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
    <div className="tech-layout">
      {/* LUZES DE FUNDO (AMBIENT LIGHTS) */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>

      <div className="tech-main">
        {/* HEADER ESTILO TECH */}
        <header className="tech-header">
          <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
            <Logo /> <span style={{color:'white', marginLeft:'10px'}}>Viagens</span>
          </div>
          <div className="tech-profile" onClick={() => navigate('/dashboard')}>
            <span style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>Voltar ao Menu ↩</span>
          </div>
        </header>

        <div className="tech-scroll-content">
          <div className="page-header-tech">
            <h2>Gestão de Viagens Corporativas</h2>
            <div className="breadcrumbs-tech">Serviços / Viagens / Solicitações</div>
          </div>

          {/* TABS DE NAVEGAÇÃO MODERNAS */}
          <div className="travel-tabs-glass">
            <button 
              className={`travel-tab-glass ${activeTab === 'minhas_viagens' ? 'active' : ''}`}
              onClick={() => setActiveTab('minhas_viagens')}
            >
              ✈ Minhas Viagens
            </button>
            <button 
              className={`travel-tab-glass ${activeTab === 'nova_solicitacao' ? 'active' : ''}`}
              onClick={() => setActiveTab('nova_solicitacao')}
            >
              ➕ Nova Solicitação
            </button>
          </div>

          {/* === ABA 1: DASHBOARD DE VIAGENS === */}
          {activeTab === 'minhas_viagens' && (
            <div className="trip-grid-tech" style={{animation: 'fadeIn 0.5s'}}>
              {viagens.map(trip => (
                <div key={trip.id} className="trip-card-glass">
                  {/* Status Badge Neon */}
                  <div className={`trip-status-neon ${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </div>
                  
                  <div className="trip-glass-header">
                    <span className="trip-route-tech">{trip.origem.slice(0,3).toUpperCase()} <span className="arrow">➝</span> {trip.destino.slice(0,3).toUpperCase()}</span>
                    <span className="trip-id-tech">{trip.id}</span>
                  </div>
                  
                  <div className="trip-glass-body">
                    <div className="trip-row-tech">
                      <div><span className="trip-label-tech">IDA</span><span className="trip-value-tech">{trip.data_ida}</span></div>
                      <div style={{textAlign:'right'}}><span className="trip-label-tech">VOLTA</span><span className="trip-value-tech">{trip.data_volta}</span></div>
                    </div>
                    <div className="trip-row-tech">
                      <div><span className="trip-label-tech">MOTIVO</span><span className="trip-value-tech">{trip.motivo}</span></div>
                    </div>
                    
                    <div className="tags-container">
                      <div className="glass-tag">🏨 {trip.hotel}</div>
                      <div className="glass-tag">✈ {trip.voo}</div>
                    </div>
                  </div>
                  
                  <div className="trip-glass-actions">
                    <button className="btn-neon-outline" onClick={() => gerarVoucher(trip)}>
                      📄 Baixar Voucher
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* === ABA 2: WIZARD DE SOLICITAÇÃO === */}
          {activeTab === 'nova_solicitacao' && (
            <div className="wizard-glass-container" style={{animation: 'fadeIn 0.5s'}}>
              
              {/* Indicador de Passos Neon */}
              <div className="wizard-steps-neon">
                <div className={`step-item-neon ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
                <div className="step-line"></div>
                <div className={`step-item-neon ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
                <div className="step-line"></div>
                <div className={`step-item-neon ${step >= 3 ? 'active' : ''}`}>3</div>
              </div>
              
              <div className="step-label-display">
                {step === 1 && "Dados do Projeto"}
                {step === 2 && "Logística & Datas"}
                {step === 3 && "Revisão Final"}
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* PASSO 1: DADOS BÁSICOS */}
                {step === 1 && (
                  <div className="wizard-form-grid-tech">
                    <div className="form-group-tech full-width">
                      <label>Motivo da Viagem *</label>
                      <input className="glass-input" name="motivo" value={formData.motivo} onChange={handleInputChange} type="text" placeholder="Ex: Reunião com Cliente X" required />
                    </div>
                    <div className="form-group-tech">
                      <label>Centro de Custo *</label>
                      <select className="glass-input" name="centro_custo" value={formData.centro_custo} onChange={handleInputChange} required>
                        <option value="">Selecione...</option>
                        <option value="1000">1000 - Comercial</option>
                        <option value="2000">2000 - TI / Infra</option>
                        <option value="3000">3000 - Diretoria</option>
                      </select>
                    </div>
                    <div className="form-group-tech">
                      <label>Projeto (PEP) - Opcional</label>
                      <input className="glass-input" name="projeto" value={formData.projeto} onChange={handleInputChange} type="text" placeholder="Ex: PROJ-2024-001" />
                    </div>
                  </div>
                )}

                {/* PASSO 2: LOGÍSTICA */}
                {step === 2 && (
                  <div className="wizard-form-grid-tech">
                    <div className="form-group-tech">
                      <label>Origem *</label>
                      <input className="glass-input" name="origem" value={formData.origem} onChange={handleInputChange} type="text" placeholder="Cidade/Aeroporto" required />
                    </div>
                    <div className="form-group-tech">
                      <label>Destino *</label>
                      <input className="glass-input" name="destino" value={formData.destino} onChange={handleInputChange} type="text" placeholder="Cidade/Aeroporto" required />
                    </div>
                    <div className="form-group-tech">
                      <label>Data Ida *</label>
                      <input className="glass-input" name="data_ida" value={formData.data_ida} onChange={handleInputChange} type="date" required />
                    </div>
                    <div className="form-group-tech">
                      <label>Data Volta *</label>
                      <input className="glass-input" name="data_volta" value={formData.data_volta} onChange={handleInputChange} type="date" required />
                    </div>
                    
                    <div className="form-group-tech">
                      <label>Precisa de Hotel?</label>
                      <select className="glass-input" name="precisa_hotel" value={formData.precisa_hotel} onChange={handleInputChange}>
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                    
                    {formData.precisa_hotel === 'sim' && (
                      <div className="form-group-tech">
                        <label>Preferência Hotel</label>
                        <input className="glass-input" name="hotel_pref" value={formData.hotel_pref} onChange={handleInputChange} type="text" placeholder="Ex: Próximo ao centro..." />
                      </div>
                    )}

                    <div className="form-group-tech full-width">
                      <label>Solicitar Adiantamento (R$)</label>
                      <input className="glass-input" name="adiantamento" type="number" value={formData.adiantamento} onChange={handleInputChange} placeholder="0,00" />
                      <small style={{color:'var(--text-secondary)'}}>* Sujeito à aprovação para valores acima de R$ 500,00</small>
                    </div>
                  </div>
                )}

                {/* PASSO 3: REVISÃO */}
                {step === 3 && (
                  <div className="wizard-review-glass">
                    <h4 className="neon-text">Resumo da Solicitação</h4>
                    <div className="review-item"><strong>Motivo:</strong> <span>{formData.motivo}</span></div>
                    <div className="review-item"><strong>Rota:</strong> <span>{formData.origem} ➝ {formData.destino}</span></div>
                    <div className="review-item"><strong>Período:</strong> <span>{formData.data_ida} até {formData.data_volta}</span></div>
                    <div className="review-item"><strong>Hotel:</strong> <span>{formData.precisa_hotel === 'sim' ? 'Sim' : 'Não'}</span></div>
                    <div className="review-item"><strong>Adiantamento:</strong> <span className="highlight-money">R$ {formData.adiantamento}</span></div>
                    
                    <div className="glass-alert">
                      ⚠ Ao confirmar, a solicitação será enviada ao seu gestor imediato. Certifique-se de que o orçamento do projeto comporta esta despesa.
                    </div>
                  </div>
                )}

                {/* RODAPÉ DO WIZARD (BOTÕES) */}
                <div className="wizard-footer-tech">
                  {step > 1 ? (
                    <button type="button" className="btn-glass-secondary" onClick={prevStep}>Anterior</button>
                  ) : (
                    <div></div> 
                  )}

                  {step < 3 ? (
                    <button type="button" className="btn-neon-primary" onClick={nextStep}>Próximo Passo</button>
                  ) : (
                    <button type="submit" className="btn-neon-primary" disabled={loading}>
                      {loading ? 'Enviando...' : '✅ Confirmar Solicitação'}
                    </button>
                  )}
                </div>

              </form>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================
          TEMPLATE DE IMPRESSÃO (VOUCHER)
          NOTA: MANTEMOS O VISUAL "PAPEL BRANCO" PARA IMPRESSÃO CORRETA
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