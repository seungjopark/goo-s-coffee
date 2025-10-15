// Supabase 설정
console.log('🔧 Config.js 로드 시작...');

// Supabase 실제 연결 정보
const SUPABASE_URL = 'https://stlpamhtkntpvngcgyfu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHBhbWh0a250cHZuZ2NneWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjQxOTYsImV4cCI6MjA3NjA0MDE5Nn0.UfJQamd9Rus_17aHBvOkQEEsvRrq8fXi_R8msnvTofg';

// Supabase 라이브러리 로드 확인 및 초기화
function initializeSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase 라이브러리가 로드되지 않았습니다');
        window.USE_SUPABASE = false;
        console.log('🔧 Database Mode: LocalStorage (Fallback)');
        return;
    }
    
    console.log('✅ Supabase 라이브러리 로드 완료');
    
    try {
        // Supabase 클라이언트 초기화
        const { createClient } = supabase;
        window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase 클라이언트 초기화 완료');
        
        // 개발 모드 설정
        window.USE_SUPABASE = true;
        console.log('🔧 Database Mode: Supabase (Production)');
        
        // 연결 테스트
        testConnection();
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        window.USE_SUPABASE = false;
        console.log('🔧 Database Mode: LocalStorage (Fallback)');
    }
}

// 연결 테스트 함수
async function testConnection() {
    try {
        console.log('🔄 Supabase 연결 테스트 중...');
        const { data, error } = await window.supabase
            .from('products')
            .select('*')
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Supabase 연결 성공!');
        
        // 성공 알림 (showNotification 함수가 로드된 후에 실행되도록 지연)
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('서버에 성공적으로 연결되었습니다!', 'success');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Supabase 연결 실패:', error);
        console.log('🔧 LocalStorage 모드로 전환됩니다');
        window.USE_SUPABASE = false;
        
        // 경고 알림
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('서버 연결에 실패했습니다. 로컬 모드로 실행됩니다.', 'warning');
            }
        }, 1000);
    }
}

// 페이지 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    // DOM이 이미 로드된 경우 바로 실행
    setTimeout(initializeSupabase, 100);
}
