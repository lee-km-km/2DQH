function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': '2DQH-Lab-Sync/1.0' } });
    if (!r.ok) return '';
    return await r.text();
  } catch (_) {
    return '';
  }
}

function parseSessEquipments(html) {
  const list = [];
  const itemRe = /<li[^>]*>[\s\S]*?<a[^>]*href="([^"]*result\.do\?equipId=(\d+)[^"]*)"[\s\S]*?<\/li>/gi;
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const block = m[0];
    const equipId = m[2];
    const imgM = block.match(/<img[^>]*src="([^"]+)"/i);
    const titleM = block.match(/<a[^>]*class="title"[^>]*>([\s\S]*?)<\/a>/i);
    const placeM = block.match(/<span[^>]*class="place"[^>]*>([\s\S]*?)<\/span>/i);
    const rawImg = imgM ? imgM[1] : '';
    const isJunkIcon = /top_ico|sns|facebook|twitter|logo|icon|btn_/i.test(rawImg);
    const imgUrl = (rawImg && !isJunkIcon) ? (rawImg.startsWith('http') ? rawImg : 'https://sess.skku.edu' + (rawImg.startsWith('/') ? '' : '/') + rawImg) : '';
    const title = titleM ? stripTags(titleM[1]) : '';
    const place = placeM ? stripTags(placeM[1]) : '';
    if (title) {
      list.push({
        sessEquipId: equipId,
        name: title,
        location: place,
        image: imgUrl,
        url: 'https://sess.skku.edu/sess/reserve/result.do?equipId=' + equipId
      });
    }
  }
  return list;
}

function parseSessBoard(html, basePath) {
  const rows = [];
  const trRe = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  let m;
  while ((m = trRe.exec(html)) !== null) {
    const tr = m[0];
    const aM = tr.match(/<a[^>]*href="([^"]*mode=view[^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!aM) continue;
    const title = stripTags(aM[2]);
    const href = aM[1].startsWith('http') ? aM[1] : 'https://sess.skku.edu' + basePath + aM[1];
    const dateM = tr.match(/\b(20\d{2}[-.]\d{2}[-.]\d{2})\b/);
    rows.push({
      title,
      url: href,
      date: dateM ? dateM[1].replace(/\./g, '-') : ''
    });
    if (rows.length >= 6) break;
  }
  return rows;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const [p1, p2, noticeHtml, semHtml] = await Promise.all([
      fetchText('https://sess.skku.edu/sess/reserve/search.do?code1=place&code2=610&article.offset=0'),
      fetchText('https://sess.skku.edu/sess/reserve/search.do?code1=place&code2=610&article.offset=10'),
      fetchText('https://sess.skku.edu/sess/community/notice.do'),
      fetchText('https://sess.skku.edu/sess/education/seminar.do')
    ]);

    const seen = new Set();
    const equipments = [];
    for (const item of parseSessEquipments(p1).concat(parseSessEquipments(p2))) {
      if (seen.has(item.sessEquipId)) continue;
      seen.add(item.sessEquipId);
      equipments.push(item);
    }

    const notices = parseSessBoard(noticeHtml, '/sess/community/notice.do');
    const seminars = parseSessBoard(semHtml, '/sess/education/seminar.do');

    return res.status(200).json({
      success: true,
      equipments,
      notices,
      seminars
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err), equipments: [], notices: [], seminars: [] });
  }
};
