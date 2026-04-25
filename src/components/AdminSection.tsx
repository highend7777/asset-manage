import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Settings, FileUp, CheckCircle2, AlertCircle, Database, Info, Coins } from 'lucide-react'

const AdminSection = () => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [priceCount, setPriceCount] = useState(0)

  useEffect(() => {
    fetchCounts()
  }, [])

  async function fetchCounts() {
    const [pRes, prRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('product_prices').select('*', { count: 'exact', head: true })
    ])
    if (!pRes.error) setProductCount(pRes.count || 0)
    if (!prRes.error) setPriceCount(prRes.count || 0)
  }

  const handleProductImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setStatus('종목 파일을 분석 중입니다...')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const products = lines.slice(1).map(line => {
          const [name, symbol, type, market] = line.split(',').map(item => item.trim())
          return { name, symbol, type, market }
        }).filter(p => p.symbol && p.name)

        const { error: upsertError } = await supabase.from('products').upsert(products, { onConflict: 'symbol,market' })
        if (upsertError) throw upsertError

        setStatus(`성공적으로 ${products.length}개의 종목을 등록했습니다.`)
        fetchCounts()
      } catch (err: any) {
        setError(`종목 임포트 실패: ${err.message}`)
      } finally {
        setLoading(false)
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handlePriceImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setStatus('가격 데이터를 분석 중입니다...')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const prices = lines.slice(1).map(line => {
          const [symbol, price, price_date] = line.split(',').map(item => item.trim())
          return { symbol, price: parseFloat(price), price_date }
        }).filter(p => p.symbol && !isNaN(p.price) && p.price_date)

        const { error: upsertError } = await supabase.from('product_prices').upsert(prices, { onConflict: 'symbol,price_date' })
        if (upsertError) throw upsertError

        setStatus(`성공적으로 ${prices.length}개의 가격 데이터를 등록했습니다.`)
        fetchCounts()
      } catch (err: any) {
        setError(`가격 임포트 실패: ${err.message}`)
      } finally {
        setLoading(false)
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass p-8 rounded-[2rem] border border-black/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Settings className="text-primary w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">데이터 통합 관리</h2>
            <p className="text-slate-500 font-medium">종목 정보와 일자별 가격 데이터를 일괄 등록합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-bold">등록된 종목</span>
              <Database className="text-primary w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-primary">{productCount.toLocaleString()} 개</div>
          </div>

          <div className="bg-accent/5 p-6 rounded-2xl border border-accent/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-bold">가격 데이터 포인트</span>
              <Coins className="text-accent w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-accent">{priceCount.toLocaleString()} 개</div>
          </div>
        </div>

        {status && !error && (
          <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl flex items-center gap-2 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">{status}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Import */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> 종목 마스터 업로드
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center">
                <FileUp className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                <p className="text-xs text-slate-700 font-bold">종목 CSV 업로드</p>
              </div>
              <input type="file" className="hidden" accept=".csv" onChange={handleProductImport} disabled={loading} />
            </label>
          </div>

          {/* Price Import */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Coins className="w-4 h-4 text-accent" /> 일자별 가격 업로드
            </h3>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-3xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center">
                <FileUp className="w-8 h-8 text-slate-300 group-hover:text-accent transition-colors mb-2" />
                <p className="text-xs text-slate-700 font-bold">가격 CSV 업로드</p>
              </div>
              <input type="file" className="hidden" accept=".csv" onChange={handlePriceImport} disabled={loading} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-black/5 bg-white/50">
          <div className="flex items-center gap-2 mb-3 text-slate-900">
            <Info className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-sm">종목 CSV 양식</h4>
          </div>
          <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px]">
            name, symbol, type, market<br/>
            삼성전자, 005930, stock, KR
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-black/5 bg-white/50">
          <div className="flex items-center gap-2 mb-3 text-slate-900">
            <Info className="w-4 h-4 text-accent" />
            <h4 className="font-bold text-sm">가격 CSV 양식</h4>
          </div>
          <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px]">
            symbol, price, price_date<br/>
            005930, 75200, 2026-04-25<br/>
            AAPL, 185.2, 2026-04-24
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSection
