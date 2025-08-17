-- =====================================================
-- Search V2 SQL Queries: FTS + Vector 하이브리드 검색
-- =====================================================
--
-- 이 파일은 Search API에서 사용할 실제 SQL 쿼리들을 포함합니다.
-- 성능 최적화된 2단계 검색 프로세스를 구현합니다.
--
-- 목표 성능: 150-300ms 내 응답
-- =====================================================

-- =====================================================
-- 1. 기본 검색 쿼리 (FTS + Vector 하이브리드)
-- =====================================================

-- 1-1. 메인 검색 쿼리 (검색어가 있는 경우)
-- 파라미터: $1 = query, $2 = query_embedding, $3 = limit, $4 = offset, $5 = type (optional)
WITH fts_candidates AS (
    -- 1단계: Full-Text Search로 후보 추출 (상위 200개)
    SELECT 
        id,
        type,
        title,
        summary,
        tags,
        body,
        embedding,
        created_at,
        updated_at,
        ts_rank(tsv, plainto_tsquery('simple', $1)) as fts_rank
    FROM ai_items
    WHERE 
        tsv @@ plainto_tsquery('simple', $1)
        AND ($5::text IS NULL OR type = $5)
        AND embedding IS NOT NULL  -- 임베딩이 있는 항목만
    ORDER BY fts_rank DESC
    LIMIT 200
),
vector_ranked AS (
    -- 2단계: Vector Similarity로 재정렬
    SELECT 
        *,
        1 - (embedding <-> $2::vector) as vector_similarity,
        -- 통합 점수: FTS 30% + Vector 70%
        (fts_rank * 0.3) + ((1 - (embedding <-> $2::vector)) * 0.7) as combined_score
    FROM fts_candidates
    WHERE embedding IS NOT NULL
    ORDER BY combined_score DESC
)
SELECT 
    id,
    type,
    title,
    summary,
    tags,
    body,
    created_at,
    updated_at,
    fts_rank,
    vector_similarity,
    combined_score
FROM vector_ranked
LIMIT $3 OFFSET $4;

-- 1-2. 전체 조회 (검색어가 없는 경우)
-- 파라미터: $1 = limit, $2 = offset, $3 = type (optional)
SELECT 
    id,
    type,
    title,
    summary,
    tags,
    body,
    created_at,
    updated_at,
    0.0 as fts_rank,
    0.0 as vector_similarity,
    0.0 as combined_score
FROM ai_items
WHERE ($3::text IS NULL OR type = $3)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- =====================================================
-- 2. 제안 검색 쿼리 (Combobox용)
-- =====================================================

-- 2-1. 빠른 제안 검색 (FTS만 사용)
-- 파라미터: $1 = query, $2 = limit
SELECT 
    id,
    title,
    type,
    summary,
    CASE 
        WHEN title ILIKE '%' || $1 || '%' THEN 'title'
        WHEN summary ILIKE '%' || $1 || '%' THEN 'summary'  
        WHEN array_to_string(tags, ' ') ILIKE '%' || $1 || '%' THEN 'tags'
        ELSE 'content'
    END as match_reason,
    ts_rank(tsv, plainto_tsquery('simple', $1)) as rank
FROM ai_items
WHERE tsv @@ plainto_tsquery('simple', $1)
ORDER BY rank DESC, created_at DESC
LIMIT $2;

-- 2-2. 인기 검색어 기반 제안 (검색어가 짧은 경우)
-- 파라미터: $1 = query_prefix, $2 = limit
SELECT DISTINCT
    title,
    type,
    'popular' as match_reason
FROM ai_items
WHERE title ILIKE $1 || '%'
ORDER BY created_at DESC
LIMIT $2;

-- =====================================================
-- 3. 카운트 쿼리 (페이지네이션용)
-- =====================================================

-- 3-1. 검색 결과 총 개수 (검색어가 있는 경우)
-- 파라미터: $1 = query, $2 = type (optional)
SELECT COUNT(*) as total
FROM ai_items
WHERE 
    tsv @@ plainto_tsquery('simple', $1)
    AND ($2::text IS NULL OR type = $2)
    AND embedding IS NOT NULL;

-- 3-2. 전체 아이템 개수 (검색어가 없는 경우)
-- 파라미터: $1 = type (optional)
SELECT COUNT(*) as total
FROM ai_items
WHERE ($1::text IS NULL OR type = $1);

-- =====================================================
-- 4. 성능 최적화 쿼리
-- =====================================================

