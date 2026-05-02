import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Wallet, Calendar, PieChart as PieIcon, Coins, List } from 'lucide-react'

const COLORS = { stock: '#FFCC00', bond: '#4D4D4D', cash: '#888888', crypto: '#2E2E2E', etc: '#E0E0E0' }
const CATEGORY_NAMES = { stock: '주식/ETF', bond: '채권', cash: '현금', crypto: '가상화폐', etc: '기타' }

interface AssetDetailItem {
  id: string
  categoryKey: string
  categoryName: string
  productName: string
  symbol: string
  amount: number
  value: number
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  
  const [totalValue, setTotalValue] = useState(0)
  const [monthlyDividend, setMonthlyDividend] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [assetDetails, setAssetDetails] = useState<AssetDetailItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // 선택된 자산유형 (PieChart 클릭 시 필터링용)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    calculateDashboardData()
  }, [selectedMonth])

  async function calculateDashboardData() {
    try {
      setLoading(true)
      setError(null)
      
      const year = parseInt(selectedMonth.split('-')[0])
      const month = parseInt(selectedMonth.split('-')[1])
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
      const firstDay = `${selectedMonth}-01`

      const [transRes, prodRes, pricesRes, divRes] = await Promise.all([
        supabase.from('transactions').select('*, products(*)').lte('transaction_date', lastDay),
        supabase.from('products').select('*'),
        supabase.from('product_prices').select('*').lte('price_date', lastDay).order('price_date', { ascending: false }),
        supabase.from('dividends').select('*').gte('payment_date', firstDay).lte('payment_date', lastDay)
      ])

      if (transRes.error) throw transRes.error
      if (prodRes.error) throw prodRes.error

      const transactions = transRes.data || []
      const products = prodRes.data || []
      const prices = pricesRes.data || []
      const dividends = divRes.data || []

      let currentTotal = 0
      const holdingsMap: Record<string, number> = {}
      const catValueMap: Record<string, number> = { stock: 0, bond: 0, cash: 0, crypto: 0, etc: 0 }

      transactions.forEach(t => {
        if (t.product_id) {
          // 계좌에 상관없이 동일 상품의 수량을 모두 합산 (sum)
          holdingsMap[t.product_id] = (holdingsMap[t.product_id] || 0) + Number(t.amount)
        }
      })

      const details: AssetDetailItem[] = []

      products.forEach(p => {
        const amount = holdingsMap[p.id] || 0
        if (amount <= 0) return

        const latestPrice = prices.find(pr => pr.product_id === p.id)?.price || 0
        const value = amount * latestPrice
        currentTotal += value
        if (catValueMap[p.category] !== undefined) {
          catValueMap[p.category] += value
        }

        details.push({
          id: p.id,
          categoryKey: p.category,
          categoryName: CATEGORY_NAMES[p.category as keyof typeof CATEGORY_NAMES],
          productName: p.name,
          symbol: p.symbol,
          amount,
          value
        })
      })

      // 총 금액이 큰 순서대로 정렬
      details.sort((a, b) => b.value - a.value)

      let totalDiv = 0
      dividends.forEach(d => {
        const holdingsAtDivDate = transactions
          .filter(t => t.product_id === d.product_id && t.transaction_date <= d.payment_date)
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        totalDiv += holdingsAtDivDate * Number(d.amount_per_share)
      })

      setTotalValue(currentTotal)
      setMonthlyDividend(totalDiv)
      setChartData(Object.keys(CATEGORY_NAMES).map(cat => ({
        name: CATEGORY_NAMES[cat as keyof typeof CATEGORY_NAMES],
        value: catValueMap[cat],
        key: cat
      })).filter(d => d.value > 0))
      setRecentTransactions(transactions.slice(-4).reverse())
      setAssetDetails(details)
    } catch (err: any) {
      console.error('Dashboard Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 필터링 로직
  const filteredDetails = selectedCategory 
    ? assetDetails.filter(d => d.categoryKey === selectedCategory) 
    : assetDetails

  if (error) {
    return (
      <div className="p-8 text-center smart-card bg-rose-50 border-rose-100">
        <p className="text-rose-600 font-black">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-xs text-rose-400 mt-2">{error}</p>
        <button onClick={calculateDashboardData} className="mt-4 smart-btn-secondary py-2 px-4 text-xs">다시 시도</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-kb-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-border-point shadow-sm">
          <Calendar className="w-4 h-4 text-text-sub" />
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="text-sm font-black text-text-main outline-none bg-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 smart-card p-6 bg-primary border-none shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-text-main/60 font-black text-[10px] uppercase tracking-[0.2em] mb-1">총자산(원화)</p>
              <h2 className="text-4xl font-black text-text-main mb-6 tracking-tight">₩{totalValue.toLocaleString()}</h2>
            </div>
            <div className="bg-white/40 p-4 rounded-3xl backdrop-blur-md"><Wallet className="w-8 h-8 text-text-main" /></div>
          </div>
        </div>
        <div className="lg:col-span-2 smart-card p-6 flex flex-col justify-center bg-white border-primary/30 border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl"><Coins className="w-5 h-5 text-primary-dark" /></div>
            <span className="text-sm font-black text-text-main">이달의 예상 배당금</span>
          </div>
          <div className="text-2xl font-black text-primary-dark">₩{monthlyDividend.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 smart-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
              <PieIcon className="text-primary w-5 h-5" /> 자산비중분석
            </h3>
            <p className="text-[10px] font-bold text-text-sub">차트 조각을 클릭하면 해당 자산만 상세 목록에 표시됩니다.</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <PieChart>
                <Pie 
                  data={chartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={true}
                  onClick={(data: any) => {
                    const key = data?.key as string | null
                    setSelectedCategory(selectedCategory === key ? null : key)
                  }}
                  cursor="pointer"
                >
                  {chartData.map((entry) => (
                    <Cell 
                      key={`cell-${entry.key}`} 
                      fill={COLORS[entry.key as keyof typeof COLORS]} 
                      stroke="#fff" 
                      strokeWidth={2} 
                      className="transition-all"
                      opacity={selectedCategory && selectedCategory !== entry.key ? 0.3 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₩${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="smart-card p-6 h-[256px] overflow-y-auto">
            <h4 className="text-xs font-black text-text-main mb-4 flex items-center justify-between">최근 거래 내역</h4>
            <div className="space-y-4">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between pb-4 border-b border-bg-point last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-6 rounded-full ${t.amount > 0 ? 'bg-primary' : 'bg-rose-500'}`} />
                    <div>
                      <div className="text-xs font-black text-text-main">{t.products?.name}</div>
                      <div className="text-[10px] text-text-sub font-bold">{t.transaction_date}</div>
                    </div>
                  </div>
                  <div className={`text-xs font-black ${t.amount > 0 ? 'text-primary-dark' : 'text-rose-500'}`}>{t.amount > 0 ? '+' : ''}{t.amount} 주</div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="text-center text-xs font-bold text-text-sub py-10">거래 내역이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 자산 상세 리스트 추가 */}
      <div className="smart-card p-6 bg-white mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest">
            <List className="text-primary w-5 h-5" /> 자산 상세 리스트
          </h3>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-black text-primary-dark hover:underline bg-primary/10 px-3 py-1 rounded-full"
            >
              전체 자산 보기
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-primary/20">
                <th className="py-3 px-4 text-xs font-black text-text-sub uppercase">자산유형</th>
                <th className="py-3 px-4 text-xs font-black text-text-sub uppercase">상품명(심볼)</th>
                <th className="py-3 px-4 text-xs font-black text-text-sub uppercase text-right">수량</th>
                <th className="py-3 px-4 text-xs font-black text-text-sub uppercase text-right">금액(원화)</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetails.map((item, idx) => (
                <tr key={idx} className="border-b border-bg-point hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-bold text-text-main">
                    <span className="px-2 py-1 bg-bg-point rounded-lg text-[10px] font-black">{item.categoryName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm font-black text-text-main">{item.productName}</div>
                    <div className="text-[10px] text-text-sub font-bold">{item.symbol}</div>
                  </td>
                  <td className="py-4 px-4 text-sm font-black text-primary-dark text-right">
                    {item.amount.toLocaleString()} 주
                  </td>
                  <td className="py-4 px-4 text-sm font-black text-text-main text-right">
                    ₩{item.value.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredDetails.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-text-sub font-black">
                    {selectedCategory ? '해당 유형의 자산이 없습니다.' : '표시할 자산이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
