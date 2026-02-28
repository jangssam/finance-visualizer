import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export interface FinancialItem {
  rcept_no: string;
  reprt_code: string;
  bsns_year: string;
  corp_code: string;
  stock_code: string;
  fs_div: string;
  fs_nm: string;
  sj_div: string;
  sj_nm: string;
  account_nm: string;
  thstrm_nm: string;
  thstrm_dt: string;
  thstrm_amount: string;
  thstrm_add_amount?: string;
  frmtrm_nm: string;
  frmtrm_dt: string;
  frmtrm_amount: string;
  frmtrm_add_amount?: string;
  bfefrmtrm_nm?: string;
  bfefrmtrm_dt?: string;
  bfefrmtrm_amount?: string;
  ord: string;
  currency: string;
}

export interface FinancialResponse {
  status: string;
  message: string;
  list?: FinancialItem[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const corp_code = searchParams.get('corp_code');
  const bsns_year = searchParams.get('year');
  const reprt_code = searchParams.get('reprt_code') || '11011';

  if (!corp_code || !bsns_year) {
    return NextResponse.json(
      { error: 'corp_code와 year 파라미터가 필요합니다.' },
      { status: 400 }
    );
  }

  if (!config.opendart.apiKey) {
    return NextResponse.json(
      { error: 'OpenDART API 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const year = parseInt(bsns_year);
  if (isNaN(year) || year < 2015 || year > new Date().getFullYear()) {
    return NextResponse.json(
      { error: '사업연도는 2015년 이후여야 합니다.' },
      { status: 400 }
    );
  }

  try {
    const url = new URL(`${config.opendart.baseUrl}/fnlttSinglAcnt.json`);
    url.searchParams.set('crtfc_key', config.opendart.apiKey);
    url.searchParams.set('corp_code', corp_code);
    url.searchParams.set('bsns_year', bsns_year);
    url.searchParams.set('reprt_code', reprt_code);

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenDART API 오류: ${response.status}`);
    }

    const data: FinancialResponse = await response.json();

    if (data.status === '013') {
      return NextResponse.json({
        status: '013',
        message: '조회된 데이터가 없습니다. 다른 연도나 보고서 종류를 선택해주세요.',
        list: [],
      });
    }

    if (data.status !== '000') {
      return NextResponse.json(
        { error: `OpenDART 오류: ${data.message} (코드: ${data.status})` },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Financial API error:', error);
    return NextResponse.json(
      { error: '재무 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
