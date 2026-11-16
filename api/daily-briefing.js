const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || 'kangminlee@skku.edu';
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.worksmobile.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);

function getKstInfo() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  const date = kst.getUTCDate();
  const day = kst.getUTCDay(); // 0=일, 1=월, ..., 5=금
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const diffDays = Math.floor((kst - startOfYear) / 86400000);
  const weekNum = Math.ceil((diffDays + startOfYear.getUTCDay() + 1) / 7);

  return {
    dateStr: `${year}년 ${month}월 ${date}일 (${dayNames[day]})`,
    day,
    weekNum
  };
}

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.filter(Boolean).join(' ');
  return text.length > 420 ? text.slice(0, 420) + '...' : text;
}

async function fetchWeeklyPaper() {
  try {
    const url = 'https://api.openalex.org/works?search=2D+heterostructure+XRD+OR+TEM+OR+STEM&filter=has_abstract:true,type:article&sort=publication_date:desc&per-page=3';
    const res = await fetch(url, { headers: { 'User-Agent': '2DQH-Lab-Briefing/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const work = data.results && data.results[0];
    if (!work) return null;
    return {
      title: work.title || '제목 없음',
      journal: (work.primary_location && work.primary_location.source && work.primary_location.source.display_name) || '학술지 정보 없음',
      date: work.publication_date || '',
      doi: work.doi || '',
      abstract: reconstructAbstract(work.abstract_inverted_index)
    };
  } catch (_) {
    return null;
  }
}

module.exports = async (req, res) => {
  const kst = getKstInfo();
  const isMonday = kst.day === 1;
  const isFriday = kst.day === 5;
  const isBiweeklySteering = kst.weekNum % 2 === 0; // 격주(짝수 주) 운영위원회

  const tasks = [
    '📦 소모품 재고 부족 품목 및 발주 필요 여부 확인',
    '🧪 특별관리물질 취급일지 및 시약 잔여량 점검',
    '🛠️ 공용 비품 대여/반납 현황 확인'
  ];

  if (isBiweeklySteering) {
    tasks.unshift('🏛️ [격주] 운영위원회 일정 확인 및 안건/자료 준비');
  }
  if (isFriday) {
    tasks.unshift('🔬 [매주 금요일] 연구장비(HR-XRD, 글러브박스, 와이어본더 등) 주간 점검 결과 보고');
  }

  let paper = null;
  if (isMonday || req.query.forcePaper === '1') {
    paper = await fetchWeeklyPaper();
  }

  const paperHtml = paper ? `
    <div style="margin-top:20px;padding:16px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:6px;">
      <div style="font-size:12px;font-weight:700;color:#2563eb;margin-bottom:6px;">📚 [월요일 주간 논문 브리핑] 2DQH · 전자현미경 / XRD</div>
      <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:4px;">${paper.title}</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:10px;">${paper.journal} · ${paper.date}</div>
      <div style="font-size:13px;color:#334155;line-height:1.6;">${paper.abstract || '초록 요약 없음'}</div>
      ${paper.doi ? `<div style="margin-top:8px;"><a href="${paper.doi}" style="font-size:12px;color:#2563eb;font-weight:700;">논문 원문 보기 (DOI) →</a></div>` : ''}
    </div>` : '';

  const html = `
    <div style="font-family:'Malgun Gothic','맑은 고딕',sans-serif;max-width:640px;margin:0 auto;color:#111827;line-height:1.65;">
      <h2 style="margin:0 0 6px;font-size:18px;color:#0f172a;">📋 2DQH 연구실 데일리 브리핑</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${kst.dateStr} · 이강민 기술원님</p>

      <div style="padding:14px 16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
        <div style="font-size:13.5px;font-weight:800;color:#0f172a;margin-bottom:8px;">✅ 오늘 / 이번 주 주요 할 일</div>
        <ul style="margin:0;padding-left:18px;font-size:13.5px;color:#1e293b;">
          ${tasks.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join('')}
        </ul>
      </div>
      ${paperHtml}
      <div style="margin-top:20px;font-size:12px;color:#94a3b8;">
        2DQH 연구실 통합 관리 시스템 자동 발송
      </div>
    </div>
  `;

  if (req.query && req.query.preview === '1') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  if (!SMTP_PASS) {
    return res.status(500).json({ error: 'SMTP_PASS 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: false }
    });

    const subjectPrefix = isMonday ? '[월간·논문브리핑] ' : (isFriday ? '[금요·장비주간보고] ' : '');
    const info = await transporter.sendMail({
      from: `"2DQH 연구실 브리핑" <${SMTP_USER}>`,
      to: SMTP_USER,
      subject: `${subjectPrefix}2DQH 오늘 할 일 브리핑 (${kst.dateStr})`,
      html
    });

    return res.status(200).json({ success: true, messageId: info.messageId, date: kst.dateStr });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
};
