import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// 모델 설정
const MODEL_NAME = 'gemini-3-flash-preview' 

export const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('환경변수 VITE_GEMINI_API_KEY가 설정되지 않았습니다')
  }
  return genAI.getGenerativeModel({ model: MODEL_NAME })
}

/**
 * 보유 종목 기반 뉴스 선별 및 3줄 핵심 요약
 */
export async function analyzeNews(assets: string[], newsRaw: string) {
  const model = getGeminiModel()
  const prompt = `
    당신은 개인 투자자를 위한 스마트 자산관리 AI 조언자입니다.
    다음은 사용자의 보유 종목 목록입니다: ${assets.join(', ')}
    
    주어진 뉴스 텍스트를 분석하여 사용자의 종목과 가장 연관성이 높은 뉴스만 선별하세요.
    각 뉴스에 대해 다음 JSON 형식의 배열로 응답해주세요:
    [{
      "asset_symbol": "관련 종목명 또는 심볼",
      "title": "뉴스 제목 요약",
      "summary": "자산에 미치는 영향을 포함한 3줄 요약",
      "relevance_score": 1~10 점수,
      "importance": "매우 중요" | "중요" | "참고",
      "source_url": "제공된 URL"
    }]
    
    [분석할 뉴스 데이터]
    ${newsRaw}
    
    반드시 유효한 JSON 배열만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    return JSON.parse(text.replace(/```json|```/g, ''))
  } catch (error: any) {
    console.error('Gemini News Analysis Error:', error)
    return []
  }
}

/**
 * 내일의 투자 액션 플랜 리포트 생성
 */
export async function generateActionPlan(assetsSummary: string, newsSummary: string) {
  const model = getGeminiModel()
  const prompt = `
    당신은 전문 투자 전략가입니다. 사용자의 현재 자산 현황과 최근 뉴스 분석을 바탕으로 '내일의 투자 액션 플랜'을 작성해주세요.
    
    [사용자 자산 현황]
    ${assetsSummary}
    
    [최근 주요 뉴스 요약]
    ${newsSummary}
    
    다음 구조의 마크다운으로 작성해주세요:
    ## 🎯 오늘의 포트폴리오 진단
    - 현재 비중 분포의 특징과 리스크 요인 분석
    
    ## 🚀 내일의 투자 액션 플랜
    - 내일 시장에서 주목해야 할 특정 이벤트나 종목별 대응 전략 (매수/매도/보유 등 구체적으로 제언)
    
    ## 💡 개인화된 조언
    - 사용자의 성향을 고려한 한마디
    
    친절하고 신뢰감 있는 한국어로 작성해주세요. 마크다운 형식을 잘 지켜주세요.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error('Gemini Report Error:', error)
    return "리포트를 생성하는 중 오류가 발생했습니다."
  }
}
