import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Asset } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, Wallet } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Dashboard = () => {
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    fetchAssets()
  }, [])

  async function fetchAssets() {
    const { data } = await supabase.from('assets').select('*')
    setAssets(data || [])
  }

  // Data Processing
  const typeData = assets.reduce((acc: any[], asset) => {
    const existing = acc.find(item => item.name === asset.type)
    if (existing) {
      existing.value += Number(asset.amount)
    } else {
      acc.push({ name: asset.type, value: Number(asset.amount) })
    }
    return acc
  }, [])

  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.amount), 0)

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border-l-4 border-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">총 자산 평가액</p>
              <h3 className="text-3xl font-bold mt-1 text-slate-900">₩{totalValue.toLocaleString()}</h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Wallet className="text-primary w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-secondary text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>지난달 대비 +2.4%</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border-l-4 border-secondary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">이번 달 수익금</p>
              <h3 className="text-3xl font-bold mt-1 text-secondary">₩4,250,000</h3>
            </div>
            <div className="bg-secondary/10 p-3 rounded-2xl">
              <TrendingUp className="text-secondary w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-slate-400 text-xs italic">*수기 입력 데이터 기반 시뮬레이션</p>
        </div>

        <div className="glass p-6 rounded-3xl border-l-4 border-accent">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">투자 자산 비중</p>
              <h3 className="text-3xl font-bold mt-1 text-slate-900">72.5%</h3>
            </div>
            <div className="bg-accent/10 p-3 rounded-2xl">
              <BarChart3 className="text-accent w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-black/5 h-2 rounded-full overflow-hidden">
            <div className="bg-accent h-full" style={{ width: '72.5%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass p-8 rounded-3xl">
          <h4 className="text-lg font-bold mb-6 text-slate-800">자산 구성비 (유형별)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Mockup for Growth */}
        <div className="glass p-8 rounded-3xl">
          <h4 className="text-lg font-bold mb-6 text-slate-800">자산 성장 추이</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: '1월', value: 4500 },
                { month: '2월', value: 4800 },
                { month: '3월', value: 4700 },
                { month: '4월', value: 5200 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  cursor={{ fill: '#00000005' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icon Import fix
import { BarChart3 } from 'lucide-react'

export default Dashboard
