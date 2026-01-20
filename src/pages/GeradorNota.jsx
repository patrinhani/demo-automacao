import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo'; 
// Substitui o App.css pelo novo CSS modular
import './GeradorNota.css';

export default function GeradorNota() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Referência para o elemento HTML que será "impresso"
  const invoiceRef = useRef();

  // Dados do formulário
  const [formData, setFormData] = useState({
    cnpj: '',
    valor: '',
    descricao: ''
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const gerarEBaixarPDF = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Pequeno delay para garantir renderização no DOM oculto
    setTimeout(async () => {
      const element = invoiceRef.current;
      
      try {
        // 1. Tira o print do elemento HTML
        const canvas = await html2canvas(element, {
          scale: 2, // Escala 2 para alta resolução
          backgroundColor: '#ffffff', // Força fundo branco
          logging: false,
          useCORS: true 
        });

        // 2. Otimiza imagem (JPEG 0.8 é melhor que PNG para documentos escaneados/impressos)
        const imgData = canvas.toDataURL('image/jpeg', 0.8);

        // 3. Cria o PDF (A4)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Gera um nome aleatório realista
        const nomeArquivo = `NFE_${new Date().getFullYear()}${Math.floor(Math.random() * 10000)}.pdf`;
        pdf.save(nomeArquivo);

        alert("✅ Nota Fiscal emitida e baixada com sucesso!\n\nAnexe o PDF na sua solicitação de reembolso.");
        navigate('/solicitacao');
        
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar PDF. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="tech-layout-gerador">
      
      {/* LUZES DE FUNDO (AMBIENT) */}
      <div className="ambient-light light-blue"></div>
      <div className="ambient-light light-green"></div>

      {/* HEADER TECHCORP */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Emissão de NFE</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <div className="gerador-container-tech">
        
        <div className="page-header-tech">
          <h2>Gerador de Nota Fiscal</h2>
          <p>Utilize esta ferramenta para gerar comprovantes fiscais padronizados para reembolso.</p>
        </div>

        {/* CARD DO FORMULÁRIO */}
        <div className="gerador-card-glass">
          <form onSubmit={gerarEBaixarPDF}>
            <div className="form-grid">
              <div className="form-group-tech">
                <label>CNPJ do Prestador</label>
                <input 
                  name="cnpj" 
                  value={formData.cnpj} 
                  onChange={handleChange} 
                  type="text" 
                  placeholder="00.000.000/0001-99" 
                  required 
                />
              </div>
              <div className="form-group-tech">
                <label>Valor Total (R$)</label>
                <input 
                  name="valor" 
                  value={formData.valor} 
                  onChange={handleChange} 
                  type="number" 
                  placeholder="0,00" 
                  step="0.01"
                  required 
                />
              </div>
            </div>
            
            <div className="form-group-tech">
              <label>Descrição Detalhada do Serviço</label>
              <textarea 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange} 
                rows="4"
                placeholder="Descreva o serviço realizado (ex: Transporte executivo, Almoço de negócios, etc)..." 
                required 
              />
            </div>

            <button type="submit" className="btn-gerar-tech" disabled={loading}>
              {loading ? 'Processando Documento...' : '📄 Gerar e Baixar PDF'}
            </button>
          </form>
        </div>
      </div>

      {/* =======================================================
          TEMPLATE DO PDF (OCULTO VISUALMENTE, VISÍVEL P/ SCRIPT)
          ======================================================= */}
      <div className="pdf-hidden-template">
        <div ref={invoiceRef} className="invoice-paper">
          
          {/* CABEÇALHO NFE */}
          <div className="nfe-header">
            <div style={{ paddingLeft: '5px' }}>
               {/* Logo em modo Light para sair correto no papel branco */}
               <Logo lightMode={true} size={1.0} /> 
            </div>

            <div style={{textAlign: 'right'}}>
              <div className="nfe-title">NOTA FISCAL DE SERVIÇO</div>
              <div className="nfe-subtitle">
                Prefeitura Municipal de TechCity<br/>
                Secretaria da Fazenda - NFS-e Digital
              </div>
            </div>
          </div>

          {/* DADOS DA NOTA */}
          <div className="nfe-row" style={{background: '#f8f9fa', padding: '10px', border: '1px solid #ddd'}}>
            <div className="nfe-col">
              <span className="nfe-label">Número da Nota</span>
              <span className="nfe-value">{new Date().getFullYear()}000{Math.floor(Math.random() * 999)}</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Emissão</span>
              <span className="nfe-value">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString().slice(0,5)}</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Código Verificação</span>
              <span className="nfe-value">XJ9-{Math.floor(Math.random()*100)}K-L0P</span>
            </div>
          </div>

          {/* PRESTADOR */}
          <div className="nfe-section-title">Prestador de Serviços</div>
          <div className="nfe-row">
            <div className="nfe-col">
              <span className="nfe-label">Razão Social / Nome</span>
              <span className="nfe-value">PRESTADOR DE SERVIÇOS GERAIS LTDA</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">CNPJ / CPF</span>
              <span className="nfe-value">{formData.cnpj || '00.000.000/0000-00'}</span>
            </div>
          </div>

          {/* TOMADOR */}
          <div className="nfe-section-title">Tomador de Serviços</div>
          <div className="nfe-row">
            <div className="nfe-col">
              <span className="nfe-label">Razão Social</span>
              <span className="nfe-value">TECHCORP SOLUTIONS S.A.</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">CNPJ</span>
              <span className="nfe-value">12.345.678/0001-90</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Endereço</span>
              <span className="nfe-value">Av. Paulista, 1000 - SP</span>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="nfe-section-title">Discriminação dos Serviços</div>
          <div className="nfe-desc-box">
            {formData.descricao || 'Descrição do serviço prestado...'}
          </div>

          {/* TOTAIS */}
          <div className="nfe-section-title">Valores e Impostos</div>
          <table className="nfe-table">
            <thead>
              <tr>
                <th>Base de Cálculo</th>
                <th>Alíquota ISS</th>
                <th>Valor ISS</th>
                <th>Valor Líquido</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R$ {formData.valor || '0,00'}</td>
                <td>5%</td>
                <td>R$ {(formData.valor * 0.05).toFixed(2)}</td>
                <td className="nfe-total">R$ {formData.valor || '0,00'}</td>
              </tr>
            </tbody>
          </table>

          {/* RODAPÉ */}
          <div style={{marginTop: '60px', textAlign: 'center'}}>
             <div className="barcode">
               *NFE{new Date().getFullYear()}TECHCORP*
             </div>
             
             <div style={{fontSize: '0.7rem', color: '#888', marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px'}}>
                Documento emitido por ME ou EPP optante pelo Simples Nacional.<br/>
                Não gera direito a crédito fiscal de IPI.
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}