'use client';

import { useState, useRef, useEffect } from 'react';
import type { FinancialItem } from '@/app/api/financial/route';

interface Props {
  corpName: string;
  year: string;
  items: FinancialItem[];
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\n<ul>/g, '')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
    .replace(/\n/g, ' ')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<') || line.trim() === '') return line;
      return `<p>${line}</p>`;
    });
}

export default function AIAnalysisPanel({ corpName, year, items }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [analysis]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis('');
    setIsDone(false);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corpName, year, items }),
      });

      if (!response.ok) {
        let data: { error?: string } = {};
        try { data = await response.json(); } catch { /* ignore */ }
        throw new Error(data.error || 'AI 분석 중 오류가 발생했습니다.');
      }

      if (!response.body) throw new Error('스트리밍 응답이 없습니다.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAnalysis(prev => prev + chunk);
      }
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-purple-100 bg-white/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-800">AI 쉬운 설명</h2>
            <p className="text-xs text-gray-500">Gemini 2.0 Flash 분석</p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading || items.length === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            isLoading || items.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isDone ? '다시 분석' : 'AI 분석 시작'}
            </>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div ref={contentRef} className="min-h-[200px] max-h-[600px] overflow-y-auto px-6 py-5">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!analysis && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <p className="font-medium text-gray-500">AI 분석 시작 버튼을 눌러주세요</p>
            <p className="text-sm mt-1">재무 데이터를 누구나 이해하기 쉽게 설명해 드립니다</p>
          </div>
        )}

        {isLoading && !analysis && (
          <div className="flex flex-col items-center justify-center py-12 text-purple-500">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm font-medium">Gemini AI가 재무 데이터를 분석하고 있습니다...</p>
          </div>
        )}

        {analysis && (
          <div className="ai-content">
            <div
              className="max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}
            />
            {isLoading && (
              <span className="inline-block w-0.5 h-5 bg-purple-500 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>

      {isDone && (
        <div className="px-6 py-3 bg-white/40 border-t border-purple-100 text-xs text-gray-400 text-center">
          본 분석은 AI가 생성한 참고 자료입니다. 투자 결정 시 반드시 전문가와 상담하세요.
        </div>
      )}
    </div>
  );
}
