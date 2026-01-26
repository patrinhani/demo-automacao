import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { db, auth } from '../firebase';
import { ref, push, get } from 'firebase/database';
import './GestaoViagens.css';

export default function GestaoViagens() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('nova_solicitacao');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});

  const [formData, setFormData] = useState({
    motivo: '', origem: '', destino: '', data_ida: '', data_volta: '',
    precisa_hotel: 'nao', adiantamento: '0'
  });

  useEffect(() => {
     const u = auth.currentUser;
     if(u) get(ref(db, `users/${u.uid}`)).then(s => s.exists() && setUserData(s.val()));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await push(ref(db, 'solicitacoes/viagens'), {
            userId: auth.currentUser.uid,
            solicitanteNome: userData.nome,
            solicitanteCargo: userData.cargo,
            ...formData,
            status: 'pendente',
            createdAt: new Date().toISOString()
        });
        alert("✈ Solicitação de viagem enviada para a Diretoria!");
        navigate('/dashboard');
    } catch (error) {
        alert("Erro: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // ... (MANTENHA OS HANDLERS INPUT/STEPS IGUAIS AO ANTERIOR) ...
  const handleInputChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="viagens-layout">
      <div className="ambient-light light-1"></div>
      <header className="viagens-header">
        <div className="brand"><div style={{transform:'scale(0.8)'}}><Logo/></div><span style={{color:'#fff', marginLeft:'10px'}}>Viagens</span></div>
        <button className="tech-profile" onClick={()=>navigate('/dashboard')}>Voltar</button>
      </header>

      <div className="viagens-scroll-content">
         <div className="page-header-tech"><h2>Nova Viagem</h2><p>Preencha os dados para o C.E.O. aprovar.</p></div>
         
         <div className="wizard-glass-container">
            {/* ... (MANTENHA O WIZARD UI IGUAL AO ANTERIOR, APENAS O FORM AQUI EM BAIXO MUDA) ... */}
            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <div className="wizard-form-grid-tech">
                        <div className="form-group-tech full-width"><label>Motivo</label><input className="glass-input" name="motivo" value={formData.motivo} onChange={handleInputChange} required /></div>
                        {/* ... outros inputs passo 1 ... */}
                    </div>
                )}
                {step === 2 && (
                    <div className="wizard-form-grid-tech">
                        <div className="form-group-tech"><label>Origem</label><input className="glass-input" name="origem" value={formData.origem} onChange={handleInputChange} required /></div>
                        <div className="form-group-tech"><label>Destino</label><input className="glass-input" name="destino" value={formData.destino} onChange={handleInputChange} required /></div>
                        {/* ... data ida/volta e adiantamento ... */}
                        <div className="form-group-tech"><label>Adiantamento (R$)</label><input className="glass-input" name="adiantamento" type="number" value={formData.adiantamento} onChange={handleInputChange} /></div>
                    </div>
                )}
                {/* ... Passo 3 e Botões iguais ... */}
                <div className="wizard-footer-tech">
                    {step > 1 && <button type="button" className="btn-glass-secondary" onClick={prevStep}>Voltar</button>}
                    {step < 2 ? <button type="button" className="btn-neon-primary" onClick={nextStep}>Próximo</button> : 
                    <button type="submit" className="btn-neon-primary" disabled={loading}>{loading ? 'Enviando...' : 'Confirmar'}</button>}
                </div>
            </form>
         </div>
      </div>
    </div>
  );
}