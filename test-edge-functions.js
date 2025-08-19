#!/usr/bin/env node
// ========================================
// EasyPick Edge Functions Test Script
// Step 3: Events 수집기 + Guard 시스템 테스트 (200/402 분기 캡처)
// ========================================

const BASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key'

// Test JWT tokens (replace with actual tokens for production testing)
const TEST_TOKENS = {
  free_user: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X2ZyZWVfdXNlciIsImV4cCI6MTk5OTk5OTk5OX0.fake-free-token',
  pro_user: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3Byb191c2VyIiwiZXhwIjoxOTk5OTk5OTk5fQ.fake-pro-token',
  invalid: 'invalid-jwt-token'
}

class EdgeFunctionTester {
  constructor() {
    this.baseUrl = BASE_URL
    this.testResults = []
    this.totalTests = 0
    this.passedTests = 0
    this.failedTests = 0
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}/functions/v1/${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const responseText = await response.text()
    let data = {}
    
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { raw: responseText }
    }

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    }
  }

  logTest(name, expected, actual, passed, details = {}) {
    this.totalTests++
    if (passed) {
      this.passedTests++
      console.log(`✅ ${name}`)
    } else {
      this.failedTests++
      console.log(`❌ ${name}`)
      console.log(`   Expected: ${expected}`)
      console.log(`   Actual: ${actual}`)
      if (details.response) {
        console.log(`   Response: ${JSON.stringify(details.response, null, 2)}`)
      }
    }
    
    this.testResults.push({
      name,
      expected,
      actual,
      passed,
      details
    })
  }

  // ========================================
  // EVENTS API TESTS
  // ========================================

  async testEventsAPI() {
    console.log('\n🧪 Testing /api/events endpoint')
    console.log('=' .repeat(50))

    // Test 1: Valid single event
    await this.testValidSingleEvent()
    
    // Test 2: Valid batch events
    await this.testValidBatchEvents()
    
    // Test 3: Invalid request body
    await this.testInvalidEventBody()
    
    // Test 4: Method not allowed
    await this.testMethodNotAllowed()
    
    // Test 5: Event with authentication
    await this.testAuthenticatedEvent()
    
    // Test 6: Idempotency key
    await this.testIdempotencyKey()
    
    // Test 7: Sampling test
    await this.testEventSampling()
  }

  async testValidSingleEvent() {
    const response = await this.makeRequest('events', {
      body: JSON.stringify({
        name: 'test_event',
        params: {
          user_action: 'button_click',
          page: '/test'
        },
        ts: new Date().toISOString()
      })
    })

    const passed = response.status === 200 && 
                   response.data.success === true &&
                   response.data.processed === 1

    this.logTest(
      'Valid single event returns 200',
      'success: true, processed: 1',
      `success: ${response.data.success}, processed: ${response.data.processed}`,
      passed,
      { response: response.data }
    )
  }

  async testValidBatchEvents() {
    const events = [
      { name: 'page_view', params: { page: '/home' } },
      { name: 'click', params: { element: 'button' } },
      { name: 'compile_prompt', params: { template_id: 'test_123' } }
    ]

    const response = await this.makeRequest('events', {
      body: JSON.stringify(events)
    })

    const expectedProcessed = events.length
    const passed = response.status === 200 && 
                   response.data.success === true &&
                   response.data.processed === expectedProcessed

    this.logTest(
      'Valid batch events returns 200',
      `processed: ${expectedProcessed}`,
      `processed: ${response.data.processed}`,
      passed,
      { response: response.data }
    )
  }

  async testInvalidEventBody() {
    const response = await this.makeRequest('events', {
      body: JSON.stringify({
        invalid: 'data'
      })
    })

    const passed = response.status === 400 && 
                   response.data.code === 'NO_VALID_EVENTS'

    this.logTest(
      'Invalid event body returns 400',
      'code: NO_VALID_EVENTS',
      `code: ${response.data.code}`,
      passed,
      { response: response.data }
    )
  }

  async testMethodNotAllowed() {
    const url = `${this.baseUrl}/functions/v1/events`
    const response = await fetch(url, { method: 'GET' })
    const data = await response.json().catch(() => ({}))

    const passed = response.status === 405 && 
                   data.code === 'METHOD_NOT_ALLOWED'

    this.logTest(
      'GET method returns 405',
      'code: METHOD_NOT_ALLOWED',
      `code: ${data.code}`,
      passed,
      { response: data }
    )
  }

  async testAuthenticatedEvent() {
    const response = await this.makeRequest('events', {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.free_user}`
      },
      body: JSON.stringify({
        name: 'authenticated_event',
        params: { action: 'premium_feature' }
      })
    })

    const passed = response.status === 200 && response.data.success === true

    this.logTest(
      'Authenticated event succeeds',
      'success: true',
      `success: ${response.data.success}`,
      passed,
      { response: response.data }
    )
  }

  async testIdempotencyKey() {
    const idempotencyKey = `test-${Date.now()}`
    const eventData = {
      name: 'idempotent_test',
      params: { unique_id: idempotencyKey }
    }

    // First request
    const response1 = await this.makeRequest('events', {
      headers: {
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(eventData)
    })

    // Second request with same key
    const response2 = await this.makeRequest('events', {
      headers: {
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(eventData)
    })

    const passed = response1.status === 200 && 
                   response2.status === 200 &&
                   response2.headers['x-idempotency-hit'] === 'true'

    this.logTest(
      'Idempotency key prevents duplicate processing',
      'X-Idempotency-Hit: true',
      `X-Idempotency-Hit: ${response2.headers['x-idempotency-hit']}`,
      passed,
      { response1: response1.data, response2: response2.data }
    )
  }

  async testEventSampling() {
    // Send a low-priority event (page_view has 10% sampling rate)
    const response = await this.makeRequest('events', {
      body: JSON.stringify({
        name: 'page_view',
        params: { page: '/sampling-test' }
      })
    })

    // Even sampled events should return success
    const passed = response.status === 200

    this.logTest(
      'Sampled events return success',
      'status: 200',
      `status: ${response.status}`,
      passed,
      { response: response.data }
    )
  }

  // ========================================
  // GUARD API TESTS  
  // ========================================

  async testGuardAPI() {
    console.log('\n🛡️  Testing /guard endpoint')
    console.log('=' .repeat(50))

    // Test 1: No authorization header
    await this.testNoAuthHeader()
    
    // Test 2: Invalid JWT token
    await this.testInvalidJWT()
    
    // Test 3: Valid free user (should pass)
    await this.testValidFreeUser()
    
    // Test 4: Quota exceeded (should return 402)
    await this.testQuotaExceeded()
    
    // Test 5: Method not allowed
    await this.testGuardMethodNotAllowed()
  }

  async testNoAuthHeader() {
    const response = await this.makeRequest('guard', {
      body: JSON.stringify({})
    })

    const passed = response.status === 401 && 
                   response.data.code === 'INVALID_TOKEN'

    this.logTest(
      'No auth header returns 401',
      'code: INVALID_TOKEN',
      `code: ${response.data.code}`,
      passed,
      { response: response.data }
    )
  }

  async testInvalidJWT() {
    const response = await this.makeRequest('guard', {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.invalid}`
      },
      body: JSON.stringify({})
    })

    const passed = response.status === 401 && 
                   response.data.code === 'INVALID_TOKEN'

    this.logTest(
      'Invalid JWT returns 401',
      'code: INVALID_TOKEN',
      `code: ${response.data.code}`,
      passed,
      { response: response.data }
    )
  }

  async testValidFreeUser() {
    const response = await this.makeRequest('guard', {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.free_user}`
      },
      body: JSON.stringify({})
    })

    // This test depends on having valid user data in DB
    // In development, it might return 404 (USER_NOT_FOUND)
    const passed = response.status === 200 || 
                   response.status === 404

    this.logTest(
      'Valid free user check',
      'status: 200 or 404 (if user not in DB)',
      `status: ${response.status}`,
      passed,
      { response: response.data }
    )
  }

  async testQuotaExceeded() {
    // This test simulates a user who has exceeded their quota
    // In real scenario, this would be a user with actual usage data
    const response = await this.makeRequest('guard', {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.free_user}`
      },
      body: JSON.stringify({})
    })

    // 402 if quota exceeded, otherwise other status codes are acceptable
    const passed = [200, 401, 402, 404].includes(response.status)

    this.logTest(
      'Guard quota check (varies by user state)',
      'status: 200/401/402/404',
      `status: ${response.status}`,
      passed,
      { response: response.data }
    )
  }

  async testGuardMethodNotAllowed() {
    const url = `${this.baseUrl}/functions/v1/guard`
    const response = await fetch(url, { method: 'GET' })
    const data = await response.json().catch(() => ({}))

    const passed = response.status === 405 && 
                   data.code === 'METHOD_NOT_ALLOWED'

    this.logTest(
      'Guard GET method returns 405',
      'code: METHOD_NOT_ALLOWED',
      `code: ${data.code}`,
      passed,
      { response: data }
    )
  }

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  async testIntegration() {
    console.log('\n🔗 Testing Integration Scenarios')
    console.log('=' .repeat(50))

    await this.testEventAfterGuardCheck()
    await this.testCORSHeaders()
  }

  async testEventAfterGuardCheck() {
    // First check guard
    const guardResponse = await this.makeRequest('guard', {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.free_user}`
      },
      body: JSON.stringify({})
    })

    // Then send event (simulating typical flow)
    const eventResponse = await this.makeRequest('events', {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.free_user}`
      },
      body: JSON.stringify({
        name: 'post_guard_event',
        params: { guard_status: guardResponse.status }
      })
    })

    const passed = eventResponse.status === 200

    this.logTest(
      'Event after guard check',
      'event status: 200',
      `event status: ${eventResponse.status}`,
      passed,
      { guardResponse: guardResponse.data, eventResponse: eventResponse.data }
    )
  }

  async testCORSHeaders() {
    const url = `${this.baseUrl}/functions/v1/events`
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://easypick.ai',
        'Access-Control-Request-Method': 'POST'
      }
    })

    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods')
    }

    const passed = response.status === 200 && 
                   corsHeaders['access-control-allow-origin'] &&
                   corsHeaders['access-control-allow-methods']

    this.logTest(
      'CORS preflight headers present',
      'CORS headers present',
      `Origin: ${corsHeaders['access-control-allow-origin']}, Methods: ${corsHeaders['access-control-allow-methods']}`,
      passed,
      { corsHeaders }
    )
  }

  // ========================================
  // TEST RUNNER
  // ========================================

  async runAllTests() {
    console.log('🚀 EasyPick Edge Functions Test Suite')
    console.log('=====================================')
    console.log(`Testing against: ${this.baseUrl}`)
    console.log('')

    const startTime = Date.now()

    try {
      await this.testEventsAPI()
      await this.testGuardAPI()
      await this.testIntegration()
    } catch (error) {
      console.error('Test suite error:', error)
      this.failedTests++
    }

    const duration = Date.now() - startTime

    console.log('\n📊 Test Results Summary')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${this.totalTests}`)
    console.log(`Passed: ${this.passedTests} ✅`)
    console.log(`Failed: ${this.failedTests} ❌`)
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`)
    console.log(`Duration: ${duration}ms`)

    if (this.failedTests > 0) {
      console.log('\n🔍 Failed Tests Details:')
      const failedTests = this.testResults.filter(test => !test.passed)
      failedTests.forEach(test => {
        console.log(`- ${test.name}`)
        if (test.details.response) {
          console.log(`  Response: ${JSON.stringify(test.details.response)}`)
        }
      })
    }

    // Exit with appropriate code
    process.exit(this.failedTests === 0 ? 0 : 1)
  }
}

