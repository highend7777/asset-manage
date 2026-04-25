import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import FamilySection from './components/FamilySection'
import AccountSection from './components/AccountSection'
import AssetSection from './components/AssetSection'
import NewsSection from './components/NewsSection'
import ReportSection from './components/ReportSection'
import AdminSection from './components/AdminSection'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'news':
        return <NewsSection />
      case 'report':
        return <ReportSection />
      case 'registration':
        return (
          <div className="space-y-12 pb-20">
            <FamilySection />
            <hr className="border-black/5" />
            <AccountSection />
            <hr className="border-black/5" />
            <AssetSection />
            <hr className="border-black/5" />
            <AdminSection />
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="py-4">
        {renderContent()}
      </div>
    </Layout>
  )
}

export default App
