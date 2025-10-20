// Service Worker for 구스커피 주문관리 시스템
const CACHE_NAME = 'goos-coffee-v1.6';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/config.js',
    '/db.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
    console.log('[SW] 서비스 워커가 설치되었습니다.');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 캐시 저장 중...');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch((error) => {
                console.error('[SW] 캐시 저장 실패:', error);
            })
    );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
    console.log('[SW] 서비스 워커가 활성화되었습니다.');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 새 버전의 캐시가 아닌 경우 삭제
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] 오래된 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
    // GET 요청만 캐시에서 처리
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 캐시된 버전 반환
                if (response) {
                    return response;
                }

                // 캐시에 없으면 네트워크에서 가져오기
                return fetch(event.request).then((response) => {
                    // 유효한 응답이 아니면 그대로 반환
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 응답을 복제 (한 번만 사용 가능하므로)
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch((error) => {
                    console.error('[SW] 네트워크 요청 실패:', error);
                    
                    // 오프라인일 때 기본 페이지 반환
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[SW] 백그라운드 동기화 실행');
        event.waitUntil(syncData());
    }
});

// 푸시 알림 (선택사항)
self.addEventListener('push', (event) => {
    console.log('[SW] 푸시 메시지 수신:', event);
    
    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM4QjQ1MTMiLz4KPHBhdGggZD0iTTk2IDQ4Qzc3LjIgNDggNjIgNjMuMiA2MiA4MkM2MiAxMDAuOCA3Ny4yIDExNiA5NiAxMTZDMTE0LjggMTE2IDEzMCAxMDAuOCAxMzAgODJDMTMwIDYzLjIgMTE0LjggNDggOTYgNDhaIiBmaWxsPSIjRkZFNEI1Ii8+CjxwYXRoIGQ9Ik03MiA5NkM3MiA5NiA4NCA4NCA5NiA4NEMxMDggODQgMTIwIDk2IDEyMCA5NkgxNDBWMTMySDUyVjk2SDcyWiIgZmlsbD0iI0QyQjQ4QyIvPgo8cGF0aCBkPSJNNTIgMTMySDU2VjE0NEg1MlYxMzJaTTEzNiAxMzJIMTQwVjE0NEgxMzZWMTMyWiIgZmlsbD0iIzM0M0EzOCIvPgo8L3N2Zz4K',
        badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM4QjQ1MTMiLz4KPHBhdGggZD0iTTk2IDQ4Qzc3LjIgNDggNjIgNjMuMiA2MiA4MkM2MiAxMDAuOCA3Ny4yIDExNiA5NiAxMTZDMTE0LjggMTE2IDEzMCAxMDAuOCAxMzAgODJDMTMwIDYzLjIgMTE0LjggNDggOTYgNDhaIiBmaWxsPSIjRkZFNEI1Ii8+CjxwYXRoIGQ9Ik03MiA5NkM3MiA5NiA4NCA4NCA5NiA4NEMxMDggODQgMTIwIDk2IDEyMCA5NkgxNDBWMTMySDUyVjk2SDcyWiIgZmlsbD0iI0QyQjQ4QyIvPgo8cGF0aCBkPSJNNTIgMTMySDU2VjE0NEg1MlYxMzJaTTEzNiAxMzJIMTQwVjE0NEgxMzZWMTMyWiIgZmlsbD0iIzM0M0EzOCIvPgo8L3N2Zz4K',
        vibrate: [200, 100, 200],
        tag: 'goos-coffee-notification'
    };
    
    event.waitUntil(
        self.registration.showNotification('구스커피', options)
    );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 알림 클릭됨:', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// 데이터 동기화 함수
async function syncData() {
    try {
        // 오프라인 상태에서 저장된 데이터가 있다면 동기화
        const pendingData = localStorage.getItem('goosCoffeePendingSync');
        if (pendingData) {
            console.log('[SW] 동기화할 데이터가 있습니다.');
            // 실제 서버가 있다면 여기서 데이터 전송
            localStorage.removeItem('goosCoffeePendingSync');
        }
    } catch (error) {
        console.error('[SW] 데이터 동기화 실패:', error);
    }
}

// 오프라인/온라인 상태 감지
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 설치 프롬프트 관련
let deferredPrompt;

self.addEventListener('beforeinstallprompt', (event) => {
    // 기본 설치 배너 표시 방지
    event.preventDefault();
    // 나중에 사용하기 위해 이벤트 저장
    deferredPrompt = event;
});

// PWA 설치 완료 이벤트
self.addEventListener('appinstalled', (event) => {
    console.log('[SW] PWA가 설치되었습니다!');
    
    // 설치 완료 알림
    self.registration.showNotification('구스커피 앱 설치 완료!', {
        body: '이제 홈 화면에서 바로 접근할 수 있습니다.',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM4QjQ1MTMiLz4KPHBhdGggZD0iTTk2IDQ4Qzc3LjIgNDggNjIgNjMuMiA2MiA4MkM2MiAxMDAuOCA3Ny4yIDExNiA5NiAxMTZDMTE0LjggMTE2IDEzMCAxMDAuOCAxMzAgODJDMTMwIDYzLjIgMTE0LjggNDggOTYgNDhaIiBmaWxsPSIjRkZFNEI1Ii8+CjxwYXRoIGQ9Ik03MiA5NkM3MiA5NiA4NCA4NCA5NiA4NEMxMDggODQgMTIwIDk2IDEyMCA5NkgxNDBWMTMySDUyVjk2SDcyWiIgZmlsbD0iI0QyQjQ4QyIvPgo8cGF0aCBkPSJNNTIgMTMySDU2VjE0NEg1MlYxMzJaTTEzNiAxMzJIMTQwVjE0NEgxMzZWMTMyWiIgZmlsbD0iIzM0M0EzOCIvPgo8L3N2Zz4K',
        tag: 'app-installed'
    });
});
