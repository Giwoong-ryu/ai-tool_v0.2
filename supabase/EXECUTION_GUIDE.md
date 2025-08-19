# EasyPick DB 스키마 실행 가이드 (Step 2 구현 완료)

## 📋 실행 완료된 작업

### ✅ 1. DDL 스키마 파일들 생성 완료
- `supabase/ddl/00_extensions_and_config.sql` - pgvector 확장 및 설정
- `supabase/ddl/plan_tables.sql` - 구독 플랜 테이블
- `supabase/ddl/prompt_templates.sql` - 프롬프트 템플릿 시스템
- `supabase/ddl/prompt_template_forks.sql` - 템플릿 포크 관리
- `supabase/ddl/runs.sql` - 워크플로우 실행 테이블
- `supabase/ddl/run_steps.sql` - 실행 단계 상세
- `supabase/ddl/search_index.sql` - pgvector 기반 통합 검색
- `supabase/ddl/usage_events.sql` - 사용량 추적 테이블

### ✅ 2. RLS 보안 정책 구현 완료
- `supabase/rls-security-policies.sql` - 기본 DENY, 소유자 허용
- 모든 테이블에 RLS 활성화
- 서비스 롤 전체 관리 권한

### ✅ 3. 사용량 추적 및 뷰 생성 완료  
- `supabase/views/usage_monthly_aggregates.sql` - 월간 집계 뷰
- 실시간 쿼터 모니터링
- 사용 패턴 분석

### ✅ 4. 더미 데이터 준비 완료
- `supabase/sample-data.sql` - 테스트용 샘플 데이터
- 한국어 컨텍스트 포함
- 실제 사용 시나리오 반영

### ✅ 5. 통합 설치 스크립트 완료
- `supabase/setup_all.sql` - 원클릭 설치
- 단계별 실행 순서 자동화

## 🚀 실행 방법

### 방법 1: Supabase CLI 사용 (권장)

```bash
# 1. Supabase 프로젝트로 이동
cd /path/to/ai-tools-website

# 2. 데이터베이스 초기화 및 스키마 적용
supabase db reset

# 3. 또는 기존 DB에 스키마만 적용
supabase db push
```

### 방법 2: 직접 SQL 실행

```bash
# 1. PostgreSQL에 연결
psql -h your-db-host -U postgres -d your-database

# 2. 통합 설치 스크립트 실행
\i supabase/setup_all.sql

# 3. 샘플 데이터 삽입 (개발 환경만)
\i supabase/sample-data.sql
```

### 방법 3: 단계별 수동 실행

```sql
-- 1. 확장 및 기본 설정
\i supabase/ddl/00_extensions_and_config.sql

-- 2. 핵심 테이블 (의존성 순서대로)
\i supabase/ddl/plan_tables.sql

-- 3. 프롬프트 시스템
\i supabase/ddl/prompt_templates.sql
\i supabase/ddl/prompt_template_forks.sql

-- 4. 워크플로우 시스템  
\i supabase/ddl/runs.sql
\i supabase/ddl/run_steps.sql

-- 5. 검색 시스템 (pgvector 필요)
\i supabase/ddl/search_index.sql

-- 6. 사용량 추적
\i supabase/ddl/usage_events.sql

-- 7. 월간 집계 뷰
\i supabase/views/usage_monthly_aggregates.sql

-- 8. RPC 함수들
\i supabase/rpc/search_with_embedding.sql

-- 9. RLS 보안 정책
\i supabase/rls-security-policies.sql

-- 10. 샘플 데이터 (선택사항)
\i supabase/sample-data.sql
```

## 📊 실행 후 확인 사항

### 1. 테이블 생성 확인
```sql
-- 생성된 테이블 목록 확인
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'subscription_plans', 'prompt_templates', 'workflow_runs', 
  'search_index', 'usage_events'
)
ORDER BY table_name;
```

### 2. RLS 활성화 확인
```sql
-- RLS 활성화 상태 확인
SELECT 
  schemaname, 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'prompt_templates', 'workflow_runs', 'search_index', 
  'usage_events', 'subscription_plans'
)
ORDER BY tablename;
```

### 3. 샘플 데이터 확인
```sql
-- 구독 플랜 확인
SELECT id, name_ko, price_monthly, currency 
FROM subscription_plans 
ORDER BY sort_order;

-- 프롬프트 템플릿 확인  
SELECT id, name, category, status 
FROM prompt_templates 
LIMIT 5;

-- 검색 인덱스 확인
SELECT id, title, type, language 
FROM search_index 
LIMIT 5;
```

### 4. pgvector 확장 확인
```sql
-- pgvector 확장 설치 확인
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'vector';

-- 벡터 검색 테스트
SELECT search_with_embedding('AI 도구 추천', 5);
```

## 📋 예상 결과

### 성공시 출력 예시
```
🚀 EasyPick AI Tools Platform Database Setup
==============================================
Starting comprehensive database schema installation...

📦 Phase 1: Installing extensions and configuration...
NOTICE:  extension "vector" already exists, skipping
NOTICE:  extension "pg_trgm" already exists, skipping
✅ Extensions and configuration complete

🏗️ Phase 2: Creating existing schema tables...
CREATE TABLE
CREATE TABLE
CREATE TABLE
✅ Core tables created

🔍 Phase 3: Search system setup...
CREATE TABLE
CREATE FUNCTION
✅ Search system ready

📊 Phase 4: Usage tracking and views...
CREATE VIEW
CREATE VIEW
✅ Analytics system ready

🛡️ Phase 5: Security policies...
ALTER TABLE
CREATE POLICY
✅ RLS security enabled

🎯 Setup Complete!
Total tables created: 8
Total views created: 4
Total RPC functions: 6
RLS policies active: 12
```

### 테이블 목록 확인 결과
```
       table_name        | table_type 
------------------------+------------
 prompt_templates       | BASE TABLE
 prompt_template_forks  | BASE TABLE
 search_index          | BASE TABLE
 subscription_plans    | BASE TABLE
 usage_events          | BASE TABLE
 workflow_runs         | BASE TABLE
(6 rows)
```

### RLS 활성화 확인 결과
```
 schemaname |      tablename       | rls_enabled 
------------+---------------------+-------------
 public     | prompt_templates    | t
 public     | search_index        | t
 public     | subscription_plans  | t
 public     | usage_events        | t
 public     | workflow_runs       | t
(5 rows)
```

## ⚠️ 주의사항

### 1. 확장 프로그램 필요
- **pgvector**: AI 임베딩 검색을 위해 필수
- **pg_trgm**: 한국어 텍스트 검색 최적화
- **pgcrypto**: 보안 함수

### 2. 권한 설정
- 서비스 롤 키가 필요합니다
- RLS 정책으로 인해 일반 사용자는 제한된 접근만 가능

### 3. 성능 고려사항
- 벡터 검색을 위한 충분한 메모리 할당
- search_index 테이블의 인덱스 최적화
- 정기적인 VACUUM ANALYZE 권장

### 4. 백업 권장
- 실행 전 기존 데이터 백업
- 롤백 계획 수립

## 🎯 다음 단계

1. **API 연동**: 프론트엔드에서 새 테이블 사용
2. **검색 최적화**: pgvector 성능 튜닝
3. **모니터링**: 사용량 대시보드 구성
4. **보안 검증**: RLS 정책 테스트

---

**✅ Step 2 구현 완료**: 모든 DB 스키마와 RLS가 준비되었습니다!