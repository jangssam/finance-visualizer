import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FinancialItem } from '../financial/route';

function formatAmount(amount: string): string {
  if (!amount) return '정보 없음';
  const num = parseInt(amount.replace(/,/g, ''));
  if (isNaN(num)) return amount;
  const trillion = Math.abs(num) / 1_000_000_000_000;
  const billion = Math.abs(num) / 100_000_000;
  if (Math.abs(trillion) >= 1) {
    return `${(num < 0 ? '-' : '')}${trillion.toFixed(1)}조원`;
  }
  return `${(num < 0 ? '-' : '')}${billion.toFixed(0)}억원`;
}

function buildPrompt(corpName: string, year: string, items: FinancialItem[]): string {
  const cfsItems = items.filter(i => i.fs_div === 'CFS');
  const ofsItems = items.filter(i => i.fs_div === 'OFS');
  const displayItems = cfsItems.length > 0 ? cfsItems : ofsItems;
  const fsType = cfsItems.length > 0 ? '연결재무제표' : '재무제표';

  const bsItems = displayItems.filter(i => i.sj_div === 'BS');
  const isItems = displayItems.filter(i => i.sj_div === 'IS');

  const getAmount = (accountNm: string): string => {
    const item = displayItems.find(i => i.account_nm === accountNm);
    return item ? formatAmount(item.thstrm_amount) : '정보 없음';
  };
  const getPrevAmount = (accountNm: string): string => {
    const item = displayItems.find(i => i.account_nm === accountNm);
    return item ? formatAmount(item.frmtrm_amount) : '정보 없음';
  };

  const financialSummary = `
[${corpName} ${year}년 ${fsType} 주요 계정]

■ 재무상태표 (${year}년 말 기준)
- 자산총계: ${getAmount('자산총계')} (전년: ${getPrevAmount('자산총계')})
- 유동자산: ${getAmount('유동자산')} (전년: ${getPrevAmount('유동자산')})
- 비유동자산: ${getAmount('비유동자산')} (전년: ${getPrevAmount('비유동자산')})
- 부채총계: ${getAmount('부채총계')} (전년: ${getPrevAmount('부채총계')})
- 유동부채: ${getAmount('유동부채')} (전년: ${getPrevAmount('유동부채')})
- 자본총계: ${getAmount('자본총계')} (전년: ${getPrevAmount('자본총계')})
- 이익잉여금: ${getAmount('이익잉여금')} (전년: ${getPrevAmount('이익잉여금')})

■ 손익계산서 (${year}년)
- 매출액: ${getAmount('매출액')} (전년: ${getPrevAmount('매출액')})
- 영업이익: ${getAmount('영업이익')} (전년: ${getPrevAmount('영업이익')})
- 법인세차감전 순이익: ${getAmount('법인세차감전 순이익')} (전년: ${getPrevAmount('법인세차감전 순이익')})
- 당기순이익(손실): ${getAmount('당기순이익(손실)')} (전년: ${getPrevAmount('당기순이익(손실)')})
`;

  return `당신은 재무 데이터를 쉽게 설명하는 전문 해설가입니다.
아래는 ${corpName}의 ${year}년 재무 데이터입니다.

${financialSummary}

다음 형식으로 누구나 이해할 수 있는 쉬운 한국어로 분석해주세요:

## 📊 한눈에 보는 ${corpName} ${year}년 재무 현황

### 💼 회사 규모와 재무 건전성
(자산, 부채, 자본 규모를 일반인이 이해하기 쉽게 설명)

### 📈 이번 해 실적은 어땠나요?
(매출, 영업이익, 순이익 등을 전년 대비로 설명)

### ✅ 긍정적인 포인트
(잘 하고 있는 부분 2-3가지)

### ⚠️ 주의해야 할 포인트
(우려되거나 개선이 필요한 부분 1-2가지, 없으면 '특이사항 없음')

### 💡 쉽게 말하면
(초등학생도 이해할 수 있는 한 줄 요약)

전문용어 사용을 최소화하고, 숫자는 "OO조원", "OO억원" 형식으로 표현해주세요.`;
}

export async function POST(request: NextRequest) {
  if (!config.gemini.apiKey) {
    return NextResponse.json(
      { error: 'Gemini API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  let body: { corpName: string; year: string; items: FinancialItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { corpName, year, items } = body;

  if (!corpName || !year || !items || items.length === 0) {
    return NextResponse.json(
      { error: '회사명, 연도, 재무 데이터가 필요합니다.' },
      { status: 400 }
    );
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const prompt = buildPrompt(corpName, year, items);

  // gemini-2.0-flash → gemini-2.5-flash → gemini-1.5-flash 순서로 폴백
  const modelNames = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;
  let streamResult: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>['generateContentStream']>> | null = null;
  let chosenModel = '';

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // generateContentStream 호출을 스트림 외부에서 먼저 시도
      streamResult = await model.generateContentStream(prompt);
      chosenModel = modelName;
      break;
    } catch (err) {
      const error = err as Error & { status?: number };
      lastError = error;
      const isRetryable = error.status === 429
        || error.message?.includes('not found')
        || error.message?.includes('quota')
        || error.message?.includes('429');
      if (isRetryable) {
        continue;
      }
      // 재시도 불가 오류는 바로 반환
      return NextResponse.json(
        { error: `AI 분석 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }
  }

  if (!streamResult) {
    const errMsg = lastError?.message || '';
    const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Too Many Requests');
    return NextResponse.json(
      {
        error: isQuota
          ? 'AI 서비스 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요. (약 1분 후 재시도)'
          : 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: isQuota ? 429 : 500 }
    );
  }

  const encoder = new TextEncoder();
  const capturedStream = streamResult;
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of capturedStream.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Gemini-Model': chosenModel,
    },
  });
}
