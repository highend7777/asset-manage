import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// 모델 설정 (사용자 요청: Gemini 3 Flash)
// 공식 SDK 기준 최신 네이밍 적용
const MODEL_NAME = 'gemini-2.5-flash' 

export const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('환경변수 VITE_GEMINI_API_KEY가 설정되지 않았습니다')
  }
  return genAI.getGenerativeModel({ model: MODEL_NAME })
}

/**
 * 보유 자산 기반 뉴스 선별 및 중요도 분석
 */
export async function analyzeNews(assets: string[], newsRaw: string) {
  const model = getGeminiModel()
  const prompt = `
    다음은 사용자의 보유 자산 목록입니다: ${assets.join(', ')}
    
    다음 뉴스 목록을 분석하여, 사용자의 자산과 직접적으로 연관된 뉴스만 선별해주세요.
    각 뉴스에 대해 다음 JSON 형식의 배열로 응답해주세요:
    [{
      "asset_symbol": "관련 종목/자산명",
      "title": "뉴스 제목 요약",
      "summary": "자산에 미치는 영향 위주의 1줄 요약",
      "relevance_score": 1~10 점수,
      "importance": "매우 중요" | "중요" | "참고",
      "source_url": "제공된 URL"
    }]
    
    분석할 뉴스:
    ${newsRaw}
    
    JSON 응답만 제공하고 다른 텍스트는 포함하지 마세요.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      return JSON.parse(text.replace(/```json|```/g, ''))
    } catch (parseError) {
      throw new Error(`Gemini JSON 파싱 실패: ${text.substring(0, 200)}... (사유: ${parseError})`)
    }
  } catch (error: any) {
    throw error
  }
}

/**
 * 주간 포트폴리오 분석 및 방향 제안
 */
export async function generateWeeklyReport(assetsSummary: string, newsSummary: string) {
  const model = getGeminiModel()
  const prompt = `
    당신은 전문 투자 전략가입니다. 다음 데이터를 바탕으로 '우상향 마이 자산라이프' 주간 리포트를 작성해주세요.
    
    [보유 자산 현황]
    ${assetsSummary}
    
    [지난주 주요 뉴스 요약]
    ${newsSummary}
    
    다음 형식의 마크다운으로 작성해주세요:
    1. 📊 지난주 포트폴리오 점검 (성과 및 변화)
    2. ⚠️ 주의해야 할 리스크 포인트
    3. 🚀 다음 주 투자 관점 및 제안
    4. 💡 가족을 위한 한마디
    
    친절하고 전문적인 한국어로 작성해주세요.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    throw error
  }
}

/**
 * 주요 종목 및 ETF 리스트 생성 (KR/US)
 */
export async function fetchAIProducts(market: 'KR' | 'US') {
  const model = getGeminiModel()
  const marketName = market === 'KR' ? '한국 코스피/코스닥' : '미국 뉴욕증권거래소/나스닥'
  const prompt = `
    ${marketName} 시장에서 시가총액이 가장 큰 주요 종목 100개와 주요 ETF 30개를 알려주세요.
    반드시 다음 JSON 형식의 배열로만 응답하세요:
    [{
      "name": "종목명 또는 ETF명",
      "symbol": "티커 또는 종목코드",
      "type": "stock" 또는 "etf",
      "market": "${market}"
    }]
    
    JSON 외의 설명이나 마크다운 태그는 절대 포함하지 마세요.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    return JSON.parse(text.replace(/```json|```/g, ''))
  } catch (error: any) {
    throw new Error(`${market} 종목 생성 실패: ${error.message}`)
  }
}
