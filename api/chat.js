export default async function handler(req, res) {
  // Garante que só aceitamos requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Puxa a chave da variável de ambiente SEGURA do servidor da Vercel
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key não configurada no servidor da Vercel' });
  }

  try {
    // Faz a requisição para o Google DE DENTRO DO SERVIDOR
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body) // Repassa os dados que vieram do front-end
    });

    const data = await googleResponse.json();
    
    // Repassa possíveis erros do Google para o front-end
    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json(data);
    }

    // Retorna a resposta de sucesso para o seu React
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}