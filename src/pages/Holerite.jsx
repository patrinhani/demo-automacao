import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import { db, auth } from '../firebase'; 
import { ref, get } from 'firebase/database'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import '../App.css';
import './Holerite.css';

export default function Holerite() {
  const navigate = useNavigate();
  const printRef = useRef();

  // --- ESTADOS ---
  const [loadingUser, setLoadingUser] = useState(true);
  const [usuario, setUsuario] = useState({
    nome: "Carregando...",
    cargo: "...",
    setor: "...",
    salarioBase: 0, 
    admissao: "..."
  });

  // Pega o ano atual dinamicamente
  const currentYear = new Date().getFullYear().toString();
  const [anoSelecionado, setAnoSelecionado] = useState(currentYear);
  
  const [valoresVisiveis, setValoresVisiveis] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [holeriteSelecionado, setHoleriteSelecionado] = useState(null);
  const [holeriteParaImpressao, setHoleriteParaImpressao] = useState(null);

  // --- 1. BUSCAR DADOS (FIREBASE) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = ref(db, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            setUsuario(snapshot.val()); 
          } else {
            setUsuario({ 
                nome: currentUser.displayName || "Colaborador", 
                cargo: "Não Definido", 
                salarioBase: 0, 
                setor: "Geral",
                admissao: "01/01/" + currentYear
            });
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error);
        }
      } else {
        navigate('/');
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [navigate, currentYear]);

  // --- 2. CÁLCULO DINÂMICO E DATAS ATUAIS ---
  const holeritesDinamicos = useMemo(() => {
    if (loadingUser) return [];

    const sb = parseFloat(usuario.salarioBase || 0); 
    if (sb === 0) return [];

    const hoje = new Date();
    
    // Meses em português
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const mesAtualNome = meses[hoje.getMonth()];
    const mesAnteriorNome = meses[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1];
    
    // Cálculos de impostos (Regras base 2024/2025)
    const inss = sb > 7786 ? 876.95 : sb * 0.14; 
    let irrf = 0;
    if (sb > 4664.68) irrf = (sb * 0.275) - 869.36;
    else if (sb > 3751.06) irrf = (sb * 0.225) - 636.13;
    else if (sb > 2826.65) irrf = (sb * 0.15) - 354.80;
    if (irrf < 0) irrf = 0;

    const descontos = inss + irrf;
    const liquido = sb - descontos;
    const f = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Datas de crédito simuladas
    const dataCreditoMensal = `05/${(hoje.getMonth() + 2).toString().padStart(2, '0')}/${currentYear}`; 
    const dataCreditoAdiant = `20/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${currentYear}`;

    return [
      { 
        id: 1, 
        ano: currentYear, 
        mes: mesAtualNome, 
        tipo: 'Folha Mensal', 
        data_credito: dataCreditoMensal, 
        valor_liquido: f(liquido), 
        status: 'EM ABERTO', 
        cssClass: 'mensal',
        bases: { sal_base: f(sb), base_inss: f(sb), base_fgts: f(sb), fgts_mes: f(sb * 0.08), base_irrf: f(sb - inss), faixa_irrf: '27.5%' },
        detalhes: [
          { cod: '001', desc: 'Salário Base', ref: '30d', venc: f(sb), desc_val: '0,00' },
          { cod: '501', desc: 'INSS', ref: '14%', venc: '0,00', desc_val: f(inss) },
          { cod: '505', desc: 'IRRF', ref: '27.5%', venc: '0,00', desc_val: f(irrf) },
        ]
      },
      { 
        id: 2, 
        ano: currentYear, 
        mes: mesAtualNome, 
        tipo: 'Adiantamento Quinzenal', 
        data_credito: dataCreditoAdiant, 
        valor_liquido: f(sb * 0.4), 
        status: 'PAGO', 
        cssClass: 'adiantamento',
        bases: { sal_base: f(sb), base_inss: '0,00', base_fgts: '0,00', fgts_mes: '0,00', base_irrf: '0,00', faixa_irrf: '0%' },
        detalhes: [
          { cod: '005', desc: 'Adiantamento Salarial', ref: '40%', venc: f(sb * 0.4), desc_val: '0,00' }
        ]
      },
      { 
        id: 3, 
        ano: currentYear, 
        mes: mesAnteriorNome, 
        tipo: 'Folha Mensal', 
        data_credito: `05/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${currentYear}`, 
        valor_liquido: f(liquido), 
        status: 'PAGO', 
        cssClass: 'mensal',
        bases: { sal_base: f(sb), base_inss: f(sb), base_fgts: f(sb), fgts_mes: f(sb * 0.08), base_irrf: f(sb - inss), faixa_irrf: '27.5%' },
        detalhes: [
          { cod: '001', desc: 'Salário Base', ref: '30d', venc: f(sb), desc_val: '0,00' },
          { cod: '501', desc: 'INSS', ref: '14%', venc: '0,00', desc_val: f(inss) },
          { cod: '505', desc: 'IRRF', ref: '27.5%', venc: '0,00', desc_val: f(irrf) },
        ]
      }
    ];
  }, [usuario.salarioBase, loadingUser, currentYear]);

  const listaFiltrada = useMemo(() => {
    return holeritesDinamicos.filter(h => h.ano === anoSelecionado);
  }, [anoSelecionado, holeritesDinamicos]);

  // --- 3. GERAR PDF (CORRIGIDO) ---
  const handleDownload = async (id, nomeArquivo) => {
    if (downloadingId) return;
    setDownloadingId(id);
    const holeriteParaBaixar = holeritesDinamicos.find(h => h.id === id);
    setHoleriteParaImpressao(holeriteParaBaixar);

    // Timeout para dar tempo do React renderizar o elemento escondido
    setTimeout(async () => {
      try {
        if (printRef.current) {
          const element = printRef.current;
          
          // Configurações robustas para capturar elemento fora da tela
          const canvas = await html2canvas(element, { 
            scale: 2, 
            backgroundColor: '#ffffff', 
            useCORS: true, 
            logging: false,
            x: 0,
            y: 0,
            width: element.offsetWidth, 
            height: element.offsetHeight,
            // Importante para elementos com scroll ou fora da viewport
            scrollX: 0,
            scrollY: 0,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(nomeArquivo);
        }
      } catch (error) { 
        console.error("Erro PDF:", error); 
        alert("Erro ao gerar PDF.");
      } 
      finally { 
        setDownloadingId(null); 
        setHoleriteParaImpressao(null); 
      }
    }, 500); 
  };

  const abrirDetalhes = (item) => {
    setHoleriteSelecionado(item);
    setModalAberto(true);
  };

  if (loadingUser) return (
    <div className="tech-holerite-layout center-loading">
      <div className="loading-spinner"></div>
      <p>Carregando dados financeiros...</p>
    </div>
  );

  return (
    <div className="tech-holerite-layout">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Meus Documentos</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</button>
      </header>

      <div className="holerite-container-tech">
        <div className="page-header-row">
          <div className="page-header-tech">
            <h2>Meus Holerites</h2>
            <p>Financeiro &gt; Demonstrativos de Pagamento</p>
            <div className="user-badge">
                <span className="cargo-tag">{usuario.cargo?.toUpperCase()}</span>
            </div>
          </div>
          <button className="privacy-toggle-tech" onClick={() => setValoresVisiveis(!valoresVisiveis)}>
            {valoresVisiveis ? '👁️ Ocultar Valores' : '🙈 Mostrar Valores'}
          </button>
        </div>

        {usuario.salarioBase === 0 ? (
            <div className="error-box-tech">
                <h3>⚠ Perfil Financeiro Incompleto</h3>
                <p>Seus dados de salário ainda não foram cadastrados no sistema.</p>
                <p className="small-text">Por favor, entre em contato com o Departamento Pessoal (RH) para regularização.</p>
            </div>
        ) : (
            <>
                <div className="filter-bar-tech">
                    <div className="filter-group">
                        <label>Ano Competência</label>
                        <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
                            <option value={currentYear}>{currentYear}</option>
                            <option value={parseInt(currentYear)-1}>{parseInt(currentYear)-1}</option>
                        </select>
                    </div>
                </div>

                <div className="holerite-list">
                {listaFiltrada.map((item) => (
                    <div key={item.id} className={`holerite-card-tech ${item.cssClass || ''}`}>
                    <div className="card-info">
                        <h4>{item.tipo} - {item.mes}/{item.ano}</h4>
                        <span>Previsão: <strong>{item.data_credito}</strong></span>
                        <span className={`status-badge ${item.status === 'PAGO' ? 'pago' : 'pendente'}`}>{item.status}</span>
                    </div>
                    <div className="card-values">
                        <small>LÍQUIDO A RECEBER</small>
                        <div className={`valor ${!valoresVisiveis ? 'blurred' : ''}`}>R$ {item.valor_liquido}</div>
                    </div>
                    <div className="card-actions">
                        <button className="btn-icon-tech" onClick={() => abrirDetalhes(item)} title="Ver Detalhes">📄</button>
                        <button 
                            className={`btn-icon-tech ${downloadingId === item.id ? 'disabled' : ''}`} 
                            onClick={() => handleDownload(item.id, `Holerite_${item.mes}_${item.ano}.pdf`)} 
                            disabled={downloadingId !== null}
                            title="Baixar PDF"
                        >
                        {downloadingId === item.id ? '⏳' : '⬇'}
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            </>
        )}
      </div>

      {/* MODAL DE DETALHES (NA TELA) */}
      {modalAberto && holeriteSelecionado && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-content-techH" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-tech">
              <h3>Detalhes do Holerite</h3>
              <button className="modal-close-tech" onClick={() => setModalAberto(false)}>×</button>
            </div>
            <div className="modal-details-summary">
                <strong>{holeriteSelecionado.tipo}</strong> <br/>
                <span>Competência: {holeriteSelecionado.mes}/{holeriteSelecionado.ano}</span>
            </div>
            <table className="payslip-table-tech">
                <thead><tr><th>Descrição</th><th>Ref.</th><th className="text-right">Vencimentos</th><th className="text-right">Descontos</th></tr></thead>
                <tbody>
                    {holeriteSelecionado.detalhes.map((linha, idx) => (
                        <tr key={idx}><td>{linha.desc}</td><td>{linha.ref}</td><td className="text-right text-success">{linha.venc!=='0,00'?linha.venc:''}</td><td className="text-right text-danger">{linha.desc_val!=='0,00'?linha.desc_val:''}</td></tr>
                    ))}
                </tbody>
            </table>
            <div className="modal-actions-tech"><button className="btn-close-modal" onClick={() => setModalAberto(false)}>Fechar</button></div>
          </div>
        </div>
      )}

      {/* === TEMPLATE DE IMPRESSÃO (PDF OFICIAL) === */}
      <div className="print-hidden-wrapper">
        {holeriteParaImpressao && (
            <div ref={printRef} className="holerite-paper-pro">
            
            {/* 1. CABEÇALHO DA EMPRESA */}
            <div className="holerite-header-pro">
                <div className="company-info-pro">
                    <strong style={{ fontSize: '14pt' }}>TECHCORP SOLUTIONS S.A.</strong>
                    <span>Av. Paulista, 1000 - Bela Vista - São Paulo/SP</span>
                    <span>CNPJ: 12.345.678/0001-90</span>
                </div>
                <div className="doc-title-box">
                    <h3>RECIBO DE PAGAMENTO DE SALÁRIO</h3>
                    <div className="ref-month">
                        {holeriteParaImpressao.mes} / {holeriteParaImpressao.ano}
                    </div>
                </div>
            </div>

            {/* 2. DADOS DO COLABORADOR */}
            <div className="employee-bar-pro">
                <div className="emp-field" style={{ width: '10%' }}>
                    <span className="label">CÓDIGO</span>
                    <span className="value">0042</span>
                </div>
                <div className="emp-field" style={{ width: '40%' }}>
                    <span className="label">NOME DO COLABORADOR</span>
                    <span className="value">{usuario.nome?.toUpperCase()}</span>
                </div>
                <div className="emp-field" style={{ width: '25%' }}>
                    <span className="label">CBO / CARGO</span>
                    <span className="value">{usuario.cargo?.toUpperCase()}</span>
                </div>
                <div className="emp-field" style={{ width: '25%' }}>
                    <span className="label">DEPARTAMENTO / SETOR</span>
                    <span className="value">{usuario.setor?.toUpperCase() || 'GERAL'}</span>
                </div>
            </div>

            {/* 3. TABELA DE VENCIMENTOS E DESCONTOS */}
            <div className="holerite-body-pro">
                <table className="table-pro">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>CÓD.</th>
                            <th style={{ textAlign: 'left' }}>DESCRIÇÃO</th>
                            <th style={{ width: '60px' }}>REF.</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>VENCIMENTOS</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>DESCONTOS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holeriteParaImpressao.detalhes.map((linha, i) => (
                            <tr key={i}>
                                <td>{linha.cod || '000'}</td>
                                <td style={{ textAlign: 'left' }}>{linha.desc}</td>
                                <td>{linha.ref}</td>
                                <td className="valor-col">{linha.venc !== '0,00' ? linha.venc : ''}</td>
                                <td className="valor-col">{linha.desc_val !== '0,00' ? linha.desc_val : ''}</td>
                            </tr>
                        ))}
                        {/* Linhas vazias para preencher o papel */}
                        {[...Array(Math.max(0, 8 - holeriteParaImpressao.detalhes.length))].map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '24px' }}>
                                <td></td><td></td><td></td><td></td><td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 4. RODAPÉ DE TOTAIS */}
            <div className="holerite-footer-pro">
                <div className="totals-row">
                    <div className="total-box">
                        <span className="label">TOTAL VENCIMENTOS</span>
                        <span className="value">
                            {holeriteParaImpressao.tipo.includes('Adiantamento') 
                                ? holeriteParaImpressao.valor_liquido 
                                : holeriteParaImpressao.bases.sal_base}
                        </span>
                    </div>
                    <div className="total-box">
                        <span className="label">TOTAL DESCONTOS</span>
                        <span className="value">
                            {holeriteParaImpressao.tipo.includes('Adiantamento') 
                                ? '0,00' 
                                : (parseFloat(holeriteParaImpressao.bases.sal_base.replace('.','').replace(',','.')) - parseFloat(holeriteParaImpressao.valor_liquido.replace('.','').replace(',','.'))).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                    </div>
                    <div className="total-box liquido">
                        <span className="label">VALOR LÍQUIDO ➔</span>
                        <span className="value">R$ {holeriteParaImpressao.valor_liquido}</span>
                    </div>
                </div>

                {/* BASES DE CÁLCULO */}
                {!holeriteParaImpressao.tipo.includes('Adiantamento') && (
                    <div className="bases-row">
                        <div className="base-item">
                            <span>Salário Base</span>
                            <strong>{holeriteParaImpressao.bases.sal_base}</strong>
                        </div>
                        <div className="base-item">
                            <span>Base INSS</span>
                            <strong>{holeriteParaImpressao.bases.base_inss}</strong>
                        </div>
                        <div className="base-item">
                            <span>Base FGTS</span>
                            <strong>{holeriteParaImpressao.bases.base_fgts}</strong>
                        </div>
                        <div className="base-item">
                            <span>FGTS do Mês</span>
                            <strong>{holeriteParaImpressao.bases.fgts_mes}</strong>
                        </div>
                        <div className="base-item">
                            <span>Base IRRF</span>
                            <strong>{holeriteParaImpressao.bases.base_irrf}</strong>
                        </div>
                        <div className="base-item">
                            <span>Faixa IRRF</span>
                            <strong>{holeriteParaImpressao.bases.faixa_irrf}</strong>
                        </div>
                    </div>
                )}
                
                <div className="legal-msg">
                    <p>DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA DISCRIMINADA NESTE RECIBO.</p>
                </div>

                <div className="sign-row">
                    <div className="sign-place">
                        <span>DATA</span>
                        <div className="line">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="sign-place wide">
                        <span>ASSINATURA DO FUNCIONÁRIO</span>
                        <div className="line"></div>
                    </div>
                </div>
            </div>
            </div>
        )}
      </div>

    </div>
  );
}