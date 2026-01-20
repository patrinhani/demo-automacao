import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import './PlanoSaude.css';

export default function PlanoSaude() {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  
  // Estados dos Modais
  const [modalOpen, setModalOpen] = useState(null); 
  
  // Estados Reembolso
  const [reembolsoFile, setReembolsoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados Rede
  const [buscaRede, setBuscaRede] = useState('');
  const [buscaLocal, setBuscaLocal] = useState('');
  
  // Estados Agendamento
  const [medicoSelecionado, setMedicoSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);

  // Estados Telemedicina & Extrato
  const [conectandoTele, setConectandoTele] = useState(false);
  const [baixandoExtrato, setBaixandoExtrato] = useState(false);
  const extratoRef = useRef(); // Referência para imprimir o PDF

  // ... (userPlan, baseMedicos, lógica de filtros e agendamento - MANTIDOS) ...
  // COPIE AQUI A MESMA LÓGICA DO ARQUIVO ANTERIOR PARA userPlan, baseMedicos, etc.
  // Vou colocar resumido apenas para mostrar onde encaixar o novo código.

  const userPlan = {
    nome: "YAN RODRIGUES",
    plano: "PREMIUM NACIONAL",
    carteirinha: "8922.0001.4590.0022",
    validade: "12/2026",
    tipo: "Apartamento",
    rede: "Unimed & Parceiros",
    carencia: "Isento",
    cvv: "492",
    dependentes: [
      { nome: "Maria Rodrigues", parentesco: "Cônjuge" },
      { nome: "Lucas Rodrigues", parentesco: "Filho" }
    ]
  };

  const baseMedicos = [
    { nome: 'Dr. Roberto Silva', esp: 'Cardiologista', loc: 'Hosp. Albert Einstein (SP)' },
    { nome: 'Dra. Ana Souza', esp: 'Dermatologista', loc: 'Clínica Dermato (SP)' },
    { nome: 'Hospital São Luiz', esp: 'Pronto Socorro', loc: 'Unidade Morumbi (SP)' },
    // ... adicione mais médicos se quiser ...
  ];

  const extratoDados = [
    { data: '15/01/26', prestador: 'Lab. A+', proc: 'Hemograma', valor: '50,00', copart: '5,00' },
    { data: '10/01/26', prestador: 'Dr. Roberto', proc: 'Consulta', valor: '350,00', copart: '35,00' },
    { data: '22/12/25', prestador: 'Hosp. S. Luiz', proc: 'P. Socorro', valor: '800,00', copart: '80,00' },
    { data: '22/12/25', prestador: 'Hosp. S. Luiz', proc: 'Medicamentos', valor: '120,00', copart: '12,00' },
  ];

  const totalCopart = extratoDados.reduce((acc, item) => acc + parseFloat(item.copart.replace(',', '.')), 0).toFixed(2).replace('.', ',');

  const medicosFiltrados = baseMedicos.filter(med => {
    const matchEsp = med.esp.toLowerCase().includes(buscaRede.toLowerCase()) || 
                     med.nome.toLowerCase().includes(buscaRede.toLowerCase());
    const matchLoc = med.loc.toLowerCase().includes(buscaLocal.toLowerCase());
    return matchEsp && matchLoc;
  });

  const toggleCVV = (e) => { e.stopPropagation(); setShowCVV(!showCVV); };
  
  const closeModal = () => {
    setModalOpen(null);
    setReembolsoFile(null);
    setLoading(false);
    setMedicoSelecionado(null);
    setConectandoTele(false);
  };

  // --- DOWNLOAD PDF EXTRATO ---
  const handleDownloadExtrato = async () => {
    setBaixandoExtrato(true);
    
    setTimeout(async () => {
      const element = extratoRef.current;
      
      try {
        const canvas = await html2canvas(element, { 
            scale: 1.5, // Qualidade boa e leve
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
        pdf.save('Extrato_Coparticipacao_TechCorp.pdf');
      } catch (error) {
        console.error("Erro PDF", error);
      }
      
      setBaixandoExtrato(false);
    }, 500);
  };

  // ... (Outras funções de Agendamento/Reembolso mantidas) ...
  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setReembolsoFile(e.target.files[0]); };
  const handleEnviarReembolso = () => {
    if (!reembolsoFile) return alert("Anexe o comprovante!");
    setLoading(true);
    setTimeout(() => { setLoading(false); setModalOpen(null); setShowSuccess(true); setReembolsoFile(null); }, 2000);
  };
  const abrirAgendamento = (medico) => {
    setMedicoSelecionado(medico);
    const hoje = new Date(); hoje.setDate(hoje.getDate() + 1); const dataIso = hoje.toISOString().split('T')[0];
    setDataSelecionada(dataIso); gerarHorariosDisponiveis(dataIso); setHorarioSelecionado(null); setModalOpen('agendar');
  };
  const gerarHorariosDisponiveis = (dateString) => {
    const date = new Date(dateString); const diaSemana = date.getUTCDay();
    if (diaSemana === 0 || diaSemana === 6) { setHorariosDisponiveis([]); return; }
    const baseSlots = ['08:00', '09:00', '09:30', '10:00', '11:30', '14:00', '15:30', '16:00', '17:30'];
    const seed = date.getDate() + date.getMonth(); 
    const slotsDoDia = baseSlots.filter((_, index) => (index + seed) % 3 !== 0);
    setHorariosDisponiveis(slotsDoDia); setHorarioSelecionado(null);
  };
  const handleDataChange = (e) => { const novaData = e.target.value; setDataSelecionada(novaData); gerarHorariosDisponiveis(novaData); };
  const confirmarAgendamento = () => {
    if (!horarioSelecionado) return alert("Selecione um horário!");
    setLoading(true); setTimeout(() => { setLoading(false); setModalOpen('agendamento_concluido'); }, 1500);
  };
  const iniciarTelemedicina = () => { setConectandoTele(true); setTimeout(() => { setConectandoTele(false); alert("Sala aberta em nova aba."); setModalOpen(null); }, 2500); };


  return (
    <div className="tech-layout-saude">
      
      <div className="ambient-light light-cyan"></div>
      <div className="ambient-light light-purple"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Saúde & Bem-estar</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</button>
      </header>

      <div className="saude-container-tech">
        {/* ... (CONTEÚDO PRINCIPAL MANTIDO IGUAL) ... */}
        <div className="page-header-tech">
          <h2>Meu Plano de Saúde</h2>
          <p>Gestão completa do seu benefício médico e dependentes.</p>
        </div>

        <div className="grid-saude">
          <div className="left-col">
            <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`card-object ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="card-face front">
                  <div className="card-header">
                    <div className="chip-container">
                      <svg viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs><linearGradient id="gold-shine" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#bf953f" /><stop offset="50%" stopColor="#fcf6ba" /><stop offset="100%" stopColor="#aa771c" /></linearGradient></defs>
                        <rect width="50" height="40" rx="6" fill="url(#gold-shine)" />
                        <path d="M0 13H50 M0 27H50 M15 0V40 M35 0V40" stroke="#000" strokeOpacity="0.3" strokeWidth="1"/>
                        <rect x="18" y="10" width="14" height="20" rx="4" stroke="#000" strokeOpacity="0.3" strokeWidth="1" fill="none"/>
                      </svg>
                    </div>
                    <div style={{opacity: 0.95}}><Logo size={0.7} /></div>
                  </div>
                  <div className="card-body">
                    <div className="card-number">{userPlan.carteirinha}</div>
                    <span className="card-label">Titular</span>
                    <div className="card-value">{userPlan.nome}</div>
                  </div>
                  <div className="card-footer">
                    <div><span className="card-label">Validade</span><div className="card-value" style={{fontSize: '0.9rem'}}>{userPlan.validade}</div></div>
                    <div className="plan-badge">{userPlan.plano}</div>
                  </div>
                </div>
                <div className="card-face back">
                  <div className="magnetic-strip"></div>
                  <div className="signature-area">
                    <div className="signature-box"></div>
                    <div className="cvv-group">
                      <div className="cvv-box">CVC {showCVV ? userPlan.cvv : '***'}</div>
                      <button className="cvv-toggle" onClick={toggleCVV}>{showCVV ? '👁️' : '🔒'}</button>
                    </div>
                  </div>
                  <div className="back-details">
                    <p className="legal-text">Pessoal e intransferível. Obrigatória apresentação de documento.</p>
                    <div className="emergency-contact">
                      <span className="emergency-title">CENTRAL 24H</span>
                      <div className="emergency-numbers">0800 777 9090 &nbsp;|&nbsp; (11) 3344-5566</div>
                    </div>
                    <div className="ans-info">TechCorp Saúde S.A. • ANS 39.123-9</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="click-hint">👆 Clique no cartão para virar</div>

            <div className="actions-grid">
              <button className="action-btn" onClick={() => setModalOpen('reembolso')}><span>💸</span><strong>Solicitar Reembolso</strong></button>
              <button className="action-btn" onClick={() => setModalOpen('rede')}><span>🏥</span><strong>Rede Credenciada</strong></button>
              <button className="action-btn" onClick={() => setModalOpen('extrato')}><span>📄</span><strong>Extrato de Uso</strong></button>
              <button className="action-btn" onClick={() => setModalOpen('telemedicina')}><span>📞</span><strong>Telemedicina</strong></button>
            </div>
          </div>

          <div className="right-col">
            <div className="info-card-glass" style={{marginBottom: '30px'}}>
              <h4 className="section-title"><span className="icon-neon">📋</span> Detalhes do Plano</h4>
              <ul className="details-list">
                <li className="details-item"><span>Modalidade</span> <strong>{userPlan.plano}</strong></li>
                <li className="details-item"><span>Acomodação</span> <strong>{userPlan.tipo}</strong></li>
                <li className="details-item"><span>Abrangência</span> <strong>Nacional</strong></li>
                <li className="details-item"><span>Carência</span> <strong style={{color: '#4ade80'}}>{userPlan.carencia}</strong></li>
                <li className="details-item"><span>Operadora</span> <strong>{userPlan.rede}</strong></li>
              </ul>
            </div>
            <div className="info-card-glass">
              <h4 className="section-title"><span className="icon-neon">👨‍👩‍👧</span> Dependentes</h4>
              <div className="dependents-list">
                {userPlan.dependentes.map((dep, index) => (
                  <div key={index} className="dependent-item">
                    <div className="dep-avatar">{dep.nome.charAt(0)}</div>
                    <div className="dep-info"><h4>{dep.nome}</h4><p>{dep.parentesco}</p></div>
                  </div>
                ))}
                <button className="tech-back-btn" style={{width: '100%', marginTop: '15px', fontSize: '0.8rem'}}>+ Adicionar Dependente</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAIS ================= */}

      {/* 1. REEMBOLSO (Mantido) */}
      {modalOpen === 'reembolso' && (<div className="modal-overlay-tech" onClick={closeModal}><div className="modal-content-tech" onClick={e=>e.stopPropagation()}><div className="modal-header-tech"><h3>Reembolso Médico</h3><button className="close-btn-tech" onClick={closeModal}>×</button></div><div className="modal-body-tech"><p style={{color:'#94a3b8',fontSize:'0.9rem',marginBottom:'20px'}}>Envie o recibo médico.</p><form><div className="form-group-tech" style={{marginBottom:'15px'}}><label>Prestador</label><input type="text" className="input-tech" /></div><div className="form-group-tech" style={{marginBottom:'15px'}}><label>Data</label><input type="date" className="input-tech" /></div><div className="form-group-tech" style={{marginBottom:'15px'}}><label>Valor (R$)</label><input type="number" className="input-tech" /></div><div className="upload-area-tech" style={reembolsoFile?{borderColor:'#4ade80',background:'rgba(74, 222, 128, 0.1)'}:{}}><input type="file" id="file-upload" style={{display:'none'}} onChange={handleFileChange}/><label htmlFor="file-upload" style={{cursor:'pointer',width:'100%',display:'block'}}>{reembolsoFile?<span style={{color:'#4ade80',fontWeight:'bold'}}>✓ {reembolsoFile.name}</span>:<span>📎 Anexar Recibo</span>}</label></div><button type="button" className="btn-primary-tech" style={{width:'100%',marginTop:'20px'}} onClick={handleEnviarReembolso} disabled={loading}>{loading?'Enviando...':'Enviar Solicitação'}</button></form></div></div></div>)}
      {showSuccess && (<div className="modal-overlay-tech"><div className="modal-content-tech success-modal" style={{textAlign:'center',maxWidth:'400px'}}><div className="success-pulse-icon">✓</div><h3 style={{color:'#4ade80',marginBottom:'10px'}}>Sucesso!</h3><p style={{color:'#fff'}}>Solicitação enviada.</p><p style={{color:'#94a3b8',fontSize:'0.85rem'}}>Protocolo: <strong>OP-{Math.floor(Math.random()*100000)}</strong></p><button className="btn-primary-tech" onClick={()=>setShowSuccess(false)} style={{width:'100%',marginTop:'20px'}}>Fechar</button></div></div>)}
      
      {/* 2. REDE (Mantido) */}
      {modalOpen === 'rede' && (
        <div className="modal-overlay-tech" onClick={closeModal}>
          <div className="modal-content-tech" onClick={e => e.stopPropagation()}>
            <div className="modal-header-tech"><h3>Rede Credenciada</h3><button className="close-btn-tech" onClick={closeModal}>×</button></div>
            <div className="modal-body-tech">
              <div style={{display:'flex', gap:'10px', marginBottom: '20px'}}>
                <input type="text" placeholder="Nome/Esp..." className="input-tech" value={buscaRede} onChange={(e) => setBuscaRede(e.target.value)} />
                <input type="text" placeholder="Local..." className="input-tech" value={buscaLocal} onChange={(e) => setBuscaLocal(e.target.value)} />
              </div>
              <div className="medicos-list-scroll">
                {medicosFiltrados.length > 0 ? (
                  medicosFiltrados.map((med, i) => (
                    <div key={i} className="medico-item-tech">
                      <div style={{flex: 1}}>
                        <strong style={{color:'#fff', display:'block', fontSize: '0.95rem'}}>{med.nome}</strong>
                        <span style={{color: 'var(--neon-cyan)', fontSize:'0.8rem', fontWeight: '600'}}>{med.esp}</span>
                        <p style={{color: '#94a3b8', fontSize: '0.8rem', margin: '3px 0'}}>📍 {med.loc}</p>
                      </div>
                      <button className="btn-secondary-tech" style={{padding: '5px 10px', fontSize: '0.75rem'}} onClick={() => abrirAgendamento(med)}>Agendar</button>
                    </div>
                  ))
                ) : <div style={{textAlign: 'center', color: '#666', padding: '20px'}}>Nenhum prestador encontrado.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AGENDAMENTO E SUCESSO (Mantidos) */}
      {modalOpen === 'agendar' && medicoSelecionado && (<div className="modal-overlay-tech" onClick={closeModal}><div className="modal-content-tech" onClick={e=>e.stopPropagation()}><div className="modal-header-tech"><h3>Agendar Consulta</h3><button className="close-btn-tech" onClick={closeModal}>×</button></div><div className="modal-body-tech"><div className="medico-summary-box"><h4 style={{color:'var(--neon-cyan)',margin:'0 0 5px 0'}}>{medicoSelecionado.nome}</h4><p style={{color:'#fff',fontSize:'0.9rem',margin:0}}>{medicoSelecionado.esp}</p><p style={{color:'#94a3b8',fontSize:'0.8rem',marginTop:'5px'}}>📍 {medicoSelecionado.loc}</p></div><div className="form-group-tech" style={{marginTop:'20px'}}><label>Selecione a Data:</label><input type="date" className="input-tech" value={dataSelecionada} onChange={handleDataChange} min={new Date().toISOString().split('T')[0]}/></div><div style={{marginTop:'20px'}}><label style={{color:'#94a3b8',fontSize:'0.85rem',fontWeight:'600',marginBottom:'10px',display:'block'}}>Horários:</label>{horariosDisponiveis.length>0?(<div className="slots-grid">{horariosDisponiveis.map((hora)=>(<button key={hora} className={`slot-btn ${horarioSelecionado===hora?'selected':''}`} onClick={()=>setHorarioSelecionado(hora)}>{hora}</button>))}</div>):<div className="no-slots-box">🚫 Sem agenda.</div>}</div><div style={{display:'flex',gap:'10px',marginTop:'30px'}}><button className="btn-secondary-tech" onClick={()=>setModalOpen('rede')} style={{flex:1}}>Voltar</button><button className="btn-primary-tech" onClick={confirmarAgendamento} disabled={loading||!horarioSelecionado} style={{flex:1}}>{loading?'Agendando...':'Confirmar'}</button></div></div></div></div>)}
      {modalOpen === 'agendamento_concluido' && (<div className="modal-overlay-tech"><div className="modal-content-tech success-modal" style={{textAlign:'center',maxWidth:'400px'}}><div className="success-pulse-icon">✓</div><h3 style={{color:'#4ade80',marginBottom:'10px'}}>Agendado!</h3><p style={{color:'#fff',marginBottom:'20px'}}>Consulta confirmada.</p><button className="btn-primary-tech" onClick={closeModal} style={{width:'100%',marginTop:'20px'}}>Fechar</button></div></div>)}

      {/* 3. EXTRATO (ATUALIZADO E COMPACTO) */}
      {modalOpen === 'extrato' && (
        <div className="modal-overlay-tech" onClick={closeModal}>
          <div className="modal-content-tech" onClick={e => e.stopPropagation()} style={{maxWidth: '650px'}}>
            <div className="modal-header-tech">
              <h3>Extrato de Coparticipação</h3>
              <button className="close-btn-tech" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body-tech">
              {/* TABELA COMPACTA */}
              <div className="table-wrapper-tech">
                <table style={{width:'100%', color:'#fff', fontSize:'0.8rem', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid #334155', color: 'var(--neon-blue)'}}>
                      <th style={{padding:'8px 5px', textAlign:'left'}}>Data</th>
                      <th style={{padding:'8px 5px', textAlign:'left'}}>Prestador</th>
                      <th style={{padding:'8px 5px', textAlign:'left'}}>Proc.</th>
                      <th style={{padding:'8px 5px', textAlign:'right'}}>Valor</th>
                      <th style={{padding:'8px 5px', textAlign:'right'}}>Copart.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extratoDados.map((item, i) => (
                      <tr key={i} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                        <td style={{padding:'8px 5px'}}>{item.data}</td>
                        <td style={{padding:'8px 5px'}}>{item.prestador}</td>
                        <td style={{padding:'8px 5px'}}>{item.proc}</td>
                        <td style={{padding:'8px 5px', textAlign:'right', color:'#94a3b8'}}>{item.valor}</td>
                        <td style={{padding:'8px 5px', textAlign:'right', color:'#ef4444', fontWeight:'bold'}}>{item.copart}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{marginTop: '20px', padding:'15px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>Desconto em Folha:</span> 
                <strong style={{color: '#ef4444', fontSize:'1.1rem'}}>R$ {totalCopart}</strong>
              </div>
              
              <button className="btn-primary-tech" style={{width:'100%', marginTop:'20px'}} onClick={handleDownloadExtrato} disabled={baixandoExtrato}>
                {baixandoExtrato ? 'Gerando PDF...' : '⬇ Baixar Extrato Detalhado (PDF)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TELEMEDICINA (MANTIDO) */}
      {modalOpen === 'telemedicina' && (
        <div className="modal-overlay-tech" onClick={closeModal}>
          <div className="modal-content-tech" style={{textAlign: 'center', maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header-tech">
              <h3>Dr. Tech - Telemedicina</h3>
              <button className="close-btn-tech" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body-tech">
              {!conectandoTele ? (
                <>
                  <div className="tele-icon-circle">🩺</div>
                  <h4 style={{color: '#fff', margin:'15px 0 5px'}}>Plantão Clínico Geral</h4>
                  <p style={{color: '#94a3b8', fontSize:'0.9rem', marginBottom: '25px'}}>
                    Sem agendamento. Fila de espera virtual.
                  </p>
                  
                  <div className="wait-time-box">
                    <span>Tempo estimado:</span>
                    <strong>~ 5 minutos</strong>
                  </div>

                  <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                    <button className="btn-secondary-tech" onClick={closeModal} style={{flex:1}}>Voltar</button>
                    <button className="btn-primary-tech" onClick={iniciarTelemedicina} style={{flex:1}}>Entrar na Fila</button>
                  </div>
                </>
              ) : (
                <div style={{padding:'20px 0'}}>
                  <div className="loading-spinner-tele"></div>
                  <h4 style={{color: 'var(--neon-blue)', marginTop:'20px'}}>Conectando...</h4>
                  <p style={{color: '#94a3b8', fontSize:'0.9rem'}}>Buscando médico disponível.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === PDF OCULTO EXTRATO === */}
      <div className="pdf-hidden-template">
        <div ref={extratoRef} className="print-page">
            <div className="print-header">
               <Logo lightMode={true} size={1.5} />
               <div style={{textAlign: 'right'}}>
                  <h2 style={{margin: 0, textTransform: 'uppercase', color: '#004a80'}}>Extrato de Utilização</h2>
                  <p style={{margin: '5px 0', fontSize: '10pt', color: '#555'}}>Demonstrativo de Coparticipação</p>
               </div>
            </div>

            <div className="print-box">
               <table style={{width: '100%'}}>
                   <tbody>
                       <tr><td><strong>TITULAR:</strong> {userPlan.nome}</td><td><strong>CARTEIRINHA:</strong> {userPlan.carteirinha}</td></tr>
                       <tr><td><strong>PLANO:</strong> {userPlan.plano}</td><td><strong>PERÍODO:</strong> 01/12/2025 A 30/01/2026</td></tr>
                   </tbody>
               </table>
            </div>

            <table className="print-table">
               <thead>
                  <tr><th>DATA</th><th>PRESTADOR</th><th>PROCEDIMENTO</th><th style={{textAlign: 'right'}}>VALOR</th><th style={{textAlign: 'right'}}>COPART.</th></tr>
               </thead>
               <tbody>
                  {extratoDados.map((item, idx) => (
                      <tr key={idx}>
                         <td>{item.data}</td><td>{item.prestador}</td><td>{item.proc}</td>
                         <td style={{textAlign: 'right'}}>R$ {item.valor}</td><td style={{textAlign: 'right'}}>R$ {item.copart}</td>
                      </tr>
                  ))}
                  <tr style={{background: '#f0f0f0'}}>
                      <td colSpan="4" style={{textAlign: 'right', fontWeight: 'bold'}}>TOTAL A DESCONTAR:</td>
                      <td style={{textAlign: 'right', fontWeight: 'bold', color: '#dc3545'}}>R$ {totalCopart}</td>
                  </tr>
               </tbody>
            </table>
            <div style={{marginTop: '50px', textAlign: 'center', fontSize: '8pt', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px'}}>
               <p>TechCorp Saúde - ANS nº 123456 - Gerado em: {new Date().toLocaleString()}</p>
            </div>
        </div>
      </div>

    </div>
  );
}