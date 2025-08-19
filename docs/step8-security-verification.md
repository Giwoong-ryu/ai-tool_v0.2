# Step 8 보안 테스트 및 검증 가이드

## 개요
플랜/사용량 가드 연결(Step 8) 구현에 대한 포괄적인 보안 테스트 및 검증 가이드입니다.

## 1. 아키텍처 검증 ✅

### 1.1 구현 완료 컴포넌트
- **plan_tables.sql**: Free/Pro/Team 플랜 스키마 및 RLS 정책
- **usage_events.sql**: 사용량 추적 및 쿼터 관리 스키마
- **usage_monthly.sql**: 월별 사용량 뷰 (5개 최적화된 뷰)
- **guard.edge.ts**: JWT 기반 엣지 가드 함수 (sub-50ms 목표)
- **featureFlags.ts**: Guard 통합 업셀 플래그 시스템

### 1.2 보안 아키텍처 원칙
✅ **최소 권한 원칙**: RLS 정책으로 사용자별 데이터 격리
✅ **심층 방어**: JWT + Rate Limiting + SQL Injection 방지
✅ **정보 최소 노출**: 오류 응답에서 trace_id만 제공
✅ **성능 최적화**: 30초 캐싱 + 인덱스 최적화

## 2. JWT 보안 검증

### 2.1 JWT 검증 로직
```typescript
// ✅ 구현됨: guard.edge.ts:136-171
- Bearer 토큰 형식 확인
- 서명 검증 (HMAC-SHA256)
- 만료 시간 확인 (exp)
- 발급자 확인 (iss contains 'supabase')
```

### 2.2 보안 테스트 시나리오
```bash
# 테스트 1: 유효하지 않은 토큰
curl -X POST /functions/v1/guard \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"action": "compile"}'
# 예상: 401 INVALID_TOKEN

# 테스트 2: 만료된 토큰
# 예상: 401 INVALID_TOKEN

# 테스트 3: 잘못된 발급자
# 예상: 401 INVALID_TOKEN

# 테스트 4: Bearer 형식 오류
curl -X POST /functions/v1/guard \
  -H "Authorization: token123" \
  -H "Content-Type: application/json" \
  -d '{"action": "compile"}'
# 예상: 401 MISSING_AUTH
```

## 3. Rate Limiting 검증

### 3.1 구현된 제한
- **분당 요청 한도**: 60회/분/사용자
- **캐시 기반**: 메모리 기반 rate limit cache
- **윈도우**: 1분 슬라이딩 윈도우

### 3.2 테스트 시나리오
```bash
# 테스트: Rate limiting
for i in {1..65}; do
  curl -X POST /functions/v1/guard \
    -H "Authorization: Bearer $VALID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"action": "compile"}' &
done
# 예상: 61번째 요청부터 429 RATE_LIMIT_EXCEEDED
```

## 4. 쿼터 검증 테스트

### 4.1 Free 플랜 제한 (plan_tables.sql:30-41)
- **monthly_compiles**: 20회
- **monthly_saves**: 10회
- **api_calls_per_day**: 50회
- **storage_mb**: 100MB

### 4.2 쿼터 초과 시나리오
```sql
-- 테스트 데이터 설정
UPDATE quota_status 
SET compiles_used = 20, compiles_limit = 20
WHERE user_id = 'test_user_id';

-- guard.edge.ts 호출
POST /functions/v1/guard
{
  "action": "compile",
  "quantity": 1
}
-- 예상: 402 QUOTA_EXCEEDED
```

## 5. SQL Injection 방지 검증

### 5.1 보안 조치
✅ **RPC 함수 사용**: log_usage_event, check_usage_quota
✅ **파라미터화 쿼리**: Supabase 클라이언트 사용
✅ **입력 검증**: ALLOWED_ACTIONS 화이트리스트

### 5.2 SQL Injection 테스트
```bash
# 테스트: 악의적 payload
curl -X POST /functions/v1/guard \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "compile; DROP TABLE quota_status; --",
    "quantity": 1
  }'
# 예상: 400 INVALID_ACTION
```

## 6. RLS 정책 검증

### 6.1 구현된 정책 (usage_events.sql:346-382)
- **usage_events_read_own**: 본인 데이터만 조회
- **quota_status_read_own**: 본인 쿼터만 조회
- **함수 기반 삽입**: log_usage_event 함수를 통해서만

### 6.2 RLS 우회 시도 테스트
```sql
-- 테스트: 직접 테이블 접근 시도
SELECT * FROM usage_events WHERE user_id != auth.uid();
-- 예상: 빈 결과 (RLS 정책으로 차단)

-- 테스트: 다른 사용자 쿼터 조회 시도
SELECT * FROM quota_status WHERE user_id = 'other_user_id';
-- 예상: 빈 결과 (RLS 정책으로 차단)
```

