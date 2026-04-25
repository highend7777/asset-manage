import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Settings, FileUp, CheckCircle2, AlertCircle, Database, Info, Coins, Plus } from 'lucide-react'

const AdminSection = () => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [priceCount, setPriceCount] = useState(0)

  // Manual Entry States - Product
  const [pName, setPName] = useState('')
  const [pSymbol, setPSymbol] = useState('')
  const [pType, setPType] = useState('stock')
  const [pMarket, setPMarket] = useState('KR')

  // Manual Entry States - Price
  const [prSymbol, setPrSymbol] = useState('')
  const [prPrice, setPrPrice] = useState('')
  const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0])

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

  // Manual Add Handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pName || !pSymbol) return
    setLoading(true)
    const { error } = await supabase.from('products').upsert([{
      name: pName, symbol: pSymbol, type: pType, market: pMarket
    }], { onConflict: 'symbol,market' })
    
    if (error) setError(`종목 등록 실패: ${error.message}`)
    else {
      setStatus(`'${pName}' 종목이 등록되었습니다.`)
      setPName(''); setPSymbol('')
      fetchCounts()
    }
    setLoading(false)
  }

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prSymbol || !prPrice || !prDate) return
    setLoading(true)
    const { error } = await supabase.from('product_prices').upsert([{
      symbol: prSymbol, price: parseFloat(prPrice), price_date: prDate
    }], { onConflict: 'symbol,price_date' })

    if (error) setError(`가격 등록 실패: ${error.message}`)
    else {
      setStatus(`${prSymbol}의 ${prDate} 가격이 등록되었습니다.`)
      setPrPrice('')
      fetchCounts()
    }
    setLoading(false)
  }

  // CSV Import Handlers
  const handleProductImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError(null); setStatus('분석 중...')
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const products = lines.slice(1).map(line => {
          const [name, symbol, type, market] = line.split(',').map(item => item.trim())
          return { name, symbol, type, market }
        }).filter(p => p.symbol && p.name)
        const { error } = await supabase.from('products').upsert(products, { onConflict: 'symbol,market' })
        if (error) throw error
        setStatus(`${products.length}개의 종목을 등록했습니다.`)
        fetchCounts()
      } catch (err: any) { setError(`임포트 실패: ${err.message}`) }
      finally { setLoading(false); if (e.target) e.target.value = '' }
    }
    reader.readAsText(file)
  }

  const handlePriceImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError(null); setStatus('분석 중...')
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const prices = lines.slice(1).map(line => {
          const [symbol, price, price_date] = line.split(',').map(item => item.trim())
          return { symbol, price: parseFloat(price), price_date }
        }).filter(p => p.symbol && !isNaN(p.price) && p.price_date)
        const { error } = await supabase.from('product_prices').upsert(prices, { onConflict: 'symbol,price_date' })
        if (error) throw error
        setStatus(`${prices.length}개의 가격을 등록했습니다.`)
        fetchCounts()
      } catch (err: any) { setError(`임포트 실패: ${err.message}`) }
      finally { setLoading(false); if (e.target) e.target.value = '' }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header & Stats */}
      <div className="glass p-8 rounded-[2rem] border border-black/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Settings className="text-primary w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">상품 및 가격 데이터 관리</h2>
            <p className="text-slate-500 font-medium">개별 등록하거나 CSV 파일로 일괄 등록할 수 있습니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex justify-between items-center">
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">등록된 종목</span>
              <div className="text-3xl font-black text-primary">{productCount.toLocaleString()} <span className="text-sm font-normal text-slate-400">개</span></div>
            </div>
            <Database className="text-primary/20 w-12 h-12" />
          </div>
          <div className="bg-accent/5 p-6 rounded-2xl border border-accent/10 flex justify-between items-center">
            <div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">가격 데이터</span>
              <div className="text-3xl font-black text-accent">{priceCount.toLocaleString()} <span className="text-sm font-normal text-slate-400">건</span></div>
            </div>
            <Coins className="text-accent/20 w-12 h-12" />
          </div>
        </div>
      </div>

      {(status || error) && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 ${error ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
          {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-bold">{error || status}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section: Product Master */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-black/5 space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> 종목 정보 등록
            </h3>
            
            {/* Manual Form */}
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="종목명" value={pName} onChange={e => setPName(e.target.value)} className="col-span-2 bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              <input type="text" placeholder="심볼(코드)" value={pSymbol} onChange={e => setPSymbol(e.target.value)} className="bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              <select value={pType} onChange={e => setPType(e.target.value)} className="bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="stock">주식</option>
                <option value="etf">ETF</option>
                <option value="crypto">가상화폐</option>
              </select>
              <select value={pMarket} onChange={e => setPMarket(e.target.value)} className="bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="KR">한국(KR)</option>
                <option value="US">미국(US)</option>
              </select>
              <button type="submit" disabled={loading} className="bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> 등록
              </button>
            </form>

            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-black/5"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-black/5"></div>
            </div>

            {/* CSV Zone */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
              <FileUp className="w-6 h-6 text-slate-300 group-hover:text-primary mb-2" />
              <span className="text-xs font-bold text-slate-500">종목 CSV 업로드</span>
              <input type="file" className="hidden" accept=".csv" onChange={handleProductImport} disabled={loading} />
            </label>
          </div>
        </div>

        {/* Section: Price History */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-black/5 space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" /> 가격 데이터 등록
            </h3>

            {/* Manual Form */}
            <form onSubmit={handleAddPrice} className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="심볼(코드)" value={prSymbol} onChange={e => setPrSymbol(e.target.value)} className="bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none" />
              <input type="number" placeholder="가격" value={prPrice} onChange={e => setPrPrice(e.target.value)} className="bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none" />
              <input type="date" value={prDate} onChange={e => setPrDate(e.target.value)} className="bg-black/5 border border-black/5 rounded-xl px-4 py-3 text-sm outline-none" />
              <button type="submit" disabled={loading} className="bg-accent hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> 등록
              </button>
            </form>

            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-black/5"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-black/5"></div>
            </div>

            {/* CSV Zone */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-3xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group">
              <FileUp className="w-6 h-6 text-slate-300 group-hover:text-accent mb-2" />
              <span className="text-xs font-bold text-slate-500">가격 CSV 업로드</span>
              <input type="file" className="hidden" accept=".csv" onChange={handlePriceImport} disabled={loading} />
            </label>
          </div>
        </div>
      </div>

      {/* Guide Card */}
      <div className="glass p-8 rounded-[2rem] border border-black/5 bg-white/50 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Info className="w-4 h-4" /> 종목 CSV 양식 가이드
          </div>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[11px] leading-relaxed">
            name, symbol, type, market<br/>
            삼성전자, 005930, stock, KR<br/>
            Apple, AAPL, stock, US
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-accent font-bold text-sm">
            <Info className="w-4 h-4" /> 가격 CSV 양식 가이드
          </div>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[11px] leading-relaxed">
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
