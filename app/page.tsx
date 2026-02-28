import SearchBar from '@/components/SearchBar';

const POPULAR_COMPANIES = [
  { name: '삼성전자', code: '00126380' },
  { name: 'SK하이닉스', code: '00164779' },
  { name: '현대자동차', code: '00164742' },
  { name: 'NAVER', code: '00266961' },
  { name: '카카오', code: '00258801' },
  { name: 'LG전자', code: '00401731' },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            OpenDART + Gemini AI 실시간 분석
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            기업 재무를
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> 누구나 쉽게</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            복잡한 재무제표를 아름다운 차트로 보여주고,<br />
            AI가 초등학생도 이해할 수 있게 설명해드립니다.
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-2xl mb-8">
          <SearchBar />
        </div>

        {/* Popular Companies */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">인기 검색 기업</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {POPULAR_COMPANIES.map(corp => (
              <a
                key={corp.code}
                href={`/company/${corp.code}?name=${encodeURIComponent(corp.name)}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
              >
                {corp.name}
              </a>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full px-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
              title: '3,864개 기업 검색',
              desc: 'DART에 등록된 모든 공시 기업을 검색하세요.',
              color: 'from-blue-400 to-blue-600',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: '인터랙티브 차트',
              desc: '재무상태표·손익계산서를 한눈에 비교하세요.',
              color: 'from-indigo-400 to-indigo-600',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              ),
              title: 'AI 쉬운 설명',
              desc: 'Gemini AI가 재무 데이터를 쉽게 분석해드립니다.',
              color: 'from-purple-400 to-purple-600',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
