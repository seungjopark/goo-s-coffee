# 🚀 구스커피 주문관리시스템 배포 가이드

## 📋 목차
1. [Vercel 배포](#vercel-배포)
2. [Supabase 설정](#supabase-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 후 확인 사항](#배포-후-확인-사항)

---

## 🌐 Vercel 배포

### 1. Vercel 계정 생성 및 설치
```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login
```

### 2. 프로젝트 배포
```bash
# 프로젝트 디렉토리에서 실행
cd "Goo's Coffee"

# Vercel 배포 (처음 배포)
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 배포 설정 확인
- `vercel.json` 파일이 이미 설정되어 있음
- 정적 파일 서빙 및 Python 서버 API 지원
- PWA 기능 완전 지원

---

## 🗄️ Supabase 설정

### 1. Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속
2. 새 프로젝트 생성
3. 데이터베이스 비밀번호 설정

### 2. 데이터베이스 스키마 실행
1. Supabase Dashboard → SQL Editor 접속
2. `supabase-setup.sql` 파일 내용 전체 복사
3. SQL Editor에 붙여넣기 후 실행 ▶️

### 3. API 키 확인
Supabase Dashboard → Settings → API에서 다음 값 복사:
- `Project URL`
- `anon public` 키

---

## ⚙️ 환경 변수 설정

### 1. 로컬 개발 환경
`env.example.txt`를 참고하여 `.env` 파일 생성:
```bash
cp env.example.txt .env
```

`.env` 파일 수정:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
APP_NAME=구스커피 주문관리시스템
```

### 2. Vercel 환경 변수 설정
Vercel Dashboard에서 환경 변수 추가:
```bash
# 또는 CLI로 설정
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

---

## ✅ 배포 후 확인 사항

### 1. 기본 기능 테스트
- [ ] PWA 설치 가능 (모바일/데스크톱)
- [ ] 상품 관리 (추가/수정/삭제/순서변경)
- [ ] 옵션 시스템 (이름 + 가격)
- [ ] 주문 등록 (직접 옵션 선택)
- [ ] 주문 요약 (개별 항목 삭제)
- [ ] 주문 내역 조회
- [ ] 매출 통계 대시보드

### 2. Supabase 연동 확인
- [ ] 상품 데이터 실시간 동기화
- [ ] 주문 데이터 저장/조회
- [ ] 옵션 정보 정상 저장

### 3. 모바일 최적화 확인
- [ ] 반응형 레이아웃
- [ ] 터치 인터페이스
- [ ] PWA 오프라인 기능
- [ ] 햅틱 피드백 (진동)

---

## 🔧 문제 해결

### Supabase 연결 문제
```javascript
// config.js에서 확인
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '설정됨' : '설정되지 않음');
```

### 배포 URL 문제
- Vercel에서 제공하는 기본 URL 사용
- 커스텀 도메인 설정 시 DNS 설정 필요

### PWA 설치 문제
- HTTPS 필수 (Vercel 자동 제공)
- `manifest.json` 및 Service Worker 정상 로드 확인

---

## 📱 최종 결과

배포 완료 후 다음과 같은 완벽한 시스템을 얻게 됩니다:

### 🏪 **완전한 카페 관리 시스템**
- ✨ 현대적이고 직관적인 UI/UX
- 📱 모바일 우선 반응형 디자인
- 🚀 PWA로 네이티브 앱 경험
- 🔄 실시간 데이터 동기화
- 📊 강력한 매출 분석 대시보드

### 🎯 **핵심 기능들**
- 🛒 **상품 관리**: 드래그앤드롭 순서 변경
- 🏷️ **옵션 시스템**: 커스텀 옵션 + 가격 설정
- 📋 **스마트 주문**: 직접 옵션 선택 + 개별 삭제
- 📈 **매출 통계**: 일/월/년 매출 분석
- 💾 **데이터 백업**: Supabase 클라우드 저장

---

🎉 **축하합니다! 완벽한 카페 주문 관리 시스템이 배포되었습니다!**
