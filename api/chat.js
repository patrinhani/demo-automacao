// AUMENTA O TEMPO DE VIDA DA FUNÇÃO NA VERCEL
export const maxDuration = 60; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // 1. PUXA AS 5 CHAVES DAS VARIÁVEIS DE AMBIENTE DA VERCEL
  const keys = [
    process.env.GEMINI_API_KEY,   // A sua chave original (1)
    process.env.GEMINI_API_KEY_2, // As novas (2 a 5)
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ];
  
  // 2. CRIA UM ARRAY APENAS COM AS CHAVES VÁLIDAS 
  // (Assim se alguma faltar, o sistema não quebra e usa só as que existem)
  const availableKeys = keys.filter(Boolean);

  if (availableKeys.length === 0) {
    return res.status(500).json({ error: 'Nenhuma API Key configurada no servidor' });
  }

  // 3. ROTAÇÃO MAGNÍFICA (Sorteia uma das 5 chaves a cada mensagem)
  const randomKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];

  try {
    const requestData = req.body;

    if (!requestData.generationConfig) {
        requestData.generationConfig = {};
    }
    requestData.generationConfig.maxOutputTokens = 8192; 

    // 4. FAZ A CHAMADA COM A CHAVE SORTEADA
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${randomKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const data = await googleResponse.json();
    
    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}