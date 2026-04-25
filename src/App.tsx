import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import FamilySection from './components/FamilySection'
import AccountSection from './components/AccountSection'
import AssetSection from './components/AssetSection'
import NewsSection from './components/NewsSection'
import ReportSection from './components/ReportSection'
import AdminSection from './components/AdminSection'
import type { FamilyMember, Account } from './lib/supabase'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const fetchSharedData = useCallback(async () => {
    const [mRes, aRes] = await Promise.all([
      supabase.from('family_members').select('*').order('name'),
      supabase.from('accounts').select('*').order('name')
    ])
    setMembers(mRes.data || [])
    setAccounts(aRes.data || [])
  }, [])

  useEffect(() => {
    fetchSharedData()
  }, [fetchSharedData])

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
            <FamilySection members={members} onRefresh={fetchSharedData} />
            <hr className="border-black/5" />
            <AccountSection members={members} accounts={accounts} onRefresh={fetchSharedData} />
            <hr className="border-black/5" />
            <AssetSection members={members} accounts={accounts} />
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
