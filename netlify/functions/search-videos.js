const { verifyGoogleToken } = require("./_shared");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { query, idToken } = JSON.parse(event.body);
    await verifyGoogleToken(idToken, CLIENT_ID);

    const apiKey = process.env.PIXABAY_API_KEY;
    const resp = await fetch(
      "https://pixabay.com/api/videos/?key=" + apiKey +
      "&q=" + encodeURIComponent(query) +
      "&per_page=10&safesearch=true"
    );
    const data = await resp.json();
    return { statusCode: resp.status, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
