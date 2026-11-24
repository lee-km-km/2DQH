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

async function fetchTodayDayDo(todayStr) {
  try {
    const r = await fetch(`https://sess.skku.edu/sess/reserve/day.do?curDate=${todayStr}&searchCode1=place&searchCode2=610&srSearchVal=HRXRD`, {
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

  const [monthRes, dayItems, supaRes] = await Promise.all([
    new Promise(resolve => {
      apiBookings({ query: { month: mKey } }, { setHeader: () => {}, status: () => ({ json: resolve }) });
    }),
    fetchTodayDayDo(todayStr),
    fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions?select=notes&equipment_code=eq.SESS_MONTH_CACHE&used_on=eq.${mKey}-01`, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    }).then(r => r.json()).catch(() => [])
  ]);

  let existing = [];
  if (Array.isArray(supaRes) && supaRes[0] && supaRes[0].notes) {
    try {
      const parsed = JSON.parse(supaRes[0].notes);
      existing = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
    } catch (_) {}
  }

  // Keep all ASIS-verified entries intact; merge new API + day.do entries by reservNo
  const asisKept = existing.filter(it => it && it.fromAsis);
  const seen = new Set(asisKept.map(it => String(it.reservNo || '')));
  const merged = asisKept.slice();

  const apiItems = (monthRes && Array.isArray(monthRes.items)) ? monthRes.items : [];
  for (const it of apiItems.concat(dayItems)) {
    const rNo = String(it.reservNo || '');
    if (rNo && seen.has(rNo)) continue;
    if (rNo) seen.add(rNo);
    merged.push(it);
  }

  if (merged.length === 0) {
    console.log(`[${new Date().toISOString()}] No items to update for ${mKey}`);
    return;
  }

  await fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions?equipment_code=eq.SESS_MONTH_CACHE&used_on=eq.${mKey}-01`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });

  const ins = await fetch(`${SUPABASE_URL}/rest/v1/equipment_sessions`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      equipment_id: 'SESS',
      equipment_code: 'SESS_MONTH_CACHE',
      used_on: mKey + '-01',
      duration_min: merged.length,
      user_name: 'SYSTEM',
      notes: JSON.stringify({ updatedAt: Date.now(), items: merged })
    })
  });

  console.log(`[${new Date().toISOString()}] Synced ${mKey}: ${merged.length} items (Supabase status ${ins.status})`);
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
