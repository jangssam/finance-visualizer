import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '재무 분석 대시보드 | 누구나 쉽게 보는 기업 재무',
  description: '기업의 재무 데이터를 시각화하고 AI가 쉽게 분석해드립니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900 text-lg">재무 분석 대시보드</span>
              </a>
              <span className="text-sm text-gray-500 hidden sm:block">OpenDART + Gemini AI</span>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-gray-200 bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
            <p>본 서비스는 금융감독원 OpenDART 공시 데이터를 기반으로 합니다.</p>
            <p className="mt-1">투자 결정에 참고 자료로만 사용하시기 바랍니다.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
