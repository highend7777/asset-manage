import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Wallet, Calendar, PieChart as PieIcon, Coins } from 'lucide-react'

const COLORS = { stock: '#FFCC00', bond: '#4D4D4D', cash: '#888888', crypto: '#2E2E2E', etc: '#E0E0E0' }
const CATEGORY_NAMES = { stock: '주식/ETF', bond: '채권', cash: '현금', crypto: '가상화폐', etc: '기타' }

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  
  const [totalValue, setTotalValue] = useState(0)
  const [monthlyDividend, setMonthlyDividend] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

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
          holdingsMap[t.product_id] = (holdingsMap[t.product_id] || 0) + Number(t.amount)
        }
      })

      products.forEach(p => {
        const amount = holdingsMap[p.id] || 0
        if (amount <= 0) return

        const latestPrice = prices.find(pr => pr.product_id === p.id)?.price || 0
        const value = amount * latestPrice
        currentTotal += value
        if (catValueMap[p.category] !== undefined) {
          catValueMap[p.category] += value
        }
      })

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
    } catch (err: any) {
      console.error('Dashboard Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="space-y-8 animate-kb-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-border-point shadow-sm">
          <Calendar className="w-4 h-4 text-text-sub" />
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="text-sm font-black text-text-main outline-none bg-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 smart-card p-8 bg-primary border-none shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-text-main/60 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Portfolio Valuation</p>
              <h2 className="text-4xl font-black text-text-main mb-6 tracking-tight">₩{totalValue.toLocaleString()}</h2>
            </div>
            <div className="bg-white/40 p-4 rounded-3xl backdrop-blur-md"><Wallet className="w-8 h-8 text-text-main" /></div>
          </div>
        </div>
        <div className="lg:col-span-2 smart-card p-8 flex flex-col justify-center bg-white border-primary/30 border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl"><Coins className="w-5 h-5 text-primary-dark" /></div>
            <span className="text-sm font-black text-text-main">이달의 예상 배당금</span>
          </div>
          <div className="text-2xl font-black text-primary-dark">₩{monthlyDividend.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 smart-card p-8">
          <div className="flex items-center justify-between mb-8"><h3 className="text-sm font-black text-text-main flex items-center gap-2 uppercase tracking-widest"><PieIcon className="text-primary w-5 h-5" /> 자산비중분석</h3></div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {chartData.map((entry) => (<Cell key={`cell-${entry.key}`} fill={COLORS[entry.key as keyof typeof COLORS]} stroke="#fff" strokeWidth={2} />))}
                </Pie>
                <Tooltip formatter={(value: any) => `₩${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="smart-card p-6">
            <h4 className="text-xs font-black text-text-main mb-6 flex items-center justify-between">최근 거래 내역</h4>
            <div className="space-y-5">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between pb-4 border-b border-bg-point last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-6 rounded-full ${t.amount > 0 ? 'bg-primary' : 'bg-rose-500'}`} />
                    <div><div className="text-xs font-black text-text-main">{t.products?.name}</div></div>
                  </div>
                  <div className={`text-xs font-black ${t.amount > 0 ? 'text-primary-dark' : 'text-rose-500'}`}>{t.amount > 0 ? '+' : ''}{t.amount} 주</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
