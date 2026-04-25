-- 우상향 마이 자산라이프: Supabase 초기 설정 스크립트 v3
-- 계좌(Accounts) 기반 관리 시스템 도입

-- 1. 기존 테이블 삭제 (초기화용)
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS news_cache CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. 가족 구성원 테이블
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 계좌 테이블 (NEW)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    institution TEXT NOT NULL, -- 금융기관 (예: 미래에셋, 삼성증권)
    name TEXT NOT NULL, -- 계좌명 (예: IRP, 종합계좌, 비과세저축)
    account_number TEXT, -- 계좌번호 (선택)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 자산 테이블 (계좌 연결 추가)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- 어떤 계좌에 속해 있는지
    type TEXT NOT NULL, -- 'stock', 'bond', 'cash', 'crypto'
    name TEXT NOT NULL, -- 자산 이름 (예: 삼성전자, 비트코인)
    amount DECIMAL NOT NULL, -- 보유 수량 또는 금액
    currency TEXT DEFAULT 'KRW', -- 통화
    symbol TEXT, -- 티커 또는 종목 코드
    current_value DECIMAL, -- 현재 평가액
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 주간 리포트 테이블
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    content TEXT NOT NULL,
    ai_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 뉴스 캐시 테이블
CREATE TABLE news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_symbol TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    relevance_score INTEGER,
    importance TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 종목 정보 테이블
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    market TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, market)
);

-- 8. 보안 설정 (실습용 RLS 비활성화)
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
