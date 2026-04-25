import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { FamilyMember, Account } from '../lib/supabase'
import { Landmark, Plus, Trash2, User } from 'lucide-react'

const AccountSection = () => {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [memberId, setMemberId] = useState('')
  const [institution, setInstitution] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [mRes, aRes] = await Promise.all([
      supabase.from('family_members').select('*').order('name'),
      supabase.from('accounts').select('*').order('created_at', { ascending: false })
    ])

    if (mRes.error) setError(`가족 데이터 로드 실패: ${mRes.error.message}`)
    if (aRes.error) setError(`계좌 데이터 로드 실패: ${aRes.error.message}`)

    setMembers(mRes.data || [])
    setAccounts(aRes.data || [])
    if (mRes.data && mRes.data.length > 0) setMemberId(mRes.data[0].id)
    setLoading(false)
  }

  async function addAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId || !institution || !name) return

    setLoading(true)
    const { error } = await supabase.from('accounts').insert([{
      member_id: memberId,
      institution,
      name
    }])

    if (error) {
      setError(`계좌 등록 실패: ${error.message}`)
    } else {
      setInstitution('')
      setName('')
      fetchData()
    }
    setLoading(false)
  }

  async function deleteAccount(id: string) {
    if (!confirm('계좌를 삭제하시겠습니까? 연동된 자산 정보에도 영향을 줄 수 있습니다.')) return
    setLoading(true)
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) setError(`계좌 삭제 실패: ${error.message}`)
    else fetchData()
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Account Form */}
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Landmark className="text-primary" /> 계좌 정보 등록
        </h2>
        <form onSubmit={addAccount} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 ml-1">소유자</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            >
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              {members.length === 0 && <option value="">구성원 먼저 등록</option>}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 ml-1">금융기관</label>
            <input
              type="text"
              placeholder="예: 미래에셋, 삼성증권"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 ml-1">계좌명</label>
            <input
              type="text"
              placeholder="예: IRP, 종합계좌"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || members.length === 0}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold p-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" /> 계좌 추가
            </button>
          </div>
        </form>
        {error && <div className="mt-4 text-danger text-sm">{error}</div>}
      </div>

      {/* Account List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="glass p-5 rounded-2xl relative group border border-black/5">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Landmark className="text-primary w-5 h-5" />
              </div>
              <button
                onClick={() => deleteAccount(account.id)}
                className="text-slate-300 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase mb-1">{account.institution}</div>
              <h3 className="text-lg font-black text-slate-800 mb-3">{account.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <User className="w-3 h-3" /> {members.find(m => m.id === account.member_id)?.name}
              </div>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-black/5 rounded-2xl">
            등록된 계좌 정보가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountSection
