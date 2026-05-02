import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { NewsItem } from '../lib/supabase'
import { analyzeNews } from '../lib/gemini'
import { Newspaper, RefreshCw, AlertCircle, ExternalLink, Flame, Sparkles } from 'lucide-react'

const NewsSection = () => {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [])

  async function fetchNews() {
    const { data: nData } = await supabase.from('news_cache').select('*').order('created_at', { ascending: false }).limit(10)
    setNews(nData || [])
  }

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    
    try {
      // 1. 보유 종목 리스트 추출
      const [transRes, prodRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('products').select('*')
      ])
      
      const transactions = transRes.data || []
      const products = prodRes.data || []

      const holdings: Record<string, number> = {}
      transactions.forEach(t => {
        holdings[t.product_id] = (holdings[t.product_id] || 0) + Number(t.amount)
      })

      const heldSymbols = products
        .filter(p => (holdings[p.id] || 0) > 0)
        .map(p => `${p.name}(${p.symbol})`)

      if (heldSymbols.length === 0) {
        setError('분석할 보유 종목이 없습니다. 구매 이력을 먼저 등록해주세요.')
        setLoading(false)
        return
      }

      // 2. 뉴스 분석 (Mock 데이터 활용)
      const mockNewsRaw = `
        1. ${heldSymbols[0] || '삼성전자'}, 기술 혁신으로 시장 점유율 확대 전략 발표.
        2. 미국 증시, 주요 ETF 자금 유입 지속되며 상승세 유지.
        3. 글로벌 원자재 및 에너지 가격 변동성 확대.
      `
      
      const analyzedNews = await analyzeNews(heldSymbols, mockNewsRaw)
      
      if (analyzedNews && Array.isArray(analyzedNews)) {
        // 기존 데이터 삭제 (유저 구분 없이 전체 삭제 트릭 사용)
        await supabase.from('news_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        
        const insertData = analyzedNews.map(item => ({
          asset_symbol: item.asset_symbol,
          title: item.title,
          summary: item.summary,
          relevance_score: item.relevance_score,
          importance: item.importance,
          source_url: item.source_url
        }))
        
        await supabase.from('news_cache').insert(insertData)
        fetchNews()
      }
    } catch (err: any) {
      setError('AI 뉴스 분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 smart-card p-6 border-none bg-white shadow-xl shadow-slate-200/50">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-text-main">
            <Sparkles className="text-primary w-5 h-5" /> 맞춤형 뉴스 브리핑
          </h2>
          <p className="text-[10px] text-text-sub font-bold mt-1 uppercase tracking-wider">AI Tailored News Feed</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="smart-btn-primary flex items-center gap-2 py-2.5 px-5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'AI 분석 중...' : '뉴스 업데이트'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="smart-card p-6 group hover:border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <span className="bg-primary/10 text-primary-dark text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest">
                {item.asset_symbol}
              </span>
              <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                item.importance === '매우 중요' ? 'bg-rose-500 text-white' : 
                item.importance === '중요' ? 'bg-primary text-text-main' : 'bg-bg-point text-text-sub'
              }`}>
                {item.importance}
              </div>
            </div>
            
            <h3 className="font-black text-lg mb-3 text-text-main leading-tight group-hover:text-primary-dark transition-colors">{item.title}</h3>
            <div className="bg-bg-point p-4 rounded-2xl mb-4 border border-border-point">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.summary}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black text-text-sub uppercase tracking-tighter">Relevance {item.relevance_score}/10</span>
              </div>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary-dark hover:underline font-black"
              >
                원문 읽기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
        
        {news.length === 0 && !loading && (
          <div className="py-20 text-center smart-card bg-bg-point/50 border-dashed border-2 border-border-point">
            <Newspaper className="w-12 h-12 text-border-point mx-auto mb-4" />
            <p className="text-text-sub font-bold">보유 종목에 대한 분석 뉴스가 없습니다.<br/>업데이트 버튼을 눌러보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsSection
