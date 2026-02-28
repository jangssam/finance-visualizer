import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface Corporation extends RowDataPacket {
  corp_code: string;
  corp_name: string;
  corp_eng_name: string;
  stock_code: string;
  modify_date: string;
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
    const results = await query<Corporation>(
      `SELECT corp_code, corp_name, corp_eng_name, stock_code
       FROM corporations
       WHERE corp_name LIKE ? OR corp_eng_name LIKE ?
       ORDER BY 
         CASE WHEN corp_name = ? THEN 0
              WHEN corp_name LIKE ? THEN 1
              ELSE 2 END,
         corp_name ASC
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, q, `${q}%`]
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'DB 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
