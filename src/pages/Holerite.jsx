import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo';
import '../App.css';
import './Holerite.css';

export default function Holerite() {
  const navigate = useNavigate();
  
  // Estados da Página
  const [anoSelecionado, setAnoSelecionado] = useState('2024');
  const [valoresVisiveis, setValoresVisiveis] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  
  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [holeriteSelecionado, setHoleriteSelecionado] = useState(null);

  // NOVO: Estado para o PDF oculto
  const [holeriteParaImpressao, setHoleriteParaImpressao] = useState(null);
  const printRef = useRef();

  // Mock de Dados Completo (com bases de cálculo para o PDF)
  const holerites = [
    { 
      id: 1, 
      ano: '2024', mes: 'Outubro', tipo: 'Folha Mensal', 
      data_credito: '30/10/2024', valor_liquido: '3.450,00', status: 'PAGO',
      // Dados específicos para o PDF
      bases: { sal_base: '4.000,00', base_inss: '4.150,00', base_fgts: '4.150,00', fgts_mes: '332,00', base_irrf: '3.700,00', faixa_irrf: '7.5%' },
      detalhes: [
        { cod: '001', desc: 'Salário Base', ref: '30d', venc: '4.000,00', desc_val: '0,00' },
        { cod: '015', desc: 'Hora Extra 50%', ref: '02:00', venc: '150,00', desc_val: '0,00' },
        { cod: '501', desc: 'INSS', ref: '11%', venc: '0,00', desc_val: '450,00' },
        { cod: '505', desc: 'IRRF', ref: '7.5%', venc: '0,00', desc_val: '150,00' },
        { cod: '520', desc: 'Vale Transporte', ref: '6%', venc: '0,00', desc_val: '100,00' }
      ]
    },
    { 
      id: 2, 
      ano: '2024', mes: 'Outubro', tipo: 'Adiantamento Quinzenal', 
      data_credito: '15/10/2024', valor_liquido: '1.600,00', status: 'PAGO', cssClass: 'adiantamento',
      bases: { sal_base: '4.000,00', base_inss: '0,00', base_fgts: '0,00', fgts_mes: '0,00', base_irrf: '0,00', faixa_irrf: '0%' },
      detalhes: [
        { cod: '005', desc: 'Adiantamento Salarial', ref: '40%', venc: '1.600,00', desc_val: '0,00' }
      ]
    },
    { 
      id: 3, 
      ano: '2024', mes: 'Setembro', tipo: 'Folha Mensal', 
      data_credito: '30/09/2024', valor_liquido: '3.400,00', status: 'PAGO',
      bases: { sal_base: '4.000,00', base_inss: '4.000,00', base_fgts: '4.000,00', fgts_mes: '320,00', base_irrf: '3.550,00', faixa_irrf: '7.5%' },
      detalhes: [
        { cod: '001', desc: 'Salário Base', ref: '30d', venc: '4.000,00', desc_val: '0,00' },
        { cod: '501', desc: 'INSS', ref: '11%', venc: '0,00', desc_val: '450,00' },
        { cod: '505', desc: 'IRRF', ref: '7.5%', venc: '0,00', desc_val: '150,00' }
      ]
    }
  ];

  const listaFiltrada = holerites.filter(h => h.ano === anoSelecionado);

  const handleDownload = async (id, nomeArquivo) => {
    setDownloadingId(id);
    
    // 1. Seleciona o holerite para preencher o template oculto
    const holeriteParaBaixar = holerites.find(h => h.id === id);
    setHoleriteParaImpressao(holeriteParaBaixar);

    // 2. Aguarda renderização e gera o PDF
    setTimeout(async () => {
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
      
      setDownloadingId(null);
      setHoleriteParaImpressao(null); // Limpa o template
    }, 800);
  };

  const abrirDetalhes = (item) => {
    setHoleriteSelecionado(item);
    setModalAberto(true);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="holerite-header">
          <div>
            <h2>Meus Holerites</h2>
            <div className="breadcrumbs">Financeiro &gt; Documentos &gt; Consulta</div>
          </div>
          <button className="privacy-toggle" onClick={() => setValoresVisiveis(!valoresVisiveis)}>
            {valoresVisiveis ? '👁️ Ocultar Valores' : '🙈 Mostrar Valores'}
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Ano Competência</label>
            <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Tipo de Folha</label>
            <select><option value="todos">Todas</option><option value="mensal">Folha Mensal</option><option value="adiantamento">Adiantamento</option></select>
          </div>
        </div>

        <div className="holerite-list">
          {listaFiltrada.map((item) => (
            <div key={item.id} className={`holerite-card ${item.cssClass || ''}`}>
              <div className="card-info">
                <h4>{item.tipo} - {item.mes}/{item.ano}</h4>
                <span>Disponibilizado em: <strong>{item.data_credito}</strong></span>
                <span style={{display: 'inline-block', marginTop: '5px', padding: '2px 8px', borderRadius: '4px', background: item.status === 'PAGO' ? '#e8f5e9' : '#fff3cd', color: item.status === 'PAGO' ? '#2e7d32' : '#856404', fontWeight: 'bold', fontSize: '0.7rem'}}>
                  {item.status}
                </span>
              </div>
              <div className="card-values">
                <small>VALOR LÍQUIDO</small>
                <div className={`valor ${!valoresVisiveis ? 'blurred' : ''}`}>R$ {item.valor_liquido}</div>
              </div>
              <div className="card-actions">
                <button className="btn-icon view" title="Visualizar" onClick={() => abrirDetalhes(item)}>📄</button>
                <button className="btn-icon download" title="Baixar PDF" onClick={() => handleDownload(item.id, `Holerite_${item.mes}_${item.ano}.pdf`)}>
                  {downloadingId === item.id ? '⏳' : '⬇'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL (Mantido igual) */}
      {modalAberto && holeriteSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header"><h3>Detalhes</h3><button className="modal-close" onClick={() => setModalAberto(false)}>×</button></div>
            <div style={{background: '#f8f9fa', padding: '15px', marginBottom: '20px', borderRadius: '4px'}}>
                <strong>{holeriteSelecionado.tipo}</strong> <br/>Competência: {holeriteSelecionado.mes}/{holeriteSelecionado.ano}
            </div>
            <table className="payslip-table">
                <thead><tr><th style={{width: '40%'}}>Descrição</th><th>Ref.</th><th className="text-right">Vencimentos</th><th className="text-right">Descontos</th></tr></thead>
                <tbody>
                    {holeriteSelecionado.detalhes.map((linha, idx) => (
                        <tr key={idx}><td>{linha.desc}</td><td>{linha.ref}</td><td className="text-right text-success">{linha.venc !== '0,00' ? linha.venc : ''}</td><td className="text-right text-danger">{linha.desc_val !== '0,00' ? linha.desc_val : ''}</td></tr>
                    ))}
                    <tr><td colSpan="4" style={{height: '20px'}}></td></tr>
                </tbody>
            </table>
            <div className="modal-actions"><button className="btn-secondary" onClick={() => setModalAberto(false)}>Fechar</button></div>
          </div>
        </div>
      )}

      {/* =================================================================
          TEMPLATE DE IMPRESSÃO (RECIBO DE PAGAMENTO)
         ================================================================= */}
      <div className="print-hidden-wrapper">
        {holeriteParaImpressao && (
        <div ref={printRef} className="print-holerite-page">
            
            {/* CABEÇALHO DO HOLERITE */}
            <div className="holerite-box">
                <div className="holerite-header-top">
                    <div>
                        <span className="holerite-label">EMPREGADOR</span>
                        <strong style={{fontSize: '11pt'}}>TECHCORP SOLUTIONS S.A.</strong><br/>
                        <span style={{fontSize: '8pt'}}>Av. Paulista, 1000 - São Paulo/SP - CNPJ: 12.345.678/0001-90</span>
                    </div>
                    <div className="holerite-title">
                        RECIBO DE PAGAMENTO<br/>DE SALÁRIO<br/>
                        <span style={{fontSize: '9pt', fontWeight: 'normal'}}>Competência: {holeriteParaImpressao.mes}/{holeriteParaImpressao.ano}</span>
                    </div>
                </div>
            </div>

            <div className="holerite-box">
                <div className="holerite-info-row">
                    <div style={{width: '10%'}}><span className="holerite-label">CÓDIGO</span><span className="holerite-value">00452</span></div>
                    <div style={{width: '40%'}}><span className="holerite-label">NOME DO FUNCIONÁRIO</span><span className="holerite-value">GUILHERME SILVA</span></div>
                    <div style={{width: '15%'}}><span className="holerite-label">CBO</span><span className="holerite-value">2124-05</span></div>
                    <div style={{width: '20%'}}><span className="holerite-label">DEPARTAMENTO</span><span className="holerite-value">TI / DEV</span></div>
                </div>
            </div>

            {/* TABELA DE VALORES */}
            <table className="holerite-table">
                <thead>
                    <tr>
                        <th style={{width: '10%'}}>CÓD.</th>
                        <th style={{width: '40%'}}>DESCRIÇÃO</th>
                        <th style={{width: '10%', textAlign: 'center'}}>REF.</th>
                        <th style={{width: '20%', textAlign: 'right'}}>VENCIMENTOS</th>
                        <th style={{width: '20%', textAlign: 'right'}}>DESCONTOS</th>
                    </tr>
                </thead>
                <tbody>
                    {holeriteParaImpressao.detalhes.map((linha, i) => (
                        <tr key={i}>
                            <td>{linha.cod}</td>
                            <td>{linha.desc}</td>
                            <td style={{textAlign: 'center'}}>{linha.ref}</td>
                            <td style={{textAlign: 'right'}}>{linha.venc !== '0,00' ? linha.venc : ''}</td>
                            <td style={{textAlign: 'right'}}>{linha.desc_val !== '0,00' ? linha.desc_val : ''}</td>
                        </tr>
                    ))}
                    {/* Linhas vazias para preencher espaço */}
                    {[...Array(8 - holeriteParaImpressao.detalhes.length)].map((_, i) => (
                        <tr key={`empty-${i}`} style={{height: '20px'}}><td></td><td></td><td></td><td></td><td></td></tr>
                    ))}
                </tbody>
            </table>

            {/* TOTAIS */}
            <div className="holerite-totals">
                <div className="holerite-total-box"></div>
                <div className="holerite-total-box">
                    <span className="total-label">TOTAL VENCIMENTOS</span>
                    <span className="total-value">
                        {/* Soma simples dos Vencimentos para demo */}
                        {holeriteParaImpressao.bases.sal_base && '4.150,00'}
                        {!holeriteParaImpressao.bases.sal_base && '1.600,00'}
                    </span>
                </div>
                <div className="holerite-total-box">
                    <span className="total-label">TOTAL DESCONTOS</span>
                    <span className="total-value">
                        {holeriteParaImpressao.bases.sal_base && '700,00'}
                        {!holeriteParaImpressao.bases.sal_base && '0,00'}
                    </span>
                </div>
                <div className="holerite-total-box" style={{background: '#eee'}}>
                    <span className="total-label">LÍQUIDO A RECEBER</span>
                    <span className="total-value">R$ {holeriteParaImpressao.valor_liquido}</span>
                </div>
            </div>

            {/* BASES DE CÁLCULO (RODAPÉ) */}
            <div className="holerite-footer-bases">
                <div className="base-item"><span className="base-label">SAL. BASE</span><span className="base-value">{holeriteParaImpressao.bases.sal_base}</span></div>
                <div className="base-item"><span className="base-label">SAL. CONTR. INSS</span><span className="base-value">{holeriteParaImpressao.bases.base_inss}</span></div>
                <div className="base-item"><span className="base-label">BASE CALC. FGTS</span><span className="base-value">{holeriteParaImpressao.bases.base_fgts}</span></div>
                <div className="base-item"><span className="base-label">FGTS DO MÊS</span><span className="base-value">{holeriteParaImpressao.bases.fgts_mes}</span></div>
                <div className="base-item"><span className="base-label">BASE CALC. IRRF</span><span className="base-value">{holeriteParaImpressao.bases.base_irrf}</span></div>
                <div className="base-item"><span className="base-label">FAIXA IRRF</span><span className="base-value">{holeriteParaImpressao.bases.faixa_irrf}</span></div>
            </div>

            <div className="holerite-msg">
                <p>DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA DISCRIMINADA NESTE RECIBO.</p>
            </div>

            <div className="holerite-sign-area">
                DATA ___/___/______ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ASSINATURA DO FUNCIONÁRIO
            </div>

        </div>
        )}
      </div>

    </div>
  );
}