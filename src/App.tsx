import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import AssetSection from './components/AssetSection'
import NewsSection from './components/NewsSection'
import ReportSection from './components/ReportSection'

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