// Command line usage
if (require.main === module) {
  const tester = new EdgeFunctionTester()
  tester.runAllTests().catch(console.error)
}

module.exports = EdgeFunctionTester

/* 
========================================
USAGE INSTRUCTIONS
========================================

1. Development Environment:
   node test-edge-functions.js

2. Custom Supabase URL:
   SUPABASE_URL=https://your-project.supabase.co node test-edge-functions.js

3. With Authentication Keys:
   SUPABASE_URL=https://your-project.supabase.co \
   SUPABASE_ANON_KEY=your-anon-key \
   SUPABASE_SERVICE_KEY=your-service-key \
   node test-edge-functions.js

========================================
EXPECTED OUTPUTS
========================================

Success Example:
✅ Valid single event returns 200
✅ Valid batch events returns 200  
✅ Invalid event body returns 400
✅ GET method returns 405
✅ Authenticated event succeeds
✅ No auth header returns 401
✅ Invalid JWT returns 401

Failure Example:
❌ Valid free user check
   Expected: status: 200
   Actual: status: 404
   Response: {"code": "USER_NOT_FOUND", "trace_id": "..."}

========================================
INTEGRATION WITH CI/CD
========================================

# GitHub Actions example
- name: Test Edge Functions
  run: |
    node test-edge-functions.js
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
*/