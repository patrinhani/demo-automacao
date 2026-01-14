import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';

export default function PlanoSaude() {
  const navigate = useNavigate();
  const [virado, setVirado] = useState(false);

  // Estilos inline para o efeito 3D (Flip Card)
  const containerStyle = {
    perspective: '1000px',
    width: '400px',
    height: '240px',
    margin: '20px auto',
    cursor: 'pointer'
  };

  const cardInnerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d',
    transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)'
  };

  const faceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '12px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    padding: '25px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const frontStyle = {
    ...faceStyle,
    background: 'linear-gradient(135deg, #004a80 0%, #002a4d 100%)',
    color: 'white',
  };

  const backStyle = {
    ...faceStyle,
    background: '#f8f9fa',
    color: '#333',
    transform: 'rotateY(180deg)',
    border: '1px solid #ccc'
  };

  const copiarNumero = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText("8899.2233.1111.0045");
    alert("Número da carteirinha copiado!");
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper" style={{textAlign: 'center'}}>
        <div className="page-header">
          <h2>Carteirinha Digital</h2>
          <div className="breadcrumbs">Benefícios &gt; Saúde</div>
        </div>

        <p style={{marginTop: '20px', color: '#666'}}>Clique no cartão para ver o verso.</p>
        
        {/* CONTAINER 3D */}
        <div style={containerStyle} onClick={() => setVirado(!virado)}>
          <div style={cardInnerStyle}>
            
            {/* FRENTE DO CARTÃO */}
            <div style={frontStyle}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <Logo lightMode={true} size={0.8} />
                <span style={{fontSize:'0.8rem', opacity:0.8}}>NACIONAL</span>
              </div>
              
              <div style={{textAlign:'left'}}>
                <span style={{fontSize:'0.7rem', display:'block', opacity:0.7}}>NÚMERO DA CARTEIRA</span>
                <span style={{fontSize:'1.3rem', letterSpacing:'2px', textShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>
                  8899 2233 1111 0045
                </span>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', textAlign:'left'}}>
                <div>
                  <span style={{fontSize:'0.6rem', display:'block', opacity:0.7}}>BENEFICIÁRIO</span>
                  <span style={{fontWeight:'bold'}}>GUILHERME SILVA</span>
                </div>
                <div>
                  <span style={{fontSize:'0.6rem', display:'block', opacity:0.7}}>VALIDADE</span>
                  <span>12/2028</span>
                </div>
              </div>
            </div>

            {/* VERSO DO CARTÃO */}
            <div style={backStyle}>
              <div style={{textAlign:'left', borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>
                <strong style={{color:'#004a80'}}>CANAIS DE ATENDIMENTO</strong>
              </div>
              
              <div style={{fontSize:'0.9rem', textAlign:'left', marginTop:'10px'}}>
                <p>📞 <strong>Emergência:</strong> 0800 777 9999</p>
                <p>📅 <strong>Agendamento:</strong> 4004-1000</p>
                <p>🌐 <strong>Site:</strong> www.techcorp-saude.com.br</p>
              </div>

              <div style={{background:'#000', height:'40px', marginTop:'auto', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.7rem', letterSpacing:'5px'}}>
                |||| || ||||| || |||
              </div>
            </div>

          </div>
        </div>

        <div className="actions" style={{justifyContent: 'center', marginTop: '30px'}}>
            <button className="btn-secondary" onClick={copiarNumero}>📋 Copiar Número</button>
            <button className="btn-primary" onClick={() => window.print()}>🖨 Imprimir Carteirinha</button>
        </div>

      </div>
    </div>
  );
}