# 📈 우상향 마이 자산라이프 (Upward My Asset Life)

가족 구성원의 주식, 채권, 예금, 가상화폐 등 다양한 자산을 한 곳에서 통합 관리하고, Gemini 3 Flash AI를 통해 투자 정보를 선별하며 주간 투자 방향을 제안하는 스마트 자산 관리 시스템입니다.

## 🚀 주요 기능
- **자산 통합 조회**: 가족 단위, 자산 유형 단위로 전체 자산 현황을 한눈에 파악
- **AI 정보 선별**: Gemini 3 Flash가 보유 자산과 직접 관련된 뉴스만 분석하여 중요도와 함께 제공
- **주간 투자 리포트**: 지난주 포트폴리오를 점검하고 다음 주 리스크와 관점 포인트를 제시
- **반응형 디자인**: 모바일과 데스크톱 모두에 최적화된 프리미엄 UI/UX

## 🛠 기술 스택
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Database & Auth)
- **AI**: Gemini 3 Flash (@google/generative-ai)
- **Visualization**: Recharts

## ⚙️ 로컬 실행 방법
1. **의존성 설치**
   ```bash
   npm install
   ```
2. **환경 변수 설정**
   - `.env` 파일을 생성하고 아래 키를 입력합니다.
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```
3. **실행**
   ```bash
   npm run dev
   ```

## 🗄 Supabase 설정 방법
1. Supabase 프로젝트의 **SQL Editor**로 이동합니다.
2. 프로젝트 루트의 `supabase_setup.sql` 파일 내용을 복사하여 붙여넣습니다.
3. **Run**을 클릭하여 테이블 및 설정을 완료합니다.

## 🌐 Vercel 배포 방법
1. GitHub 저장소에 코드를 Push합니다.
2. Vercel에서 프로젝트를 Import합니다.
3. **Environment Variables**에 위 3가지 환경 변수를 설정합니다.
4. **Deploy** 버튼을 누르면 배포가 완료됩니다.

---
**주의**: 실습용으로 RLS가 비활성화되어 있으니, 실제 서비스 시에는 보안 정책을 설정하시기 바랍니다.
