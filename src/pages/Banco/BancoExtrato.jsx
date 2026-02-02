import React, { useState } from 'react';
import { db } from '../../firebase';
import { ref, push, remove, update, get } from 'firebase/database';
import { gerarCenarioFinanceiro } from '../../utils/geradorFinanceiro';
import { set } from 'firebase/database';
import { useUser } from '../../contexts/UserContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './Banco.css'; 

const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAbFBMVEVHcEzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFwF820JAAAAI3RSTlMAAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCX7hWEAAAGvSURBVFjD7dbZcoMwEAZgQQKyC7bsW4hL//9D6xAwCKR2pDPPL803E2aWJcrF5fJ/B6B23wGA2g8A7L4BANsfACD7AwC0+wIA2H0BAOwvAMA9AABwDwAA3AMAAPcAAIB7AABwDwAA3AMAAPcAAIB7AABwDwAA3AMAgHsAAOAeAADcAwAA9wAAgHsAAOAeAADcAwAA9wAAgHsAAOAeAADcAwAA9wAA4B4AALgHAADuAQAA9wAAgHsAAOAeAADcAwCA7G8A4PY3AHD7GwC4/Q0A3P4GAG5/AwC3vwGA298AwO1vAOD2NwBw+xsAuP0NANz+BgBufwMAt78BgNvfAMDtNwBw+w0A3H4DALffAMDtNwBw+w0A3H4DALffAMDtNwBw+w0A3H4DALe/AYDb3wDA7W8A4PY3AHD7GwC4/Q0A3P4GAG5/AwC3vwGA298AwO03AHD7DQDb/wEA2X8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDt/wDAF1YjK/u6B678AAAAAElFTkSuQmCC";

export default function BancoExtrato({ extrato, saldo, isCorporate }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // --- GERAÇÃO DE EXTRATO CORPORATIVO (RPA) ---
  const handleGerarDownload = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Gera dados massivos (Só faz sentido se for corporate ou teste)
      const { extrato: novosDados, faturas } = gerarCenarioFinanceiro();

      // Salva no Firebase do usuário (isolado)
      await set(ref(db, `users/${user.uid}/financeiro/faturas`), faturas);
      
      // Gera Excel
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Horizon Bank';
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet('Extrato', { properties: { tabColor: { argb: 'FF8B5CF6' } } });
      
      const imageId = workbook.addImage({ base64: LOGO_BASE64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 64, height: 64 } });
      
      worksheet.mergeCells('C1:F1');
      worksheet.getCell('C1').value = 'HORIZON BANK - CORPORATE';
      worksheet.getCell('C1').font = { size: 14, bold: true };
      
      worksheet.addRow([]); worksheet.addRow([]); worksheet.addRow([]); 
      
      worksheet.columns = [{ width: 15 }, { width: 40 }, { width: 15 }, { width: 15 }, { width: 10 }];
      const header = worksheet.getRow(6);
      header.values = ['DATA', 'HISTÓRICO', 'DOC', 'VALOR', 'TIPO'];
      header.font = { bold: true };

      novosDados.forEach(i => {
        const row = worksheet.addRow([i.data, i.historico, i.documento, i.valor, i.tipo]);
        row.getCell(4).numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Extrato_Horizon.xlsx');

      alert("Extrato Corporativo Gerado e Sincronizado!");

    } catch (e) {
      console.error(e);
      alert("Erro ao gerar.");
    } finally {
      setLoading(false);
    }
  };

  // Filtro
  const filtrados = extrato ? extrato.filter(item => item.desc && item.desc.toLowerCase().includes(busca.toLowerCase())) : [];

  return (
    <div>
      <div className="filters-bar">
        <input 
            type="text" 
            placeholder="🔍 Buscar..." 
            className="search-input-bank"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
        />
        
        {/* BOTÃO SÓ APARECE SE FOR CONTA CORPORATIVA */}
        {isCorporate && (
          <button className="btn-generate-infinite" style={{width:'auto', marginTop:0, padding:'0 20px'}} onClick={handleGerarDownload} disabled={loading}>
              {loading ? 'Processando...' : '📥 Baixar Lote (100+)'}
          </button>
        )}
      </div>

      <div className="glass-card full-width" style={{padding:0, overflow:'hidden'}}>
        <div className="table-container">
            <table>
            <thead>
                <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Documento</th>
                <th className="text-right">Valor</th>
                <th className="text-center">Tipo</th>
                </tr>
            </thead>
            <tbody>
                {filtrados.length === 0 ? (
                    <tr><td colSpan="5" className="empty-msg">Sem lançamentos.</td></tr>
                ) : (
                    filtrados.map((item, i) => (
                    <tr key={i}>
                        <td>{new Date(item.data).toLocaleDateString()}</td>
                        <td className="desc-infinite">{item.desc}</td>
                        <td className="mono">{item.doc}</td>
                        <td className={`text-right ${item.tipo === 'D' ? 'neg' : 'pos'}`}>
                        R$ {Math.abs(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="text-center">
                        <span className={`tag-type ${item.tipo}`}>{item.tipo}</span>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}