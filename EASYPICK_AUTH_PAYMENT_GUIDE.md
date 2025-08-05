# 이지픽 통합 기능 구현 가이드

## 🎉 구현 완료된 기능

### 1. 로그인/회원가입 시스템
- ✅ 랜딩페이지 로그인 버튼 연동
- ✅ 네비게이션 바 로그인 버튼 연동
- ✅ 로그인/회원가입 모달
- ✅ 로그인 상태 유지 (localStorage)
- ✅ 프로필 드롭다운 메뉴

### 2. 소셜 로그인
- ✅ Google 로그인 버튼
- ✅ 네이버 로그인 버튼
- ✅ 카카오 로그인 버튼
- ✅ 소셜 로그인 설정 파일

### 3. PayPal 결제 시스템
- ✅ PayPal SDK 통합
- ✅ 프로 플랜 결제 버튼
- ✅ 결제 모달 UI
- ✅ 결제 성공/실패 처리

## 🚀 실행 방법

```bash
# 1. 의존성 설치
npm install
# 또는
pnpm install

# 2. 환경 변수 설정 (.env 파일 생성)
cp .env.example .env
# .env 파일을 열어서 필요한 키들을 입력

# 3. 개발 서버 실행
npm run dev
# 또는
pnpm dev
```

## 📝 사용 방법

### 1. 로그인/회원가입
- 헤더 또는 랜딩페이지의 "로그인" 버튼 클릭
- 이메일/비밀번호 또는 소셜 로그인 선택
- 데모 모드: 아무 이메일/비밀번호로 로그인 가능

### 2. 소셜 로그인
- 로그인 모달에서 Google/네이버/카카오 버튼 클릭
- 데모 모드: 클릭만으로 로그인 (실제 OAuth 연동 필요)

### 3. PayPal 결제
- 랜딩페이지 가격표에서 "프로 선택하기" 클릭
- PayPal 버튼으로 결제 진행
- 테스트 모드: PayPal Sandbox 계정 필요

## 🔧 실제 서비스 연동을 위한 추가 작업

### 1. 백엔드 API 구축
```javascript
// 필요한 API 엔드포인트
POST   /api/auth/login          // 일반 로그인
POST   /api/auth/signup         // 회원가입
POST   /api/auth/logout         // 로그아웃
GET    /api/auth/me             // 현재 사용자 정보
POST   /api/auth/social/google  // Google OAuth 콜백
POST   /api/auth/social/naver   // 네이버 OAuth 콜백
POST   /api/auth/social/kakao   // 카카오 OAuth 콜백
POST   /api/payments/paypal/create-order   // PayPal 주문 생성
POST   /api/payments/paypal/capture/:id    // PayPal 결제 승인
GET    /api/users/:id/subscription         // 구독 상태 확인
```

### 2. 소셜 로그인 설정

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. 승인된 리디렉션 URI 추가: `https://your-domain.com/auth/google/callback`
5. Client ID를 `.env` 파일에 추가

