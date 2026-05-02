-- 스마트 자산관리: Supabase 스키마 v3.1 (개인용 최적화)

-- 1. 기존 테이블 삭제 (초기화)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS dividends CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS news_cache CASCADE;
DROP TABLE IF EXISTS reports CASCADE;

-- 2. 계좌 테이블
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(), -- NOT NULL 제거
    name TEXT NOT NULL,
    institution TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 상품 테이블
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(), -- NOT NULL 제거
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('stock', 'bond', 'cash', 'crypto', 'etc')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol)
);

-- 4. 구매/매도 이력 테이블
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(), -- NOT NULL 제거
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    price DECIMAL NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 상품별 일자별 가격 테이블
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL,
    price_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, price_date)
);

-- 6. 상품별 배당 이력 테이블
CREATE TABLE dividends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    amount_per_share DECIMAL NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 뉴스 캐시 및 리포트
CREATE TABLE news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(), -- NOT NULL 제거
    asset_symbol TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    relevance_score INTEGER,
    importance TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(), -- NOT NULL 제거
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 보안 설정 비활성화 (개인용)
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE dividends DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
