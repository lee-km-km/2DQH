function toHalfHourSlots(startTm, endTm) {
  if (!startTm || !endTm) return [];
  const toMin = (s) => {
    const p = String(s).split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  };
  const sMin = Math.floor(toMin(startTm) / 30) * 30;
  const eMin = Math.ceil(toMin(endTm) / 30) * 30;
  const out = [];
  for (let m = sMin; m < eMin; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    out.push(`${hh}:${mm}`);
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const month = (req.query && req.query.month) ? String(req.query.month).slice(0, 7) : new Date().toISOString().slice(0, 7);
  const curDate = `${month}-01`;

  try {
    const url = `https://sess.skku.edu/_custom/shb/_common/sessEquip/reserve/month/getMonthData.jsp?searchCode1=place&searchCode2=610&curDate=${encodeURIComponent(curDate)}`;
    const r = await fetch(url, { headers: { 'User-Agent': '2DQH-Lab-Sync/1.0' } });
    if (!r.ok) {
      return res.status(502).json({ error: `SESS 응답 오류 (${r.status})`, items: [] });
    }
    const json = await r.json();
    const raw = Array.isArray(json.data) ? json.data : [];

    const items = raw.map((d) => ({
      reservNo: d.reservNo || d.reservNos || '',
      equipEngNm: d.equipEngNm || '',
      equipShortNm: d.equipShortNm || '',
      equipKorNm: d.equipKorNm || '',
      user: d.korNm || 'SESS 예약자',
      date: d.startDt || d.start || '',
      startTm: d.startTm || '',
      endTm: d.endTm || '',
      slots: toHalfHourSlots(d.startTm, d.endTm),
      space: d.GK_GU_SPACE_NM || ''
    }));

    return res.status(200).json({ success: true, month, count: items.length, items });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err), items: [] });
  }
};
