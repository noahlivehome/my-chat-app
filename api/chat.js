import https from 'https';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    
    // STEP 1 でコピーした Default Gemini Project のキー（AQ...）をここに貼り付け
    const apiKey = "AQ.Ab8RN6Kn833X4efnCTAGxtSKGd3rPXA9fjtGLoXTsRPKbBJBKQ"; 

    const postData = JSON.stringify({
      contents: [
        {
          parts: [{ text: message || "こんにちは" }]
        }
      ]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiResponse = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            resolve({ statusCode: response.statusCode, body: JSON.parse(data) });
          } catch (e) {
            reject(new Error("レスポンスの解析に失敗しました"));
          }
        });
      });

      request.on('error', (error) => { reject(error); });
      request.write(postData);
      request.end();
    });

    if (apiResponse.statusCode !== 200) {
      console.error("Gemini API Error:", apiResponse.body);
      return res.status(500).json({ 
        error: "Google APIエラーが発生しました。", 
        details: apiResponse.body.error?.message || JSON.stringify(apiResponse.body) 
      });
    }

    const replyText = apiResponse.body.candidates?.[0]?.content?.parts?.[0]?.text || "返答が得られませんでした。";
    return res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。", details: error.message });
  }
}
