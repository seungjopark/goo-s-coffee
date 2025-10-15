# 구스커피 주문 관리 시스템 🚀

구스커피의 커피 원두 주문을 효율적으로 관리할 수 있는 **반응형 웹 애플리케이션**입니다.  
PC와 모바일에서 모두 사용 가능하며, PWA(Progressive Web App) 기능으로 모바일 앱처럼 설치할 수 있습니다.

## ✨ 주요 기능

### 📱 **반응형 디자인**
- PC, 태블릿, 모바일 모든 기기에서 최적화된 화면
- PWA 지원으로 모바일 앱처럼 설치 및 사용 가능
- 오프라인에서도 데이터 저장 및 조회 가능

### ☕ **상품 관리**
- 커피 원두 명칭 설정 및 수정
- 가격 입력 및 관리
- 상품 추가/삭제 기능

### 📝 **주문 시스템**
- 직관적인 수량 조절 (플러스/마이너스 버튼)
- 실시간 가격 계산 (단가 × 수량)
- 여러 원두 동시 주문 가능
- 전체 주문 금액 자동 계산

### 📊 **데이터 관리**
- 일별 주문 기록 저장
- 주문 내역 조회 및 검색
- 로컬 저장소 활용으로 빠른 성능

### 📈 **통계 및 결산**
- 일별/월별/연별 매출 분석
- 상품별 판매 순위
- 시각적 차트로 매출 현황 확인
- 평균 주문액 및 주문 건수 통계

## 🚀 설치 및 실행 방법

### 1. 파일 다운로드
모든 파일을 하나의 폴더에 저장하세요:
```
Goo's Coffee/
├── index.html          # 메인 HTML 파일
├── styles.css          # CSS 스타일 파일
├── script.js           # JavaScript 기능 파일
├── manifest.json       # PWA 설정 파일
├── sw.js              # Service Worker 파일
└── README.md          # 사용 설명서
```

### 2. 웹 서버 실행
로컬에서 웹 서버를 실행해야 PWA 기능이 정상 작동합니다.

#### **방법 1: Python 사용 (추천)**
```bash
# Python 3가 설치된 경우
cd "Goo's Coffee"
python -m http.server 8000

# Python 2가 설치된 경우  
python -m SimpleHTTPServer 8000
```

#### **방법 2: Node.js 사용**
```bash
# http-server 설치
npm install -g http-server

# 서버 실행
cd "Goo's Coffee"
http-server -p 8000
```

#### **방법 3: Live Server (VSCode 확장)**
1. VSCode에서 Live Server 확장 설치
2. index.html 우클릭 → "Open with Live Server"

### 3. 웹 브라우저에서 접속
```
http://localhost:8000
```

## 📱 PWA 설치 방법

### **Android (Chrome, Samsung Internet 등)**
1. 웹사이트 접속
2. 브라우저 메뉴 → "홈 화면에 추가" 또는 "앱 설치"
3. 홈 화면에 구스커피 아이콘이 생성됨

### **iOS (Safari)**
1. Safari로 웹사이트 접속
2. 화면 하단 공유 버튼 탭
3. "홈 화면에 추가" 선택
4. 홈 화면에 구스커피 아이콘이 생성됨

### **PC (Chrome, Edge 등)**
1. 웹사이트 접속
2. 주소창 옆 "앱 설치" 버튼 클릭
3. 또는 브라우저 메뉴 → "구스커피 설치"

## 🎯 사용 방법

### **1. 상품 관리**
- "상품관리" 탭에서 커피 원두 추가/수정/삭제
- 원두명과 가격 설정

### **2. 주문 등록**
1. "주문등록" 탭에서 새 주문 생성
2. 상품 선택 및 수량 조절
3. 여러 상품 추가 가능
4. "주문 저장" 버튼으로 완료

### **3. 주문 내역 확인**
- "주문내역" 탭에서 과거 주문 조회
- 날짜별 필터링 가능
- 주문 수정/삭제 기능

### **4. 통계 분석**
- "통계" 탭에서 매출 현황 확인
- 일별/월별/연별 전환 가능
- 상품별 판매 순위 확인

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage (브라우저 로컬 저장)
- **PWA**: Service Worker, Web App Manifest
- **Icons**: Font Awesome 6.0
- **Responsive**: CSS Grid & Flexbox

## 🌟 주요 특징

### **오프라인 지원**
- 인터넷 연결 없이도 데이터 저장/조회 가능
- Service Worker로 캐싱 및 오프라인 기능 제공

### **반응형 디자인**
- 모든 화면 크기에 최적화
- 터치 친화적 UI
- 모바일 우선 설계

### **로컬 데이터 저장**
- 브라우저에 안전하게 데이터 저장
- 빠른 로딩 및 검색 성능
- 데이터 손실 방지

### **사용자 친화적 UI**
- 직관적인 인터페이스
- 실시간 피드백
- 아름다운 커피 테마 디자인

## 🎨 커스터마이징

### **색상 변경**
`styles.css` 파일의 CSS 변수 수정:
```css
:root {
    --primary-color: #8B4513;    /* 기본 브라운 색상 */
    --secondary-color: #D2B48C;  /* 연한 브라운 */
    --accent-color: #FFE4B5;     /* 강조 색상 */
}
```

### **기본 상품 변경**
`script.js` 파일의 `getDefaultProducts()` 함수 수정:
```javascript
function getDefaultProducts() {
    return [
        { id: 1, name: '새로운 원두명', price: 가격 },
        // 원하는 상품 추가
    ];
}
```

## 🔄 데이터 백업

### **수동 백업**
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 실행:
```javascript
// 데이터 내보내기
const backup = {
    products: JSON.parse(localStorage.getItem('goosCoffeeProducts')),
    orders: JSON.parse(localStorage.getItem('goosCoffeeOrders'))
};
console.log('백업 데이터:', JSON.stringify(backup));
```

### **수동 복원**
```javascript
// 데이터 가져오기 (백업 데이터를 backupData 변수에 넣고 실행)
localStorage.setItem('goosCoffeeProducts', JSON.stringify(backupData.products));
localStorage.setItem('goosCoffeeOrders', JSON.stringify(backupData.orders));
location.reload(); // 페이지 새로고침
```

## ❓ 자주 묻는 질문

### **Q: 데이터가 사라지나요?**
A: 브라우저 로컬 저장소에 저장되어 브라우저 데이터를 삭제하기 전까지는 안전합니다.

### **Q: 여러 기기에서 동기화되나요?**
A: 현재는 로컬 저장 방식으로 기기별로 독립적입니다. 클라우드 동기화는 향후 업데이트 예정입니다.

### **Q: 인터넷 없이 사용 가능한가요?**
A: PWA 기능으로 오프라인에서도 완전히 사용 가능합니다.

### **Q: 모바일 앱이 있나요?**
A: 별도 앱스토어 앱은 없지만, PWA로 설치하면 네이티브 앱처럼 사용할 수 있습니다.

## 📞 지원

문제가 있거나 개선 사항이 있으시면 언제든지 연락주세요!

---

**구스커피 주문 관리 시스템** - 더 스마트한 커피 비즈니스를 위해 ☕️
# 구스커피 주문 관리 시스템 - Wed Oct 15 14:03:05 KST 2025
