-- 구스커피 주문관리 시스템 - Supabase 데이터베이스 설정
-- 생성일: 2025-10-15
-- 업데이트: 2025-10-16 (드래그앤드롭 순서 기능 추가)

-- =============================================
-- 1. 상품 테이블 (products) 생성
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. 주문 테이블 (orders) 생성
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_time TIME NOT NULL DEFAULT CURRENT_TIME,
    total_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 주문 상세 테이블 (order_items) 생성
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL DEFAULT 0,
    subtotal INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. 인덱스 생성 (성능 최적화)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_order_index ON products(order_index);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =============================================
-- 5. RLS (Row Level Security) 정책 설정
-- =============================================
-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (인증 없는 앱이므로)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 읽기 정책
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);

-- 쓰기 정책
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON order_items FOR INSERT WITH CHECK (true);

-- 업데이트 정책
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON order_items FOR UPDATE USING (true);

-- 삭제 정책
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON orders FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON order_items FOR DELETE USING (true);

-- =============================================
-- 6. 트리거 함수 (updated_at 자동 업데이트)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- products 테이블에 트리거 적용
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- orders 테이블에 트리거 적용
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- 7. 기존 데이터 마이그레이션 (order_index 컬럼 추가 시)
-- =============================================
-- 기존에 order_index가 NULL인 상품들에 순서 할당
UPDATE products 
SET order_index = id 
WHERE order_index IS NULL;

-- =============================================
-- 8. 샘플 데이터 삽입 (테스트용)
-- =============================================
-- 기본 상품들 추가 (중복 방지를 위한 조건부 삽입)
DO $$
BEGIN
    -- 상품이 하나도 없을 때만 샘플 데이터 삽입
    IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
        INSERT INTO products (name, price, order_index) VALUES 
            ('에티오피아 예가체프', 15000, 0),
            ('콜롬비아 수프리모', 16000, 1),
            ('브라질 산토스', 14000, 2),
            ('과테말라 안티구아', 17000, 3),
            ('케냐 AA', 18000, 4),
            ('인도네시아 블루 만델링', 20000, 5);
        RAISE NOTICE '샘플 상품 데이터가 추가되었습니다.';
    ELSE
        RAISE NOTICE '상품 데이터가 이미 존재하므로 샘플 데이터 삽입을 건너뜁니다.';
    END IF;
END $$;

-- =============================================
-- 설정 완료!
-- =============================================
-- 위 SQL을 Supabase SQL Editor에서 실행하면
-- 구스커피 주문관리 시스템이 완벽하게 작동합니다! 🚀
