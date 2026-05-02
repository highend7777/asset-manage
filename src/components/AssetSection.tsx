import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Account, Product, Transaction, AssetCategory } from '../lib/supabase'
import { Landmark, Package, History, Coins, Plus, Trash2, Calendar, FileUp, Info, Activity } from 'lucide-react'

const AssetSection = () => {
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'product' | 'transaction' | 'price' | 'dividend'>('account')
  const [loading, setLoading] = useState(false)

  // Data States
  const [accounts, setAccounts] = useState<Account[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [prices, setPrices] = useState<any[]>([])
  const [dividends, setDividends] = useState<any[]>([])

  // Form States - Account
  const [accName, setAccName] = useState('')
  const [accInstitution, setAccInstitution] = useState('')

  // Form States - Product
  const [pSymbol, setPSymbol] = useState('')
  const [pName, setPName] = useState('')
  const [pCategory, setPCategory] = useState<AssetCategory>('stock')

  // Form States - Transaction
  const [tAccId, setTAccId] = useState('')
  const [tProdId, setTProdId] = useState('')
  const [tAmount, setTAmount] = useState('')
  const [tPrice, setTPrice] = useState('')
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0])

  // Form States - Price
  const [priceProdId, setPriceProdId] = useState('')
  const [priceValue, setPriceValue] = useState('')
  const [priceDate, setPriceDate] = useState(new Date().toISOString().split('T')[0])

  // Form States - Dividend
  const [divProdId, setDivProdId] = useState('')
  const [divValue, setDivValue] = useState('')
  const [divDate, setDivDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      setLoading(true)
      const [accRes, prodRes, transRes, priceRes, divRes] = await Promise.all([
        supabase.from('accounts').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('transactions').select('*, accounts(name), products(name, symbol)').order('transaction_date', { ascending: false }),
        supabase.from('product_prices').select('*, products(name, symbol)').order('price_date', { ascending: false }),
        supabase.from('dividends').select('*, products(name, symbol)').order('payment_date', { ascending: false })
      ])
      
      if (accRes.error) console.error('Account Fetch Error:', accRes.error)
      if (prodRes.error) console.error('Product Fetch Error:', prodRes.error)
      if (transRes.error) console.error('Transaction Fetch Error:', transRes.error)

      setAccounts(accRes.data || [])
      setProducts(prodRes.data || [])
      setTransactions(transRes.data || [])
      setPrices(priceRes.data || [])
      setDividends(divRes.data || [])
    } catch (err) {
      console.error('Initial Data Fetch Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accName || !accInstitution) return
    const { error } = await supabase.from('accounts').insert([{ name: accName, institution: accInstitution }])
    if (error) alert(`등록 실패: ${error.message}`)
    else { setAccName(''); setAccInstitution(''); fetchInitialData() }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pSymbol || !pName) return
    const { error } = await supabase.from('products').insert([{ symbol: pSymbol, name: pName, category: pCategory }])
    if (error) alert(`등록 실패: ${error.message}`)
    else { setPSymbol(''); setPName(''); fetchInitialData() }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tAccId || !tProdId || !tAmount || !tPrice) return
    const { error } = await supabase.from('transactions').insert([{
      account_id: tAccId, product_id: tProdId, amount: parseFloat(tAmount), price: parseFloat(tPrice), transaction_date: tDate
    }])
    if (error) alert(`등록 실패: ${error.message}`)
    else { setTAmount(''); setTPrice(''); fetchInitialData() }
  }

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!priceProdId || !priceValue || !priceDate) return
    const { error } = await supabase.from('product_prices').upsert([{ 
      product_id: priceProdId, price: parseFloat(priceValue), price_date: priceDate 
    }], { onConflict: 'product_id,price_date' })
    if (error) alert(`가격 등록 실패: ${error.message}`)
    else { setPriceValue(''); alert('가격이 등록되었습니다.'); fetchInitialData() }
  }

  const handleAddDividend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!divProdId || !divValue || !divDate) return
    const { error } = await supabase.from('dividends').insert([{ 
      product_id: divProdId, amount_per_share: parseFloat(divValue), payment_date: divDate 
    }])
    if (error) alert(`배당 등록 실패: ${error.message}`)
    else { setDivValue(''); alert('배당이 등록되었습니다.'); fetchInitialData() }
  }

  // --- CSV Uploads ---
  const handlePriceCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const newPrices = []
        
        for (let i = 1; i < lines.length; i++) {
          const [symbol, priceStr, dateStr] = lines[i].split(',').map(item => item.trim())
          const product = products.find(p => p.symbol === symbol)
          if (product && !isNaN(parseFloat(priceStr))) {
            newPrices.push({
              product_id: product.id,
              price: parseFloat(priceStr),
              price_date: dateStr || new Date().toISOString().split('T')[0]
            })
          }
        }

        if (newPrices.length > 0) {
          const { error } = await supabase.from('product_prices').upsert(newPrices, { onConflict: 'product_id,price_date' })
          if (error) throw error
          alert(`${newPrices.length}건의 가격 데이터가 등록되었습니다.`)
        } else {
          alert('유효한 데이터가 없거나 등록된 상품(심볼)이 없습니다.')
        }
      } catch (err: any) {
        alert(`CSV 업로드 실패: ${err.message}`)
      } finally {
        setLoading(false)
        fetchInitialData()
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset file input
  }

  const handleDividendCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const newDivs = []
        
        for (let i = 1; i < lines.length; i++) {
          const [symbol, amountStr, dateStr] = lines[i].split(',').map(item => item.trim())
          const product = products.find(p => p.symbol === symbol)
          if (product && !isNaN(parseFloat(amountStr))) {
            newDivs.push({
              product_id: product.id,
              amount_per_share: parseFloat(amountStr),
              payment_date: dateStr || new Date().toISOString().split('T')[0]
            })
          }
        }

        if (newDivs.length > 0) {
          const { error } = await supabase.from('dividends').insert(newDivs)
          if (error) throw error
          alert(`${newDivs.length}건의 배당 데이터가 등록되었습니다.`)
        } else {
          alert('유효한 데이터가 없거나 등록된 상품(심볼)이 없습니다.')
        }
      } catch (err: any) {
        alert(`CSV 업로드 실패: ${err.message}`)
      } finally {
        setLoading(false)
        fetchInitialData()
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset file input
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from(table).delete().eq('id', id)
    fetchInitialData()
  }

  return (
    <div className="space-y-8 animate-kb-fade">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-bg-point p-1.5 rounded-2xl w-fit">
        {[
          { id: 'account', label: '계좌 관리', icon: Landmark },
          { id: 'product', label: '상품 관리', icon: Package },
          { id: 'transaction', label: '구매 이력', icon: History },
          { id: 'price', label: '가격 등록', icon: Activity },
          { id: 'dividend', label: '배당 등록', icon: Coins },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeSubTab === tab.id ? 'bg-white text-text-main shadow-sm' : 'text-text-sub hover:text-text-main'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="smart-card p-8 h-fit">
            <h2 className="text-sm font-black text-text-main mb-6 flex items-center gap-2 uppercase tracking-widest">
              {activeSubTab === 'account' && <><Landmark className="text-primary w-4 h-4" /> 신규 계좌 등록</>}
              {activeSubTab === 'product' && <><Package className="text-primary w-4 h-4" /> 신규 상품 등록</>}
              {activeSubTab === 'transaction' && <><History className="text-primary w-4 h-4" /> 구매 이력 등록</>}
              {activeSubTab === 'price' && <><Activity className="text-primary w-4 h-4" /> 가격 정보 등록</>}
              {activeSubTab === 'dividend' && <><Coins className="text-primary w-4 h-4" /> 배당 정보 등록</>}
            </h2>

            <form className="space-y-4" onSubmit={
              activeSubTab === 'account' ? handleAddAccount :
              activeSubTab === 'product' ? handleAddProduct :
              activeSubTab === 'transaction' ? handleAddTransaction : 
              activeSubTab === 'price' ? handleAddPrice : handleAddDividend
            }>
              {activeSubTab === 'account' && (
                <>
                  <input type="text" placeholder="금융기관 (예: KB증권)" value={accInstitution} onChange={e => setAccInstitution(e.target.value)} className="smart-input w-full" required />
                  <input type="text" placeholder="계좌 별칭 (예: ISA 계좌)" value={accName} onChange={e => setAccName(e.target.value)} className="smart-input w-full" required />
                </>
              )}

              {activeSubTab === 'product' && (
                <>
                  <input type="text" placeholder="종목코드/심볼 (예: VOO)" value={pSymbol} onChange={e => setPSymbol(e.target.value)} className="smart-input w-full" required />
                  <input type="text" placeholder="종목명 (예: Vanguard S&P500)" value={pName} onChange={e => setPName(e.target.value)} className="smart-input w-full" required />
                  <select value={pCategory} onChange={e => setPCategory(e.target.value as any)} className="smart-input w-full">
                    <option value="stock">주식/ETF</option>
                    <option value="bond">채권</option>
                    <option value="cash">현금</option>
                    <option value="crypto">가상화폐</option>
                  </select>
                </>
              )}

              {activeSubTab === 'transaction' && (
                <>
                  <select value={tAccId} onChange={e => setTAccId(e.target.value)} className="smart-input w-full" required>
                    <option value="">계좌 선택</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.institution} - {a.name}</option>)}
                  </select>
                  <select value={tProdId} onChange={e => setTProdId(e.target.value)} className="smart-input w-full" required>
                    <option value="">상품 선택</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.symbol} ({p.name})</option>)}
                  </select>
                  <input type="number" step="any" placeholder="수량 (매수는 +, 매도는 -)" value={tAmount} onChange={e => setTAmount(e.target.value)} className="smart-input w-full" required />
                  <input type="number" step="any" placeholder="체결 단가" value={tPrice} onChange={e => setTPrice(e.target.value)} className="smart-input w-full" required />
                  <input type="date" value={tDate} onChange={e => setTDate(e.target.value)} className="smart-input w-full" required />
                </>
              )}

              {activeSubTab === 'price' && (
                <>
                  <select value={priceProdId} onChange={e => setPriceProdId(e.target.value)} className="smart-input w-full" required>
                    <option value="">상품 선택</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.symbol} ({p.name})</option>)}
                  </select>
                  <input type="number" step="any" placeholder="오늘의 가격" value={priceValue} onChange={e => setPriceValue(e.target.value)} className="smart-input w-full" required />
                  <input type="date" value={priceDate} onChange={e => setPriceDate(e.target.value)} className="smart-input w-full" required />
                </>
              )}

              {activeSubTab === 'dividend' && (
                <>
                  <select value={divProdId} onChange={e => setDivProdId(e.target.value)} className="smart-input w-full" required>
                    <option value="">상품 선택</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.symbol} ({p.name})</option>)}
                  </select>
                  <input type="number" step="any" placeholder="주당 배당금" value={divValue} onChange={e => setDivValue(e.target.value)} className="smart-input w-full" required />
                  <input type="date" value={divDate} onChange={e => setDivDate(e.target.value)} className="smart-input w-full" required />
                </>
              )}

              <button type="submit" disabled={loading} className="smart-btn-primary w-full mt-2">수동 등록하기</button>
            </form>
          </div>

          {/* CSV Upload Boxes */}
          {(activeSubTab === 'price' || activeSubTab === 'dividend') && (
            <div className="space-y-4 animate-kb-fade">
              <div className="smart-card p-6 border-dashed border-2 bg-transparent hover:border-primary/50 cursor-pointer relative group">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={activeSubTab === 'price' ? handlePriceCsvUpload : handleDividendCsvUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  title="CSV 파일 업로드"
                />
                <div className="text-center">
                  <div className="bg-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FileUp className="text-primary w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-black text-text-main mb-1">CSV 파일로 대량 업로드</h3>
                  <p className="text-[10px] text-text-sub font-bold">여기를 클릭하여 파일 선택</p>
                </div>
              </div>

              <div className="point-box bg-white">
                <h4 className="text-[10px] font-black text-text-main mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3 text-primary" /> CSV 작성 가이드
                </h4>
                <div className="bg-bg-point p-3 rounded-lg font-mono text-[9px] text-text-main/80 leading-relaxed overflow-x-auto">
                  {activeSubTab === 'price' ? (
                    <>
                      <div className="font-bold mb-1 border-b border-border-point pb-1">symbol, price, date</div>
                      VOO, 510.50, 2026-05-02<br/>
                      005930, 75000, 2026-05-02<br/>
                      <span className="text-text-sub italic mt-2 block">* 상품관리에 미리 등록된 심볼(symbol)이어야 합니다.</span>
                    </>
                  ) : (
                    <>
                      <div className="font-bold mb-1 border-b border-border-point pb-1">symbol, amount_per_share, date</div>
                      VOO, 1.5, 2026-05-02<br/>
                      005930, 361, 2026-05-02<br/>
                      <span className="text-text-sub italic mt-2 block">* 상품관리에 미리 등록된 심볼(symbol)이어야 합니다.</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Data List</h3>
          </div>

          <div className="space-y-3">
            {activeSubTab === 'account' && accounts.map(a => (
              <div key={a.id} className="smart-card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bg-point rounded-2xl"><Landmark className="w-5 h-5 text-text-sub" /></div>
                  <div>
                    <div className="text-sm font-black text-text-main">{a.name}</div>
                    <div className="text-[10px] font-bold text-text-sub uppercase">{a.institution}</div>
                  </div>
                </div>
                <button onClick={() => handleDelete('accounts', a.id)} className="p-2 text-text-sub hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}

            {activeSubTab === 'product' && products.map(p => (
              <div key={p.id} className="smart-card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bg-point rounded-2xl"><Package className="w-5 h-5 text-text-sub" /></div>
                  <div>
                    <div className="text-sm font-black text-text-main">{p.name}</div>
                    <div className="text-[10px] font-bold text-primary uppercase">{p.symbol} • {p.category}</div>
                  </div>
                </div>
                <button onClick={() => handleDelete('products', p.id)} className="p-2 text-text-sub hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}

            {activeSubTab === 'transaction' && transactions.map(t => (
              <div key={t.id} className="smart-card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bg-point rounded-2xl"><History className="w-5 h-5 text-text-sub" /></div>
                  <div>
                    <div className="text-sm font-black text-text-main">{t.products?.name}</div>
                    <div className="text-[10px] font-bold text-text-sub uppercase">{t.transaction_date} • {t.accounts?.name}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className={`text-sm font-black ${t.amount > 0 ? 'text-primary-dark' : 'text-rose-500'}`}>{t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} 주</span>
                    <span className="text-[10px] font-bold text-text-sub italic">@ ₩{t.price.toLocaleString()}</span>
                  </div>
                  <button onClick={() => handleDelete('transactions', t.id)} className="p-2 text-text-sub hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}

            {activeSubTab === 'price' && prices.map(p => (
              <div key={p.id} className="smart-card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bg-point rounded-2xl"><Activity className="w-5 h-5 text-text-sub" /></div>
                  <div>
                    <div className="text-sm font-black text-text-main">{p.products?.name}</div>
                    <div className="text-[10px] font-bold text-text-sub uppercase">{p.price_date} • {p.products?.symbol}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div className="text-sm font-black text-text-main">₩{p.price.toLocaleString()}</div>
                  <button onClick={() => handleDelete('product_prices', p.id)} className="p-2 text-text-sub hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}

            {activeSubTab === 'dividend' && dividends.map(d => (
              <div key={d.id} className="smart-card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bg-point rounded-2xl"><Coins className="w-5 h-5 text-text-sub" /></div>
                  <div>
                    <div className="text-sm font-black text-text-main">{d.products?.name}</div>
                    <div className="text-[10px] font-bold text-text-sub uppercase">{d.payment_date} • {d.products?.symbol}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div className="text-sm font-black text-primary-dark">₩{d.amount_per_share.toLocaleString()} / 주</div>
                  <button onClick={() => handleDelete('dividends', d.id)} className="p-2 text-text-sub hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            
            {((activeSubTab === 'account' && accounts.length === 0) || 
              (activeSubTab === 'product' && products.length === 0) || 
              (activeSubTab === 'transaction' && transactions.length === 0) ||
              (activeSubTab === 'price' && prices.length === 0) ||
              (activeSubTab === 'dividend' && dividends.length === 0)) && (
              <div className="py-20 text-center smart-card border-dashed border-2 bg-transparent">
                <p className="text-text-sub font-bold">데이터를 먼저 등록해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetSection
