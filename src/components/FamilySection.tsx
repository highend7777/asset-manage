import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FamilyMember } from '../lib/supabase'
import { UserPlus, Trash2, User } from 'lucide-react'

interface FamilySectionProps {
  members: FamilyMember[]
  onRefresh: () => void
}

const FamilySection: React.FC<FamilySectionProps> = ({ members, onRefresh }) => {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('본인')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    const { error } = await supabase.from('family_members').insert([{ name, relationship }])
    if (error) {
      setError(`멤버 추가 실패: ${error.message}`)
    } else {
      setName('')
      onRefresh() // 부모의 데이터를 갱신하도록 호출
    }
    setLoading(false)
  }

  async function deleteMember(id: string) {
    if (!confirm('정말 삭제하시겠습니까? 관련 자산 데이터도 함께 삭제됩니다.')) return
    
    setLoading(true)
    const { error } = await supabase.from('family_members').delete().eq('id', id)
    if (error) {
      setError(`멤버 삭제 실패: ${error.message}`)
    } else {
      onRefresh() // 부모의 데이터를 갱신하도록 호출
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="text-primary" /> 가족 구성원 등록
        </h2>
        <form onSubmit={addMember} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-slate-800"
          />
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFB81C]/50 transition-all text-slate-800"
          >
            <option value="본인">본인</option>
            <option value="와이프">와이프</option>
            <option value="자녀">자녀</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#FFB81C] hover:bg-[#e6a519] text-slate-900 font-bold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? '...' : '멤버 추가'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="underline">닫기</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="text-primary w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{member.name}</div>
                <div className="text-xs text-slate-500">{member.relationship}</div>
              </div>
            </div>
            <button
              onClick={() => deleteMember(member.id)}
              className="p-2 text-slate-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {members.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
            등록된 가족 구성원이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default FamilySection
