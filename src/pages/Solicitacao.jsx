import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Solicitacao.css'; // Importa o novo CSS específico

export default function Solicitacao() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [arquivoNome, setArquivoNome] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setArquivoNome(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const dadosEnvio = {
      protocolo: `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`,
      valor: '150,00', 
      data: new Date().toLocaleDateString()
    };

    setTimeout(() => {
      navigate('/status-reembolso', { state: dadosEnvio });
    }, 1500);
  };

  return (
    <div className="tech-layout-solicitacao">
      
      {/* LUZES DE FUNDO */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      {/* HEADER PADRONIZADO */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Financeiro</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="solicitacao-container-tech">
        
        <div className="page-header-tech">
          <h2>Nova Solicitação</h2>
          <p>Financeiro &gt; Reembolsos &gt; Preenchimento</p>
        </div>

        <div className="form-card-glass">
          <div className="alert-box-tech">
            <span>⚠</span> 
            <strong>Atenção:</strong> O preenchimento incorreto pode bloquear o centro de custo. Anexe comprovante legível.
          </div>

          <form ref={formRef} onSubmit={handleSubmit}>
            
            {/* LINHA 1 */}
            <div className="form-row-tech">
              <div className="form-group-tech">
                <label htmlFor="campo_matricula">Matrícula SAP *</label>
                <input 
                  className="input-tech"
                  type="text" 
                  name="matricula" 
                  id="campo_matricula" 
                  placeholder="Ex: 8000XXXX"
                  required
                />
              </div>
              <div className="form-group-tech" style={{flex: 2}}>
                <label htmlFor="campo_nome">Nome Completo *</label>
                <input 
                  className="input-tech"
                  type="text" 
                  name="nome" 
                  id="campo_nome" 
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* LINHA 2 */}
            <div className="form-row-tech">
              <div className="form-group-tech">
                <label htmlFor="campo_centro_custo">Centro de Custo *</label>
                <select className="select-tech" name="centro_custo" id="campo_centro_custo" required defaultValue="">
                  <option value="" disabled>-- Selecione --</option>
                  <option value="CC_TI_DEV">1020 - TI Desenvolvimento</option>
                  <option value="CC_RH_ADM">3040 - RH Administrativo</option>
                  <option value="CC_FIN_CORP">5000 - Financeiro Corporativo</option>
                  <option value="CC_COMERCIAL">6000 - Comercial / Vendas</option>
                </select>
              </div>
              <div className="form-group-tech">
                <label htmlFor="campo_data">Data da Despesa *</label>
                <input 
                  className="input-tech"
                  type="date" 
                  name="data" 
                  id="campo_data" 
                  required
                />
              </div>
            </div>

            {/* LINHA 3 */}
            <div className="form-group-tech" style={{marginBottom: '20px'}}>
              <label htmlFor="campo_motivo">Justificativa da Despesa *</label>
              <textarea 
                className="textarea-tech"
                name="motivo" 
                id="campo_motivo" 
                rows="4" 
                placeholder="Descreva detalhadamente o motivo (transporte, alimentação com cliente, etc)..."
                required
              ></textarea>
            </div>

            {/* UPLOAD CUSTOMIZADO */}
            <div className="form-group-tech">
              <label>Comprovante Fiscal (PDF/XML) *</label>
              <div className="upload-box-tech">
                <input 
                  type="file" 
                  name="arquivo" 
                  id="campo_arquivo" 
                  className="upload-input-hidden" 
                  required 
                  onChange={handleFileChange}
                />
                <div className="upload-label">
                  <span className="icon-upload">📂</span>
                  {arquivoNome ? (
                    <span style={{color: '#3b82f6'}}>{arquivoNome}</span>
                  ) : (
                    <>
                      <span className="text-upload">Clique ou arraste o arquivo aqui</span>
                      <span className="subtext-upload">Formatos: PDF, JPG, PNG (Máx 5MB)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* BOTÕES */}
            <div className="actions-tech">
              <button 
                type="button" 
                className="btn-secondary-tech" 
                onClick={() => {
                  formRef.current.reset();
                  setArquivoNome('');
                }}
                disabled={loading}
              >
                Limpar Campos
              </button>
              
              <button 
                type="submit" 
                className="btn-primary-tech"
                disabled={loading}
              >
                {loading ? 'Enviando ao SAP...' : 'Enviar Solicitação 🚀'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}