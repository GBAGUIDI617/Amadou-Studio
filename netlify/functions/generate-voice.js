const { verifyGoogleToken } = require("./_shared");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { text, voiceName, languageCode, idToken } = JSON.parse(event.body);
    await verifyGoogleToken(idToken, CLIENT_ID);

    const apiKey = process.env.GEMINI_API_KEY;
    const speechConfig = {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || "Kore" } }
    };
    if (languageCode) speechConfig.languageCode = languageCode;

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: speechConfig }
        })
      }
    );
    const data = await resp.json();
    return { statusCode: resp.status, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
