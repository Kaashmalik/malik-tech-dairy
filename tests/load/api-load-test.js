/**
 * K6 Load Test for MTK Dairy API
 * Tests API performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// Helper function to make authenticated requests
function makeRequest(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-Tenant-ID': 'test-tenant',
    'X-User-ID': 'test-user',
  };

  const params = {
    headers,
    tags: { name: `${method} ${path}` },
  };

  if (body) {
    return http[method](`${BASE_URL}${path}`, JSON.stringify(body), params);
  } else {
    return http[method](`${BASE_URL}${path}`, params);
  }
}

// Helper function to check response
function checkResponse(response, checks = {}) {
  const defaultChecks = {
    'status is 200': r => r.status === 200,
    'response time < 500ms': r => r.timings.duration < 500,
    ...checks,
  };

  const result = check(response, defaultChecks);
  errorRate.add(!result);
  return result;
}

export function setup() {
  // Setup: Create test data if needed
  console.log('Starting load test...');
  return { timestamp: new Date().toISOString() };
}

export default function (data) {
  // Test 1: Health check
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  checkResponse(healthResponse, {
    'health check status is 200': r => r.status === 200,
  });

  // Test 2: List animals
  const animalsResponse = makeRequest('GET', '/api/animals?page=1&limit=20');
  checkResponse(animalsResponse, {
    'animals list status is 200': r => r.status === 200,
    'animals list has data': r => JSON.parse(r.body).success === true,
  });

  // Test 3: Get single animal
  const animalResponse = makeRequest('GET', '/api/animals/animal-1');
  checkResponse(animalResponse, {
    'animal detail status is 200': r => r.status === 200 || r.status === 404,
  });

  // Test 4: List milk logs
  const milkResponse = makeRequest('GET', '/api/milk?page=1&limit=20');
  checkResponse(milkResponse, {
    'milk logs status is 200': r => r.status === 200,
  });

  // Test 5: List health records
  const healthRecordsResponse = makeRequest('GET', '/api/health?page=1&limit=20');
  checkResponse(healthRecordsResponse, {
    'health records status is 200': r => r.status === 200,
  });

  // Test 6: List expenses
  const expensesResponse = makeRequest('GET', '/api/expenses?page=1&limit=20');
  checkResponse(expensesResponse, {
    'expenses status is 200': r => r.status === 200,
  });

  // Test 7: List sales
  const salesResponse = makeRequest('GET', '/api/sales?page=1&limit=20');
  checkResponse(salesResponse, {
    'sales status is 200': r => r.status === 200,
  });

  // Test 8: Search animals
  const searchResponse = makeRequest('GET', '/api/animals?search=test');
  checkResponse(searchResponse, {
    'search status is 200': r => r.status === 200,
  });

  // Test 9: Filter animals
  const filterResponse = makeRequest('GET', '/api/animals?species=cattle&status=active');
  checkResponse(filterResponse, {
    'filter status is 200': r => r.status === 200,
  });

  // Test 10: Create animal (write operation - less frequent)
  if (__VU % 10 === 0) {
    // Only 10% of virtual users create animals
    const createResponse = makeRequest('POST', '/api/animals', {
      tag: `TAG${__VU}-${__ITER}`,
      name: `Test Animal ${__VU}`,
      species: 'cattle',
      gender: 'female',
      status: 'active',
    });
    checkResponse(createResponse, {
      'create animal status is 201': r => r.status === 201 || r.status === 400,
    });
  }

  // Simulate user think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds between requests
}

export function teardown(data) {
  // Teardown: Clean up test data if needed
  console.log('Load test completed!');
}
