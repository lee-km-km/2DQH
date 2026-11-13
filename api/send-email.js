const nodemailer = require('nodemailer');

// 네이버웍스 (WorksMobile / 성균관대 웹메일) SMTP 설정
const SMTP_USER = process.env.SMTP_USER || 'kangminlee@skku.edu';
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.worksmobile.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);

// Transporter 초기화 (재사용)
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!SMTP_PASS) {
    return res.status(500).json({ error: '서버에 SMTP_PASS 환경변수가 없습니다. Vercel Settings > Environment Variables에서 Production 체크 여부와 이름을 확인하고 재배포하세요.' });
  }
  try {
    const { to, cc, subject, html, text, senderName, attachments } = req.body || {};

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({ error: '수신자(to) 이메일 주소를 1개 이상 지정해주세요.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: '메일 제목을 입력해주세요.' });
    }

    const toList = Array.isArray(to) ? to.filter(Boolean).join(', ') : to;
    const ccList = Array.isArray(cc) ? cc.filter(Boolean).join(', ') : (cc || '');

    const fromName = senderName || '이강민 (2DQH 연구실)';
    const fromAddress = `"${fromName}" <${SMTP_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: toList,
      subject: subject.trim(),
      text: text || '',
      html: html || (text ? text.replace(/\n/g, '<br>') : '')
    };

    if (Array.isArray(attachments) && attachments.length) {
      mailOptions.attachments = attachments.map(a => ({ filename: a.filename, content: a.content, encoding: 'base64' }));
    }

    if (ccList) {
      mailOptions.cc = ccList;
    }

    const t = getTransporter();
    const info = await t.sendMail(mailOptions);

    console.log('[SMTP SUCCESS] Mail sent:', info.messageId, 'to:', toList);
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      to: toList
    });
  } catch (err) {
    console.error('[SMTP ERROR]', err);
    return res.status(500).json({
      error: '이메일 발송에 실패했습니다: ' + (err.message || String(err))
    });
  }
};
