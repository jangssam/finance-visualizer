/**
 * corp.xml → MySQL 임포트 스크립트
 * 실행: node scripts/import-corp.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const xml2js = require('xml2js');

// .env.local 파일이 있으면 로드 (로컬 개발용)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('fs').readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
};

if (!DB_CONFIG.user || !DB_CONFIG.password || !DB_CONFIG.database) {
  console.error('❌ DB 환경변수가 설정되지 않았습니다. .env.local 또는 환경변수를 확인하세요.');
  console.error('   필요한 변수: DB_USER, DB_PASSWORD, DB_NAME');
  process.exit(1);
}

const XML_PATH = path.join(__dirname, '..', '..', 'corp.xml');

async function createTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS corporations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      corp_code VARCHAR(8) NOT NULL,
      corp_name VARCHAR(200) NOT NULL,
      corp_eng_name VARCHAR(200),
      stock_code VARCHAR(6),
      modify_date VARCHAR(8),
      INDEX idx_corp_name (corp_name),
      INDEX idx_corp_code (corp_code),
      FULLTEXT INDEX ft_corp_name (corp_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ corporations 테이블 준비 완료');
}

async function importCorpData() {
  console.log('📂 corp.xml 읽는 중...');
  const xmlContent = fs.readFileSync(XML_PATH, 'utf8');

  console.log('🔄 XML 파싱 중...');
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xmlContent);

  const list = result.result.list;
  if (!Array.isArray(list)) {
    throw new Error('XML 파싱 실패: list 배열을 찾을 수 없습니다');
  }

  console.log(`📊 총 ${list.length}개 기업 데이터 발견`);

  const connection = await mysql.createConnection(DB_CONFIG);
  console.log('✅ MySQL 연결 성공');

  await createTable(connection);

  // 기존 데이터 삭제 후 재삽입
  await connection.execute('DELETE FROM corporations');
  console.log('🗑️  기존 데이터 삭제 완료');

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);
    const values = batch.map(item => [
      item.corp_code || '',
      item.corp_name || '',
      item.corp_eng_name || '',
      item.stock_code || '',
      item.modify_date || '',
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await connection.execute(
      `INSERT INTO corporations (corp_code, corp_name, corp_eng_name, stock_code, modify_date) VALUES ${placeholders}`,
      flatValues
    );

    inserted += batch.length;
    process.stdout.write(`\r📥 삽입 중... ${inserted}/${list.length}`);
  }

  console.log(`\n✅ 임포트 완료: 총 ${inserted}개 기업 데이터 저장`);
  await connection.end();
}

importCorpData().catch(err => {
  console.error('❌ 임포트 실패:', err.message);
  console.error('상세 에러:', err);
  process.exit(1);
});
