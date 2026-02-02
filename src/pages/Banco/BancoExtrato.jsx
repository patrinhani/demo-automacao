import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { db } from '../../firebase';
import { ref, set } from 'firebase/database';
import { gerarCenarioFinanceiro } from '../../utils/geradorFinanceiro';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './Banco.css'; 

// LOGO VÁLIDA (Um ícone de escudo roxo minimalista em Base64)
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAbFBMVEVHcEzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFzmXFwF820JAAAAI3RSTlMAAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCX7hWEAAAGvSURBVFjD7dbZcoMwEAZgQQKyC7bsW4hL//9D6xAwCKR2pDPPL803E2aWJcrF5fJ/B6B23wGA2g8A7L4BANsfACD7AwC0+wIA2H0BAOwvAMA9AABwDwAA3AMAAPcAAIB7AABwDwAA3AMAAPcAAIB7AABwDwAA3AMAgHsAAOAeAADcAwAA9wAAgHsAAOAeAADcAwAA9wAAgHsAAOAeAADcAwAA9wAA4B4AALgHAADuAQAA9wAAgHsAAOAeAADcAwCA7G8A4PY3AHD7GwC4/Q0A3P4GAG5/AwC3vwGA298AwO1vAOD2NwBw+xsAuP0NANz+BgBufwMAt78BgNvfAMDtNwBw+w0A3H4DALffAMDtNwBw+w0A3H4DALffAMDtNwBw+w0A3H4DALe/AYDb3wDA7W8A4PY3AHD7GwC4/Q0A3P4GAG5/AwC3vwGA298AwO03AHD7DQDb/wEA2X8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDtvwCA2n8BALX/AgBq/wUA1P4LAKj9FwBQ+y8AoPZfAEDt/wDAF1YjK/u6B678AAAAAElFTkSuQmCC";

