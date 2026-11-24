async function translateOne(text) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=' + encodeURIComponent(text);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(4500) : undefined
    });
    if (!r.ok) return text;
    const j = await r.json();
    if (Array.isArray(j) && Array.isArray(j[0])) {
      return j[0].map(seg => (Array.isArray(seg) && seg[0]) ? seg[0] : '').join('') || text;
    }
    return text;
  } catch (_) {
    return text;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const raw = Array.isArray(body.texts) ? body.texts : [];
    const unique = Array.from(new Set(raw.map(t => String(t || '').trim()).filter(t => t && /[가-힣]/.test(t)))).slice(0, 40);
    const translations = {};
    await Promise.all(unique.map(async (txt) => {
      translations[txt] = await translateOne(txt);
    }));
    return res.status(200).json({ success: true, translations });
  } catch (err) {
    return res.status(200).json({ success: false, translations: {}, error: err.message || String(err) });
  }
};
