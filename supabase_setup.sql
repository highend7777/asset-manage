-- 우상향 마이 자산라이프: Supabase 초기 설정 스크립트 v4
-- 일자별 상품 가격 관리 및 히스토리 조회 시스템 도입

-- 1. 기존 테이블 삭제 (초기화용)
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS news_cache CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;

-- 2. 가족 구성원 테이블
CREATE TABLE family_members (
    id PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 계좌 테이블
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    name TEXT NOT NULL,
    account_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 자산 테이블
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'KRW',
    symbol TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 상품별 일자별 가격 테이블 (NEW)
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL, -- 종목코드/심볼
    price DECIMAL NOT NULL, -- 해당 일자의 가격
    price_date DATE NOT NULL, -- 가격 기준일
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, price_date) -- 같은 날짜의 중복 가격 방지
);

-- 6. 주간 리포트 테이블
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    content TEXT NOT NULL,
    ai_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 뉴스 캐시 테이블
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

-- 8. 종목 정보 테이블
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    market TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, market)
);

-- 9. 보안 설정 (실습용 RLS 비활성화)
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices DISABLE ROW LEVEL SECURITY;
