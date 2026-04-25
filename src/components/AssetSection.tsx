import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { FamilyMember, Asset, Account } from '../lib/supabase'
import React from 'react'
import { Wallet, Plus, Trash2 } from 'lucide-react'

interface AssetSectionProps {
  members: FamilyMember[]
  accounts: Account[]
}

const AssetSection: React.FC<AssetSectionProps> = ({ members, accounts }) => {
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
  const [assetDate, setAssetDate] = useState(new Date().toISOString().split('T')[0])

  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (name.length >= 2 && !symbol) { // 심볼이 정해지지 않았을 때만 검색
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
  }, [name, symbol])

  async function fetchData() {
    setLoading(true)
    const { data, error: aError } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (aError) setError(`자산 데이터 로드 실패: ${aError.message}`)

    if (members && members.length > 0) setMemberId(members[0].id)

    // 자산별로 등록일 기준 가격 조회
    const rawAssets = data || []
    const evaluatedAssets = await Promise.all(rawAssets.map(async (asset) => {
      if (!asset.symbol) return asset

      const { data: priceData } = await supabase
        .from('product_prices')
        .select('price')
        .eq('symbol', asset.symbol)
        .lte('price_date', asset.asset_date)
        .order('price_date', { ascending: false })
        .limit(1)
      
      return {
        ...asset,
        current_value: priceData?.[0]?.price ? priceData[0].price * asset.amount : 0,
        registered_price: priceData?.[0]?.price || 0
      }
    }))

    setAssets(evaluatedAssets as any)
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

  const handleNameChange = (val: string) => {
    setName(val)
    setSymbol('') // 이름을 수정하면 선택된 심볼 초기화 (강제 선택 유도)
  }

  async function addAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId || !name || !amount || !symbol) {
      setError('종목을 검색하여 반드시 선택해야 합니다.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('assets').insert([{
      member_id: memberId,
      account_id: accountId || null,
      type,
      name,
      amount: parseFloat(amount),
      symbol: symbol,
      asset_date: assetDate
    }])

    if (error) {
      setError(`자산 추가 실패: ${error.message}`)
    } else {
      setName('')
      setAmount('')
      setSymbol('')
      setError(null)
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      {/* Asset Form - Compact Version */}
      <div className="kb-card p-5">
        <h2 className="text-base font-black mb-4 flex items-center gap-2 text-slate-800">
          <Wallet className="text-primary w-5 h-5" /> 신규 자산 등록
        </h2>
        <form onSubmit={addAsset} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-slate-400 ml-1">소유자</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              >
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                {members.length === 0 && <option value="">구성원 먼저</option>}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-slate-400 ml-1">등록일</label>
              <input
                type="date"
                value={assetDate}
                onChange={(e) => setAssetDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-slate-400 ml-1">계좌</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none"
              >
                {accounts.filter(a => a.member_id === memberId).map(a => (
                  <option key={a.id} value={a.id}>{a.institution} - {a.name}</option>
                ))}
                {accounts.filter(a => a.member_id === memberId).length === 0 && (
                  <option value="">계좌 없음</option>
                )}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 relative col-span-2">
              <label className="text-[10px] font-bold text-slate-400 ml-1">자산명 검색 (필수)</label>
              <input
                type="text"
                placeholder="종목명 또는 코드 검색"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => name.length >= 2 && !symbol && setShowDropdown(true)}
                className={`bg-slate-50 border ${symbol ? 'border-primary bg-primary/5' : 'border-slate-200'} rounded-lg px-3 py-2 text-xs font-bold outline-none transition-all`}
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={`${product.symbol}-${product.market}`}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[11px]">{product.name}</span>
                        <span className="text-[9px] text-slate-400">{product.market} • {product.type}</span>
                      </div>
                      <span className="text-[9px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase">{product.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-slate-400 ml-1">수량/금액</label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !symbol}
                className="w-full bg-primary hover:bg-amber-400 text-slate-900 font-black py-2 rounded-lg text-xs transition-all shadow-md disabled:opacity-30 disabled:grayscale"
              >
                {loading ? '...' : '자산 등록'}
              </button>
            </div>
          </div>
        </form>
        {error && <div className="mt-2 text-danger text-[10px] font-bold flex items-center gap-1"><Plus className="w-3 h-3 rotate-45" /> {error}</div>}
      </div>

      {/* Asset List - Compact Table */}
      <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">등록일</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">소유자</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">계좌</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">자산명</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-right">등록일 가격</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-right">수량</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-right">평가액</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assets.map((asset: any) => {
                const account = accounts.find(a => a.id === asset.account_id)
                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 text-[11px] text-slate-400 font-medium">{asset.asset_date}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-700">{members.find(m => m.id === asset.member_id)?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-600">{account?.name || '-'}</span>
                        <span className="text-[9px] text-slate-400">{account?.institution}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-[11px]">{asset.name}</span>
                        <span className="text-[9px] text-primary font-black uppercase">{asset.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-600 text-right">
                      {asset.registered_price ? `₩${asset.registered_price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-800 text-right font-medium">{asset.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-black text-slate-900 text-[11px] text-right">
                      {asset.current_value ? `₩${asset.current_value.toLocaleString()}` : '₩0'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-1.5 text-slate-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-300 text-xs font-bold italic">
                    등록된 자산 데이터가 없습니다.
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
