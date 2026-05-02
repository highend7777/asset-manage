import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateActionPlan } from '../lib/gemini'
import { FileText, TrendingUp, Sparkles, RefreshCw, AlertCircle, Quote } from 'lucide-react'

const ReportSection = () => {
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLatestReport()
  }, [])

  async function fetchLatestReport() {
    const { data, error } = await supabase.from('reports').select('content').order('created_at', { ascending: false }).limit(1)
    if (!error && data.length > 0) {
      setReport(data[0].content)
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    
    try {
      // 1. 보유 종목 및 수량 계산
      const [transRes, prodRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('products').select('*')
      ])
      
      const transactions = transRes.data || []
      const products = prodRes.data || []
      
      if (transactions.length === 0) {
        setError('리포트를 생성할 거래 내역이 없습니다.')
        setLoading(false)
        return
      }

      const holdings: Record<string, number> = {}
      transactions.forEach(t => {
        holdings[t.product_id] = (holdings[t.product_id] || 0) + Number(t.amount)
      })

      const heldProducts = products.filter(p => (holdings[p.id] || 0) > 0)
      const assetsSummary = heldProducts.map(p => `${p.name}(${p.symbol}): ${holdings[p.id]}주`).join(', ')
      
      // 2. 뉴스 캐시 수집
      const { data: news } = await supabase.from('news_cache').select('*').limit(5)
      const newsSummary = news?.map(n => `[${n.asset_symbol}] ${n.title}`).join('\n') || '최근 주요 뉴스 없음'

      // 3. Gemini 호출
      const aiContent = await generateActionPlan(assetsSummary, newsSummary)
      
      // 4. DB 저장
      const { error: dbError } = await supabase.from('reports').insert([{ content: aiContent }])
      if (dbError) throw dbError

      setReport(aiContent)
    } catch (err: any) {
      setError('리포트 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 smart-card p-6 border-none bg-text-main text-white shadow-xl">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <TrendingUp className="text-primary w-5 h-5" /> AI 투자 리포트
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">AI Strategic Investment Guide</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="smart-btn-primary flex items-center gap-2 py-2.5 px-5 bg-primary text-text-main hover:bg-primary-dark border-none"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '분석 중...' : '전략 생성'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="smart-card p-8 bg-white min-h-[400px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles className="w-32 h-32 text-primary" />
        </div>
        
        {report ? (
          <div className="prose prose-slate max-w-none prose-headings:font-black prose-h2:text-xl prose-h2:text-text-main prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:font-medium prose-li:text-slate-600">
            <div className="flex items-center gap-2 text-primary mb-8 pb-4 border-b border-bg-point">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">AI Analysis Report</span>
              <span className="text-[10px] text-text-sub ml-auto">Updated: {new Date().toLocaleDateString()}</span>
            </div>
            
            <div className="whitespace-pre-wrap leading-relaxed">
              {report.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="mt-8 mb-4">{line.replace('## ', '')}</h2>
                if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-2">{line.replace('- ', '')}</li>
                return <p key={i} className="mb-2">{line}</p>
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-bg-point flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Quote className="text-primary w-5 h-5" />
              </div>
              <p className="text-xs text-text-sub font-bold italic leading-relaxed">
                이 리포트는 보유 종목과 최근 뉴스를 기반으로 Gemini AI가 생성한 제언입니다. 최종 판단의 책임은 투자자 본인에게 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20">
            <div className="bg-bg-point p-6 rounded-3xl mb-6">
              <Sparkles className="w-12 h-12 text-border-point" />
            </div>
            <h3 className="text-text-sub font-black text-center leading-relaxed">
              보유 이력과 뉴스를 분석하여<br/>당신만을 위한 투자 전략을 세워드립니다.
            </h3>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportSection
