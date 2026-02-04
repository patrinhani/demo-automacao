import React, { useState, useRef } from 'react';
import { db } from '../../firebase';
import { ref, set, update } from 'firebase/database';
import { gerarCenarioFinanceiro } from '../../utils/geradorFinanceiro';
import { useUser } from '../../contexts/UserContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Banco.css'; 

const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAbFBMVEVHcEzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFwF820JAAAAI3RSTlMAAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCX7hWEAAAGvSURBVFjD7dbZcoMwEAZgQQKyC7bsW4hL//9D6xAwCKR2pDPPL803E2aWJcrF5fJ/B6B23wGA2g8A7L4BANsfACD7AwC0+wIA2H0BAOwvAMA9AABwDwAA3AMAAPcAAIB7AABwDwAA3AMAAPcAAIB7AABwDwAA3AMAgHsAAOAeAADcAwAA9wAAgHsAAOAeAADcAwAA9wAAgHsAAOAeAADcAwAA9wAA4B4AALgHAADuAQAA9wAAgHsAAOAeAADcAwCA7G8A4PY3AHD7GwC4/Q0A3P4GAG5/AwC3vwGA298AwO1vAOD2NwBw+w0A3H4DALffAMDtNwBw+w0A3H4DALffAMDtNwBw+w0A3H4DALe/AYDb3wDA7W8A4PY3AHD7GwC4/Q0A3P4GAG5/AwC3vwGA298AwO03AHD7DQDb/wEA2X8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDt/wDAF1YjK/u6B678AAAAAElFTkSuQmCC";

// Componente visual para simular código de barras no PDF
const FakeBarcode = () => (
    <div style={{height:'30px', background:"repeating-linear-gradient(90deg, #333, #333 2px, transparent 2px, transparent 4px)", marginTop:'20px', opacity:0.8}}></div>
);

