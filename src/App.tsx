import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import AssetSection from './components/AssetSection'
import NewsSection from './components/NewsSection'
import ReportSection from './components/ReportSection'
import type { Session } from '@supabase/supabase-js'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'assets':
        return <AssetSection />
      case 'analysis':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <NewsSection />
            <ReportSection />
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

export default App
