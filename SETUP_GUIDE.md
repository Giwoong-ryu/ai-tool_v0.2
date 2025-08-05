# 🚀 AI 도구 추천 사이트 실행 가이드

## 📋 1단계: 필수 패키지 설치

```bash
# 프로젝트 디렉토리로 이동
cd C:\Users\user\Desktop\gpt\ai-tools-website

# 패키지 설치 (pnpm 사용)
pnpm install

# 또는 npm 사용
npm install

# 또는 yarn 사용
yarn install
```

## 🔧 2단계: 환경변수 설정

1. **Supabase 설정**
   - https://supabase.com 에서 계정 생성
   - 새 프로젝트 생성 (Region: Northeast Asia - Seoul)
   - Settings > API 에서 URL과 anon key 복사

2. **토스페이먼츠 설정**
   - https://developers.tosspayments.com 에서 계정 생성
   - 개발자센터에서 테스트 클라이언트 키 발급

3. **.env.local 파일 수정**
```bash
# Supabase 설정 (실제 값으로 교체)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 토스페이먼츠 설정 (실제 값으로 교체)
VITE_TOSS_CLIENT_KEY=test_ck_your_test_key

# 기타 설정
VITE_APP_URL=http://localhost:5173
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 💾 3단계: 데이터베이스 설정

1. **Supabase Dashboard > SQL Editor**에서 `database-schema.sql` 파일 내용 실행

2. **Row Level Security 확인**
   - Authentication > Settings에서 "Enable email confirmations" 끄기 (개발용)
   - 또는 이메일 인증 서비스 설정

## 🏃‍♂️ 4단계: 개발 서버 실행

```bash
# 개발 서버 시작
pnpm dev

# 또는
npm run dev

# 또는
yarn dev
```

브라우저에서 http://localhost:5173 접속

## ✅ 5단계: 기능 테스트

### 인증 테스트
1. 회원가입 테스트 (실제 이메일 사용)
2. 로그인 테스트
3. 사용자 프로필 확인

### 검색 테스트
1. AI 도구 검색
2. 카테고리 필터링
3. 북마크 기능

### 결제 테스트 (토스페이먼츠 테스트 모드)
1. 테스트 카드 정보:
   - 카드번호: 4242424242424242
   - 유효기간: 12/25
   - CVC: 123

## 🚀 6단계: 프로덕션 배포

### Vercel 배포 (추천)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_TOSS_CLIENT_KEY

# 재배포
vercel --prod
```

### Netlify 배포
1. GitHub에 코드 푸시
2. Netlify에서 GitHub 연동
3. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 환경변수 설정 (Site settings > Environment variables)

## 📊 7단계: Google Analytics 설정 (선택)

1. **Google Analytics 계정 생성**
2. **GA4 속성 생성**
3. **측정 ID를 .env에 추가**
4. **gtag 스크립트를 index.html에 추가**

```html
<!-- index.html의 <head> 태그 안에 추가 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🛠️ 문제해결

### 일반적인 오류들

1. **Supabase 연결 오류**
   - URL과 키가 정확한지 확인
   - RLS 정책이 올바른지 확인

2. **토스페이먼츠 오류**
   - 클라이언트 키가 테스트 키인지 확인
   - CORS 설정 확인

3. **빌드 오류**
   - 모든 의존성이 설치되었는지 확인
   - Node.js 버전 확인 (16+ 권장)

### 로그 확인 방법
```bash
# 개발자 도구 > Console 탭에서 오류 확인
# 네트워크 탭에서 API 요청 확인
```

## 📈 다음 단계

1. **실제 AI 도구 데이터 수집 및 입력**
2. **SEO 최적화 (메타태그, 사이트맵)**  
3. **성능 최적화 (이미지 압축, 코드 스플리팅)**
4. **사용자 피드백 수집 및 개선**
5. **마케팅 및 홍보**

## 🎯 성공 체크리스트

- [ ] 로컬 개발 환경 실행됨
- [ ] 회원가입/로그인 작동함
- [ ] AI 도구 검색 작동함
- [ ] 북마크 기능 작동함
- [ ] 테스트 결제 성공함
- [ ] 프로덕션 배포 완료함
- [ ] GA4 추적 작동함

축하합니다! 🎉 이제 실제 수익을 창출할 수 있는 AI 도구 추천 사이트가 완성되었습니다.
