export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const userMessage = body.message || body.text || body.prompt || body.content || (typeof body === 'string' ? body : '');
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません。' });
  }

  const finalMessage = userMessage || "こんにちは";

  // 利用可能なモデルの候補リスト（上から順に試します）
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro'
  ];

  let lastErrorData = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: String(finalMessage) }] }]
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を取得できませんでした。';
        return res.status(200).json({ reply });
      }

      console.warn(`Model ${model} failed:`, data);
      lastErrorData = data;
    } catch (err) {
      console.error(`Fetch error for model ${model}:`, err);
    }
  }

  // 全てのモデルで失敗した場合のみエラーを返す
  return res.status(500).json({ error: 'API呼び出しエラー', details: lastErrorData });
}
