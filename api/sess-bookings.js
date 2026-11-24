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

async function fetchSessQuery(curDate, extraParams) {
  const url = `https://sess.skku.edu/_custom/shb/_common/sessEquip/reserve/month/getMonthData.jsp?curDate=${encodeURIComponent(curDate)}&${extraParams}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': '2DQH-Lab-Sync/1.0' }, signal: AbortSignal.timeout ? AbortSignal.timeout(7500) : undefined });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch (_) {
    return [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const month = (req.query && req.query.month) ? String(req.query.month).slice(0, 7) : new Date().toISOString().slice(0, 7);
  const curDate = `${month}-01`;

  try {
    const batches = await Promise.all([
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610'),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=HRXRD'),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=FT-IR'),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=UV'),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=OM')
    ]);

    const seen = new Set();
    const items = [];
    for (const raw of batches) {
      for (const d of raw) {
        const rNo = String(d.reservNo || d.reservNos || '');
        if (rNo && seen.has(rNo)) continue;
        if (rNo) seen.add(rNo);
        items.push({
          reservNo: rNo,
          equipEngNm: d.equipEngNm || '',
          equipShortNm: d.equipShortNm || '',
          equipKorNm: d.equipKorNm || '',
          user: d.korNm || 'SESS 예약자',
          date: d.startDt || d.start || '',
          startTm: d.startTm || '',
          endTm: d.endTm || '',
          slots: toHalfHourSlots(d.startTm, d.endTm),
          space: d.GK_GU_SPACE_NM || ''
        });
      }
    }

    return res.status(200).json({ success: true, month, count: items.length, items });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err), items: [] });
  }
};
