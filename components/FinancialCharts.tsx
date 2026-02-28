'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ComposedChart, Area,
  ReferenceLine,
} from 'recharts';
import type { FinancialItem } from '@/app/api/financial/route';

interface Props {
  items: FinancialItem[];
  fsDiv: 'CFS' | 'OFS';
}

function parseAmount(amount: string | undefined): number {
  if (!amount) return 0;
  const cleaned = amount.replace(/,/g, '');
  const num = parseInt(cleaned);
  return isNaN(num) ? 0 : num;
}

function toTrillion(amount: number): number {
  return Math.round((amount / 1_000_000_000_000) * 10) / 10;
}

function toHundredMillion(amount: number): number {
  return Math.round(amount / 100_000_000);
}

const formatTrillionLabel = (value: number) => `${value}조`;
const formatHundredMillionLabel = (value: number) => `${value.toLocaleString()}억`;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function TrillionTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: {p.value.toFixed(1)}조원
        </p>
      ))}
    </div>
  );
}

function HundredMillionTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: {p.value.toLocaleString()}억원
        </p>
      ))}
    </div>
  );
}

export default function FinancialCharts({ items, fsDiv }: Props) {
  const filtered = items.filter(i => i.fs_div === fsDiv);
  const bs = filtered.filter(i => i.sj_div === 'BS');
  const is = filtered.filter(i => i.sj_div === 'IS');

  const getItem = (accountNm: string) => filtered.find(i => i.account_nm === accountNm);

  // 재무상태표 차트 데이터 (3개년)
  const buildBsData = () => {
    const accounts = ['자산총계', '부채총계', '자본총계'];
    const item = bs.find(i => i.account_nm === '자산총계');
    if (!item) return [];

    const periods = [
      { key: 'bfefrmtrm', label: item.bfefrmtrm_nm?.replace(' 기', '기') || '전전기' },
      { key: 'frmtrm', label: item.frmtrm_nm?.replace(' 기', '기') || '전기' },
      { key: 'thstrm', label: item.thstrm_nm?.replace(' 기', '기') || '당기' },
    ].filter(p => p.key !== 'bfefrmtrm' || item.bfefrmtrm_amount);

    return periods.map(period => {
      const result: Record<string, string | number> = { period: period.label };
      accounts.forEach(acc => {
        const row = bs.find(i => i.account_nm === acc);
        if (!row) return;
        const amountKey = `${period.key}_amount` as keyof FinancialItem;
        result[acc] = toTrillion(parseAmount(row[amountKey] as string));
      });
      return result;
    });
  };

  // 유동/비유동 자산 구성
  const buildAssetComposition = () => {
    const item = bs.find(i => i.account_nm === '자산총계');
    if (!item) return [];
    const current = bs.find(i => i.account_nm === '유동자산');
    const nonCurrent = bs.find(i => i.account_nm === '비유동자산');

    const periods = [
      { key: 'bfefrmtrm', label: item.bfefrmtrm_nm || '전전기' },
      { key: 'frmtrm', label: item.frmtrm_nm || '전기' },
      { key: 'thstrm', label: item.thstrm_nm || '당기' },
    ].filter(p => p.key !== 'bfefrmtrm' || item.bfefrmtrm_amount);

    return periods.map(p => ({
      period: p.label,
      유동자산: toTrillion(parseAmount(current?.[`${p.key}_amount` as keyof FinancialItem] as string)),
      비유동자산: toTrillion(parseAmount(nonCurrent?.[`${p.key}_amount` as keyof FinancialItem] as string)),
    }));
  };

  // 손익계산서 차트 데이터
  const buildIsData = () => {
    const accounts = ['매출액', '영업이익', '당기순이익(손실)'];
    const item = is.find(i => i.account_nm === '매출액');
    if (!item) return [];

    const periods = [
      { key: 'bfefrmtrm', label: item.bfefrmtrm_nm || '전전기' },
      { key: 'frmtrm', label: item.frmtrm_nm || '전기' },
      { key: 'thstrm', label: item.thstrm_nm || '당기' },
    ].filter(p => p.key !== 'bfefrmtrm' || item.bfefrmtrm_amount);

    return periods.map(period => {
      const result: Record<string, string | number> = { period: period.label };
      accounts.forEach(acc => {
        const row = is.find(i => i.account_nm === acc);
        if (!row) return;
        const amountKey = `${period.key}_amount` as keyof FinancialItem;
        const val = toHundredMillion(parseAmount(row[amountKey] as string));
        result[acc === '당기순이익(손실)' ? '당기순이익' : acc] = val;
      });
      return result;
    });
  };

  // 수익성 지표
  const buildProfitabilityData = () => {
    const revenue = is.find(i => i.account_nm === '매출액');
    const opProfit = is.find(i => i.account_nm === '영업이익');
    const netProfit = is.find(i => i.account_nm === '당기순이익(손실)');
    if (!revenue) return [];

    const periods = [
      { key: 'bfefrmtrm', label: revenue.bfefrmtrm_nm || '전전기' },
      { key: 'frmtrm', label: revenue.frmtrm_nm || '전기' },
      { key: 'thstrm', label: revenue.thstrm_nm || '당기' },
    ].filter(p => p.key !== 'bfefrmtrm' || revenue.bfefrmtrm_amount);

    return periods.map(p => {
      const amountKey = `${p.key}_amount` as keyof FinancialItem;
      const rev = parseAmount(revenue[amountKey] as string);
      const op = parseAmount(opProfit?.[amountKey] as string ?? '0');
      const net = parseAmount(netProfit?.[amountKey] as string ?? '0');
      return {
        period: p.label,
        영업이익률: rev > 0 ? Math.round((op / rev) * 1000) / 10 : 0,
        순이익률: rev > 0 ? Math.round((net / rev) * 1000) / 10 : 0,
      };
    });
  };

  const bsData = buildBsData();
  const assetData = buildAssetComposition();
  const isData = buildIsData();
  const profitData = buildProfitabilityData();

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>선택한 재무제표 유형에 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 재무상태표 - 자산/부채/자본 */}
      {bsData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">자산 · 부채 · 자본 추이</h3>
          <p className="text-sm text-gray-500 mb-6">단위: 조원</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bsData} barGap={4} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={formatTrillionLabel} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<TrillionTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="자산총계" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="부채총계" fill="#f87171" radius={[6, 6, 0, 0]} />
              <Bar dataKey="자본총계" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 유동/비유동 자산 구성 */}
      {assetData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">유동자산 vs 비유동자산</h3>
          <p className="text-sm text-gray-500 mb-6">단위: 조원</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assetData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={formatTrillionLabel} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<TrillionTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="유동자산" fill="#60a5fa" radius={[6, 6, 0, 0]} stackId="a" />
              <Bar dataKey="비유동자산" fill="#818cf8" radius={[0, 0, 6, 6]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 손익계산서 */}
      {isData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">매출 · 영업이익 · 순이익 추이</h3>
          <p className="text-sm text-gray-500 mb-6">단위: 억원</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={isData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={formatHundredMillionLabel} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip content={<HundredMillionTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <ReferenceLine y={0} stroke="#d1d5db" />
              <Bar dataKey="매출액" fill="#bfdbfe" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="영업이익" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} />
              <Line type="monotone" dataKey="당기순이익" stroke="#7c3aed" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5, fill: '#7c3aed' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 수익성 지표 */}
      {profitData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">수익성 지표 (이익률)</h3>
          <p className="text-sm text-gray-500 mb-6">단위: %</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                formatter={(value) => [`${value}%`]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
              <Legend iconType="circle" iconSize={8} />
              <ReferenceLine y={0} stroke="#d1d5db" />
              <Line type="monotone" dataKey="영업이익률" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
              <Line type="monotone" dataKey="순이익률" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 주요 계정 표 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">주요 계정 상세</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="text-left py-3 px-3 font-semibold text-gray-600 w-32">구분</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 w-28">계정명</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">전전기</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">전기</th>
                <th className="text-right py-3 px-3 font-semibold text-blue-600">당기</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">증감률</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const curr = parseAmount(item.thstrm_amount);
                const prev = parseAmount(item.frmtrm_amount);
                const change = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
                return (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 text-xs text-gray-500">{item.sj_nm}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-700">{item.account_nm}</td>
                    <td className="py-2.5 px-3 text-right text-gray-500 font-mono text-xs">
                      {item.bfefrmtrm_amount ? formatAmount(item.bfefrmtrm_amount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600 font-mono text-xs">
                      {formatAmount(item.frmtrm_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-800 font-mono text-xs">
                      {formatAmount(item.thstrm_amount)}
                    </td>
                    <td className={`py-2.5 px-3 text-right text-xs font-medium ${
                      change > 0 ? 'text-blue-600' : change < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {prev !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatAmount(amount: string): string {
  if (!amount) return '-';
  const num = parseInt(amount.replace(/,/g, ''));
  if (isNaN(num)) return amount;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(0)}억`;
  }
  return `${sign}${(abs / 10_000).toFixed(0)}만`;
}
