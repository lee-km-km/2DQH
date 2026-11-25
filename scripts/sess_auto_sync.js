const path = require('path');
const apiBookings = require(path.join(__dirname, '..', 'api', 'sess-bookings.js'));

const SUPABASE_URL = 'https://nngownhoxrtymzvwscyc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ijsPGWswYcZKdhrjoy4hSw_9jRaQGbv';

function pad(n) { return String(n).padStart(2, '0'); }

function toHalfHourSlots(startTm, endTm) {
  if (!startTm || !endTm) return [];
  const toMin = (s) => { const p = String(s).split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); };
  const sMin = Math.floor(toMin(startTm) / 30) * 30;
  const eMin = Math.ceil(toMin(endTm) / 30) * 30;
  const out = [];
  for (let m = sMin; m < eMin; m += 30) {
    out.push(pad(Math.floor(m / 60)) + ':' + pad(m % 60));
  }
  return out;
}

function isNamedUser(u) {
  const s = String(u || '').trim();
  return Boolean(s && s !== 'SESS 예약자');
}

async function fetchTodayDayDo(todayStr) {
  try {
    const r = await fetch(`https://sess.skku.edu/sess/reserve/day.do?curDate=${todayStr}&code1=place&code2=610&srSearchVal=HRXRD`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });
    if (!r.ok) return [];
    const h = await r.text();
    const out = [];
    const resRe = /date-reserve="(\d+)"[^>]*>\s*(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/gi;
    let m;
    while ((m = resRe.exec(h)) !== null) {
      out.push({
        reservNo: m[1],
        equipEngNm: 'X-Ray Diffractometer System',
        equipShortNm: 'HRXRD',
        equipKorNm: '회절기, 엑스선 (X-선 회절분석시스템)',
        user: 'SESS 예약자',
        date: todayStr,
        startTm: m[2],
        endTm: m[3],
        slots: toHalfHourSlots(m[2], m[3]),
        space: '실험실'
      });
    }
    return out;
  } catch (_) {
    return [];
  }
}

async function run() {
  const now = new Date();
  const mKey = now.getFullYear() + '-' + pad(now.getMonth() + 1);
  const todayStr = mKey + '-' + pad(now.getDate());

  const [monthRes, dayItems, supaFetch] = await Promise.all([
    new Promise(resolve => {
      apiBookings({ query: { month: mKey } }, { setHeader: () => {}, status: () => ({ json: resolve }) });
    }),
    fetchTodayDayDo(todayStr),
    fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions?select=id,notes&equipment_code=eq.SESS_MONTH_CACHE&used_on=eq.${mKey}-01`, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    }).then(async r => ({ ok: r.ok, rows: r.ok ? await r.json() : [] })).catch(() => ({ ok: false, rows: [] }))
  ]);

  // Abort if Supabase read failed so transient network errors never wipe fromAsis/existing cache
  if (!supaFetch.ok || !Array.isArray(supaFetch.rows)) {
    console.error(`[${new Date().toISOString()}] Aborting sync for ${mKey}: failed to read existing Supabase cache`);
    process.exit(1);
  }

  let existing = [];
  const supaId = supaFetch.rows[0] && supaFetch.rows[0].id ? supaFetch.rows[0].id : null;
  if (supaFetch.rows[0] && supaFetch.rows[0].notes) {
    try {
      const parsed = JSON.parse(supaFetch.rows[0].notes);
      existing = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
    } catch (_) {}
  }

  // Keep all ASIS-verified entries, all past-date entries (< todayStr), and today's existing entries if day.do returned empty
  const kept = existing.filter(it => it && (it.fromAsis || (it.date && it.date < todayStr) || (dayItems.length === 0 && it.date === todayStr)));
  const byRNo = new Map();
  const merged = [];
  for (const it of kept) {
    const rNo = String(it.reservNo || '');
    const idx = merged.length;
    merged.push(Object.assign({}, it));
    if (rNo && !byRNo.has(rNo)) byRNo.set(rNo, idx);
  }

  const apiItems = (monthRes && Array.isArray(monthRes.items)) ? monthRes.items : [];
  for (const it of apiItems.concat(dayItems)) {
    const rNo = String(it.reservNo || '');
    if (rNo && byRNo.has(rNo)) {
      const idx = byRNo.get(rNo);
      const prev = merged[idx];
      // Never touch fromAsis entries; only upgrade generic placeholder users or fill empty metadata
      if (!prev.fromAsis) {
        if (!isNamedUser(prev.user) && isNamedUser(it.user)) {
          prev.user = it.user;
        }
        if (!prev.equipEngNm && it.equipEngNm) prev.equipEngNm = it.equipEngNm;
        if (!prev.equipKorNm && it.equipKorNm) prev.equipKorNm = it.equipKorNm;
      }
      continue;
    }
    if (rNo) byRNo.set(rNo, merged.length);
    merged.push(it);
  }

  if (merged.length === 0) {
    console.log(`[${new Date().toISOString()}] No items to update for ${mKey}`);
    return;
  }

  const prevAsisCount = existing.filter(it => it && it.fromAsis).length;
  const nextAsisCount = merged.filter(it => it && it.fromAsis).length;
  if (nextAsisCount < prevAsisCount) {
    console.error(`[${new Date().toISOString()}] Guard triggered: fromAsis count shrank (${prevAsisCount} -> ${nextAsisCount})`);
    process.exit(1);
  }

  const payload = {
    equipment_id: 'SESS',
    equipment_code: 'SESS_MONTH_CACHE',
    used_on: mKey + '-01',
    duration_min: merged.length,
    user_name: 'SYSTEM',
    notes: JSON.stringify({ updatedAt: Date.now(), items: merged })
  };

  let res;
  if (supaId && supaFetch.rows.length === 1) {
    res = await fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions?id=eq.${supaId}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
  } else {
    if (supaFetch.rows.length > 1) {
      await fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions?equipment_code=eq.SESS_MONTH_CACHE&used_on=eq.${mKey}-01`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
      });
    }
    res = await fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
  }

  console.log(`[${new Date().toISOString()}] Synced ${mKey}: ${merged.length} items (fromAsis=${nextAsisCount}, Supabase status ${res.status})`);
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