#### 네이버 로그인
1. [네이버 개발자 센터](https://developers.naver.com) 접속
2. "애플리케이션 등록" 클릭
3. 사용 API: "네이버 로그인" 선택
4. 서비스 URL과 Callback URL 설정
5. Client ID와 Client Secret을 `.env` 파일에 추가

#### 카카오 로그인
1. [카카오 개발자](https://developers.kakao.com) 접속
2. "내 애플리케이션" → "애플리케이션 추가하기"
3. "카카오 로그인" 활성화
4. Redirect URI 등록: `https://your-domain.com/auth/kakao/callback`
5. REST API 키를 `.env` 파일에 추가

### 3. PayPal 설정

#### PayPal 앱 생성
1. [PayPal Developer](https://developer.paypal.com) 접속
2. "My Apps & Credentials" → "Create App"
3. Sandbox와 Live 환경 각각 설정
4. Client ID와 Secret은 백엔드에서만 사용

#### 백엔드 PayPal 통합
```javascript
// PayPal SDK 설치
npm install @paypal/checkout-server-sdk

// 주문 생성 API
const paypal = require('@paypal/checkout-server-sdk');
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// 결제 승인 API
const request = new paypal.orders.OrdersCaptureRequest(orderId);
const response = await client.execute(request);
```

### 4. 보안 고려사항

1. **환경 변수 관리**
   - 절대 시크릿 키를 프론트엔드에 노출하지 마세요
   - `.env` 파일을 `.gitignore`에 추가
   - 프로덕션 환경에서는 환경 변수 서비스 사용 (Vercel, Netlify 등)

2. **인증 토큰 관리**
   - JWT 토큰 사용 시 만료 시간 설정
   - Refresh Token 구현으로 보안 강화
   - HTTPS 필수 사용

3. **CORS 설정**
   ```javascript
   // 백엔드 CORS 설정 예시
   app.use(cors({
     origin: 'https://your-domain.com',
     credentials: true
   }))
   ```

4. **PayPal 보안**
   - 결제 승인은 반드시 백엔드에서 처리
   - Webhook으로 결제 상태 확인
   - 결제 금액 검증 필수

### 5. 데이터베이스 스키마 예시

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  provider VARCHAR(50), -- 'local', 'google', 'naver', 'kakao'
  provider_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 구독 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan_type VARCHAR(50) DEFAULT 'free', -- 'free', 'pro'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  paypal_subscription_id VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 결제 내역 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  paypal_order_id VARCHAR(255),
  status VARCHAR(50), -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. 테스트 방법

#### 로그인/회원가입 테스트
1. 일반 회원가입 → 이메일/비밀번호 입력 → 로그인
2. 소셜 로그인 → 각 제공자별 테스트
3. 로그아웃 → 재로그인 → 세션 유지 확인

#### PayPal 결제 테스트
1. [PayPal Sandbox](https://developer.paypal.com/developer/accounts) 계정 생성
2. 테스트 구매자/판매자 계정 생성
3. Sandbox 모드에서 결제 플로우 테스트
4. Webhook 이벤트 수신 확인

### 7. 트러블슈팅

#### 일반적인 문제 해결

**소셜 로그인이 작동하지 않을 때:**
- Redirect URI가 정확히 일치하는지 확인
- 클라이언트 ID가 올바른지 확인
- 도메인이 승인된 도메인 목록에 있는지 확인

**PayPal 결제가 실패할 때:**
- PayPal 계정이 비즈니스 계정인지 확인
- 통화 설정이 올바른지 확인
- Sandbox/Production 모드 확인

**CORS 오류가 발생할 때:**
- 백엔드 CORS 설정 확인
- 프론트엔드 요청 헤더 확인
- 쿠키 설정 시 `credentials: 'include'` 추가

### 8. 프로덕션 체크리스트

- [ ] 모든 환경 변수가 프로덕션 값으로 설정됨
- [ ] HTTPS 인증서 설치됨
- [ ] 데이터베이스 백업 설정됨
- [ ] 에러 로깅 시스템 구축됨
- [ ] 보안 헤더 설정됨 (Helmet.js 등)
- [ ] Rate limiting 구현됨
- [ ] 모니터링 시스템 설정됨
- [ ] PayPal Production 앱 승인됨
- [ ] 소셜 로그인 프로덕션 설정 완료됨
- [ ] 이용약관 및 개인정보처리방침 페이지 추가됨

## 📞 지원 및 문의

추가 도움이 필요하시면 다음 리소스를 참고하세요:

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [네이버 로그인 API 문서](https://developers.naver.com/docs/login/api/)
- [카카오 로그인 REST API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [PayPal Integration 문서](https://developer.paypal.com/docs/checkout/)

---

이 가이드를 따라 이지픽 프로젝트에 로그인/회원가입, 소셜 로그인, PayPal 결제 시스템을 성공적으로 구현하실 수 있습니다! 🎉
