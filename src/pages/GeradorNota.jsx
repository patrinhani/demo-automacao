import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../App.css';

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

    // Pequeno delay para garantir que o React renderizou os dados no template
    setTimeout(async () => {
      const element = invoiceRef.current;
      
      // 1. Tira o print do elemento HTML
      const canvas = await html2canvas(element, {
        scale: 2, // Melhora a resolução
        backgroundColor: '#ffffff'
      });

      // 2. Converte para imagem
      const imgData = canvas.toDataURL('image/png');

      // 3. Cria o PDF (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`NFE_${Math.floor(Math.random() * 10000)}.pdf`);

      setLoading(false);
      alert("Nota Fiscal (PDF) gerada com sucesso!");
      navigate('/solicitacao');
    }, 500);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">🧾 Emissor NFE v2.0</div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="main-wrapper" style={{maxWidth: '800px'}}>
        <div className="page-header">
          <h2>Emissão de Nota Fiscal de Serviço</h2>
          <div className="breadcrumbs">O PDF será gerado automaticamente após o preenchimento.</div>
        </div>

        <div className="form-content">
          <form onSubmit={gerarEBaixarPDF}>
            <div className="form-row">
              <div className="form-group">
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
              <div className="form-group">
                <label>Valor Total (R$)</label>
                <input 
                  name="valor" 
                  value={formData.valor} 
                  onChange={handleChange} 
                  type="number" 
                  placeholder="0,00" 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Descrição Detalhada do Serviço</label>
              <textarea 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange} 
                rows="3"
                placeholder="Ex: Serviço de transporte executivo..." 
                required 
              />
            </div>

            <div className="actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =======================================================
          TEMPLATE DO PDF (Fica visível apenas para o gerador)
          Para esconder da tela do usuário e aparecer só no PDF,
          movemos ele para fora da visão com CSS, mas ele precisa
          existir no DOM.
          =======================================================
      */}
      <div style={{position: 'absolute', top: '-10000px', left: 0}}>
        <div ref={invoiceRef} className="invoice-paper">
          
          {/* Cabeçalho NFE */}
          <div className="nfe-header">
            <div className="nfe-title">Nota Fiscal de Serviço Eletrônica (NFS-e)</div>
            <div style={{fontSize: '0.8rem'}}>Prefeitura Municipal de TechCity - Secretaria da Fazenda</div>
          </div>

          <div className="nfe-row">
            <div className="nfe-col">
              <span className="nfe-label">Número da Nota</span>
              <span className="nfe-value">{new Date().getFullYear()}000{Math.floor(Math.random() * 999)}</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Data de Emissão</span>
              <span className="nfe-value">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Código de Verificação</span>
              <span className="nfe-value">XJ9-22K-L0P</span>
            </div>
          </div>

          {/* Prestador e Tomador */}
          <div className="nfe-section-title">Prestador de Serviços</div>
          <div className="nfe-row" style={{background: '#f9f9f9'}}>
            <div className="nfe-col">
              <span className="nfe-label">Razão Social / Nome</span>
              <span className="nfe-value">TRANSPORTES E SERVIÇOS LTDA</span>
              <br/>
              <span className="nfe-label">CNPJ / CPF</span>
              <span className="nfe-value">{formData.cnpj || '00.000.000/0000-00'}</span>
            </div>
          </div>

          <div className="nfe-section-title">Tomador de Serviços</div>
          <div className="nfe-row">
            <div className="nfe-col">
              <span className="nfe-label">Razão Social</span>
              <span className="nfe-value">TECHCORP SOLUTIONS S.A.</span>
              <br/>
              <span className="nfe-label">CNPJ</span>
              <span className="nfe-value">12.345.678/0001-90</span>
            </div>
          </div>

          {/* Detalhes */}
          <div className="nfe-section-title">Discriminação dos Serviços</div>
          <div style={{border: '1px solid black', padding: '20px', minHeight: '100px', marginBottom: '10px'}}>
            {formData.descricao || 'Descrição do serviço prestado...'}
          </div>

          <div className="nfe-section-title">Valores e Impostos</div>
          <table className="nfe-table">
            <thead>
              <tr>
                <th>Base de Cálculo</th>
                <th>Alíquota ISS</th>
                <th>Valor ISS</th>
                <th>Valor Total da Nota</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R$ {formData.valor || '0,00'}</td>
                <td>5%</td>
                <td>R$ {(formData.valor * 0.05).toFixed(2)}</td>
                <td style={{fontWeight: 'bold'}}>R$ {formData.valor || '0,00'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{marginTop: '40px', textAlign: 'center', fontSize: '0.7rem'}}>
            Documento emitido por ME ou EPP optante pelo Simples Nacional.<br/>
            Não gera direito a crédito fiscal de IPI.
          </div>

          {/* Código de Barras Falso */}
          <div className="barcode"></div>
          <div style={{textAlign: 'center', fontSize: '0.7rem', letterSpacing: '5px'}}>
            83920000001-9 23940000000-1 92839482938-2
          </div>

        </div>
      </div>
    </div>
  );
}