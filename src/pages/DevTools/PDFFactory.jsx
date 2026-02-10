import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useUser } from '../../contexts/UserContext';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'; // Caso tenha tabelas complexas
import './PDFFactory.css';

export default function PDFFactory() {
  const { isDev } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('boasvindas');

  // Estado único para o formulário (campos mudam conforme a aba)
  const [formData, setFormData] = useState({
    // Boas Vindas
    nome: 'João Dev',
    email: 'joao.dev@tech.com',
    senha: 'SenhaForte123',
    matricula: '900123',
    cargo: 'Senior Fullstack',
    
    // Holerite
    mes: '10/2023',
    salarioBase: 8500,
    horasExtras: 1500,
    descontos: 2000,
    
    // Nota Fiscal
    cliente: 'Cliente Teste Ltda',
    cnpj: '12.345.678/0001-90',
    valorNota: 15000,
    descricaoServico: 'Desenvolvimento de Software Customizado'
  });

  // Segurança: Só Dev entra
  useEffect(() => {
    if (isDev === false) { // Verifica explicitamente false (carregado)
      alert("Acesso restrito a Desenvolvedores.");
      navigate('/dashboard');
    }
  }, [isDev, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- GERADORES DE PDF ---

  const gerarBoasVindas = () => {
    const doc = new jsPDF();
    
    // Header Azul
    doc.setFillColor(14, 165, 233); // #0ea5e9
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BEM-VINDO À TECHCORP", 105, 25, { align: "center" });

    // Corpo
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.text(`Olá, ${formData.nome}!`, 20, 60);
    doc.setFontSize(12);
    doc.text("Abaixo estão suas credenciais de acesso geradas manualmente:", 20, 70);

    // Box de Credenciais
    doc.setDrawColor(14, 165, 233);
    doc.rect(20, 80, 170, 50);
    
    doc.setFont("helvetica", "bold");
    doc.text("LOGIN:", 25, 95);
    doc.text("SENHA:", 25, 105);
    doc.text("MATRÍCULA:", 25, 115);
    doc.text("CARGO:", 25, 125);

    doc.setFont("helvetica", "normal");
    doc.text(formData.email, 75, 95);
    doc.text(formData.senha, 75, 105);
    doc.text(formData.matricula, 75, 115);
    doc.text(formData.cargo, 75, 125);

    doc.save(`BoasVindas_${formData.nome}.pdf`);
  };

  const gerarHolerite = () => {
    const doc = new jsPDF();
    const salario = parseFloat(formData.salarioBase);
    const extras = parseFloat(formData.horasExtras);
    const desc = parseFloat(formData.descontos);
    const liquido = salario + extras - desc;

    // Header
    doc.setFontSize(18);
    doc.text("DEMONSTRATIVO DE PAGAMENTO", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Referência: ${formData.mes}`, 105, 28, { align: "center" });
    doc.line(10, 35, 200, 35);

    // Dados Func
    doc.text(`Funcionário: ${formData.nome}`, 15, 45);
    doc.text(`Matrícula: ${formData.matricula}`, 150, 45);

    // Tabela (Desenhada manualmente para controle total)
    let y = 60;
    doc.setFillColor(240, 240, 240);
    doc.rect(10, y-5, 190, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text("DESCRIÇÃO", 15, y);
    doc.text("VENCIMENTOS", 110, y);
    doc.text("DESCONTOS", 160, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Salário Base", 15, y);
    doc.text(salario.toFixed(2), 135, y, { align: 'right' });

    y += 8;
    doc.text("Horas Extras / Prêmios", 15, y);
    doc.text(extras.toFixed(2), 135, y, { align: 'right' });

    y += 8;
    doc.text("INSS / IRRF / Benefícios", 15, y);
    doc.text(desc.toFixed(2), 185, y, { align: 'right' });

    // Totais
    y += 20;
    doc.line(10, y, 200, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text("LÍQUIDO A RECEBER:", 120, y);
    doc.setFontSize(14);
    doc.text(`R$ ${liquido.toFixed(2)}`, 190, y, { align: 'right' });

    doc.save(`Holerite_${formData.mes.replace('/','-')}.pdf`);
  };

  const gerarNotaFiscal = () => {
    const doc = new jsPDF();
    
    // Logo Tech
    doc.setFontSize(24);
    doc.setTextColor(168, 85, 247); // Roxo Tech
    doc.text("TECHCORP", 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e", 120, 25);
    doc.text(`Emissão: ${new Date().toLocaleDateString()}`, 120, 30);

    doc.setDrawColor(0);
    doc.line(10, 40, 200, 40);

    // Tomador
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("TOMADOR DO SERVIÇO", 20, 50);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Razão Social: ${formData.cliente}`, 20, 60);
    doc.text(`CNPJ: ${formData.cnpj}`, 20, 65);

    // Serviço
    doc.rect(15, 80, 180, 80);
    doc.setFont(undefined, 'bold');
    doc.text("DISCRIMINAÇÃO DOS SERVIÇOS", 20, 90);
    doc.setFont(undefined, 'normal');
    
    // Quebra de linha automática
    const splitText = doc.splitTextToSize(formData.descricaoServico, 170);
    doc.text(splitText, 20, 100);

    // Valor
    doc.setFillColor(230, 230, 230);
    doc.rect(130, 170, 65, 20, 'F');
    doc.setFontSize(12);
    doc.text("VALOR TOTAL:", 135, 182);
    doc.setFont(undefined, 'bold');
    doc.text(`R$ ${parseFloat(formData.valorNota).toFixed(2)}`, 190, 182, { align: 'right' });

    doc.save(`NFE_${formData.cliente}.pdf`);
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
            <p>Gerador de Documentos para Teste e Validação</p>
          </div>
          <div className="dev-badge">DEV MODE</div>
        </header>

        <div className="tech-scroll-content">
          <div className="pdf-factory-container">
            
            {/* ABAS */}
            <div className="factory-tabs">
              <button 
                className={activeTab === 'boasvindas' ? 'active' : ''} 
                onClick={() => setActiveTab('boasvindas')}
              >
                🎉 Kit Boas-Vindas
              </button>
              <button 
                className={activeTab === 'holerite' ? 'active' : ''} 
                onClick={() => setActiveTab('holerite')}
              >
                💰 Holerite
              </button>
              <button 
                className={activeTab === 'nfe' ? 'active' : ''} 
                onClick={() => setActiveTab('nfe')}
              >
                🧾 Nota Fiscal
              </button>
            </div>

            <div className="factory-card">
              {/* FORMULÁRIO BOAS VINDAS */}
              {activeTab === 'boasvindas' && (
                <div className="form-grid">
                  <div className="form-group-tech">
                    <label>Nome do Funcionário</label>
                    <input name="nome" value={formData.nome} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Cargo</label>
                    <input name="cargo" value={formData.cargo} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>E-mail</label>
                    <input name="email" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Senha Provisória</label>
                    <input name="senha" value={formData.senha} onChange={handleChange} />
                  </div>
                  
                  <div className="action-area">
                    <button className="btn-generate" onClick={gerarBoasVindas}>
                      🖨️ Baixar PDF de Boas-Vindas
                    </button>
                  </div>
                </div>
              )}

              {/* FORMULÁRIO HOLERITE */}
              {activeTab === 'holerite' && (
                <div className="form-grid">
                  <div className="form-group-tech">
                    <label>Nome</label>
                    <input name="nome" value={formData.nome} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Mês de Referência</label>
                    <input name="mes" value={formData.mes} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Salário Base (R$)</label>
                    <input type="number" name="salarioBase" value={formData.salarioBase} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Horas Extras / Bônus (R$)</label>
                    <input type="number" name="horasExtras" value={formData.horasExtras} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Descontos Totais (R$)</label>
                    <input type="number" name="descontos" value={formData.descontos} onChange={handleChange} />
                  </div>

                  <div className="action-area">
                    <button className="btn-generate" onClick={gerarHolerite}>
                      🖨️ Gerar Holerite
                    </button>
                  </div>
                </div>
              )}

              {/* FORMULÁRIO NOTA FISCAL */}
              {activeTab === 'nfe' && (
                <div className="form-grid">
                  <div className="form-group-tech">
                    <label>Cliente (Razão Social)</label>
                    <input name="cliente" value={formData.cliente} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>CNPJ</label>
                    <input name="cnpj" value={formData.cnpj} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech">
                    <label>Valor da Nota (R$)</label>
                    <input type="number" name="valorNota" value={formData.valorNota} onChange={handleChange} />
                  </div>
                  <div className="form-group-tech full-width">
                    <label>Descrição do Serviço</label>
                    <textarea 
                      name="descricaoServico" 
                      value={formData.descricaoServico} 
                      onChange={handleChange} 
                      rows="4"
                    />
                  </div>

                  <div className="action-area">
                    <button className="btn-generate" onClick={gerarNotaFiscal}>
                      🖨️ Emitir Nota Fiscal (Teste)
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}