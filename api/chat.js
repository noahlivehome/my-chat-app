export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // クライアント側から渡される message を取得
  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません。' });
  }

  if (!message) {
    return res.status(400).json({ error: 'メッセージが空です。' });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: String(message)
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'API呼び出しエラー', details: data });
    }

    // AIからの返答文を取り出す
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '返答を取得できませんでした。';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'サーバー内でエラーが発生しました。' });
  }
}
