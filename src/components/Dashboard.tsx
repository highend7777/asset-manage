import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Asset, FamilyMember } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Wallet, TrendingUp, Users, Calendar, Filter } from 'lucide-react'

// KB Premium Palette
const COLORS = ['#FFBC00', '#4D4D4D', '#6E6E6E', '#A5A5A5', '#D9D9D9', '#B88E00']

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
    const [mRes, aRes] = await Promise.all([
      supabase.from('family_members').select('*'),
      supabase.from('assets').select('*')
    ])

    const membersData = mRes.data || []
    const assetsData = aRes.data || []
    const symbols = Array.from(new Set(assetsData.map(a => a.symbol).filter(Boolean)))
    
    let pricesMap: Record<string, number> = {}

    if (symbols.length > 0) {
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
      prices.forEach(p => { if (p.symbol) pricesMap[p.symbol] = p.price })
    }

    const evaluatedAssets = assetsData.map(asset => ({
      ...asset,
      current_value: asset.symbol ? (pricesMap[asset.symbol] || 0) * asset.amount : asset.amount
    }))

    setMembers(membersData)
    setAssets(evaluatedAssets)
    setLoading(false)
  }

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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* KB Styled Summary Header */}
      <div className="kb-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl">
            <Wallet className="text-primary w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets 평가액</h2>
            <p className="text-3xl font-black text-slate-900 leading-none">₩{totalAssets.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <div className="pl-3 flex items-center gap-2 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase">Standard Date</span>
          </div>
          <input 
            type="date" 
            value={valuationDate}
            onChange={(e) => setValuationDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-black text-slate-900 focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset Type Chart */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary w-4 h-4" /> 자산 구성 (유형별)
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value: any) => `₩${Number(value).toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-600">{entry.name}</span>
                <span className="text-[10px] font-black text-slate-900 ml-auto">{Math.round((entry.value / totalAssets) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Member Asset Chart */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users className="text-slate-400 w-4 h-4" /> 자산 현황 (가족별)
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value: any) => `₩${Number(value).toLocaleString()}`}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {memberData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
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
