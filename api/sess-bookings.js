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

async function fetchSessQuery(curDate, extraParams, errs) {
  const url = `https://sess.skku.edu/_custom/shb/_common/sessEquip/reserve/month/getMonthData.jsp?curDate=${encodeURIComponent(curDate)}&${extraParams}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, signal: AbortSignal.timeout ? AbortSignal.timeout(8500) : undefined });
    if (!r.ok) {
      if (errs) errs.push(`HTTP ${r.status}`);
      return [];
    }
    const j = await r.json();
    return Array.isArray(j.data) ? j.data : [];
  } catch (e) {
    if (errs) errs.push(e && e.message ? e.message : String(e));
    return [];
  }
}

const EQUIP_META_DEFAULTS = {
  '185': { equipEngNm: 'X-Ray Diffractometer System', equipShortNm: 'HRXRD', equipKorNm: '회절기, 엑스선 (X-선 회절분석시스템)' },
  '187': { equipEngNm: 'FT-IR Spectrometer', equipShortNm: 'FT-IR 4700', equipKorNm: '적외선분광기' },
  '180': { equipEngNm: 'Atomic Resolution Electron Microscope', equipShortNm: 'TEMⅡ(JEM-ARM200F)', equipKorNm: '전자현미경(수차보정전계방사투과전자현미경)' },
  '184': { equipEngNm: 'NanoBase Confocal Raman Spectrometer', equipShortNm: 'XperRAM 200', equipKorNm: '공초점 레이저 주사 현미경 3' },
  '186': { equipEngNm: 'UV-VIS-NIR Spectrophotometer', equipShortNm: 'UV-3600', equipKorNm: '자외선-가시광선-근적외선 분광광도계' },
  '13210': { equipEngNm: 'Alpha-Step Surface Profiler', equipShortNm: 'Alpha-Step', equipKorNm: '단차측정기' },
  '13690': { equipEngNm: 'E-Beam Evaporator 2', equipShortNm: 'E-Beam Evaporator 2', equipKorNm: '전자빔 증착기 2' }
};

function expandSessDayRow(d, equipMetaById, equipMetaByShort) {
  const out = [];
  const suffixes = [''];
  for (let i = 1; i <= 30; i++) {
    suffixes.push(String(i));
  }
  const dateStr = d.startDt || d.start || '';
  const space = d.GK_GU_SPACE_NM || '';
  const rootUser = d.korNm || 'SESS 예약자';

  for (const sfx of suffixes) {
    const rNoRaw = d['reservNo' + sfx];
    const startTm = d['startTm' + sfx];
    const endTm = d['endTm' + sfx];
    if (sfx !== '' && !rNoRaw && !startTm && !endTm) continue;
    const rNo = String(rNoRaw || (sfx === '' ? (d.reservNos ? String(d.reservNos).split(',')[0] : '') : '') || '');
    if (!rNo && !startTm) continue;

    const eqIdStr = String(d['equipId' + sfx] || (sfx === '' ? d.equipId : '') || '');
    const shortNm = d['equipShortNm' + sfx] || (sfx === '' ? d.equipShortNm : '') || '';
    const meta = (eqIdStr && equipMetaById[eqIdStr]) ||
      (shortNm && equipMetaByShort[shortNm.toUpperCase()]) ||
      (eqIdStr && EQUIP_META_DEFAULTS[eqIdStr]) ||
      null;

    out.push({
      reservNo: rNo,
      equipId: eqIdStr,
      equipEngNm: (sfx === '' && d.equipEngNm) ? d.equipEngNm : (meta ? meta.equipEngNm : ''),
      equipShortNm: shortNm || (meta ? meta.equipShortNm : ''),
      equipKorNm: (sfx === '' && d.equipKorNm) ? d.equipKorNm : (meta ? meta.equipKorNm : ''),
      user: d['korNm' + sfx] || rootUser,
      date: dateStr,
      startTm: startTm || '',
      endTm: endTm || '',
      slots: toHalfHourSlots(startTm, endTm),
      procStatCd: d['procStatCd' + sfx] || d.procStatCd || '',
      space
    });
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const month = (req.query && req.query.month) ? String(req.query.month).slice(0, 7) : new Date().toISOString().slice(0, 7);
  const curDate = `${month}-01`;

  try {
    const errs = [];
    // Fetch equipment-specific queries first so each reservNo keeps its exact korNm & equip metadata, then fetch place catch-all
    const batches = await Promise.all([
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=HRXRD', errs),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=FT-IR', errs),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=UV', errs),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610&srSearchVal=OM', errs),
      fetchSessQuery(curDate, 'searchCode1=place&searchCode2=610', errs)
    ]);

    const equipMetaById = Object.assign({}, EQUIP_META_DEFAULTS);
    const equipMetaByShort = {};
    for (const raw of batches) {
      for (const d of raw) {
        if (d.equipId && d.equipEngNm) {
          const meta = {
            equipEngNm: d.equipEngNm || '',
            equipShortNm: d.equipShortNm || '',
            equipKorNm: d.equipKorNm || ''
          };
          equipMetaById[String(d.equipId)] = meta;
          if (d.equipShortNm) equipMetaByShort[String(d.equipShortNm).toUpperCase()] = meta;
        }
      }
    }

    const seen = new Set();
    const items = [];
    for (const raw of batches) {
      for (const d of raw) {
        for (const entry of expandSessDayRow(d, equipMetaById, equipMetaByShort)) {
          const key = entry.reservNo
            ? String(entry.reservNo)
            : `${entry.date}|${entry.equipShortNm}|${entry.startTm}|${entry.endTm}`;
          if (key && seen.has(key)) continue;
          if (key) seen.add(key);
          items.push(entry);
        }
      }
    }

    return res.status(200).json({ success: true, month, count: items.length, items, errors: items.length === 0 ? errs : undefined });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err), items: [] });
  }
};
