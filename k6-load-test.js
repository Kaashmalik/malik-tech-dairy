// k6 Load Test Script for 500 Concurrent Users
// Run with: k6 run k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 300 }, // Ramp up to 300 users
    { duration: '5m', target: 300 }, // Stay at 300 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '10m', target: 500 }, // Stay at 500 users (peak load)
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'test123' },
  { email: 'test2@example.com', password: 'test123' },
  // Add more test users as needed
];

export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Test 1: Health Check
  let res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health check status is 200': r => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Sign In (if authentication required)
  // Note: In production, you'd need to handle authentication properly
  // res = http.post(`${BASE_URL}/api/auth/sign-in`, JSON.stringify({
  //   email: user.email,
  //   password: user.password,
  // }), {
  //   headers: { "Content-Type": "application/json" },
  // });
  // check(res, {
  //   "sign in status is 200": (r) => r.status === 200,
  // }) || errorRate.add(1);

  // sleep(1);

  // Test 3: Get Dashboard Data
  res = http.get(`${BASE_URL}/api/dashboard`, {
    headers: {
      // "Authorization": `Bearer ${authToken}`, // Add auth token if needed
      'Content-Type': 'application/json',
    },
  });
  check(res, {
    'dashboard status is 200 or 401': r => r.status === 200 || r.status === 401, // 401 is OK if not authenticated
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Get Animals List
  res = http.get(`${BASE_URL}/api/animals`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  check(res, {
    'animals list status is 200 or 401': r => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Get Milk Logs
  res = http.get(`${BASE_URL}/api/milk`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  check(res, {
    'milk logs status is 200 or 401': r => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: IoT Webhook (if API key available)
  // const apiKey = __ENV.API_KEY;
  // if (apiKey) {
  //   res = http.post(
  //     `${BASE_URL}/api/iot/milk-log`,
  //     JSON.stringify({
  //       animalId: "test-animal-id",
  //       date: new Date().toISOString().split("T")[0],
  //       session: "morning",
  //       quantity: 10.5,
  //     }),
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //         "X-API-Key": apiKey,
  //       },
  //     }
  //   );
  //   check(res, {
  //     "IoT webhook status is 202": (r) => r.status === 202,
  //   }) || errorRate.add(1);
  // }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Simple text summary
  return `
    ============================================
    Load Test Summary
    ============================================
    Total Requests: ${data.metrics.http_reqs.values.count}
    Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%
    Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    ============================================
  `;
}
