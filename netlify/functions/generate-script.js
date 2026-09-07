const { verifyGoogleToken, checkAndIncrementQuota } = require("./_shared");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const DAILY_LIMIT = 5;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { idea, duration, tone, idToken } = JSON.parse(event.body);
    const user = await verifyGoogleToken(idToken, CLIENT_ID);
    const quota = await checkAndIncrementQuota(user.email, DAILY_LIMIT);
    if (!quota.allowed) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "Limite quotidienne de " + DAILY_LIMIT + " vidéos atteinte. Réessaie demain." })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `Tu es scénariste pour vidéos courtes. À partir de cette idée : "${idea}"
Durée visée : ${duration}. Ton : ${tone}.
Découpe la vidéo en 4 à 7 scènes.
Réponds UNIQUEMENT avec un tableau JSON valide (pas de texte autour, pas de markdown), où chaque élément a exactement ces clés :
"visuel" (description de ce qu'on voit à l'écran),
"voix_off" (texte à dire, une ou deux phrases),
"mots_cles_image" (2-4 mots-clés en anglais pour chercher une image/vidéo libre de droits correspondante).`;

    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2048 }
        })
      }
    );
    const data = await resp.json();
    return { statusCode: resp.status, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
