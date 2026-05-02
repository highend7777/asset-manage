import type { ReactNode } from 'react'
import { Sparkles, LayoutDashboard, Wallet, Newspaper, Settings } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {

  const menuItems = [
    { id: 'dashboard', label: '자산현황', icon: LayoutDashboard },
    { id: 'analysis', label: 'AI 투자분석', icon: Newspaper },
    { id: 'assets', label: '자산정보등록', icon: Wallet },
  ]

  return (
    <div className="min-h-screen bg-bg-soft flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
          >
            <div className="bg-primary p-2 rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Smart <span className="text-primary">Asset</span>
            </h1>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-xs font-medium border-t border-slate-100">
        &copy; 2026 Smart Asset Management. Powered by Gemini AI.
      </footer>
    </div>
  )
}

export default Layout
