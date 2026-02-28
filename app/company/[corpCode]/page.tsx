'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import type { FinancialItem } from '@/app/api/financial/route';

const FinancialCharts = dynamic(() => import('@/components/FinancialCharts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const REPORT_TYPES = [
  { code: '11011', label: '사업보고서 (연간)' },
  { code: '11012', label: '반기보고서' },
  { code: '11013', label: '1분기보고서' },
  { code: '11014', label: '3분기보고서' },
];

const currentYear = new Date().getFullYear();
// 사업보고서는 보통 3~4월에 공시되므로, 3월 이전이면 전전년도를 기본으로 사용
const now = new Date();
const defaultYear = now.getMonth() < 3 ? currentYear - 2 : currentYear - 1;
const YEARS = Array.from({ length: defaultYear - 2013 }, (_, i) => defaultYear - i);

function CompanyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const corpCode = params.corpCode as string;
  const corpName = searchParams.get('name') || corpCode;

  const [year, setYear] = useState(String(defaultYear));
  const [reprtCode, setReprtCode] = useState('11011');
  const [fsDiv, setFsDiv] = useState<'CFS' | 'OFS'>('CFS');
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasData, setHasData] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setItems([]);
    setHasData(false);

    try {
      const url = `/api/financial?corp_code=${corpCode}&year=${year}&reprt_code=${reprtCode}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }

      if (data.status === '013' || !data.list || data.list.length === 0) {
        setError('조회된 데이터가 없습니다. 다른 연도나 보고서 종류를 선택해주세요.');
        return;
      }

      const sortedItems = [...data.list].sort((a: FinancialItem, b: FinancialItem) => {
        return parseInt(a.ord) - parseInt(b.ord);
      });

      setItems(sortedItems);
      setHasData(true);

      // 연결재무제표 없으면 개별재무제표로 자동 전환
      const hasCFS = sortedItems.some((i: FinancialItem) => i.fs_div === 'CFS');
      if (!hasCFS) setFsDiv('OFS');
      else setFsDiv('CFS');

    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [corpCode, year, reprtCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasCFS = items.some(i => i.fs_div === 'CFS');
  const hasOFS = items.some(i => i.fs_div === 'OFS');
  const currentItems = items.filter(i => i.fs_div === fsDiv);
  const reportInfo = items.find(i => i.thstrm_dt);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{corpName}</span>
      </nav>

      {/* Company Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {corpName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{corpName}</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                고유번호: <span className="font-mono">{corpCode}</span>
                {reportInfo?.stock_code && (
                  <> · 종목코드: <span className="font-mono">{reportInfo.stock_code}</span></>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* 사업연도 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">사업연도</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-[120px]"
            >
              {YEARS.map(y => (
                <option key={y} value={String(y)}>{y}년</option>
              ))}
            </select>
          </div>

          {/* 보고서 종류 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">보고서 종류</label>
            <select
              value={reprtCode}
              onChange={e => setReprtCode(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-[180px]"
            >
              {REPORT_TYPES.map(r => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* 재무제표 유형 */}
          {hasData && (hasCFS || hasOFS) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">재무제표 유형</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {hasCFS && (
                  <button
                    onClick={() => setFsDiv('CFS')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                      fsDiv === 'CFS'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    연결
                  </button>
                )}
                {hasOFS && (
                  <button
                    onClick={() => setFsDiv('OFS')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                      fsDiv === 'OFS'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    개별
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                조회 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                재조회
              </>
            )}
          </button>
        </div>

        {reportInfo && hasData && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              📅 기간:{' '}
              <span className="font-medium text-gray-700">{reportInfo.thstrm_dt}</span>
            </span>
            <span>
              📋 보고서:{' '}
              <span className="font-mono text-gray-700">{reportInfo.rcept_no}</span>
            </span>
            <span>
              💱 통화:{' '}
              <span className="font-medium text-gray-700">{reportInfo.currency}</span>
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" style={{ borderWidth: '3px' }} />
          <p className="font-medium">OpenDART에서 재무 데이터를 가져오는 중...</p>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold text-yellow-800">{error}</p>
          <p className="text-sm text-yellow-600 mt-1">다른 연도나 보고서 종류를 선택하거나, 잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {/* Charts and Analysis */}
      {!isLoading && hasData && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '총자산', account: '자산총계', color: 'blue' },
              { label: '총부채', account: '부채총계', color: 'red' },
              { label: '자본총계', account: '자본총계', color: 'green' },
              { label: '매출액', account: '매출액', color: 'indigo' },
            ].map(({ label, account, color }) => {
              const item = currentItems.find(i => i.account_nm === account);
              const curr = item ? parseInt(item.thstrm_amount.replace(/,/g, '')) : 0;
              const prev = item ? parseInt(item.frmtrm_amount.replace(/,/g, '')) : 0;
              const change = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
              const colorMap: Record<string, string> = {
                blue: 'from-blue-500 to-blue-600',
                red: 'from-red-400 to-red-500',
                green: 'from-emerald-500 to-emerald-600',
                indigo: 'from-indigo-500 to-indigo-600',
              };
              return (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${colorMap[color]} mb-3`}>
                    {label}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {item ? formatAmountShort(item.thstrm_amount) : '-'}
                  </div>
                  {item && prev !== 0 && (
                    <div className={`text-sm mt-1 font-medium ${change >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% (전기대비)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <FinancialCharts items={items} fsDiv={fsDiv} />

          {/* AI Analysis */}
          <AIAnalysisPanel corpName={corpName} year={year} items={currentItems} />
        </div>
      )}
    </div>
  );
}

export default function CompanyPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
      </div>
    }>
      <CompanyPage />
    </Suspense>
  );
}

function formatAmountShort(amount: string): string {
  if (!amount) return '-';
  const num = parseInt(amount.replace(/,/g, ''));
  if (isNaN(num)) return '-';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(1)}조`;
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(0)}억`;
  return `${sign}${(abs / 10_000).toFixed(0)}만`;
}
