import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import { db, auth } from '../firebase'; 
import { ref, get } from 'firebase/database'; // Apenas leitura (get)
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

  const [anoSelecionado, setAnoSelecionado] = useState('2024');
  const [valoresVisiveis, setValoresVisiveis] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [holeriteSelecionado, setHoleriteSelecionado] = useState(null);
  const [holeriteParaImpressao, setHoleriteParaImpressao] = useState(null);

  // --- 1. BUSCAR DADOS (SOMENTE LEITURA) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = ref(db, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            setUsuario(snapshot.val()); 
          } else {
            // Se não achar, usa padrão (mas não salva nada)
            setUsuario({ 
                nome: currentUser.displayName || "Colaborador", 
                cargo: "Não Definido", 
                salarioBase: 0, 
                setor: "Geral",
                admissao: "..."
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
  }, [navigate]);

  // --- 2. CÁLCULO DINÂMICO ---
  const holeritesDinamicos = useMemo(() => {
    if (loadingUser) return [];

    const sb = parseFloat(usuario.salarioBase || 0); 
    
    // Se o salário for 0 (perfil incompleto), retorna vazio para não mostrar dados errados
    if (sb === 0) return [];

    const inss = sb > 7786 ? 876.95 : sb * 0.14; 
    let irrf = 0;
    if (sb > 4664.68) irrf = (sb * 0.275) - 869.36;
    else if (sb > 3751.06) irrf = (sb * 0.225) - 636.13;
    else if (sb > 2826.65) irrf = (sb * 0.15) - 354.80;
    if (irrf < 0) irrf = 0;

    const descontos = inss + irrf;
    const liquido = sb - descontos;
    const f = (val) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      { 
        id: 1, ano: '2024', mes: 'Outubro', tipo: 'Folha Mensal', 
        data_credito: '30/10/2024', valor_liquido: f(liquido), status: 'PAGO', cssClass: 'mensal',
        bases: { sal_base: f(sb), base_inss: f(sb), base_fgts: f(sb), fgts_mes: f(sb * 0.08), base_irrf: f(sb - inss), faixa_irrf: '27.5%' },
        detalhes: [
          { cod: '001', desc: 'Salário Base / Pró-labore', ref: '30d', venc: f(sb), desc_val: '0,00' },
          { cod: '501', desc: 'INSS', ref: '14%', venc: '0,00', desc_val: f(inss) },
          { cod: '505', desc: 'IRRF', ref: '27.5%', venc: '0,00', desc_val: f(irrf) },
        ]
      },
      { 
        id: 2, ano: '2024', mes: 'Outubro', tipo: 'Adiantamento Quinzenal', 
        data_credito: '15/10/2024', valor_liquido: f(sb * 0.4), status: 'PAGO', cssClass: 'adiantamento',
        bases: { sal_base: f(sb), base_inss: '0,00', base_fgts: '0,00', fgts_mes: '0,00', base_irrf: '0,00', faixa_irrf: '0%' },
        detalhes: [
          { cod: '005', desc: 'Adiantamento Salarial', ref: '40%', venc: f(sb * 0.4), desc_val: '0,00' }
        ]
      }
    ];
  }, [usuario.salarioBase, loadingUser]);

  const listaFiltrada = useMemo(() => {
    return holeritesDinamicos.filter(h => h.ano === anoSelecionado);
  }, [anoSelecionado, holeritesDinamicos]);

  const handleDownload = async (id, nomeArquivo) => {
    if (downloadingId) return;
    setDownloadingId(id);
    const holeriteParaBaixar = holeritesDinamicos.find(h => h.id === id);
    setHoleriteParaImpressao(holeriteParaBaixar);

    setTimeout(async () => {
      try {
        if (printRef.current) {
          const element = printRef.current;
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(nomeArquivo);
        }
      } catch (error) { console.error("Erro PDF:", error); } 
      finally { setDownloadingId(null); setHoleriteParaImpressao(null); }
    }, 800);
  };

  const abrirDetalhes = (item) => {
    setHoleriteSelecionado(item);
    setModalAberto(true);
  };

  if (loadingUser) return <div className="tech-holerite-layout" style={{justifyContent: 'center', alignItems: 'center'}}><div style={{color: '#fff'}}>Carregando...</div></div>;

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
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
                <span style={{fontSize: '0.8rem', color: 'var(--neon-blue)', border: '1px solid var(--neon-blue)', padding: '2px 8px', borderRadius: '4px'}}>
                {usuario.cargo?.toUpperCase()}
                </span>
            </div>
          </div>
          <button className="privacy-toggle-tech" onClick={() => setValoresVisiveis(!valoresVisiveis)}>
            {valoresVisiveis ? '👁️ Ocultar Valores' : '🙈 Mostrar Valores'}
          </button>
        </div>

        {/* Se o salário for 0, mostra aviso de contato com RH em vez de form de edição */}
        {usuario.salarioBase === 0 ? (
            <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '15px', padding: '20px', marginBottom: '30px', color: '#fff', textAlign: 'center'}}>
                <h3 style={{margin: '0 0 10px 0', color: '#fca5a5'}}>⚠ Perfil Financeiro Incompleto</h3>
                <p>Seus dados de salário ainda não foram cadastrados no sistema.</p>
                <p style={{fontSize:'0.9rem', color:'#ccc'}}>Por favor, entre em contato com o Departamento Pessoal (RH) para regularização.</p>
            </div>
        ) : (
            <>
                <div className="filter-bar-tech">
                <div className="filter-group">
                    <label>Ano Competência</label>
                    <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Tipo de Folha</label>
                    <select><option value="todos">Todas</option><option value="mensal">Folha Mensal</option><option value="adiantamento">Adiantamento</option></select>
                </div>
                </div>

                <div className="holerite-list">
                {listaFiltrada.map((item) => (
                    <div key={item.id} className={`holerite-card-tech ${item.cssClass || ''}`}>
                    <div className="card-info">
                        <h4>{item.tipo} - {item.mes}/{item.ano}</h4>
                        <span>Disponibilizado em: <strong>{item.data_credito}</strong></span>
                        <span className={`status-badge ${item.status === 'PAGO' ? 'pago' : ''}`}>{item.status}</span>
                    </div>
                    <div className="card-values">
                        <small>LÍQUIDO A RECEBER</small>
                        <div className={`valor ${!valoresVisiveis ? 'blurred' : ''}`}>R$ {item.valor_liquido}</div>
                    </div>
                    <div className="card-actions">
                        <button className="btn-icon-tech" onClick={() => abrirDetalhes(item)}>📄</button>
                        <button className={`btn-icon-tech ${downloadingId === item.id ? 'disabled' : ''}`} onClick={() => handleDownload(item.id, `Holerite.pdf`)} disabled={downloadingId !== null}>
                        {downloadingId === item.id ? '⏳' : '⬇'}
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            </>
        )}
      </div>

      {modalAberto && holeriteSelecionado && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-content-techH" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-tech">
              <h3>Detalhes do Holerite</h3>
              <button className="modal-close-tech" onClick={() => setModalAberto(false)}>×</button>
            </div>
            <div className="modal-details-summary">
                <strong style={{color: '#fff', fontSize: '1.2rem'}}>{holeriteSelecionado.tipo}</strong> <br/>
                <span style={{color: '#94a3b8'}}>Competência: {holeriteSelecionado.mes}/{holeriteSelecionado.ano}</span>
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

      <div className="print-hidden-wrapper">
        {holeriteParaImpressao && (
        <div ref={printRef} className="print-holerite-page">
            <div className="holerite-box">
                <div className="holerite-header-top">
                    <div>
                        <span className="holerite-label">EMPREGADOR</span>
                        <strong style={{fontSize: '11pt'}}>TECHCORP SOLUTIONS S.A.</strong><br/>
                        <span style={{fontSize: '8pt'}}>CNPJ: 12.345.678/0001-90</span>
                    </div>
                    <div className="holerite-title">RECIBO DE PAGAMENTO<br/>DE SALÁRIO</div>
                </div>
            </div>
            <div className="holerite-box">
                <div className="holerite-info-row">
                    <div style={{width: '10%'}}><span className="holerite-label">CÓD.</span><span className="holerite-value">001</span></div>
                    <div style={{width: '40%'}}><span className="holerite-label">NOME</span><span className="holerite-value">{usuario.nome?.toUpperCase()}</span></div>
                    <div style={{width: '20%'}}><span className="holerite-label">ADMISSÃO</span><span className="holerite-value">{usuario.admissao || '01/01/2024'}</span></div>
                    <div style={{width: '30%'}}><span className="holerite-label">CARGO</span><span className="holerite-value">{usuario.cargo?.toUpperCase()}</span></div>
                </div>
            </div>
            <table className="holerite-table">
                <thead><tr><th>DESCRIÇÃO</th><th>REF.</th><th style={{textAlign:'right'}}>VENCIMENTOS</th><th style={{textAlign:'right'}}>DESCONTOS</th></tr></thead>
                <tbody>
                    {holeriteParaImpressao.detalhes.map((linha, i) => (
                        <tr key={i}><td>{linha.desc}</td><td>{linha.ref}</td><td align="right">{linha.venc!=='0,00'?linha.venc:''}</td><td align="right">{linha.desc_val!=='0,00'?linha.desc_val:''}</td></tr>
                    ))}
                    {[...Array(6)].map((_, i) => <tr key={`e-${i}`} style={{height:'20px'}}><td></td><td></td><td></td><td></td></tr>)}
                </tbody>
            </table>
            <div className="holerite-totals">
                <div className="holerite-total-box"><span className="total-label">TOTAL VENCIMENTOS</span><span className="total-value">{holeriteParaImpressao.tipo.includes('Adiantamento') ? holeriteParaImpressao.valor_liquido : holeriteParaImpressao.bases.sal_base}</span></div>
                <div className="holerite-total-box"><span className="total-label">TOTAL DESCONTOS</span><span className="total-value">{holeriteParaImpressao.tipo.includes('Adiantamento') ? '0,00' : (parseFloat(holeriteParaImpressao.bases.sal_base.replace('.','').replace(',','.')) - parseFloat(holeriteParaImpressao.valor_liquido.replace('.','').replace(',','.'))).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
                <div className="holerite-total-box" style={{background:'#eee'}}><span className="total-label">LÍQUIDO</span><span className="total-value">R$ {holeriteParaImpressao.valor_liquido}</span></div>
            </div>
            <div className="holerite-sign-area">Assinatura: ________________________________________________</div>
        </div>
        )}
      </div>
    </div>
  );
}