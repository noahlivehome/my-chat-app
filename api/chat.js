export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(200).json({ reply: '❌ エラー: GEMINI_API_KEY が設定されていません。' });
  }

  const userMessage = req.body?.message || req.body?.prompt || 'こんにちは';

  // 試行するエンドポイントのリスト（v1 / v1beta × モデル各種）
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`
  ];

  let lastError = '';

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: String(userMessage) }] }]
        })
      });

      const data = await response.json();

      if (response.ok) {
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を取得できませんでした。';
        return res.status(200).json({ reply });
      }

      lastError = data.error?.message || JSON.stringify(data);
    } catch (e) {
      lastError = String(e.message || e);
    }
  }

  // すべて失敗した場合のみエラーを表示
  return res.status(200).json({ reply: `❌ Google APIエラー: ${lastError}` });
}
