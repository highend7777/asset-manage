import React from 'react'
import { TrendingUp, Newspaper, BarChart3, Settings } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: '대시보드', icon: BarChart3 },
    { id: 'news', label: '투자정보', icon: Newspaper },
    { id: 'report', label: '주간리뷰', icon: TrendingUp },
    { id: 'registration', label: '정보 등록', icon: Settings },
  ]

  return (
    <div className="min-h-screen upward-gradient text-slate-800 flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/30">
            <TrendingUp className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900">
            우상향 <span className="text-primary">자산관리</span>
          </h1>
        </div>
        <div className="hidden md:flex gap-1 bg-black/5 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-slate-900 shadow-md'
                  : 'hover:bg-black/5 text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden glass fixed bottom-0 left-0 right-0 px-2 py-3 flex justify-around items-center border-t border-black/5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id ? 'text-primary' : 'text-slate-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>
      
      {/* Spacer for bottom nav */}
      <div className="h-20 md:hidden" />
    </div>
  )
}

export default Layout