-- 4-1. 임베딩이 없는 아이템 확인
SELECT 
    id,
    title,
    type,
    created_at,
    CASE 
        WHEN embedding IS NULL THEN 'missing'
        WHEN embedding_updated_at IS NULL THEN 'outdated'
        WHEN embedding_updated_at < updated_at THEN 'stale'
        ELSE 'current'
    END as embedding_status
FROM ai_items
WHERE 
    embedding IS NULL 
    OR embedding_updated_at IS NULL 
    OR embedding_updated_at < updated_at
ORDER BY created_at DESC;

-- 4-2. 검색 성능 분석 (EXPLAIN ANALYZE용)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
WITH fts_candidates AS (
    SELECT id, embedding, ts_rank(tsv, plainto_tsquery('simple', 'blog writing')) as rank
    FROM ai_items
    WHERE tsv @@ plainto_tsquery('simple', 'blog writing')
    ORDER BY rank DESC
    LIMIT 200
)
SELECT 
    fc.*,
    1 - (fc.embedding <-> '[임베딩 벡터]'::vector) as similarity
FROM fts_candidates fc
WHERE fc.embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT 30;

-- =====================================================
-- 5. 통계 및 모니터링 쿼리
-- =====================================================

-- 5-1. 검색 성능 통계
SELECT 
    'search_performance' as metric_type,
    json_build_object(
        'total_items', COUNT(*),
        'items_with_embedding', COUNT(embedding),
        'embedding_coverage', ROUND(COUNT(embedding) * 100.0 / COUNT(*), 2),
        'avg_title_length', ROUND(AVG(char_length(title)), 2),
        'avg_summary_length', ROUND(AVG(char_length(summary)), 2),
        'avg_tags_count', ROUND(AVG(array_length(tags, 1)), 2)
    ) as metrics
FROM ai_items
UNION ALL
SELECT 
    'type_distribution' as metric_type,
    json_object_agg(type, count) as metrics
FROM (
    SELECT type, COUNT(*) as count
    FROM ai_items
    GROUP BY type
) t;

-- 5-2. 인덱스 사용률 체크
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'unused'
        WHEN idx_scan < 100 THEN 'low_usage'
        ELSE 'active'
    END as usage_status
FROM pg_stat_user_indexes 
WHERE tablename = 'ai_items'
ORDER BY idx_scan DESC;

-- 5-3. 테이블 크기 및 성장률
SELECT 
    'ai_items' as table_name,
    pg_size_pretty(pg_total_relation_size('ai_items')) as total_size,
    pg_size_pretty(pg_relation_size('ai_items')) as table_size,
    pg_size_pretty(
        pg_total_relation_size('ai_items') - pg_relation_size('ai_items')
    ) as index_size,
    (SELECT COUNT(*) FROM ai_items) as row_count,
    pg_size_pretty(
        pg_total_relation_size('ai_items') / GREATEST((SELECT COUNT(*) FROM ai_items), 1)
    ) as avg_row_size;

-- =====================================================
-- 6. 임베딩 관련 쿼리
-- =====================================================

-- 6-1. 임베딩 업데이트 대상 조회
-- 파라미터: $1 = batch_size
SELECT 
    id,
    title,
    summary,
    type,
    updated_at,
    embedding_updated_at
FROM ai_items
WHERE 
    embedding IS NULL 
    OR embedding_updated_at IS NULL 
    OR embedding_updated_at < updated_at
ORDER BY 
    CASE WHEN embedding IS NULL THEN 0 ELSE 1 END,  -- NULL 우선
    updated_at DESC
LIMIT $1;

-- 6-2. 임베딩 배치 업데이트
-- 파라미터: $1 = id, $2 = embedding_vector, $3 = model_name
UPDATE ai_items 
SET 
    embedding = $2::vector,
    embedding_model = $3,
    embedding_updated_at = NOW()
WHERE id = $1;

-- 6-3. 유사한 아이템 찾기 (추천 시스템용)
-- 파라미터: $1 = reference_id, $2 = limit
SELECT 
    id,
    title,
    type,
    summary,
    1 - (embedding <-> (
        SELECT embedding FROM ai_items WHERE id = $1
    )) as similarity
FROM ai_items
WHERE 
    id != $1 
    AND embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT $2;

-- =====================================================
-- 7. 관리용 쿼리
-- =====================================================

-- 7-1. 중복 제목 검사
SELECT 
    title,
    COUNT(*) as duplicate_count,
    array_agg(id) as item_ids
FROM ai_items
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 7-2. 태그 사용 통계
SELECT 
    tag,
    COUNT(*) as usage_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ai_items), 2) as usage_percentage
