// Vercel サーバーサイド関数 - Yahoo Finance からIONQデータを取得
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300'); // 5分キャッシュ

  const end   = Math.floor(Date.now() / 1000);
  const start = end - 60 * 24 * 3600; // 直近60日
  const url   = 'https://query1.finance.yahoo.com/v8/finance/chart/IONQ'
    + '?period1=' + start + '&period2=' + end + '&interval=1d';

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        }
      }, (r) => {
        let raw = '';
        r.on('data', c => raw += c);
        r.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch(e) { reject(e); }
        });
      }).on('error', reject);
    });

    const result = data.chart.result[0];
    const quote  = result.indicators.quote[0];
    const rows   = result.timestamp
      .map((t, i) => ({
        date:  new Date(t * 1000).toISOString().slice(0, 10),
        close: quote.close[i],
      }))
      .filter(d => d.close != null && !isNaN(d.close));

    res.status(200).json({ ok: true, data: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
