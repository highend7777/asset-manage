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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header & Stats */}
      <div className="kb-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary/20 p-2.5 rounded-2xl">
            <Settings className="text-primary w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">상품 및 가격 데이터 관리</h2>
            <p className="text-slate-400 text-xs font-bold">KB Premium Data Management System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Master Products</span>
              <div className="text-2xl font-black text-slate-800">{productCount.toLocaleString()} <span className="text-xs font-bold text-slate-400">Items</span></div>
            </div>
            <Database className="text-primary/20 w-10 h-10" />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Price History</span>
              <div className="text-2xl font-black text-slate-800">{priceCount.toLocaleString()} <span className="text-xs font-bold text-slate-400">Points</span></div>
            </div>
            <Coins className="text-slate-200 w-10 h-10" />
          </div>
        </div>
      </div>

      {(status || error) && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span className="text-xs font-black">{error || status}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Product Master */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> 종목 정보 등록
          </h3>
          
          <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="종목명" value={pName} onChange={e => setPName(e.target.value)} className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
            <input type="text" placeholder="심볼(코드)" value={pSymbol} onChange={e => setPSymbol(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
            <select value={pType} onChange={e => setPType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none">
              <option value="stock">주식</option>
              <option value="etf">ETF</option>
              <option value="crypto">가상화폐</option>
            </select>
            <select value={pMarket} onChange={e => setPMarket(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none">
              <option value="KR">한국(KR)</option>
              <option value="US">미국(US)</option>
            </select>
            <button type="submit" disabled={loading} className="col-span-2 bg-primary hover:bg-amber-400 text-slate-900 rounded-xl font-black text-xs py-2.5 transition-all flex items-center justify-center gap-1 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> 종목 추가
            </button>
          </form>

          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase">CSV Upload</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-100 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
            <FileUp className="w-5 h-5 text-slate-200 group-hover:text-primary mb-1.5" />
            <span className="text-[10px] font-black text-slate-400">파일 선택</span>
            <input type="file" className="hidden" accept=".csv" onChange={handleProductImport} disabled={loading} />
          </label>
        </div>

        {/* Section: Price History */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-300" /> 가격 데이터 등록
          </h3>

          <form onSubmit={handleAddPrice} className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="심볼(코드)" value={prSymbol} onChange={e => setPrSymbol(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
            <input type="number" placeholder="가격" value={prPrice} onChange={e => setPrPrice(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
            <input type="date" value={prDate} onChange={e => setPrDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none col-span-2" />
            <button type="submit" disabled={loading} className="col-span-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs py-2.5 transition-all flex items-center justify-center gap-1 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> 가격 추가
            </button>
          </form>

          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase">CSV Upload</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-100 rounded-3xl hover:border-slate-800 hover:bg-slate-50 transition-all cursor-pointer group">
            <FileUp className="w-5 h-5 text-slate-200 group-hover:text-slate-800 mb-1.5" />
            <span className="text-[10px] font-black text-slate-400">파일 선택</span>
            <input type="file" className="hidden" accept=".csv" onChange={handlePriceImport} disabled={loading} />
          </label>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase mb-3">
            <Info className="w-3 h-3" /> Product CSV Guide
          </div>
          <div className="bg-slate-900 text-slate-400 p-3 rounded-xl font-mono text-[9px] leading-relaxed">
            name, symbol, type, market<br/>
            삼성전자, 005930, stock, KR
          </div>
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase mb-3">
            <Info className="w-3 h-3" /> Price CSV Guide
          </div>
          <div className="bg-slate-900 text-slate-400 p-3 rounded-xl font-mono text-[9px] leading-relaxed">
            symbol, price, price_date<br/>
            005930, 75200, 2026-04-25
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSection
