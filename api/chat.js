export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // APIキーを使わず、動作確認用の返答を返すテストコード
    const replyText = `【テスト応答】「${message || "こんにちは"}」というメッセージを受け取りました！通信は正常に成功しています。`;

    return res.status(200).json({ reply: replyText });

  } catch (error) {
    return res.status(500).json({ error: "エラーが発生しました。" });
  }
}