## 7. 성능 및 가용성 검증

### 7.1 성능 목표 (guard.edge.ts:461-465)
- **응답 시간**: <50ms (캐시 히트시 <20ms)
- **동시 사용자**: 100+ 지원
- **메모리 사용량**: <50MB
- **에러율**: <0.1%

### 7.2 부하 테스트
```bash
# Apache Bench를 사용한 부하 테스트
ab -n 1000 -c 10 -H "Authorization: Bearer $VALID_TOKEN" \
   -H "Content-Type: application/json" \
   -p guard_payload.json \
   http://localhost:54321/functions/v1/guard

# 성능 모니터링
echo '{"action": "compile", "quantity": 1}' > guard_payload.json
```

## 8. 업셀 기능 검증

### 8.1 Guard 에러 업셀 (featureFlags.ts:349-370)
- **QUOTA_EXCEEDED** → FEATURE_UPGRADE (high urgency)
- **RATE_LIMIT_EXCEEDED** → FEATURE_BILLING (medium urgency)

### 8.2 업셀 로직 테스트
```typescript
// 테스트: Guard 에러 업셀
const upsellResult = guardUpsellService.getUpsellForGuardError(
  'QUOTA_EXCEEDED', 
  'compile'
);

// 예상 결과:
// shouldShowUpsell: true (Free 플랜인 경우)
// upsellInfo.urgency: 'high'
// upsellInfo.upgradeUrl: '/pricing?source=guard&action=compile...'
```

## 9. 통합 테스트 시나리오

### 9.1 정상 플로우
```bash
1. 유효한 JWT로 guard 호출
2. Free 플랜 사용자, 쿼터 내 요청
3. 사용량 로깅 성공
4. 200 응답 with quota info
```

### 9.2 쿼터 초과 플로우
```bash
1. 유효한 JWT로 guard 호출  
2. Free 플랜 사용자, 쿼터 초과 요청
3. 실패 로깅 (quantity: 0)
4. 402 응답 with QUOTA_EXCEEDED
5. Frontend에서 업셀 모달 표시
```

## 10. 보안 체크리스트

### 10.1 인증 & 인가 ✅
- [x] JWT 서명 검증
- [x] 토큰 만료 확인
- [x] 발급자(issuer) 확인
- [x] Bearer 형식 검증
- [x] RLS 정책 적용

### 10.2 입력 검증 ✅
- [x] Action 화이트리스트 검증
- [x] Quantity 범위 검증 (1-1000)
- [x] JSON 형식 검증
- [x] HTTP 메서드 제한 (POST only)

### 10.3 DoS 방지 ✅
- [x] Rate Limiting (60/min/user)
- [x] 요청 크기 제한
- [x] 타임아웃 설정
- [x] 캐싱으로 DB 부하 감소

### 10.4 정보 보안 ✅
- [x] 최소 정보 노출 (trace_id only)
- [x] 민감 정보 로깅 방지
- [x] 에러 메시지 정규화
- [x] SQL Injection 방지

### 10.5 감사 & 모니터링 ✅
- [x] 모든 요청 로깅
- [x] 실패 시도 추적
- [x] 성능 메트릭 수집
- [x] 보안 이벤트 기록

## 11. 배포 전 검증 절차

### 11.1 환경 변수 확인
```bash
# 필수 환경 변수
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
```

### 11.2 데이터베이스 마이그레이션
```sql
-- 순서대로 실행
1. supabase/ddl/plan_tables.sql
2. supabase/ddl/usage_events.sql  
3. supabase/views/usage_monthly.sql
```

### 11.3 Edge Function 배포
```bash
supabase functions deploy guard --project-ref your-project-ref
```

### 11.4 스모크 테스트
```bash
# 기본 기능 확인
curl -X POST https://your-project.supabase.co/functions/v1/guard \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "compile", "quantity": 1}'
```

## 12. 모니터링 및 알림

### 12.1 핵심 메트릭
- **응답 시간**: P95 < 50ms
- **에러율**: < 0.1%
- **처리량**: > 100 RPS
- **캐시 히트율**: > 70%

### 12.2 알림 조건
- 응답 시간 > 100ms 지속 5분
- 에러율 > 1% 지속 2분
- Rate limit 히트율 > 10%
- DB 연결 실패

## 결론

Step 8 구현은 보안, 성능, 확장성을 모두 고려한 enterprise-grade 솔루션입니다:

✅ **보안**: JWT 검증, RLS 정책, Rate limiting, SQL injection 방지
✅ **성능**: 30초 캐싱, 최적화된 인덱스, sub-50ms 응답
✅ **확장성**: 월별 뷰 최적화, 사용량 추적, 자동 정리
✅ **UX**: 점진적 업셀, feature flags, 에러 처리

모든 보안 테스트가 통과하면 production 배포가 가능합니다.