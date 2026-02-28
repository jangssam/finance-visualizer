import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Corporation {
  corp_code: string;
  corp_name: string;
  corp_eng_name: string;
  stock_code: string;
  modify_date: string;
}

let corpsCache: Corporation[] | null = null;

function getCorps(): Corporation[] {
  if (corpsCache) return corpsCache;
  const filePath = join(process.cwd(), 'data', 'corps.json');
  const data = readFileSync(filePath, 'utf-8');
  corpsCache = JSON.parse(data) as Corporation[];
  return corpsCache;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  if (q.length > 50) {
    return NextResponse.json({ error: '검색어가 너무 깁니다.' }, { status: 400 });
  }

  try {
    const corps = getCorps();
    const lower = q.toLowerCase();

    const matched = corps.filter(c =>
      c.corp_name.toLowerCase().includes(lower) ||
      c.corp_eng_name.toLowerCase().includes(lower)
    );

    matched.sort((a, b) => {
      const aName = a.corp_name.toLowerCase();
      const bName = b.corp_name.toLowerCase();
      if (aName === lower) return -1;
      if (bName === lower) return 1;
      if (aName.startsWith(lower) && !bName.startsWith(lower)) return -1;
      if (!aName.startsWith(lower) && bName.startsWith(lower)) return 1;
      return aName.localeCompare(bName);
    });

    const results = matched.slice(0, 20).map(({ corp_code, corp_name, corp_eng_name, stock_code }) => ({
      corp_code, corp_name, corp_eng_name, stock_code,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
