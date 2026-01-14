import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css'; 

// Em breve importaremos o robô aqui
// import BotAutomacao from '../components/BotAutomacao';

export default function Solicitacao() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Captura os dados apenas para passar para a tela de recibo
    // O robô vai preencher isso visualmente, mas aqui pegamos o valor final
    const form = formRef.current;
    
    // Gera dados fictícios para o comprovante
    const dadosEnvio = {
      protocolo: `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`,
      valor: '150,00', // Valor fixo para a demo ou poderia vir do input se fosse controlado
      data: new Date().toLocaleDateString()
    };

    // Simula tempo de processamento do servidor (SAP/ERP)
    setTimeout(() => {
      navigate('/status-reembolso', { state: dadosEnvio });
    }, 1500);
  };

  return (
    <div className="app-container">
      {/* BARRA DE TOPO */}
      <header className="top-bar">
        <div className="brand">
          <Logo />
        </div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="main-wrapper">
        <div className="page-header">
          <h2>Solicitação de Reembolso de Despesas</h2>
          <div className="breadcrumbs">Home &gt; Financeiro &gt; Novo Reembolso</div>
        </div>

        <div className="form-content">
          <div className="alert-box">
            ⚠ <strong>Atenção:</strong> O preenchimento incorreto pode acarretar no bloqueio do centro de custo. Anexe sempre o comprovante fiscal legível.
          </div>

          <form ref={formRef} onSubmit={handleSubmit}>
            
            {/* LINHA 1 */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="campo_matricula">Matrícula SAP *</label>
                <input 
                  type="text" 
                  name="matricula" 
                  id="campo_matricula" 
                  placeholder="Ex: 8000XXXX"
                  defaultValue="" 
                  required
                />
              </div>
              <div className="form-group" style={{flex: 2}}>
                <label htmlFor="campo_nome">Nome Completo *</label>
                <input 
                  type="text" 
                  name="nome" 
                  id="campo_nome" 
                  defaultValue="" 
                  required
                />
              </div>
            </div>

            {/* LINHA 2 */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="campo_centro_custo">Centro de Custo *</label>
                <select name="centro_custo" id="campo_centro_custo" defaultValue="" required>
                  <option value="">-- Selecione --</option>
                  <option value="CC_TI_DEV">1020 - TI Desenvolvimento</option>
                  <option value="CC_RH_ADM">3040 - RH Administrativo</option>
                  <option value="CC_FIN_CORP">5000 - Financeiro Corporativo</option>
                  <option value="CC_COMERCIAL">6000 - Comercial / Vendas</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="campo_data">Data da Despesa *</label>
                <input 
                  type="date" 
                  name="data" 
                  id="campo_data" 
                  defaultValue="" 
                  required
                />
              </div>
            </div>

            {/* LINHA 3 */}
            <div className="form-group">
              <label htmlFor="campo_motivo">Justificativa da Despesa *</label>
              <textarea 
                name="motivo" 
                id="campo_motivo" 
                rows="4" 
                placeholder="Descreva detalhadamente o motivo da despesa (transporte, alimentação, etc)..."
                defaultValue=""
                required
              ></textarea>
            </div>

            {/* UPLOAD */}
            <div className="form-group" style={{marginTop: '20px'}}>
              <label htmlFor="campo_arquivo">Comprovante Fiscal (PDF/XML) *</label>
              <div className="file-upload-box">
                <input type="file" name="arquivo" id="campo_arquivo" required />
                <p style={{fontSize: '0.8rem', color: '#666', marginTop: '10px'}}>
                  Formatos aceitos: PDF, JPG, PNG. Tamanho máximo: 5MB.
                </p>
              </div>
            </div>

            {/* BOTÕES */}
            <div className="actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => formRef.current.reset()}
                disabled={loading}
              >
                Limpar
              </button>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
                style={{minWidth: '150px'}}
              >
                {loading ? 'Processando...' : 'Enviar Solicitação'}
              </button>
            </div>

          </form>
        </div>
      </div>
      
      {/* O Robô entrará aqui depois */}
      {/* <BotAutomacao /> */}
    </div>
  );
}