import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Asset, NewsItem } from '../lib/supabase'
import { analyzeNews } from '../lib/gemini'
import { Newspaper, RefreshCw, AlertCircle, ExternalLink, Flame } from 'lucide-react'

const NewsSection = () => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: aData } = await supabase.from('assets').select('*')
    setAssets(aData || [])
    
    const { data: nData } = await supabase.from('news_cache').select('*').order('created_at', { ascending: false })
    setNews(nData || [])
  }

  async function handleAnalyze() {
    if (assets.length === 0) {
      setError('분석할 자산이 없습니다. 먼저 자산을 등록해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const assetNames = assets.map(a => a.name)
      // 실제 뉴스 API 연동 전 Mock 데이터 활용
      const mockNewsRaw = `
        1. 삼성전자, 차세대 반도체 공정 양산 성공 발표. 파운드리 시장 점유율 확대 기대. (https://example.com/news1)
        2. 미국 연준, 금리 동결 시사. 국채 수익률 하락하며 기술주 반등. (https://example.com/news2)
        3. 비트코인, 현물 ETF 승인 이후 자금 유입 가속화. $65,000 돌파. (https://example.com/news3)
        4. 글로벌 원자재 시장 불안정. 금값 사상 최고치 경신. (https://example.com/news4)
      `
      
      const analyzedNews = await analyzeNews(assetNames, mockNewsRaw)
      
      // 결과 저장
      for (const item of analyzedNews) {
        await supabase.from('news_cache').upsert([{
          asset_symbol: item.asset_symbol,
          title: item.title,
          summary: item.summary,
          relevance_score: item.relevance_score,
          importance: item.importance,
          source_url: item.source_url
        }])
      }
      
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex justify-between items-center bg-black/5 p-6 rounded-2xl border border-black/5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Newspaper className="text-primary" /> AI 맞춤형 투자 정보
          </h2>
          <p className="text-sm text-slate-500 mt-1">보유 자산과 연관된 뉴스만 Gemini가 선별해 드립니다.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 bg-primary hover:bg-blue-600 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '분석 중...' : '새로고침'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger/20 border border-danger/30 text-danger rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
          {error.includes('네트워크') && (
            <button onClick={handleAnalyze} className="ml-auto underline font-bold">재시도</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => (
          <div key={item.id} className="glass p-6 rounded-2xl relative group overflow-hidden border border-black/5">
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl ${
              item.importance === '매우 중요' ? 'bg-danger text-white' : 
              item.importance === '중요' ? 'bg-accent text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {item.importance}
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {item.asset_symbol}
              </span>
              <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            
            <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-primary transition-colors">{item.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2 mb-4">{item.summary}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-orange-600">연관도 {item.relevance_score}/10</span>
              </div>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-bold"
              >
                원문보기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
        {news.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center glass rounded-2xl border-2 border-dashed border-black/5">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">새로고침 버튼을 눌러 맞춤 뉴스를 받아보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsSection
