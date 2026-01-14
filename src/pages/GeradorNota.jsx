import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '../components/Logo'; 
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

    // Pequeno delay para garantir que o React renderizou os dados no template invisível
    setTimeout(async () => {
      const element = invoiceRef.current;
      
      // 1. Tira o print do elemento HTML
      const canvas = await html2canvas(element, {
        scale: 1, // Aumenta a resolução para ficar nítido
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true // Ajuda a carregar fontes externas
      });

      // 2. Converte para imagem
      const imgData = canvas.toDataURL('image/png');

      // 3. Cria o PDF (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Gera um nome aleatório para parecer real
      const nomeArquivo = `NFE_${new Date().getFullYear()}${Math.floor(Math.random() * 10000)}.pdf`;
      pdf.save(nomeArquivo);

      setLoading(false);
      alert("Nota Fiscal emitida e baixada com sucesso!\n\nAgora anexe este arquivo na solicitação de reembolso.");
      
      // Redireciona o usuário de volta para o formulário
      navigate('/solicitacao');
    }, 800);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          <Logo />
        </div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="main-wrapper" style={{maxWidth: '800px'}}>
        <div className="page-header">
          <h2>Emissão de Nota Fiscal de Serviço</h2>
          <div className="breadcrumbs">O PDF será gerado automaticamente com a marca da empresa.</div>
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
                placeholder="Ex: Serviço de transporte executivo para reunião com cliente..." 
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
          TEMPLATE DO PDF (Ajustado)
          ======================================================= */}
      <div style={{position: 'absolute', top: '-10000px', left: 0}}>
        <div ref={invoiceRef} className="invoice-paper">
          
          {/* CABEÇALHO */}
          <div className="nfe-header" style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: '2px solid #000',
            paddingBottom: '10px', /* Reduzi o padding */
            marginBottom: '15px'   /* Reduzi a margem */
          }}>
            
            {/* LADO ESQUERDO: LOGO MENOR */}
            <div style={{ paddingLeft: '5px' }}>
               {/* Reduzi o size de 1.8 para 0.8 */}
               <Logo lightMode={true} size={0.8} /> 
            </div>

            {/* LADO DIREITO: TÍTULOS */}
            <div style={{textAlign: 'right'}}>
              <div className="nfe-title" style={{fontSize: '1.4rem', fontWeight:'900', marginBottom:'2px'}}>NOTA FISCAL DE SERVIÇO</div>
              <div style={{fontSize: '0.75rem', color: '#444'}}>
                Prefeitura Municipal de TechCity<br/>
                Secretaria da Fazenda - NFS-e
              </div>
            </div>
          </div>

          {/* ... O RESTANTE DO CÓDIGO CONTINUA IGUAL ... */}

          {/* DADOS DA NOTA */}
          <div className="nfe-row">
            <div className="nfe-col">
              <span className="nfe-label">Número da Nota</span>
              <span className="nfe-value">{new Date().getFullYear()}000{Math.floor(Math.random() * 999)}</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Emissão</span>
              <span className="nfe-value">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString().slice(0,5)}</span>
            </div>
            <div className="nfe-col">
              <span className="nfe-label">Código de Verificação</span>
              <span className="nfe-value">XJ9-{Math.floor(Math.random()*100)}K-L0P</span>
            </div>
          </div>

          {/* PRESTADOR */}
          <div className="nfe-section-title">Prestador de Serviços</div>
          <div className="nfe-row" style={{background: '#f8f9fa'}}>
            <div className="nfe-col">
              <span className="nfe-label">Razão Social / Nome</span>
              <span className="nfe-value">TRANSPORTES E SERVIÇOS LTDA</span>
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
          <div style={{border: '1px solid #000', padding: '15px', minHeight: '100px', fontSize: '1rem', marginBottom: '10px'}}>
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
                <td style={{fontWeight: 'bold', fontSize: '1.2rem'}}>R$ {formData.valor || '0,00'}</td>
              </tr>
            </tbody>
          </table>

          {/* RODAPÉ E CÓDIGO DE BARRAS */}
          <div style={{marginTop: '50px', textAlign: 'center'}}>
             {/* O Texto entre asteriscos gera o código de barras correto na fonte Libre Barcode 39 */}
             <div className="barcode">
               *NFE{new Date().getFullYear()}TECHCORP*
             </div>
             
             <div style={{fontSize: '0.75rem', color: '#666', marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '10px'}}>
                Documento emitido por ME ou EPP optante pelo Simples Nacional.<br/>
                Não gera direito a crédito fiscal de IPI.
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}