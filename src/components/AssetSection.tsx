import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { FamilyMember, Asset } from '../lib/supabase'
import { Wallet, Plus, Trash2, TrendingUp, Landmark, Banknote, Bitcoin } from 'lucide-react'

const AssetSection = () => {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [memberId, setMemberId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [type, setType] = useState<Asset['type']>('stock')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [symbol, setSymbol] = useState('')

  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (name.length >= 2) {
        const { data } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${name}%,symbol.ilike.%${name}%`)
          .limit(10)
        setSearchResults(data || [])
        setShowDropdown(true)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [name])

  async function fetchData() {
    setLoading(true)
    const [mRes, aRes, acRes] = await Promise.all([
      supabase.from('family_members').select('*').order('name'),
      supabase.from('assets').select('*').order('created_at', { ascending: false }),
      supabase.from('accounts').select('*').order('name')
    ])

    if (mRes.error) setError(`가족 데이터 로드 실패: ${mRes.error.message}`)
    if (aRes.error) setError(`자산 데이터 로드 실패: ${aRes.error.message}`)
    if (acRes.error) setError(`계좌 데이터 로드 실패: ${acRes.error.message}`)

    setMembers(mRes.data || [])
    setAssets(aRes.data || [])
    setAccounts(acRes.data || [])
    
    if (mRes.data && mRes.data.length > 0) setMemberId(mRes.data[0].id)
    setLoading(false)
  }

  // 소유자가 변경되면 계좌 선택 초기화
  useEffect(() => {
    const memberAccounts = accounts.filter(a => a.member_id === memberId)
    if (memberAccounts.length > 0) {
      setAccountId(memberAccounts[0].id)
    } else {
      setAccountId('')
    }
  }, [memberId, accounts])

  const handleSelectProduct = (product: any) => {
    setName(product.name)
    setSymbol(product.symbol)
    setType(product.type === 'etf' ? 'stock' : product.type as any) 
    setShowDropdown(false)
  }

  async function addAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId || !name || !amount) return

    setLoading(true)
    const { error } = await supabase.from('assets').insert([{
      member_id: memberId,
      account_id: accountId || null,
      type,
      name,
      amount: parseFloat(amount),
      symbol: symbol || null,
      current_value: parseFloat(amount)
    }])

    if (error) {
      setError(`자산 추가 실패: ${error.message}`)
    } else {
      setName('')
      setAmount('')
      setSymbol('')
      fetchData()
    }
    setLoading(false)
  }

  async function deleteAsset(id: string) {
    if (!confirm('자산을 삭제하시겠습니까?')) return
    setLoading(true)
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) setError(`자산 삭제 실패: ${error.message}`)
    else fetchData()
    setLoading(false)
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'stock': return <TrendingUp className="text-blue-400" />
      case 'bond': return <Landmark className="text-purple-400" />
      case 'cash': return <Banknote className="text-green-400" />
      case 'crypto': return <Bitcoin className="text-orange-400" />
      default: return <Wallet />
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      {/* Asset Form */}
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Wallet className="text-primary" /> 신규 자산 등록
        </h2>
        <form onSubmit={addAsset} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <label className="text-xs text-slate-500 ml-1">계좌</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            >
              {accounts.filter(a => a.member_id === memberId).map(a => (
                <option key={a.id} value={a.id}>{a.institution} - {a.name}</option>
              ))}
              {accounts.filter(a => a.member_id === memberId).length === 0 && (
                <option value="">계좌 먼저 등록</option>
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 ml-1">자산 유형</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            >
              <option value="stock">주식</option>
              <option value="bond">채권</option>
              <option value="cash">예금/현금</option>
              <option value="crypto">가상화폐</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs text-slate-500 ml-1">자산명</label>
            <input
              type="text"
              placeholder="예: 삼성전자"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => name.length >= 2 && setShowDropdown(true)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={`${product.symbol}-${product.market}`}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{product.name}</span>
                      <span className="text-[10px] text-slate-400">{product.market} • {product.type}</span>
                    </div>
                    <span className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded uppercase">{product.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 ml-1">수량/금액</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 ml-1">종목코드(선택)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ticker"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="flex-1 bg-black/5 border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
              />
              <button
                type="submit"
                disabled={loading || members.length === 0}
                className="bg-primary hover:bg-blue-600 p-3 rounded-xl transition-all disabled:opacity-50"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </form>
        {error && <div className="mt-4 text-danger text-sm">{error}</div>}
      </div>

      {/* Asset List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/5 border-b border-black/5">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">소유자</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">계좌</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">유형</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">자산명</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">금액/수량</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">코드</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {assets.map((asset) => {
                const account = accounts.find(a => a.id === asset.account_id)
                return (
                  <tr key={asset.id} className="hover:bg-black/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-800">{members.find(m => m.id === asset.member_id)?.name || '알수없음'}</td>
                    <td className="px-6 py-4">
                      {account ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{account.name}</span>
                          <span className="text-[10px] text-slate-400">{account.institution}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getAssetIcon(asset.type)}
                        <span className="capitalize text-slate-700">{asset.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{asset.name}</td>
                    <td className="px-6 py-4 text-slate-800">{asset.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{asset.symbol || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-2 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    등록된 자산이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AssetSection
