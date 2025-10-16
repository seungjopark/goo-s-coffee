// LocalStorage 전용 설정
console.log('🔧 Config.js 로드 시작...');

// Supabase 설정 정보 (나중에 필요할 때를 위해 보관)
const SUPABASE_URL = 'https://stlpamhtkntpvngcgyfu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHBhbWh0a250cHZuZ2NneWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjQxOTYsImV4cCI6MjA3NjA0MDE5Nn0.UfJQamd9Rus_17aHBvOkQEEsvRrq8fXi_R8msnvTofg';

// Supabase + LocalStorage 하이브리드 모드 초기화
function initializeSupabase() {
    console.log('🚀 Supabase 하이브리드 모드로 시작...');
    
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase 라이브러리가 로드되지 않았습니다');
        window.USE_SUPABASE = false;
        console.log('🔧 Database Mode: LocalStorage (Fallback)');
        testConnection();
        return;
    }
    
    console.log('✅ Supabase 라이브러리 로드 완료');
    
    try {
        // Supabase 클라이언트 초기화
        const { createClient } = supabase;
        window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase 클라이언트 초기화 완료');
        
        // Supabase 우선 모드로 설정
        window.USE_SUPABASE = true;
        console.log('🔧 Database Mode: Supabase (Production) + LocalStorage (Fallback)');
        
        // 연결 테스트
        testConnection();
        
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        window.USE_SUPABASE = false;
        console.log('🔧 Database Mode: LocalStorage (Fallback)');
        testConnection();
    }
}

// 연결 테스트 함수 (Supabase 우선, LocalStorage 폴백)
async function testConnection() {
    if (window.USE_SUPABASE && window.supabase) {
        // Supabase 연결 테스트
        try {
            console.log('🔄 Supabase 연결 테스트 중...');
            const { data, error } = await window.supabase
                .from('products')
                .select('*')
                .limit(1);
            
            if (error) throw error;
            
            console.log('✅ Supabase 연결 성공!');
            
            // 기본 상품 데이터 추가 (없을 경우에만)
            await initializeDefaultProducts();
            
            // 성공 알림
            setTimeout(() => {
                if (typeof showNotification === 'function') {
                    showNotification('클라우드 데이터베이스에 연결되었습니다!', 'success');
                }
            }, 1000);
            
            return true;
            
        } catch (error) {
            console.error('❌ Supabase 연결 실패:', error);
            console.log('🔄 LocalStorage 폴백 모드로 전환...');
            window.USE_SUPABASE = false;
            
            // 폴백 알림
            setTimeout(() => {
                if (typeof showNotification === 'function') {
                    showNotification('로컬 모드로 전환되었습니다', 'warning');
                }
            }, 1000);
        }
    }
    
    // LocalStorage 연결 테스트 (폴백)
    try {
        console.log('💾 LocalStorage 연결 테스트 중...');
        const testKey = 'goosCoffeeTest';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (testValue === 'test') {
            console.log('✅ LocalStorage 연결 성공!');
            
            // 기본 상품 데이터 추가 (없을 경우에만)
            initializeDefaultProducts();
            
            return true;
        } else {
            throw new Error('LocalStorage 접근 실패');
        }
    } catch (error) {
        console.error('❌ LocalStorage 연결 실패:', error);
        return false;
    }
}

// 기본 상품 데이터 초기화 함수 (Supabase + LocalStorage)
async function initializeDefaultProducts() {
    const defaultProducts = [
        { name: '에티오피아 예가체프', price: 15000 },
        { name: '콜롬비아 수프리모', price: 16000 },
        { name: '브라질 산토스', price: 14000 },
        { name: '과테말라 안티구아', price: 17000 },
        { name: '케냐 AA', price: 18000 },
        { name: '인도네시아 블루 만델링', price: 20000 }
    ];
    
    if (window.USE_SUPABASE && window.supabase) {
        // Supabase 모드: 데이터베이스에서 확인
        try {
            console.log('🛍️ Supabase 상품 데이터 확인 중...');
            const { data: existingProducts, error } = await window.supabase
                .from('products')
                .select('*');
            
            if (error) throw error;
            
            if (!existingProducts || existingProducts.length === 0) {
                console.log('🛍️ Supabase에 기본 상품 데이터 추가 중...');
                
                const { error: insertError } = await window.supabase
                    .from('products')
                    .insert(defaultProducts);
                
                if (insertError) throw insertError;
                console.log('✅ Supabase에 기본 상품 6개 추가 완료!');
            } else {
                console.log('✅ Supabase 기존 상품 데이터 확인됨:', existingProducts.length, '개');
            }
            
        } catch (error) {
            console.error('❌ Supabase 상품 초기화 실패:', error);
            console.log('🔄 LocalStorage 폴백으로 전환...');
            window.USE_SUPABASE = false;
        }
    }
    
    // LocalStorage 모드 또는 폴백
    if (!window.USE_SUPABASE) {
        const existingProducts = localStorage.getItem('goosCoffeeProducts');
        
        if (!existingProducts || JSON.parse(existingProducts).length === 0) {
            console.log('🛍️ LocalStorage에 기본 상품 데이터 추가 중...');
            
            const localProducts = defaultProducts.map((product, index) => ({
                id: index + 1,
                ...product,
                createdAt: new Date().toISOString()
            }));
            
            localStorage.setItem('goosCoffeeProducts', JSON.stringify(localProducts));
            console.log('✅ LocalStorage에 기본 상품 6개 추가 완료!');
        } else {
            console.log('✅ LocalStorage 기존 상품 데이터 확인됨');
        }
    }
}

// 페이지 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    // DOM이 이미 로드된 경우 바로 실행
    setTimeout(initializeSupabase, 100);
}