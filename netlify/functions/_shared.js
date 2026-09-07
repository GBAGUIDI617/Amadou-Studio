// Fonctions partagées : vérification du compte Google, et limite d'usage quotidienne.

async function verifyGoogleToken(idToken, expectedClientId) {
  if (!idToken) throw new Error("Connexion requise.");
  const resp = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken));
  if (!resp.ok) throw new Error("Session invalide, reconnecte-toi.");
  const payload = await resp.json();
  if (payload.aud !== expectedClientId) {
    throw new Error("Jeton non destiné à cette application.");
  }
  return payload; // contient email, name, etc.
}

async function checkAndIncrementQuota(email, limit) {
  try {
    const { getStore } = require("@netlify/blobs");
    const store = getStore("usage");
    const today = new Date().toISOString().slice(0, 10);
    const key = email + ":" + today;
    const current = parseInt((await store.get(key)) || "0", 10);
    if (current >= limit) {
      return { allowed: false, count: current };
    }
    await store.set(key, String(current + 1));
    return { allowed: true, count: current + 1 };
  } catch (e) {
    // Si le stockage n'est pas disponible, on laisse passer plutôt que de bloquer tout le monde.
    return { allowed: true, count: 0 };
  }
}

module.exports = { verifyGoogleToken, checkAndIncrementQuota };
