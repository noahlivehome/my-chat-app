export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // APIキーの読み込み（トリム処理）
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(200).json({ reply: '❌ エラー: Vercelに GEMINI_API_KEY が設定されていません。' });
  }

  const userMessage = req.body?.message || req.body?.prompt || 'こんにちは';
  
  // 安定版のgemini-1.5-flashモデルを使用
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
      // エラーの詳細をそのまま返答として画面に送る
      const errorDetail = data.error?.message || JSON.stringify(data);
      return res.status(200).json({ reply: `❌ Google APIエラー (${response.status}): ${errorDetail}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を取得できませんでした。';
    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(200).json({ reply: `❌ サーバー接続エラー: ${String(error.message || error)}` });
  }
}
