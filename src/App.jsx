import { useRef } from 'react';
import './App.css';

// Em breve importaremos o robô aqui
// import BotAutomacao from './components/BotAutomacao'; 

function App() {
  // Referências para acessar os valores APENAS no envio (Submit)
  // Isso deixa o input "solto" para ser editado por scripts externos
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulação de processamento de um sistema legado
    const formData = new FormData(formRef.current);
    const dados = Object.fromEntries(formData.entries());
    
    console.log("Dados capturados pelo sistema:", dados);
    alert(`Solicitação ${dados.protocolo || '000'} enviada para o SAP!`);
  };

  return (
    <div className="app-container">
      {/* 1. TOPO ESTILO PORTAL CORPORATIVO */}
      <header className="top-bar">
        <div className="brand">
          <span>🏢</span>
          <span>Portal RH | TechCorp Solutions</span>
        </div>
        <div className="user-badge">
          👤 Logado: <strong>COLABORADOR_VISITANTE</strong>
        </div>
      </header>

      {/* 2. CONTEÚDO DA PÁGINA */}
      <div className="main-wrapper">
        <div className="page-header">
          <h2>Solicitação de Reembolso de Despesas</h2>
          <div className="breadcrumbs">Home &gt; Serviços RH &gt; Financeiro &gt; Novo Reembolso</div>
        </div>

        <div className="form-content">
          <p style={{marginBottom: '20px', color: '#cc0000', backgroundColor: '#ffe6e6', padding: '10px', border: '1px solid #ffcccc'}}>
            ⚠ <strong>Atenção:</strong> O preenchimento incorreto pode acarretar no bloqueio do centro de custo.
          </p>

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
                />
              </div>
              <div className="form-group" style={{flex: 2}}>
                <label htmlFor="campo_nome">Nome Completo *</label>
                <input 
                  type="text" 
                  name="nome" 
                  id="campo_nome" 
                  defaultValue="" 
                />
              </div>
            </div>

            {/* LINHA 2 */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="campo_centro_custo">Centro de Custo *</label>
                <select name="centro_custo" id="campo_centro_custo" defaultValue="">
                  <option value="">-- Selecione --</option>
                  <option value="CC_TI_DEV">1020 - TI Desenvolvimento</option>
                  <option value="CC_RH_ADM">3040 - RH Administrativo</option>
                  <option value="CC_FIN_CORP">5000 - Financeiro Corporativo</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="campo_data">Data da Despesa *</label>
                <input 
                  type="date" 
                  name="data" 
                  id="campo_data" 
                  defaultValue="" 
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
                placeholder="Descreva detalhadamente o motivo da despesa..."
                defaultValue=""
              ></textarea>
            </div>

            {/* UPLOAD */}
            <div className="form-group" style={{marginTop: '20px'}}>
              <label htmlFor="campo_arquivo">Comprovante Fiscal (PDF/XML) *</label>
              <div className="file-upload-box">
                <input type="file" name="arquivo" id="campo_arquivo" />
                <p style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>Tamanho máximo: 2MB</p>
              </div>
            </div>

            {/* BOTÕES */}
            <div className="actions">
              <button type="button" className="btn-secondary" onClick={() => formRef.current.reset()}>Limpar</button>
              <button type="submit" className="btn-primary">Enviar Solicitação</button>
            </div>

          </form>
        </div>
      </div>

      {/* O Robô entrará aqui depois */}
      {/* <BotAutomacao /> */}
    </div>
  );
}

export default App;