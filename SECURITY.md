# 🛡️ EasyPick AI Tools Platform - Security Documentation

**Mission**: Comprehensive defense-in-depth security architecture protecting Korean users' AI tool interactions, payment data, and personal information.

**Compliance**: GDPR, Korean Personal Information Protection Act (PIPA), PCI DSS Level 1, OWASP Top 10.

**Architecture**: Zero-trust security model with default-deny policies, multi-layer validation, and comprehensive audit logging.

## 📋 목차

1. [보안 개요](#보안-개요)
2. [키 관리](#키-관리)
3. [인증 및 권한](#인증-및-권한)
4. [API 보안](#api-보안)
5. [데이터 보호](#데이터-보호)
6. [웹훅 보안](#웹훅-보안)
7. [스토리지 보안](#스토리지-보안)
8. [모니터링 및 로깅](#모니터링-및-로깅)
9. [사고 대응](#사고-대응)
10. [컴플라이언스](#컴플라이언스)

---

## 🛡️ 보안 개요

### 보안 원칙

- **기본 거부(Default Deny)**: 모든 접근은 기본적으로 차단되며, 명시적으로 허용된 경우만 접근 가능
- **최소 권한(Least Privilege)**: 사용자와 시스템은 필요한 최소한의 권한만 보유
- **심층 방어(Defense in Depth)**: 여러 보안 계층을 통한 다중 보안 체계
- **투명성(Transparency)**: 모든 보안 이벤트는 로깅되고 모니터링됨

### 보안 아키텍처

```
[Frontend] ←→ [CDN/WAF] ←→ [API Gateway] ←→ [Edge Functions] ←→ [Database]
     ↓               ↓              ↓              ↓              ↓
  VITE_* Only    DDoS 보호      CORS/Rate      서명검증/RLS    RLS/Audit
```

### 위협 모델

| 위협 유형 | 위험도 | 완화 조치 |
|-----------|--------|-----------|
| 데이터 유출 | 높음 | RLS, 암호화, 접근 제어 |
| 결제 사기 | 높음 | 웹훅 서명 검증, 거래 모니터링 |
| DDoS 공격 | 중간 | Rate limiting, CDN |
| 권한 상승 | 중간 | RBAC, 감사 로그 |
| 코드 주입 | 낮음 | 입력 검증, 파라미터화 쿼리 |

---

## 🔑 키 관리

### 환경변수 분류

#### 프론트엔드 (VITE_* - 공개)
```env
# 클라이언트 번들에 포함되는 공개 키들
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_TOSS_CLIENT_KEY=test_ck_...
VITE_PAYPAL_CLIENT_ID=AZaQ...
```

#### 백엔드/Edge Functions (비공개)
```env
# 서버사이드에서만 사용되는 비밀 키들
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
PAYPAL_CLIENT_SECRET=EOq...
PAYPAL_WEBHOOK_ID=WH-...
TOSS_SECRET_KEY=test_sk_...
GA4_API_SECRET=measurement_protocol_secret_...
CLERK_SECRET_KEY=sk_test_...
JWT_SECRET=your_super_secure_jwt_secret...
```

### 키 보안 수칙

1. **분리 원칙**: 프론트엔드와 백엔드 키를 명확히 분리
2. **로테이션**: 모든 비밀 키는 정기적으로 교체 (최소 90일)
3. **암호화**: 전송 중(TLS 1.3) 및 저장 시 암호화
4. **접근 제어**: 키에 대한 접근은 최소 권한 원칙 적용
5. **모니터링**: 키 사용량 및 비정상적 접근 모니터링

### 키 관리 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] 프로덕션 키가 개발/테스트 환경과 분리됨
- [ ] 웹훅 서명 검증이 활성화됨
- [ ] API 키 사용량이 모니터링됨
- [ ] 키 로테이션 일정이 수립됨

---

## 👤 인증 및 권한

### 인증 시스템 (Clerk)

#### 지원 인증 방법
- **이메일/비밀번호**: 강력한 비밀번호 정책 적용
- **소셜 로그인**: Google, Kakao 지원
- **OTP**: 선택적 2단계 인증

#### 세션 관리
- **세션 토큰**: JWT 기반, 1시간 만료
- **리프레시 토큰**: 30일 만료, 자동 갱신
- **자동 로그아웃**: 비활성 상태 24시간 후 자동 로그아웃

### 역할 기반 접근 제어 (RBAC)

#### 사용자 역할

| 역할 | 권한 | 제한사항 |
|------|------|----------|
| `free` | 기본 프롬프트, 제한된 사용량 | 10회/월 프롬프트 컴파일 |
| `pro` | 고급 기능, 확장된 사용량 | 1000회/월 프롬프트 컴파일 |
| `business` | 모든 기능, 무제한 사용량 | 없음 |
| `admin` | 시스템 관리, 모든 데이터 접근 | 감사 로그 필수 |

#### 권한 매트릭스

```sql
-- 사용자는 자신의 데이터만 접근 가능
auth.uid()::text = user_id::text

-- 관리자는 모든 데이터 접근 가능 (감사 로그 포함)
EXISTS (SELECT 1 FROM public.clerk_profiles 
        WHERE id = auth.uid() AND role = 'admin')

-- 서비스 롤은 모든 시스템 작업 수행 가능
auth.role() = 'service_role'
```

### 접근 제어 정책

1. **최소 권한**: 각 역할은 필요한 최소한의 권한만 보유
2. **권한 상승 방지**: 사용자는 자신의 역할을 변경할 수 없음
3. **시간 제한**: 관리자 세션은 더 짧은 만료 시간 적용
4. **감사 추적**: 모든 권한 사용은 로깅됨

---

## 🔌 API 보안

### Edge Function 보안

#### 공통 미들웨어 적용
```typescript
// 모든 Edge Function에 적용되는 보안 미들웨어
import { securityMiddleware } from './supabase/functions/_middleware'

export default async function handler(req: Request) {
  return securityMiddleware(req, async (req) => {
    // 실제 함수 로직
  })
}
```

#### 보안 기능
- **CORS 검증**: 허용된 도메인만 접근 가능
- **Rate Limiting**: IP당 100req/min, 사용자당 1000req/hour
- **서명 검증**: PayPal/Toss 웹훅 서명 검증
- **에러 마스킹**: 프로덕션에서 에러 정보 마스킹
- **멱등성**: 멱등키를 통한 중복 요청 방지

### API 보안 헤더

```http
# 보안 헤더 자동 적용
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### Rate Limiting 정책

| 엔드포인트 | 제한 | 윈도우 |
|------------|------|--------|
| `/events` | 100req/min | IP 기준 |
| `/paypal-webhook` | 1000req/hour | 전역 |
| `/auth/*` | 10req/min | IP 기준 |
| `/api/*` | 100req/min | 사용자 기준 |

---

## 🛡️ 데이터 보호

### Row Level Security (RLS)

#### 기본 정책
모든 테이블에 RLS 활성화 및 기본 거부 정책 적용

```sql
-- 모든 테이블 RLS 활성화
ALTER TABLE public.* ENABLE ROW LEVEL SECURITY;

-- 기본 거부 (명시적 허용 정책만 접근 가능)
-- 기본적으로 아무도 접근할 수 없음
```

#### 사용자 데이터 접근 정책

```sql
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "users_select_own" ON table_name FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- 사용자는 자신의 안전한 필드만 수정 가능
CREATE POLICY "users_update_safe_fields" ON table_name FOR UPDATE 
USING (auth.uid()::text = user_id::text)
WITH CHECK (/* 안전한 필드만 수정 가능 */);
```

#### 서비스 롤 정책

```sql
-- 서비스 롤은 모든 시스템 작업 수행 가능
CREATE POLICY "service_role_all_access" ON table_name FOR ALL 
USING (auth.role() = 'service_role');
```

### 데이터 암호화

#### 전송 중 암호화
- **TLS 1.3**: 모든 HTTP 통신
- **Certificate Pinning**: 모바일 앱에서 적용 예정
- **HSTS**: HTTP Strict Transport Security 강제

#### 저장 시 암호화
- **Database**: PostgreSQL native encryption
- **Storage**: Supabase Storage AES-256 암호화
- **Backups**: 암호화된 백업 저장

### 데이터 보존 정책

| 데이터 유형 | 보존 기간 | 자동 삭제 |
|-------------|----------|----------|
| 사용자 세션 | 1년 | ✅ |
| 분석 이벤트 | 2년 | ✅ |
| 거래 기록 | 7년 (법적 요구사항) | ✅ |
| 사용량 이벤트 | 3년 | ✅ |
| 감사 로그 | 5년 | ✅ |

---

## 🎣 웹훅 보안

### PayPal 웹훅 보안

#### 서명 검증 프로세스
1. **헤더 검증**: 필수 PayPal 헤더 존재 확인
2. **액세스 토큰**: PayPal OAuth2로 토큰 획득
3. **서명 검증**: PayPal API로 서명 검증
4. **멱등성**: 중복 이벤트 처리 방지

```typescript
// PayPal 웹훅 서명 검증
const isValid = await validatePayPalSignature(headers, body, webhookId)
if (!isValid) {
  return new Response('Invalid signature', { status: 401 })
}
```

### Toss 웹훅 보안

#### HMAC-SHA256 검증
```typescript
// Toss 웹훅 HMAC 검증
const expectedSignature = await crypto.subtle.sign(
  'HMAC', 
  secretKey, 
  encoder.encode(body)
)
```

### 웹훅 보안 수칙

1. **서명 검증**: 모든 웹훅 요청의 서명 검증 필수
2. **HTTPS Only**: HTTPS 엔드포인트만 사용
3. **타임스탬프 검증**: 요청 시간 검증으로 재생 공격 방지
4. **멱등성**: 중복 처리 방지
5. **로깅**: 모든 웹훅 요청 로깅

---

## 💾 스토리지 보안

### 버킷 보안 정책

#### 버킷 구성

| 버킷 | 공개 여부 | 용도 | 크기 제한 |
|------|----------|------|----------|
| `user-prompts` | 비공개 | 사용자 프롬프트 | 5MB |
| `user-exports` | 비공개 | 내보내기 파일 | 50MB |
| `user-avatars` | 비공개 | 프로필 이미지 | 2MB |
| `workflow-templates` | 비공개 | 워크플로우 템플릿 | 10MB |
| `public-assets` | 공개 | 정적 자원 | 10MB |

#### 접근 제어
```sql
-- 사용자는 자신의 폴더만 접근 가능
bucket_id = 'user-prompts' 
AND auth.uid()::text = (storage.foldername(name))[1]
```

### 파일 업로드 보안

#### 검증 규칙
1. **MIME 타입**: 허용된 파일 형식만 업로드
2. **파일 크기**: 역할별 저장 용량 제한
3. **파일명**: 안전한 문자만 허용 (`[a-zA-Z0-9._-]`)
4. **경로 검증**: 디렉터리 순회 공격 방지
5. **악성 파일**: 실행 파일 확장자 차단

#### 저장 용량 제한

| 역할 | 저장 용량 |
|------|----------|
| Free | 100MB |
| Pro | 1GB |
| Business | 10GB |

### 서명된 URL

#### 보안 특징
- **단기 만료**: 기본 15분, 최대 1시간
- **사용자 검증**: 본인 파일만 접근 가능
- **일회성**: 재사용 불가능한 토큰

```typescript
// 안전한 서명된 URL 생성
const signedUrl = await storage.generate_secure_url(
  'user-prompts', 
  `${userId}/prompt.json`, 
  900 // 15분
)
```

---

## 📊 모니터링 및 로깅

### 보안 이벤트 로깅

#### 로깅 대상 이벤트
- **인증 실패**: 로그인 시도 실패
- **권한 거부**: RLS 정책 위반
- **Rate Limit**: 요청 제한 초과
- **웹훅 실패**: 서명 검증 실패
- **의심스러운 활동**: 비정상적 사용 패턴

#### 로그 구조
```typescript
interface SecurityEvent {
  type: 'AUTH_FAILED' | 'RATE_LIMITED' | 'CORS_BLOCKED' | 'SIGNATURE_INVALID'
  source: string
  ip?: string
  userAgent?: string
  details?: Record<string, any>
  timestamp: string
  traceId: string
}
```

### PII 마스킹

#### 민감 정보 자동 마스킹
```typescript
const sensitiveFields = [
  'email', 'phone', 'password', 'token', 'secret', 'key',
  'credit_card', 'bank_account', 'first_name', 'last_name'
]

// 자동으로 민감 정보 마스킹 처리
masked[key] = value.length > 4 ? 
  `${value.substring(0, 2)}***${value.substring(value.length - 2)}` : 
  '***'
```

### 감사 추적

#### 감사 로그 테이블
```sql
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 모니터링 대시보드

1. **실시간 보안 이벤트**: 최근 24시간 보안 이벤트
2. **사용자 활동**: 비정상적 사용 패턴 감지
3. **시스템 상태**: API 응답시간, 에러율
4. **저장소 사용량**: 사용자별 저장 용량 모니터링

---

## 🚨 사고 대응

### 사고 분류

#### 심각도 레벨

| 레벨 | 정의 | 대응 시간 | 예시 |
|------|------|----------|------|
| P0 | 서비스 전체 중단 | 15분 | 데이터베이스 다운, 대규모 데이터 유출 |
| P1 | 핵심 기능 장애 | 1시간 | 결제 시스템 오류, 인증 장애 |
| P2 | 기능 제한 | 4시간 | 일부 기능 오류, 성능 저하 |
| P3 | 경미한 문제 | 24시간 | UI 오류, 비핵심 기능 문제 |

### 사고 대응 절차

#### 즉시 대응 (15분 이내)
1. **사고 확인**: 모니터링 알림 확인
2. **상황 파악**: 영향 범위 및 원인 조사
3. **임시 조치**: 추가 피해 방지 조치
4. **팀 알림**: 관련 팀원에게 상황 전파

#### 단기 대응 (1시간 이내)
1. **근본 원인 분석**: 상세한 원인 조사
2. **복구 작업**: 시스템 복구 및 정상화
3. **영향 평가**: 사용자 및 데이터 영향 평가
4. **고객 소통**: 필요시 고객 공지

#### 장기 대응 (24시간 이내)
1. **사후 분석**: 상세한 사고 분석 보고서 작성
2. **개선 계획**: 재발 방지 계획 수립
3. **시스템 강화**: 보안 정책 및 시스템 개선
4. **교육 실시**: 팀 교육 및 훈련

### 데이터 유출 대응

#### 즉시 조치
1. **접근 차단**: 의심스러운 접근 즉시 차단
2. **로그 보존**: 관련 로그 및 증거 보전
3. **영향 평가**: 유출된 데이터 범위 확인
4. **당국 신고**: 법적 요구사항에 따른 신고

#### 사용자 보호
1. **계정 보안**: 영향받은 계정 보안 강화
2. **비밀번호 재설정**: 전체 사용자 비밀번호 재설정 요청
3. **모니터링 강화**: 비정상적 활동 모니터링
4. **투명한 소통**: 사용자에게 상황 및 대응 조치 안내

---

## 📋 컴플라이언스

### 개인정보보호법 준수

#### 수집하는 개인정보
- **필수 정보**: 이메일, 이름 (서비스 제공용)
- **선택 정보**: 프로필 이미지, 사용 선호도
- **자동 수집**: IP 주소, 사용 로그, 쿠키

#### 개인정보 처리 원칙
1. **목적 제한**: 명시된 목적으로만 사용
2. **최소 수집**: 필요한 최소한의 정보만 수집
3. **보존 기간**: 목적 달성 후 즉시 삭제
4. **동의 획득**: 명시적 동의 후 수집
5. **안전한 처리**: 암호화 및 접근 제어

### GDPR 준수 (EU 사용자 대상)

#### 사용자 권리 보장
- **정보 접근권**: 개인정보 처리 현황 제공
- **정정·삭제권**: 잘못된 정보 수정 및 삭제
- **처리 정지권**: 개인정보 처리 중단 요청
- **데이터 이동권**: 개인정보 이동 지원

#### 기술적 조치
```sql
-- 사용자 데이터 완전 삭제 (GDPR Article 17)
CREATE FUNCTION gdpr_delete_user_data(user_uuid UUID) 
RETURNS VOID AS $$
BEGIN
  -- 모든 사용자 관련 데이터 삭제
  DELETE FROM public.clerk_profiles WHERE id = user_uuid;
  DELETE FROM public.analytics_events WHERE user_id = user_uuid;
  -- ... 기타 테이블
END;
$$ LANGUAGE plpgsql;
```

### PCI DSS 준수 (결제 정보)

#### 결제 정보 보안
1. **토큰화**: 카드 정보는 토큰으로 저장
2. **암호화**: 전송 및 저장 시 암호화
3. **접근 제어**: 최소 권한 접근
4. **모니터링**: 결제 관련 활동 모니터링

#### PCI DSS 요구사항 매핑
- **Requirement 1-2**: 방화벽 및 네트워크 보안
- **Requirement 3-4**: 카드 데이터 보호 및 암호화
- **Requirement 7-8**: 접근 제어 및 사용자 인증
- **Requirement 10-11**: 로깅 및 보안 테스트

---

## ✅ 보안 체크리스트

### 배포 전 필수 확인사항

#### 환경 설정
- [ ] 프로덕션 환경변수 설정 완료
- [ ] 개발/테스트 키가 프로덕션에 사용되지 않음
- [ ] HTTPS 강제 설정
- [ ] 보안 헤더 적용

#### 인증 및 권한
- [ ] RLS 정책 모든 테이블에 적용
- [ ] 기본 거부 정책 설정
- [ ] 관리자 계정 보안 강화
- [ ] 세션 타임아웃 설정

#### API 보안
- [ ] 웹훅 서명 검증 활성화
- [ ] Rate limiting 설정
- [ ] CORS 정책 적용
- [ ] 에러 메시지 마스킹

#### 데이터 보안
- [ ] 암호화 키 로테이션
- [ ] 백업 암호화 설정
- [ ] 데이터 보존 정책 적용
- [ ] PII 마스킹 구현

#### 모니터링
- [ ] 보안 이벤트 로깅 활성화
- [ ] 알림 설정 완료
- [ ] 대시보드 구성
- [ ] 사고 대응 계획 수립

### 정기 보안 점검 (월간)

#### 시스템 점검
- [ ] 취약점 스캔 실행
- [ ] 의존성 보안 업데이트
- [ ] 로그 분석 및 이상 활동 확인
- [ ] 백업 및 복구 테스트

#### 정책 검토
- [ ] 접근 권한 검토
- [ ] 사용자 계정 정리
- [ ] 보안 정책 업데이트
- [ ] 팀 보안 교육

---

## 📞 보안 연락처

### 보안 사고 신고
- **이메일**: security@easypick.ai
- **긴급 연락처**: +82-10-XXXX-XXXX
- **보안 신고서**: [보안 신고 양식](https://easypick.ai/security-report)

### 책임 공개 (Responsible Disclosure)
보안 취약점을 발견하신 경우, 다음 절차를 따라 신고해 주세요:

1. **비공개 신고**: security@easypick.ai로 상세 내용 전송
2. **검증 기간**: 영업일 기준 5일 이내 검증 완료
3. **수정 기간**: 심각도에 따라 15-90일 이내 수정
4. **공개**: 수정 완료 후 합의된 일정에 따라 공개

### 보안 인증 및 감사
- **SOC 2 Type II**: 계획 중 (2024년 하반기)
- **ISO 27001**: 계획 중 (2025년)
- **정기 감사**: 연 2회 외부 보안 감사

---

## 📚 추가 리소스

### 내부 문서
- [개인정보처리방침](https://easypick.ai/privacy)
- [이용약관](https://easypick.ai/terms)
- [쿠키 정책](https://easypick.ai/cookies)

### 기술 문서
- [API 문서](https://docs.easypick.ai)
- [개발자 가이드](https://github.com/easypick/docs)
- [보안 백서](https://easypick.ai/security-whitepaper)

### 외부 리소스
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase 보안 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk 보안 문서](https://clerk.com/docs/security)

---

**마지막 업데이트**: 2024년 8월 17일  
**문서 버전**: v1.0  
**담당자**: EasyPick 보안팀