FROM (
    SELECT unnest(tags) as tag
    FROM ai_items
    WHERE tags IS NOT NULL
) tag_list
GROUP BY tag
ORDER BY usage_count DESC
LIMIT 50;

-- 7-3. 오래된 아이템 정리
-- 파라미터: $1 = days_old
SELECT 
    id,
    title,
    type,
    created_at,
    updated_at,
    DATE_PART('day', NOW() - updated_at) as days_since_update
FROM ai_items
WHERE updated_at < NOW() - INTERVAL '$1 days'
ORDER BY updated_at ASC;

-- =====================================================
-- 8. 개발/테스트용 쿼리
-- =====================================================

-- 8-1. 랜덤 샘플 데이터 생성
INSERT INTO ai_items (type, title, summary, tags, body)
SELECT 
    (ARRAY['tool', 'template', 'workflow'])[1 + floor(random() * 3)::int] as type,
    'Test Item ' || generate_series as title,
    'This is a test summary for item ' || generate_series as summary,
    ARRAY['test', 'sample', 'data'] as tags,
    json_build_object('test', true, 'iteration', generate_series) as body
FROM generate_series(1, 100);

-- 8-2. 성능 테스트용 대량 데이터
-- 주의: 실제 프로덕션에서는 실행하지 말 것
/*
INSERT INTO ai_items (type, title, summary, tags, body)
SELECT 
    (ARRAY['tool', 'template', 'workflow'])[1 + floor(random() * 3)::int],
    'Performance Test Item ' || i,
    'Performance test summary with various keywords like AI, machine learning, data science, automation, productivity, creativity, analysis, optimization, generation, workflow, template, tool, solution, platform, service, application, system, framework, library, plugin, extension, addon, feature, function, capability, enhancement, improvement, upgrade, update, version, release, beta, alpha, stable, production, development, testing, debugging, monitoring, analytics, metrics, performance, speed, efficiency, accuracy, reliability, scalability, security, privacy, compliance, governance, management, administration, configuration, setup, installation, deployment, integration, migration, backup, recovery, maintenance, support, documentation, tutorial, guide, manual, reference, example, demo, sample, prototype, proof of concept, MVP, beta test, user acceptance test, quality assurance, validation, verification, certification, approval, authorization, authentication, access control, permissions, roles, privileges, rights, security, safety, protection, prevention, detection, response, recovery, resilience, robustness, stability, consistency, integrity, availability, accessibility, usability, user experience, user interface, design, layout, styling, branding, theming, customization, personalization, localization, internationalization, globalization, translation, language, locale, region, country, timezone, currency, format, encoding, charset, unicode, utf8, ascii, binary, text, string, number, integer, float, decimal, boolean, date, time, timestamp, duration, interval, range, list, array, object, json, xml, yaml, csv, excel, pdf, image, video, audio, file, document, content, media, asset, resource, data, information, knowledge, intelligence, insight, wisdom, understanding, comprehension, awareness, consciousness, perception, observation, analysis, synthesis, evaluation, assessment, judgment, decision, choice, option, alternative, solution, answer, result, outcome, output, product, service, offering, delivery, fulfillment, satisfaction, success, achievement, accomplishment, completion, finish, end, goal, objective, target, milestone, benchmark, standard, criteria, requirement, specification, definition, description, explanation, clarification, instruction, direction, guidance, advice, recommendation, suggestion, tip, hint, clue, example, illustration, demonstration, proof, evidence, testimony, witness, verification, validation, confirmation, approval, endorsement, certification, accreditation, authorization, permission, license, patent, copyright, trademark, brand, logo, symbol, icon, image, picture, photo, graphic, chart, diagram, map, model, simulation, emulation, virtualization, automation, orchestration, coordination, synchronization, integration, combination, merger, fusion, synthesis, composition, construction, creation, generation, production, manufacturing, assembly, building, development, implementation, execution, operation, function, process, procedure, method, technique, approach, strategy, tactic, plan, scheme, design, pattern, template, framework, structure, architecture, infrastructure, platform, foundation, base, core, kernel, engine, runtime, environment, context, scope, domain, field, area, sector, industry, market, segment, niche, category, class, type, kind, sort, variety, version, variant, flavor, style, theme, mode, format, layout, structure, organization, hierarchy, taxonomy, classification, categorization, grouping, clustering, partitioning, segmentation, division, separation, isolation, abstraction, encapsulation, modularization, componentization, decomposition, analysis, breakdown, dissection, examination, inspection, investigation, exploration, discovery, research, study, survey, review, audit, assessment, evaluation, testing, validation, verification, quality assurance, quality control, monitoring, tracking, logging, reporting, alerting, notification, messaging, communication, collaboration, coordination, cooperation, teamwork, partnership, alliance, network, community, ecosystem, environment, culture, values, principles, beliefs, philosophy, vision, mission, purpose, goal, objective, strategy, plan, roadmap, timeline, schedule, calendar, agenda, task, activity, action, step, phase, stage, level, tier, layer, dimension, aspect, facet, perspective, viewpoint, angle, approach, method, technique, tool, utility, helper, assistant, companion, guide, mentor, teacher, instructor, trainer, coach, consultant, advisor, expert, specialist, professional, practitioner, user, customer, client, stakeholder, participant, member, contributor, collaborator, partner, ally, supporter, advocate, champion, leader, manager, administrator, operator, developer, engineer, architect, designer, analyst, researcher, scientist, scholar, academic, student, learner, beginner, novice, intermediate, advanced, expert, master, guru, ninja, wizard, superhero, genius, prodigy, talent, skill, ability, capability, competency, proficiency, expertise, mastery, excellence, quality, superiority, advantage, benefit, value, worth, merit, importance, significance, relevance, impact, influence, effect, result, consequence, outcome, achievement, success, victory, win, triumph, accomplishment, completion, fulfillment, satisfaction, happiness, joy, pleasure, delight, excitement, enthusiasm, passion, love, care, concern, interest, curiosity, wonder, amazement, surprise, shock, awe, respect, admiration, appreciation, gratitude, thankfulness, recognition, acknowledgment, praise, compliment, commendation, approval, endorsement, support, encouragement, motivation, inspiration, empowerment, enablement, facilitation, assistance, help, aid, service, solution, answer, response, reply, feedback, comment, suggestion, recommendation, advice, guidance, direction, instruction, information, knowledge, wisdom, insight, understanding, comprehension, awareness, consciousness, mindfulness, attention, focus, concentration, dedication, commitment, determination, perseverance, persistence, resilience, strength, power, energy, force, momentum, progress, advancement, improvement, enhancement, upgrade, evolution, development, growth, expansion, scaling, optimization, refinement, polishing, finishing, completion, perfection, excellence, mastery, expertise, proficiency, competency, capability, ability, skill, talent, gift, blessing, advantage, benefit, value, worth, merit, quality, superiority, leadership, management, administration, governance, control, regulation, compliance, standards, guidelines, rules, policies, procedures, processes, workflows, systems, frameworks, architectures, infrastructures, platforms, foundations, bases, cores, kernels, engines, runtimes, environments, contexts, scopes, domains, fields, areas, sectors, industries, markets, segments, niches, categories, classes, types, kinds, sorts, varieties, versions, variants, flavors, styles, themes, modes, formats, layouts, structures, organizations, hierarchies, taxonomies, classifications, categorizations, groupings, clusterings, partitions, segments, divisions, separations, isolations, abstractions, encapsulations, modularizations, componentizations' || ' iteration ' || i,
    ARRAY['performance', 'test', 'data', 'sample', 'benchmark', 'load', 'stress'],
    json_build_object('performance_test', true, 'iteration', i, 'size', 'large')
FROM generate_series(1, 10000) i;
*/

-- 8-3. 데이터 정리 (테스트 후)
DELETE FROM ai_items WHERE title LIKE 'Test Item %' OR title LIKE 'Performance Test Item %';

-- =====================================================
-- 9. 쿼리 성능 최적화 팁
-- =====================================================

/*
성능 최적화 가이드:

1. 인덱스 활용
   - FTS: tsv 컬럼의 GIN 인덱스 사용
   - Vector: embedding 컬럼의 HNSW 인덱스 사용
   - 필터링: type, created_at 인덱스 활용

2. 쿼리 최적화
   - FTS 단계에서 적절한 후보 수 제한 (200개)
   - WHERE 절에서 임베딩 존재 여부 먼저 확인
   - 불필요한 컬럼 조회 방지

3. 연결 최적화
   - 연결 풀 사용 (pg-pool, pgbouncer)
   - 적절한 타임아웃 설정
   - 트랜잭션 최소화

4. 캐싱 전략
   - 인기 검색어 결과 캐싱
   - 임베딩 생성 결과 캐싱
   - 통계 쿼리 결과 캐싱

5. 모니터링
   - 쿼리 실행 계획 정기 점검
   - 슬로우 쿼리 로그 분석
   - 인덱스 사용률 모니터링
*/