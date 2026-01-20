import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './PlanoSaude.css';

export default function PlanoSaude() {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCVV, setShowCVV] = useState(false);

  const userPlan = {
    nome: "YAN RODRIGUES",
    plano: "PREMIUM NACIONAL",
    carteirinha: "8922.0001.4590.0022",
    validade: "12/2026",
    tipo: "Apartamento",
    rede: "Unimed & Parceiros",
    carencia: "Isento",
    cvv: "492",
    dependentes: [
      { nome: "Maria Rodrigues", parentesco: "Cônjuge" },
      { nome: "Lucas Rodrigues", parentesco: "Filho" }
    ]
  };

  const toggleCVV = (e) => {
    e.stopPropagation(); 
    setShowCVV(!showCVV);
  };

  return (
    <div className="tech-layout-saude">
      
      {/* Luzes de Fundo */}
      <div className="ambient-light light-cyan"></div>
      <div className="ambient-light light-purple"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Saúde & Bem-estar</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="saude-container-tech">
        
        <div className="page-header-tech">
          <h2>Meu Plano de Saúde</h2>
          <p>Gestão completa do seu benefício médico e dependentes.</p>
        </div>

        <div className="grid-saude">
          
          <div className="left-col">
            
            {/* CARTEIRINHA COM FLIP */}
            <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`card-object ${isFlipped ? 'is-flipped' : ''}`}>
                
                {/* --- FRENTE --- */}
                <div className="card-face front">
                  <div className="card-header">
                    <div className="chip-container">
                      <svg viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#bf953f" />
                            <stop offset="25%" stopColor="#fcf6ba" />
                            <stop offset="50%" stopColor="#b38728" />
                            <stop offset="75%" stopColor="#fbf5b7" />
                            <stop offset="100%" stopColor="#aa771c" />
                          </linearGradient>
                        </defs>
                        <rect width="50" height="40" rx="6" fill="url(#gold-shine)" />
                        <path d="M0 13H15M35 13H50" stroke="#000" strokeOpacity="0.3" strokeWidth="1"/>
                        <path d="M0 27H15M35 27H50" stroke="#000" strokeOpacity="0.3" strokeWidth="1"/>
                        <path d="M15 0V40" stroke="#000" strokeOpacity="0.3" strokeWidth="1"/>
                        <path d="M35 0V40" stroke="#000" strokeOpacity="0.3" strokeWidth="1"/>
                        <rect x="18" y="10" width="14" height="20" rx="4" stroke="#000" strokeOpacity="0.3" strokeWidth="1" fill="none"/>
                      </svg>
                    </div>

                    {/* CORREÇÃO: Removido filtro de brancura total. Agora usa as cores originais */}
                    <div style={{opacity: 0.95}}>
                      <Logo size={0.7} />
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-number">{userPlan.carteirinha}</div>
                    <span className="card-label">Titular</span>
                    <div className="card-value">{userPlan.nome}</div>
                  </div>

                  <div className="card-footer">
                    <div>
                      <span className="card-label">Validade</span>
                      <div className="card-value" style={{fontSize: '0.9rem'}}>{userPlan.validade}</div>
                    </div>
                    <div className="plan-badge">
                      {userPlan.plano}
                    </div>
                  </div>
                </div>

                {/* --- VERSO --- */}
                <div className="card-face back">
                  <div className="magnetic-strip"></div>
                  
                  <div className="signature-area">
                    <div className="signature-box"></div>
                    
                    <div className="cvv-group">
                      <div className="cvv-box">
                        CVC {showCVV ? userPlan.cvv : '***'}
                      </div>
                      <button 
                        className="cvv-toggle" 
                        onClick={toggleCVV} 
                        title={showCVV ? "Esconder CVC" : "Mostrar CVC"}
                      >
                        {showCVV ? '👁️' : '🔒'}
                      </button>
                    </div>
                  </div>

                  <div className="back-details">
                    <p className="legal-text">
                      Pessoal e intransferível. Obrigatória apresentação de documento com foto. Uso indevido sujeito a lei.
                    </p>
                    
                    <div className="emergency-contact">
                      <span className="emergency-title">CENTRAL 24H</span>
                      <div className="emergency-numbers">
                        0800 777 9090 &nbsp;|&nbsp; (11) 3344-5566
                      </div>
                    </div>

                    <div className="ans-info">
                      TechCorp Saúde S.A. • ANS 39.123-9
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="click-hint">👆 Clique no cartão para virar</div>

            <div className="actions-grid">
              <button className="action-btn" onClick={() => navigate('/status-reembolso')}>
                <span>💸</span>
                <strong>Solicitar Reembolso</strong>
              </button>
              <button className="action-btn">
                <span>🏥</span>
                <strong>Rede Credenciada</strong>
              </button>
              <button className="action-btn">
                <span>📄</span>
                <strong>Extrato de Uso</strong>
              </button>
              <button className="action-btn">
                <span>📞</span>
                <strong>Telemedicina</strong>
              </button>
            </div>
          </div>

          <div className="right-col">
            <div className="info-card-glass" style={{marginBottom: '30px'}}>
              <h4 className="section-title"><span className="icon-neon">📋</span> Detalhes do Plano</h4>
              <ul className="details-list">
                <li className="details-item"><span>Modalidade</span> <strong>{userPlan.plano}</strong></li>
                <li className="details-item"><span>Acomodação</span> <strong>{userPlan.tipo}</strong></li>
                <li className="details-item"><span>Abrangência</span> <strong>Nacional</strong></li>
                <li className="details-item"><span>Carência</span> <strong style={{color: '#4ade80'}}>{userPlan.carencia}</strong></li>
                <li className="details-item"><span>Operadora</span> <strong>{userPlan.rede}</strong></li>
              </ul>
            </div>

            <div className="info-card-glass">
              <h4 className="section-title"><span className="icon-neon">👨‍👩‍👧</span> Dependentes Cadastrados</h4>
              <div className="dependents-list">
                {userPlan.dependentes.map((dep, index) => (
                  <div key={index} className="dependent-item">
                    <div className="dep-avatar">
                      {dep.nome.charAt(0)}
                    </div>
                    <div className="dep-info">
                      <h4>{dep.nome}</h4>
                      <p>{dep.parentesco}</p>
                    </div>
                  </div>
                ))}
                
                <button className="tech-back-btn" style={{width: '100%', marginTop: '15px', fontSize: '0.8rem'}}>
                  + Adicionar Dependente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}