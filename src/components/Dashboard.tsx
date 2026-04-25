import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Asset, FamilyMember } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Wallet, TrendingUp, Users, Calendar, Filter } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Dashboard = () => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [valuationDate])

  async function fetchData() {
    setLoading(true)
    
    // 1. 가족 및 자산 기본 데이터 로드
    const [mRes, aRes] = await Promise.all([
      supabase.from('family_members').select('*'),
      supabase.from('assets').select('*')
    ])

    const membersData = mRes.data || []
    const assetsData = aRes.data || []

    // 2. 각 자산의 심볼별로 선택한 날짜 기준 가장 최근 가격 가져오기
    const symbols = Array.from(new Set(assetsData.map(a => a.symbol).filter(Boolean)))
    
    let pricesMap: Record<string, number> = {}

    if (symbols.length > 0) {
      // 심볼별로 valuationDate 이하인 데이터 중 가장 최신 데이터 1개씩 조회
      // (Supabase JS 클라이언트 제약으로 개별 조회 혹은 RPC 필요, 여기서는 루프를 활용하되 최적화 고려)
      const pricePromises = symbols.map(async (symbol) => {
        const { data } = await supabase
          .from('product_prices')
          .select('price')
          .eq('symbol', symbol)
          .lte('price_date', valuationDate)
          .order('price_date', { ascending: false })
          .limit(1)
        
        return { symbol, price: data?.[0]?.price || 0 }
      })

      const prices = await Promise.all(pricePromises)
      prices.forEach(p => {
        if (p.symbol) pricesMap[p.symbol] = p.price
      })
    }

    // 3. 자산 데이터에 조회된 가격 적용하여 현재가 계산
    const evaluatedAssets = assetsData.map(asset => ({
      ...asset,
      current_value: asset.symbol ? (pricesMap[asset.symbol] || 0) * asset.amount : asset.amount // 현금 등 심볼 없는 경우 금액 그대로
    }))

    setMembers(membersData)
    setAssets(evaluatedAssets)
    setLoading(false)
  }

  // 데이터 가공 (차트용)
  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.current_value) || 0), 0)
  
  const typeData = [
    { name: '주식', value: assets.filter(a => a.type === 'stock').reduce((sum, a) => sum + Number(a.current_value), 0) },
    { name: '채권', value: assets.filter(a => a.type === 'bond').reduce((sum, a) => sum + Number(a.current_value), 0) },
    { name: '현금', value: assets.filter(a => a.type === 'cash').reduce((sum, a) => sum + Number(a.current_value), 0) },
    { name: '가상화폐', value: assets.filter(a => a.type === 'crypto').reduce((sum, a) => sum + Number(a.current_value), 0) },
  ].filter(d => d.value > 0)

  const memberData = members.map(m => ({
    name: m.name,
    value: assets.filter(a => a.member_id === m.id).reduce((sum, a) => sum + Number(a.current_value), 0)
  })).filter(d => d.value > 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Date Filter & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Wallet className="text-primary w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">총 자산 평가액</h2>
            <p className="text-3xl font-black text-slate-900">₩{totalAssets.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-black/5">
          <div className="pl-3 flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold">조회 기준일</span>
          </div>
          <input 
            type="date" 
            value={valuationDate}
            onChange={(e) => setValuationDate(e.target.value)}
            className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
          />
          <div className="pr-2">
            <Filter className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Asset Type Chart */}
        <div className="glass p-8 rounded-[2.5rem] border border-black/5">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary w-5 h-5" /> 자산 구성 (유형별)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-black/5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                <span className="text-xs font-black text-slate-900 ml-auto">{Math.round((entry.value / totalAssets) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Member Asset Chart */}
        <div className="glass p-8 rounded-[2.5rem] border border-black/5">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users className="text-secondary w-5 h-5" /> 자산 현황 (가족별)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                />
                <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                  {memberData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
