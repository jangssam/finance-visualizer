const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'jangssam', password: 'KimSH0723@',
    database: 'jangssam', charset: 'utf8mb4'
  });
  const names = ['삼성전자', '현대자동차', '카카오', 'LG전자', 'SK하이닉스', 'NAVER', '포스코홀딩스', '현대모비스', 'KB금융'];
  const placeholders = names.map(() => '?').join(',');
  const [rows] = await conn.execute(`SELECT corp_name, corp_code FROM corporations WHERE corp_name IN (${placeholders})`, names);
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
})().catch(console.error);
