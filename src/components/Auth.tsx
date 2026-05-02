import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, UserPlus, Sparkles, Mail, Lock } from 'lucide-react'

const Auth = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({ type: 'success', text: '인증 메일이 발송되었습니다. 이메일을 확인해주세요!' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-white rounded-3xl shadow-xl shadow-primary/10 mb-4 animate-float">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            스마트 <span className="text-gradient">자산관리</span>
          </h1>
          <p className="text-slate-500 font-medium">당신만의 AI 투자 조언자를 만나보세요</p>
        </div>

        <div className="smart-card p-8 bg-white/80 backdrop-blur-xl">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="smart-input w-full pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="smart-input w-full pl-11"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="smart-btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isSignUp ? '시작하기' : '로그인'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '처음이신가요? 회원가입하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth
