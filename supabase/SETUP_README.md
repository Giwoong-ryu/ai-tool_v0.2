# EasyPick Database Schema Setup Guide

이지픽 AI 도구 플랫폼의 완전한 데이터베이스 스키마 설정 가이드입니다.

## 📋 개요

이 스키마는 다음 기능들을 지원합니다:
- ✅ pgvector 기반 AI 검색 시스템
- ✅ Row Level Security (RLS) 완전 구현
- ✅ 월간 사용량 추적 및 집계
- ✅ 프롬프트 템플릿 버전 관리
- ✅ 워크플로우 실행 관리
- ✅ 종합적인 분석 뷰

## 🚀 설정 순서

### 1. 기본 확장 및 설정
```sql
\i supabase/ddl/00_extensions_and_config.sql
```
- pgvector, pg_trgm, pgcrypto 확장 설치
- 한국어 텍스트 검색 설정
- 유틸리티 함수 생성

### 2. 핵심 테이블 생성 (의존성 순서대로)
```sql
\i supabase/ddl/subscription_plans.sql
\i supabase/ddl/clerk_profiles.sql
\i supabase/ddl/clerk_subscriptions.sql
\i supabase/ddl/clerk_transactions.sql
\i supabase/ddl/clerk_usage_events.sql
```

### 3. 프롬프트 및 워크플로우 시스템
```sql
\i supabase/ddl/prompt_templates.sql
\i supabase/ddl/prompt_template_forks.sql
\i supabase/ddl/runs.sql
\i supabase/ddl/run_steps.sql
```

### 4. 검색 시스템
```sql
\i supabase/ddl/search_index.sql
```

### 5. 사용량 추적
```sql
\i supabase/ddl/usage_events.sql
```

### 6. 분석 뷰 생성
```sql
\i supabase/views/usage_monthly_aggregates.sql
```

### 7. 고급 검색 RPC 함수
```sql
\i supabase/rpc/search_with_embedding.sql
\i supabase/rpc/search_fts.sql
\i supabase/rpc/rerank_by_embedding.sql
```

### 8. 보안 정책 적용
```sql
\i supabase/rls-security-policies.sql
```

### 9. 샘플 데이터 삽입 (개발 환경만)
```sql
-- 개발 환경에서만 실행
\i supabase/sample-data.sql
```

## 🔄 원클릭 설치

전체 스키마를 한 번에 설치하려면:

```bash
# Supabase CLI 사용
supabase db reset

# 또는 psql 직접 사용
psql -h your-db-host -U postgres -d your-db-name -f supabase/setup_all.sql
```

## 🔐 보안 기능

### Row Level Security (RLS)
- **기본 정책**: DENY (모든 테이블)
- **소유자 기반**: 사용자는 자신의 데이터만 접근
- **서비스 역할**: 관리 작업용 전체 접근 권한
- **공개 데이터**: 승인된 템플릿과 검색 인덱스 공개

### 주요 보안 정책
```sql
-- 예시: 프롬프트 템플릿
- 공개 템플릿: 모든 사용자 읽기 가능
- 개인 템플릿: 소유자만 접근
- 관리자: 모든 템플릿 관리 가능
```

## 📊 데이터베이스 구조

### 핵심 테이블

#### 인증 & 사용자 관리
- `clerk_profiles` - 사용자 프로필
- `clerk_subscriptions` - 구독 정보
- `clerk_transactions` - 결제 내역
- `clerk_usage_events` - 사용량 추적

#### 콘텐츠 관리
- `prompt_templates` - 프롬프트 템플릿
- `prompt_template_forks` - 템플릿 포크
- `workflow_runs` - 워크플로우 실행
- `run_steps` - 워크플로우 단계

#### 검색 시스템
- `search_index` - 통합 검색 인덱스 (pgvector)
- `search_logs` - 검색 로그 및 분석

#### 사용량 관리
- `usage_events` - 상세 사용량 로그
- `usage_summary` - 월간 집계
- `quota_status` - 실시간 쿼터 상태

### 주요 뷰

- `usage_monthly_summary` - 월간 사용량 요약
- `current_month_usage` - 현재 월 사용량
- `usage_trends` - 사용량 추세 분석
- `platform_usage_stats` - 플랫폼 전체 통계
- `usage_alerts` - 쿼터 초과 알림

## 🔍 검색 시스템

### 하이브리드 검색 (FTS + Vector)
1. **1차**: PostgreSQL FTS (한국어 최적화)
2. **2차**: pgvector 임베딩 재정렬
3. **개인화**: 사용자 행동 기반 추천

### 주요 RPC 함수
- `search_with_hybrid_ranking()` - 통합 검색
- `search_by_embedding()` - 벡터 유사도 검색
- `get_related_items()` - 관련 항목 추천
- `get_search_suggestions()` - 자동완성
- `search_personalized()` - 개인화 검색

## 📈 사용량 추적

### 실시간 쿼터 관리
- 월간 사용량 자동 집계
- 실시간 제한 확인
- 알림 및 업그레이드 안내

### 분석 대시보드
- 사용자별 상세 통계
- 플랫폼 전체 지표
- 트렌드 분석 및 예측

## 🛠️ 유지보수

### 정기 작업
```sql
-- 월간 사용량 집계 (매월 실행)
SELECT aggregate_monthly_usage();

-- 오래된 로그 정리 (매일 실행)
SELECT cleanup_old_usage_events();

-- 템플릿 버전 정리 (매주 실행)
SELECT cleanup_old_template_versions();
```

### 모니터링
```sql
-- 데이터베이스 상태 확인
SELECT * FROM monitoring.check_database_health();

-- 검색 품질 분석
SELECT * FROM search_quality_metrics;

-- 보안 이벤트 모니터링
SELECT * FROM security_monitoring;
```

## 🔧 개발 환경 설정

### 1. Supabase 프로젝트 생성
```bash
supabase init
supabase start
supabase db reset
```

### 2. 환경 변수 설정
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 3. 타입 생성
```bash
supabase gen types typescript --local > src/types/database.ts
```

## 📚 추가 리소스

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ⚠️ 주의사항

1. **프로덕션 배포 전 체크리스트**:
   - [ ] 모든 RLS 정책 활성화 확인
   - [ ] 서비스 키 보안 설정
   - [ ] 백업 정책 수립
   - [ ] 모니터링 알림 설정

2. **성능 최적화**:
   - 인덱스 사용량 모니터링
   - 쿼리 성능 정기 검토
   - pgvector 인덱스 최적화

3. **데이터 보안**:
   - 개인정보 암호화
   - 감사 로그 활성화
   - 정기 보안 검토

---

*이 가이드는 EasyPick AI Tools Platform v1.0 기준으로 작성되었습니다.*