export default function BancoExtrato({ extrato, saldo, isCorporate }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [comprovanteData, setComprovanteData] = useState(null);
  const invoiceRef = useRef(); 

  const handleGerarDownload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { extrato: dadosBanco, faturas: dadosSistema } = gerarCenarioFinanceiro();

      // Salva no Sistema e no Banco
      await set(ref(db, `users/${user.uid}/financeiro/faturas`), dadosSistema);
      const transacoesObj = {};
      dadosBanco.forEach((item, index) => { transacoesObj[`tx_${Date.now()}_${index}`] = item; });
      await update(ref(db), {
        'banco_mock/transacoes': transacoesObj,
        'banco_mock/saldo': 850000.00 + (Math.random() * 50000)
      });

      // Gera Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extrato Horizon');
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = 'EXTRATO DE MOVIMENTAÇÃO - HORIZON BANK';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.addRow(['Data', 'Histórico', 'Documento', 'CNPJ Pagador', 'Valor', 'Hash']);
      worksheet.getRow(2).font = { bold: true };
      dadosBanco.forEach(i => {
        worksheet.addRow([i.data, i.historico, i.documento, i.pagador_cnpj || '-', i.valor, i.hash || '-']);
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'Extrato_Horizon.xlsx');

      alert("✅ Lote Processado! Dados atualizados e Excel baixado.");
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleBaixarComprovante = async (item) => {
    setComprovanteData(item);
    setTimeout(async () => {
        if (!invoiceRef.current) return;
        const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
        pdf.save(`Comprovante_Horizon_${item.documento}.pdf`);
        setComprovanteData(null); 
    }, 200);
  };

  const filtrados = extrato ? extrato.filter(item => 
    (item.historico && item.historico.toLowerCase().includes(busca.toLowerCase())) ||
    (item.documento && item.documento.toLowerCase().includes(busca.toLowerCase()))
  ) : [];

  return (
    <div>
      {/* Barra de filtros e botão Gerar (Mantidos iguais) */}
      <div className="filters-bar">
        <input type="text" placeholder="🔍 Buscar lançamento..." className="search-input-bank" value={busca} onChange={(e) => setBusca(e.target.value)}/>
        {isCorporate && (
          <button className="btn-generate-infinite" style={{width:'auto', background: loading ? '#64748b' : '#2563eb'}} onClick={handleGerarDownload} disabled={loading}>
              {loading ? '⏳ Processando...' : '📥 Gerar Lote + Excel'}
          </button>
        )}
      </div>

      {/* Tabela (Mantida igual) */}
      <div className="glass-card full-width" style={{padding:0, overflow:'hidden'}}>
        <div className="table-container">
            <table>
            <thead><tr><th>Data</th><th>Histórico</th><th>Doc.</th><th className="text-right">Valor</th><th className="text-center">Ação</th></tr></thead>
            <tbody>
                {filtrados.length === 0 ? (<tr><td colSpan="5" className="empty-msg">Nenhum lançamento.</td></tr>) : (
                    filtrados.map((item, i) => (
                    <tr key={i}>
                        <td>{new Date(item.data).toLocaleDateString()}</td>
                        <td className="desc-infinite">{item.historico}</td>
                        <td className="mono">{item.documento}</td>
                        <td className={`text-right ${item.tipo === 'D' ? 'neg' : 'pos'}`}>R$ {Math.abs(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="text-center">
                            {item.tipo === 'C' && (
                                <button className="btn-icon-download" onClick={() => handleBaixarComprovante(item)} title="Baixar Comprovante">📄 PDF</button>
                            )}
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* === NOVO TEMPLATE REALISTA DO COMPROVANTE BANCÁRIO === */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>
        {comprovanteData && (
            <div ref={invoiceRef} className="bank-receipt-container">
                
                {/* Cabeçalho Institucional */}
                <div className="receipt-header">
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <img src={LOGO_BASE64} alt="Horizon Bank" style={{width:'40px', height:'40px', opacity:0.8}} />
                        <div>
                            <h2 style={{margin:0, color:'#1e3a8a', fontSize:'1.4rem'}}>HORIZON BANK S.A.</h2>
                            <p style={{margin:0, fontSize:'0.7rem', color:'#64748b'}}>Internet Banking Corporativo</p>
                        </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                        <h3 style={{margin:0, color:'#333', textTransform:'uppercase'}}>Comprovante de Transação</h3>
                        <p style={{margin:'5px 0 0 0', fontSize:'0.8rem', fontFamily:'monospace'}}>Protocolo: {comprovanteData.documento}</p>
                    </div>
                </div>

                <hr className="receipt-divider" />

                {/* Detalhes Principais */}
                <div className="receipt-main-info">
                    <div className="info-group">
                        <label>DATA DA TRANSAÇÃO</label>
                        <span>{new Date(comprovanteData.data).toLocaleDateString()} às {comprovanteData.hora || '12:00:00'}</span>
                    </div>
                    <div className="info-group">
                        <label>TIPO DE OPERAÇÃO</label>
                        <span>Crédito em Conta Corrente (STR/PIX)</span>
                    </div>
                    <div className="info-group highlight">
                        <label>VALOR TOTAL</label>
                        <span style={{fontSize:'1.5rem', color:'#059669'}}>
                            R$ {Math.abs(comprovanteData.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                    </div>
                </div>

                {/* Área de Pagador e Beneficiário (ONDE O CNPJ APARECE) */}
                <div className="receipt-details-grid">
                    
                    {/* DADOS DE QUEM PAGOU */}
                    <div className="detail-box source">
                        <h4 className="box-title">ORIGEM (PAGADOR)</h4>
                        <div className="box-content">
                            <div className="data-row">
                                <span className="data-label">Nome/Razão Social:</span>
                                <span className="data-value">{comprovanteData.pagador_nome || 'NÃO INFORMADO'}</span>
                            </div>
                            <div className="data-row highlight-cnpj">
                                <span className="data-label">CPF/CNPJ:</span>
                                {/* AQUI ESTÁ O CNPJ QUE FALTAVA */}
                                <span className="data-value mono">{comprovanteData.pagador_cnpj || '---'}</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Instituição:</span>
                                <span className="data-value">{comprovanteData.pagador_banco || 'Outra Instituição'}</span>
                            </div>
                        </div>
                    </div>

                    {/* DADOS DE QUEM RECEBEU (NÓS) */}
                    <div className="detail-box destination">
                        <h4 className="box-title">DESTINO (BENEFICIÁRIO)</h4>
                        <div className="box-content">
                            <div className="data-row">
                                <span className="data-label">Nome/Razão Social:</span>
                                <span className="data-value">TECHCORP SOLUTIONS LTDA</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">CNPJ:</span>
                                <span className="data-value mono">45.123.001/0001-99</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Agência / Conta:</span>
                                <span className="data-value">0001 / 8829-X</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Segurança e Histórico */}
                <div className="receipt-security-area">
                    <div style={{marginBottom:'15px'}}>
                        <label style={{fontSize:'0.7rem', fontWeight:'bold', color:'#64748b'}}>HISTÓRICO DO LANÇAMENTO:</label>
                        <p style={{margin:'5px 0', fontSize:'0.9rem'}}>{comprovanteData.historico}</p>
                    </div>

                    <div className="auth-block">
                        <span className="auth-label">AUTENTICAÇÃO ELETRÔNICA (HASH)</span>
                        {/* O HASH IMPORTANTE */}
                        <div className="auth-hash">{comprovanteData.hash || 'GERADO-AUTOMATICAMENTE'}</div>
                        <small>Utilize este código para validação nos sistemas de conciliação.</small>
                    </div>
                    
                    <FakeBarcode />
                </div>

                {/* Rodapé Legal */}
                <div className="receipt-footer">
                    <p>Este comprovante tem valor legal conforme a legislação vigente. A transação foi processada em ambiente seguro.</p>
                    <p>Horizon Bank S.A. - CNPJ 00.000.000/0000-00 | Ouvidoria: 0800 999 8888</p>
                    <p style={{marginTop:'10px', fontFamily:'monospace'}}>
                        UID: {comprovanteData.documento}.{Date.now().toString(36).toUpperCase()}
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}