import React, { useState } from 'react';
import { db } from '../../firebase';
import { ref, set, update } from 'firebase/database';
import { gerarCenarioFinanceiro } from '../../utils/geradorFinanceiro';
import { useUser } from '../../contexts/UserContext';
import { jsPDF } from 'jspdf'; 
import './Banco.css'; 

export default function BancoExtrato({ extrato, saldo, isCorporate }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  const handleGerarDownload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { extrato: dadosBanco, faturas: dadosSistema } = gerarCenarioFinanceiro();
      await set(ref(db, `users/${user.uid}/financeiro/faturas`), dadosSistema);
      const updates = {};
      dadosBanco.forEach((item, index) => { 
        item.uid = user.uid; 
        const newKey = `tx_${Date.now()}_${index}`;
        updates[`banco_mock/transacoes/${newKey}`] = item;
      });
      updates['banco_mock/saldo'] = 850000.00 + (Math.random() * 50000);
      await update(ref(db), updates);
      alert("✅ Lote Processado! Dados adicionados ao seu extrato.");
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  // === GERAÇÃO NATIVA DO PDF EM TEXTO (RPA FRIENDLY) ===
  const handleBaixarComprovante = (item) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20;

      // ==========================================
      // Cabeçalho Institucional
      
      // 1. LOGO VETORIAL
      pdf.setFillColor(30, 58, 138); // Azul escuro
      pdf.roundedRect(margin, 15, 12, 12, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text("H", margin + 3.5, 23.5);
      
      // 2. TEXTO INSTITUCIONAL
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(30, 58, 138); 
      pdf.text("HORIZON BANK S.A.", margin + 15, 20);
      // ==========================================
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139); 
      pdf.text("Internet Banking Corporativo", margin + 15, 25);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51); 
      pdf.text("COMPROVANTE DE TRANSAÇÃO", 210 - margin, 20, { align: 'right' });
      
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Protocolo: ${item.documento}`, 210 - margin, 25, { align: 'right' });

      // Linha Divisória
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 32, 210 - margin, 32);

      // Detalhes Principais
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("DATA DA TRANSAÇÃO", margin, 42);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      pdf.text(`${new Date(item.data).toLocaleDateString()} às ${item.hora || '12:00:00'}`, margin, 47);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("TIPO DE OPERAÇÃO", 85, 42);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      pdf.text("Crédito em Conta Corrente (STR/PIX)", 85, 47);

      // Box de Valor (Fundo Verde Claro - Mantido para destaque positivo)
      pdf.setFillColor(240, 253, 244); 
      pdf.rect(145, 37, 45, 15, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("VALOR TOTAL", 150, 42);
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105); 
      pdf.text(`R$ ${Math.abs(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 150, 49);

      // --- BLOCOS DE ORIGEM E DESTINO (CORRIGIDO: FUNDO BRANCO) ---
      
      // Pagador
      pdf.setDrawColor(226, 232, 240); // Borda sutil
      pdf.setFillColor(255, 255, 255); // <--- CORREÇÃO: FUNDO BRANCO PURO
      pdf.rect(margin, 60, 80, 45, 'FD');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 58, 138); // Azul Horizon
      pdf.text("ORIGEM (PAGADOR)", margin + 5, 67);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // Rótulo Cinza (Agora legível no fundo branco)
      pdf.text("Nome/Razão Social:", margin + 5, 75);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51); // Valor Preto/Chumbo
      pdf.text(item.pagador_nome || 'NÃO INFORMADO', margin + 5, 80);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text("CPF/CNPJ:", margin + 5, 87);
      pdf.setFont('courier', 'normal');
      pdf.setTextColor(51, 51, 51);
      pdf.text(item.pagador_cnpj || '---', margin + 5, 92);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text("Instituição:", margin + 5, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51);
      pdf.text(item.pagador_banco || 'Outra Instituição', margin + 5, 104);

      // Beneficiário
      // Como usamos 'FD' (Fill and Draw), precisamos garantir que o fill seja branco novamente
      pdf.setFillColor(255, 255, 255); // <--- CORREÇÃO: FUNDO BRANCO PURO
      pdf.rect(110, 60, 80, 45, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 58, 138); // Azul Horizon
      pdf.text("DESTINO (BENEFICIÁRIO)", 115, 67);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // Rótulo Cinza
      pdf.text("Nome/Razão Social:", 115, 75);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51); // Valor Preto
      pdf.text("TECHCORP SOLUTIONS LTDA", 115, 80);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text("CNPJ:", 115, 87);
      pdf.setFont('courier', 'normal');
      pdf.setTextColor(51, 51, 51);
      pdf.text("45.123.001/0001-99", 115, 92);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text("Agência / Conta:", 115, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 51, 51);
      pdf.text("0001 / 8829-X", 115, 104);

      // Histórico
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("HISTÓRICO DO LANÇAMENTO:", margin, 120);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 51, 51);
      pdf.text(item.historico || '', margin, 125);

      // --- ÁREA DE SEGURANÇA (Fundo Branco) ---
      const hashAutenticacao = item.hash || `HRZ-AUTH-${item.documento}`;

      // Caixa de fundo branca
      pdf.setDrawColor(203, 213, 225); 
      pdf.setFillColor(255, 255, 255); // Fundo Branco
      pdf.rect(margin, 135, 170, 25, 'FD'); 

      // Título
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("AUTENTICAÇÃO ELETRÔNICA (HASH)", margin + 5, 142);
      
      // Hash em Azul Escuro
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(16); 
      pdf.setTextColor(30, 58, 138);
      pdf.text(String(hashAutenticacao), margin + 5, 151);

      // Aviso legal
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Utilize este código para validação nos sistemas de conciliação.", margin + 5, 157);

      // Código de barras simulado em azul
      pdf.setDrawColor(30, 58, 138); 
      for(let i=0; i<40; i++) {
          if(Math.random() > 0.3) {
              pdf.setLineWidth(Math.random() > 0.5 ? 1 : 0.5);
              pdf.line(margin + (i*2), 165, margin + (i*2), 175);
          }
      }

      // Rodapé
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Este comprovante tem valor legal conforme a legislação vigente. A transação foi processada em ambiente seguro.", margin, 190);
      pdf.text("Horizon Bank S.A. - CNPJ 00.000.000/0000-00 | Ouvidoria: 0800 999 8888", margin, 194);
      
      pdf.setFont('courier', 'normal');
      pdf.text(`UID: ${item.documento}.${Date.now().toString(36).toUpperCase()}`, margin, 198);

      // Baixa o arquivo instantaneamente
      pdf.save(`Comprovante_Horizon_${item.documento}.pdf`);

    } catch (error) {
      console.error("ERRO AO GERAR O PDF:", error);
      alert("Falha ao gerar o PDF! Verifique a consola do navegador.");
    }
  };

  const filtrados = extrato ? extrato.filter(item => 
    (user && item.uid === user.uid) && 
    ((item.historico && item.historico.toLowerCase().includes(busca.toLowerCase())) ||
    (item.documento && item.documento.toLowerCase().includes(busca.toLowerCase())))
  ) : [];

  return (
    <div>
      <div className="filters-bar">
        <input type="text" placeholder="🔍 Buscar lançamento..." className="search-input-bank" value={busca} onChange={(e) => setBusca(e.target.value)}/>
        {isCorporate && (
          <button className="btn-generate-infinite" style={{width:'auto', background: loading ? '#64748b' : '#2563eb'}} onClick={handleGerarDownload} disabled={loading}>
              {loading ? '⏳ Processando...' : '📥 Gerar Lote'}
          </button>
        )}
      </div>

      <div className="glass-card full-width" style={{padding:0, overflow:'hidden'}}>
        <div className="table-container">
            <table>
            <thead><tr><th>Data</th><th>Histórico</th><th>Doc. (TRX)</th><th className="text-right">Valor</th><th className="text-center">Ação</th></tr></thead>
            <tbody>
                {filtrados.length === 0 ? (<tr><td colSpan="5" className="empty-msg">Nenhum lançamento encontrado.</td></tr>) : (
                    filtrados.map((item, i) => (
                    <tr key={i}>
                        <td>{new Date(item.data).toLocaleDateString()}</td>
                        <td className="desc-infinite">{item.historico}</td>
                        <td className="mono" style={{color:'#f59e0b'}}>{item.documento}</td>
                        <td className={`text-right ${item.tipo === 'D' ? 'neg' : 'pos'}`}>R$ {Math.abs(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="text-center">
                            {item.tipo === 'C' && (
                                <button className="btn-icon-download" onClick={() => handleBaixarComprovante(item)} title="Baixar Comprovante">📄 Baixar</button>
                            )}
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