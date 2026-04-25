import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Settings, FileUp, CheckCircle2, AlertCircle, Database, Info } from 'lucide-react'

const AdminSection = () => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    fetchProductCount()
  }, [])

  async function fetchProductCount() {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true })
    if (!error) setProductCount(count || 0)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setStatus('파일을 분석 중입니다...')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        
        // 헤더 제외 (name, symbol, type, market 순서 가정)
        const products = lines.slice(1).map(line => {
          const [name, symbol, type, market] = line.split(',').map(item => item.trim())
          return { name, symbol, type, market }
        })

        if (products.length === 0) throw new Error('업로드할 데이터가 없습니다.')

        setStatus(`${products.length}개의 종목을 DB에 저장 중입니다...`)

        const { error: upsertError } = await supabase
          .from('products')
          .upsert(products, { onConflict: 'symbol,market' })

        if (upsertError) throw upsertError

        setStatus(`총 ${products.length}개의 종목이 성공적으로 등록되었습니다!`)
        fetchProductCount()
      } catch (err: any) {
        setError(`임포트 실패: ${err.message}`)
        setStatus(null)
      } finally {
        setLoading(false)
        if (e.target) e.target.value = '' // 파일 입력 초기화
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
            <h2 className="text-2xl font-black text-slate-900">상품 데이터 관리 (Admin)</h2>
            <p className="text-slate-500 font-medium">엑셀(CSV) 파일을 업로드하여 자산 종목을 일괄 등록합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-bold">등록된 총 종목 수</span>
              <Database className="text-primary w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-primary">{productCount.toLocaleString()} 개</div>
          </div>

          <div className="bg-secondary/5 p-6 rounded-2xl border border-secondary/10 flex items-center justify-center">
            {loading ? (
              <span className="text-sm font-bold text-secondary animate-pulse">{status}</span>
            ) : status?.includes('성공') ? (
              <div className="flex items-center gap-2 text-secondary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">{status}</span>
              </div>
            ) : (
              <span className="text-slate-400 italic">파일을 업로드해 주세요.</span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {/* File Upload Zone */}
        <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileUp className="w-12 h-12 text-slate-300 group-hover:text-primary transition-colors mb-3" />
            <p className="mb-2 text-sm text-slate-700 font-bold">클릭하여 CSV 파일 업로드</p>
            <p className="text-xs text-slate-400 font-medium">엑셀에서 '다른 이름으로 저장' &gt; 'CSV (쉼표로 분리)' 선택</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={loading} />
        </label>
      </div>

      {/* Helper Card */}
      <div className="glass p-8 rounded-[2rem] border border-black/5 bg-white/50">
        <div className="flex items-center gap-2 mb-4 text-slate-900">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="font-black">CSV 파일 양식 가이드</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4 font-medium">엑셀 첫 줄에 아래 헤더를 넣고 데이터를 작성해 주세요.</p>
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto">
          name, symbol, type, market<br/>
          삼성전자, 005930, stock, KR<br/>
          Apple, AAPL, stock, US<br/>
          TIGER 차이나전기차SOLACTIVE, 371460, etf, KR<br/>
          Invesco QQQ Trust, QQQ, etf, US
        </div>
        <ul className="mt-6 space-y-2 text-xs text-slate-500 font-medium list-disc list-inside">
          <li><strong>type</strong>: 'stock'(주식) 또는 'etf'(ETF)로 입력</li>
          <li><strong>market</strong>: 'KR'(한국) 또는 'US'(미국)로 입력</li>
          <li>기존 등록된 심볼(Symbol)이 있으면 정보가 업데이트됩니다.</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminSection
