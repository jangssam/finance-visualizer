# 재무 데이터 시각화 분석 서비스

OpenDART 공시 데이터를 기반으로 기업의 재무제표를 시각화하고, Gemini AI가 누구나 이해할 수 있는 언어로 분석해주는 서비스입니다.

## 주요 기능

- **기업 검색**: 3,864개 DART 등록 기업을 회사명으로 실시간 검색
- **재무 시각화**: 재무상태표·손익계산서를 Recharts 인터랙티브 차트로 표현 (3개년 비교)
- **AI 쉬운 설명**: Gemini 2.0 Flash가 재무 데이터를 일반인도 이해하기 쉽게 분석

## 기술 스택

- **프레임워크**: Next.js 14 (App Router, TypeScript)
- **스타일**: Tailwind CSS
- **차트**: Recharts
- **DB**: MySQL 8.x
- **AI**: Google Gemini 2.0 Flash
- **데이터 소스**: 금융감독원 OpenDART API

## 로컬 개발 시작하기

### 사전 요구사항

- Node.js 18+
- MySQL 8.x

### 1. MySQL 설정

```sql
CREATE DATABASE IF NOT EXISTS jangssam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'jangssam'@'localhost' IDENTIFIED BY 'KimSH0723@';
GRANT ALL PRIVILEGES ON jangssam.* TO 'jangssam'@'localhost';
```

### 2. 의존성 설치

```bash
cd webapp
npm install
```

### 3. 환경변수 설정

`.env.local` 파일 생성 (`.env.example` 참고):

```
OPENDART_API_KEY=your_key
GEMINI_API_KEY=your_key
DB_HOST=localhost
DB_USER=jangssam
DB_PASSWORD=KimSH0723@
DB_NAME=jangssam
```

### 4. 기업 데이터 DB 임포트 (최초 1회)

```bash
node scripts/import-corp.js
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## Vercel 배포

1. GitHub에 코드 푸시 (`.env.local`은 `.gitignore`에 포함되어 자동 제외)
2. Vercel에서 프로젝트 연결
3. 환경변수 설정 (`.env.example` 참고)
4. DB는 PlanetScale, Railway, Neon 등 클라우드 MySQL로 전환 후 `DB_HOST` 환경변수만 변경

## 주의사항

- 본 서비스는 참고 자료로만 사용하시기 바랍니다.
- 투자 결정은 반드시 전문가와 상담하세요.
- OpenDART API는 일일 20,000건 요청 제한이 있습니다.
