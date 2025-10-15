// LocalStorage 전용 설정
console.log('🔧 Config.js 로드 시작...');

// Supabase 설정 정보 (나중에 필요할 때를 위해 보관)
const SUPABASE_URL = 'https://stlpamhtkntpvngcgyfu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHBhbWh0a250cHZuZ2NneWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjQxOTYsImV4cCI6MjA3NjA0MDE5Nn0.UfJQamd9Rus_17aHBvOkQEEsvRrq8fXi_R8msnvTofg';

// LocalStorage 전용 모드 초기화
function initializeSupabase() {
    console.log('💽 LocalStorage 전용 모드로 시작...');
    
    // LocalStorage 모드로 고정 설정
    window.USE_SUPABASE = false;
    console.log('🔧 Database Mode: LocalStorage (Production)');
    
    // LocalStorage 연결 테스트
    testConnection();
    
    console.log('✅ LocalStorage 모드 초기화 완료!');
}

// LocalStorage 연결 테스트 함수
function testConnection() {
    console.log('💾 LocalStorage 연결 테스트 중...');
    
    try {
        // LocalStorage 접근 테스트
        const testKey = 'goosCoffeeTest';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (testValue === 'test') {
            console.log('✅ LocalStorage 연결 성공!');
            
            // 기본 상품 데이터 추가 (없을 경우에만)
            initializeDefaultProducts();
            
            // 성공 알림
            setTimeout(() => {
                if (typeof showNotification === 'function') {
                    showNotification('로컬 데이터베이스 준비 완료!', 'success');
                }
            }, 1000);
            
            return true;
        } else {
            throw new Error('LocalStorage 접근 실패');
        }
    } catch (error) {
        console.error('❌ LocalStorage 연결 실패:', error);
        
        // 실패 알림
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('로컬 저장소 접근에 실패했습니다', 'error');
            }
        }, 1000);
        
        return false;
    }
}

// 기본 상품 데이터 초기화 함수
function initializeDefaultProducts() {
    const existingProducts = localStorage.getItem('goosCoffeeProducts');
    
    if (!existingProducts || JSON.parse(existingProducts).length === 0) {
        console.log('🛍️ 기본 상품 데이터 추가 중...');
        
        const defaultProducts = [
            { id: 1, name: '에티오피아 예가체프', price: 15000, createdAt: new Date().toISOString() },
            { id: 2, name: '콜롬비아 수프리모', price: 16000, createdAt: new Date().toISOString() },
            { id: 3, name: '브라질 산토스', price: 14000, createdAt: new Date().toISOString() },
            { id: 4, name: '과테말라 안티구아', price: 17000, createdAt: new Date().toISOString() },
            { id: 5, name: '케냐 AA', price: 18000, createdAt: new Date().toISOString() },
            { id: 6, name: '인도네시아 블루 만델링', price: 20000, createdAt: new Date().toISOString() }
        ];
        
        localStorage.setItem('goosCoffeeProducts', JSON.stringify(defaultProducts));
        console.log('✅ 기본 상품 6개 추가 완료!');
    } else {
        console.log('✅ 기존 상품 데이터 확인됨');
    }
}

// 페이지 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    // DOM이 이미 로드된 경우 바로 실행
    setTimeout(initializeSupabase, 100);
}