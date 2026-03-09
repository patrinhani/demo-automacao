import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../contexts/UserContext';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'; 

import { db } from '../../firebase'; 
import { ref, get } from 'firebase/database'; 
import { useAlert } from '../../contexts/AlertContext'; // <-- Importado o AlertContext

import './PDFFactory.css';

export default function PDFFactory() {
  const { isDev } = useUser();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert(); // <-- Inicializado o hook de alertas

  const [activeTab, setActiveTab] = useState('boasvindas');
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [progressoBatch, setProgressoBatch] = useState("");

  const [formData, setFormData] = useState({
    nome: 'Usuario Exemplo',
    email: 'usuario.comprido@techcorp.com.br', // Exemplo longo para teste
    senha: 'Mudar@123',
    cargo: 'Novo Colaborador',
    dataInicio: '2023-10-25',
    horarioInicio: '09:00',
    // ...outros campos mantidos
    mes: '10/2023',
    salarioBase: 8500,
    horasExtras: 1500,
    descontos: 2000,
    cliente: 'Cliente Teste Ltda',
    cnpj: '12.345.678/0001-90',
    valorNota: 15000,
    descricaoServico: 'Desenvolvimento de Software Customizado'
  });

  useEffect(() => {
    // <-- Função assíncrona para aguardar o alerta
    const verificarAcesso = async () => {
      if (isDev === false) { 
        await showAlert("Acesso Negado", "Acesso restrito a Desenvolvedores.");
        navigate('/dashboard');
      }
    };
    verificarAcesso();
  }, [isDev, navigate, showAlert]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =========================================================================
  // --- GERADOR DE PDF (COM CORREÇÃO DE TAMANHO DE FONTE) ---
  // =========================================================================

  const montarDocBoasVindas = (dadosOverride = null) => {
    const dados = dadosOverride || formData; 

    const doc = new jsPDF();
    const dataFormatada = dados.dataInicio ? dados.dataInicio.split('-').reverse().join('/') : '--/--/----';

    // 1. Fundo Tech
    doc.setFillColor(248, 250, 252); 
    doc.rect(0, 0, 210, 297, 'F');
    
    // Linhas diagonais
    doc.setDrawColor(226, 232, 240); 
    doc.setLineWidth(0.5);
    for (let i = -100; i < 300; i += 10) {
      doc.line(0, i, 210, i + 100); 
    }

    // Moldura
    doc.setDrawColor(168, 85, 247); 
    doc.setLineWidth(2);
    doc.roundedRect(10, 10, 190, 277, 4, 4);

    // 2. Cabeçalho
    doc.setFillColor(168, 85, 247);
    doc.circle(105, 40, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TC", 105, 42, { align: "center" });

    doc.setTextColor(30, 41, 59); 
    doc.setFontSize(22);
    doc.text("BEM-VINDO AO TIME", 105, 65, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.setFont("helvetica", "normal");
    doc.text("Seu acesso oficial ao ecossistema TechCorp", 105, 72, { align: "center" });

    // 3. Card Central
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(35, 90, 140, 120, 3, 3, 'FD');
    doc.setFillColor(168, 85, 247); 
    doc.rect(36, 91, 138, 4, 'F'); 

    // Dados Principais
    doc.setTextColor(15, 23, 42); 
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text((dados.nome || "Colaborador").toUpperCase(), 105, 115, { align: "center" });
    
    doc.setTextColor(168, 85, 247); 
    doc.setFontSize(11);
    doc.text(dados.cargo || "Cargo não definido", 105, 122, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(50, 130, 160, 130);

    // Detalhes
    const startY = 145;
    const col1X = 50;
    const col2X = 115;
    const lineHeight = 18;

    // --- FUNÇÃO CORRIGIDA: AUTO-AJUSTE DE FONTE ---
    const drawItem = (x, y, label, valueStr, color, maxWidth = 50) => {
        const valorFinal = String(valueStr || "");

        // Marcador (Bolinha)
        doc.setFillColor(...color); 
        doc.circle(x, y - 1, 1.5, 'F');

        // Rótulo
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); 
        doc.setFont("helvetica", "bold");
        doc.text(label, x + 5, y);

        // Valor (Com ajuste automático de tamanho)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42); 
        
        let fontSize = 11; // Tamanho ideal
        doc.setFontSize(fontSize);
        
        // Reduz a fonte enquanto o texto for maior que o espaço permitido (maxWidth)
        // O limite mínimo da fonte é 6 para não ficar ilegível
        while (doc.getTextWidth(valorFinal) > maxWidth && fontSize > 6) {
            fontSize -= 0.5;
            doc.setFontSize(fontSize);
        }

        doc.text(valorFinal, x + 5, y + 6);
    };

    // Aumentei um pouco o maxWidth (55) para aproveitar bem o espaço
    drawItem(col1X, startY, "DATA DE INICIO", dataFormatada, [59, 130, 246], 55); 
    drawItem(col1X, startY + lineHeight, "HORARIO", `${dados.horarioInicio || "09:00"} h`, [16, 185, 129], 55); 
    
    // Login e Senha podem ser longos, então o auto-ajuste vai atuar aqui
    drawItem(col2X, startY, "LOGIN DE ACESSO", dados.email || "email@tech.com", [249, 115, 22], 55); 
    drawItem(col2X, startY + lineHeight, "SENHA PROVISORIA", dados.senha || "Mudar@123", [239, 68, 68], 55); 

    // --- MENSAGEM DE AVISO ---
    doc.setFillColor(254, 226, 226); 
    doc.roundedRect(45, 185, 120, 15, 2, 2, 'F'); 
    
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28); 
    doc.setFont("helvetica", "bold");
    doc.text("E OBRIGATORIO ESTAR COM O CONVITE", 105, 191, { align: "center" });
    doc.text("EM MAOS NO DIA DE INICIO.", 105, 196, { align: "center" });

    // 4. Rodapé
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); 
    doc.setFont("helvetica", "normal");
    doc.text("Este documento e pessoal e intransferivel.", 105, 220, { align: "center" });

    return doc;
  };

  const montarDocHolerite = () => { const doc = new jsPDF(); doc.text("Holerite", 10, 10); return doc; };
  const montarDocNotaFiscal = () => { const doc = new jsPDF(); doc.text("NFE", 10, 10); return doc; };

  // --- EFEITOS E AÇÕES ---

  useEffect(() => {
    const timer = setTimeout(() => {
      let doc;
      if (activeTab === 'boasvindas') doc = montarDocBoasVindas(); 
      if (activeTab === 'holerite') doc = montarDocHolerite();
      if (activeTab === 'nfe') doc = montarDocNotaFiscal();
      if (doc) setPreviewUrl(doc.output('bloburl'));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, activeTab]);

  const handleDownload = () => {
    let doc;
    if (activeTab === 'boasvindas') doc = montarDocBoasVindas();
    else if (activeTab === 'holerite') doc = montarDocHolerite();
    else if (activeTab === 'nfe') doc = montarDocNotaFiscal();
    
    if (doc) doc.save(`Preview_${activeTab}.pdf`);
  };

  // --- GERAÇÃO EM LOTE COM DELAY ---
  const handleGerarLoteBanco = async () => {
    // <-- Substituído o window.confirm nativo
    const confirmou = await showConfirm("Atenção", "Gerar PDFs para TODOS os usuários? Isso pode levar alguns segundos.");
    if (!confirmou) return;
    
    setIsGeneratingBatch(true);
    setProgressoBatch("Iniciando...");

    try {
      const usersRef = ref(db, 'users'); 
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const listaUsuarios = Object.values(usersData);
        const total = listaUsuarios.length;
        let count = 0;

        for (const userData of listaUsuarios) {
          count++;
          setProgressoBatch(`Gerando ${count} de ${total}...`);

          const dadosCompletos = {
            nome: userData.nome || "Sem Nome",
            email: userData.email || "Sem Email",
            cargo: userData.cargo || "Colaborador",
            senha: userData.senha || "Mudar@123",
            dataInicio: formData.dataInicio,
            horarioInicio: formData.horarioInicio
          };

          const pdfDoc = montarDocBoasVindas(dadosCompletos);
          pdfDoc.save(`Convite_${dadosCompletos.nome.replace(/\s+/g, '_')}.pdf`);

          // Delay de 800ms para evitar bloqueio de múltiplos downloads
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        setProgressoBatch("Concluído!");
        // <-- Substituído o alert nativo
        await showAlert("Sucesso", `Sucesso! ${count} arquivos gerados. Verifique sua pasta de Downloads.`);
      } else {
        // <-- Substituído o alert nativo
        await showAlert("Aviso", "Nenhum usuário encontrado no banco de dados.");
      }
    } catch (error) {
      console.error("Erro no lote:", error);
      // <-- Substituído o alert nativo
      await showAlert("Erro", "Erro ao buscar usuários: " + error.message);
    } finally {
      setIsGeneratingBatch(false);
      setProgressoBatch("");
    }
  };

  if (!isDev) return null;

  return (
    <div className="tech-layout">
      <div className="ambient-light light-3"></div>
      <Sidebar />

      <main className="tech-main">
        <header className="tech-header">
          <div className="header-content">
            <h1>🏭 Fábrica de PDFs</h1>
            <p>Gerador e Visualizador em Tempo Real</p>
          </div>
          <div className="dev-badge">DEV MODE</div>
        </header>

        <div className="tech-scroll-content">
          <div className="pdf-factory-container">
            
            <div className="factory-tabs">
              <button className={activeTab === 'boasvindas' ? 'active' : ''} onClick={() => setActiveTab('boasvindas')}>🎉 Convite Tech</button>
              <button className={activeTab === 'holerite' ? 'active' : ''} onClick={() => setActiveTab('holerite')}>💰 Holerite</button>
              <button className={activeTab === 'nfe' ? 'active' : ''} onClick={() => setActiveTab('nfe')}>🧾 Nota Fiscal</button>
            </div>

            <div className="factory-content-grid">
              
              <div className="factory-card">
                {activeTab === 'boasvindas' && (
                  <>
                    <div style={{background: 'rgba(59, 130, 246, 0.1)', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #3b82f6'}}>
                      <h4 style={{color:'#60a5fa', margin:'0 0 10px 0'}}>🚀 Geração em Lote</h4>
                      <p style={{fontSize:'0.8rem', color:'#cbd5e1', marginBottom:'10px'}}>
                        Usa usuários do Realtime DB. Configure Data e Horário abaixo.
                      </p>
                      
                      {isGeneratingBatch && (
                         <div style={{marginBottom:'10px', color:'#bef264', fontWeight:'bold', fontSize:'0.9rem'}}>
                           {progressoBatch}
                         </div>
                      )}

                      <button 
                        className="btn-generate" 
                        style={{background: isGeneratingBatch ? '#475569' : '#3b82f6', width:'100%'}}
                        onClick={handleGerarLoteBanco}
                        disabled={isGeneratingBatch}
                      >
                        {isGeneratingBatch ? '⏳ Gerando...' : '🏭 Gerar Convites para TODOS'}
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="form-group-tech"><label>Data Início (Padrão)</label><input type="date" name="dataInicio" value={formData.dataInicio} onChange={handleChange} /></div>
                      <div className="form-group-tech"><label>Horário (Padrão)</label><input type="time" name="horarioInicio" value={formData.horarioInicio} onChange={handleChange} /></div>
                      
                      <div className="form-group-tech full-width"><hr style={{borderColor:'#334155'}}/><label>Dados para Preview</label></div>
                      <div className="form-group-tech"><label>Nome</label><input name="nome" value={formData.nome} onChange={handleChange} /></div>
                      <div className="form-group-tech"><label>Cargo</label><input name="cargo" value={formData.cargo} onChange={handleChange} /></div>
                      <div className="form-group-tech"><label>Email</label><input name="email" value={formData.email} onChange={handleChange} /></div>
                      <div className="form-group-tech"><label>Senha</label><input name="senha" value={formData.senha} onChange={handleChange} /></div>
                    </div>
                  </>
                )}

                {activeTab !== 'boasvindas' && (
                  <div className="form-grid">
                     <div className="form-group-tech full-width" style={{textAlign:'center', color:'#aaa'}}>Selecione Convite para usar o Lote.</div>
                  </div>
                )}

                <div className="action-area">
                  <button className="btn-generate" onClick={handleDownload}>💾 Baixar Preview</button>
                </div>
              </div>

              <div className="preview-card">
                {previewUrl ? <iframe src={previewUrl} className="pdf-iframe" title="PDF Preview" /> : <div style={{padding:'20px', color:'white'}}>Carregando...</div>}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}