export default function BancoExtrato() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleGerarDownload = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Gera os dados (Caos + Ordem)
      const { extrato, faturas } = gerarCenarioFinanceiro();

      // 2. Salva no Firebase (Sincroniza com a tela de Conciliação)
      await set(ref(db, `users/${user.uid}/financeiro/faturas`), faturas);
      await set(ref(db, `users/${user.uid}/financeiro/extrato`), extrato);

      // =================================================================
      // 3. GERAÇÃO DO EXCEL PREMIUM (ExcelJS)
      // =================================================================
      const workbook = new ExcelJS.Workbook();
      
      // Metadados do Arquivo
      workbook.creator = 'Horizon Bank System';
      workbook.lastModifiedBy = 'TechCorp Bot';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Extrato Conta Corrente', {
        properties: { tabColor: { argb: 'FF8B5CF6' } }, // Aba roxa
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // --- A. ADICIONAR LOGOTIPO ---
      const imageId = workbook.addImage({
        base64: LOGO_BASE64,
        extension: 'png',
      });
      
      // Posiciona o logo nas células A1:B4 (Mescla implícita visual)
      // tl = Top Left (Coluna 0, Linha 0)
      // ext = Extensão em pixels (64x64)
      worksheet.addImage(imageId, {
        tl: { col: 0.2, row: 0.2 }, 
        ext: { width: 64, height: 64 } 
      });

      // --- B. CABEÇALHO DO BANCO (Títulos) ---
      // Mescla as células para o título ficar ao lado do logo
      worksheet.mergeCells('C1:F1');
      const titleCell = worksheet.getCell('C1');
      titleCell.value = 'HORIZON BANK - CORPORATE';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

      worksheet.mergeCells('C2:F2');
      const subTitle = worksheet.getCell('C2');
      subTitle.value = `Cliente: ${user.email ? user.email.split('@')[0].toUpperCase() : 'USUARIO'} | Agência: 0001 | Conta: 9932-X`;
      subTitle.font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } };

      worksheet.mergeCells('C3:F3');
      worksheet.getCell('C3').value = `Emissão: ${new Date().toLocaleString('pt-BR')}`;
      worksheet.getCell('C3').font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };

      // Pula linhas para dar espaço entre cabeçalho e tabela
      worksheet.addRow([]); 
      worksheet.addRow([]); 
      worksheet.addRow([]); 

      // --- C. TABELA DE DADOS ---
      // Define largura das colunas
      worksheet.columns = [
        { key: 'data', width: 15 },
        { key: 'historico', width: 45 },
        { key: 'doc', width: 15 },
        { key: 'valor', width: 18 },
        { key: 'tipo', width: 8 },
      ];

      // Cabeçalho da Tabela (Linha 6)
      const headerRow = worksheet.getRow(6);
      headerRow.values = ['DATA', 'HISTÓRICO DE LANÇAMENTO', 'DOCUMENTO', 'VALOR (R$)', 'TIPO'];
      
      // Estilo do Cabeçalho (Roxo TechCorp)
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8B5CF6' } // Roxo Neon
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF6D28D9' } } };
      });

      // Insere os dados
      extrato.forEach((item) => {
        const row = worksheet.addRow([
          item.data,
          item.historico,
          item.documento,
          item.valor, // Valor numérico real (negativo ou positivo)
          item.tipo
        ]);

        // Formatação Condicional (Vermelho para Débito, Verde para Crédito)
        const valorCell = row.getCell(4); // Coluna Valor (D)
        
        if (item.valor < 0) {
          valorCell.font = { color: { argb: 'FFDC2626' } }; // Vermelho
        } else {
          valorCell.font = { color: { argb: 'FF16A34A' } }; // Verde
        }

        // --- EXPLICAÇÃO SOBRE O SINAL NEGATIVO ---
        // O formato abaixo mantém o sinal negativo para débitos.
        // Se quisesse esconder o sinal, usaria: '"R$" #,##0.00;[Red]"R$" #,##0.00' (Sem o menos no 2º bloco)
        // Mas vamos manter o padrão bancário:
        valorCell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
        
        // Alinhamento das outras colunas
        row.getCell(1).alignment = { horizontal: 'center' }; // Data
        row.getCell(3).alignment = { horizontal: 'center' }; // Doc
        row.getCell(5).alignment = { horizontal: 'center' }; // Tipo (D/C)
        
        // Borda fina embaixo de cada linha
        row.eachCell((cell) => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
        });
      });

      // --- D. RODAPÉ ---
      const lastRow = extrato.length + 8; // Linha atual + margem
      worksheet.mergeCells(`A${lastRow}:E${lastRow}`);
      const footer = worksheet.getCell(`A${lastRow}`);
      footer.value = '*** Fim do Extrato - Horizon Bank Security System ***';
      footer.alignment = { horizontal: 'center' };
      footer.font = { size: 8, color: { argb: 'FFCBD5E1' } };

      // Gera o Buffer e Baixa
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, `Extrato_Horizon_Bank_${new Date().getTime()}.xlsx`);

      alert("📂 Extrato Premium gerado!\n\n1. O logo deve aparecer no canto esquerdo.\n2. Valores em VERMELHO são saídas (negativos).\n3. Valores em VERDE são entradas (positivos).");

    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      alert("Erro ao gerar arquivo personalizado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="banco-container-interno">
      <div className="banco-header">
        <h2>Extrato / Conta Corrente</h2>
        <p style={{color: '#666', fontSize:'14px'}}>Área Segura - Exportação Oficial</p>
      </div>

      <div className="area-download-xlsx" style={{
        padding: '50px', 
        textAlign: 'center', 
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        marginTop: '20px',
        background: 'linear-gradient(to bottom right, #f8fafc, #fff)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        {/* Ícone Decorativo na Interface Web */}
        <div style={{
          width: '60px', height: '60px', background: '#f0fdfa', 
          borderRadius: '50%', margin: '0 auto 20px auto', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '30px', border: '1px solid #ccfbf1'
        }}>
          📊
        </div>

        <h3 style={{color: '#0f172a', marginBottom: '10px'}}>Exportação Contábil</h3>
        <p style={{marginBottom: '30px', color: '#64748b', maxWidth: '400px', margin: '0 auto 30px auto'}}>
          Baixe o extrato detalhado com identidade visual Horizon para auditoria e conciliação.
        </p>
        
        <button 
          onClick={handleGerarDownload} 
          disabled={loading} 
          className="btn-banco-action"
          style={{
            padding: '16px 32px', 
            fontSize: '16px', 
            background: 'linear-gradient(135deg, #0f766e, #115e59)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(15, 118, 110, 0.3)',
            transition: 'transform 0.2s',
            fontWeight: '600'
          }}
        >
          {loading ? "Gerando Arquivo Personalizado..." : "📥 Baixar Extrato Oficial (.xlsx)"}
        </button>
      </div>
      
      <div className="aviso-rodape" style={{marginTop:'40px', color: '#94a3b8', fontSize: '11px'}}>
        <p>HORIZON BANK CORPORATE • CRIPTOGRAFIA DE PONTA A PONTA</p>
      </div>
    </div>
  );
}