export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEYが設定されていません。' });
  }

  const userMessage = req.body?.message || req.body?.prompt || 'こんにちは';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: String(userMessage) }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Google APIエラー',
        details: data.error?.message || JSON.stringify(data)
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を取得できませんでした。';
    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: 'サーバーエラーが発生しました。', details: String(error) });
  }
}
