#!/usr/bin/env node

/**
 * GeoIntel Pro - Website Verification Script
 * Tests deployment and checks for key components
 */

const https = require('https');

const DEPLOYMENT_URL = 'https://nei3lpyczsoa.space.minimax.io';

// Test configuration
const tests = {
  'Page Loads': async () => {
    return fetch(DEPLOYMENT_URL);
  },
  'Title Check': async () => {
    const response = await fetch(DEPLOYMENT_URL);
    const html = await response.text();
    return html.includes('GeoIntel Pro') || html.includes('Intelligence Platform');
  },
  'CSS Loaded': async () => {
    const response = await fetch(DEPLOYMENT_URL);
    const html = await response.text();
    return html.includes('.css');
  },
  'JS Bundle Loaded': async () => {
    const response = await fetch(DEPLOYMENT_URL);
    const html = await response.text();
    return html.includes('.js');
  },
};

async function runTests() {
  console.log('\n=== GeoIntel Pro Deployment Verification ===\n');
  console.log(`Testing: ${DEPLOYMENT_URL}\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const [testName, testFn] of Object.entries(tests)) {
    try {
      const result = await testFn();
      const success = result && (typeof result === 'boolean' ? result : result.ok);
      
      if (success) {
        console.log(`✓ ${testName}: PASSED`);
        passed++;
      } else {
        console.log(`✗ ${testName}: FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${testName}: ERROR - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  
  if (failed === 0) {
    console.log('✓ All tests passed! Deployment successful.');
    return 0;
  } else {
    console.log('✗ Some tests failed. Manual verification recommended.');
    return 1;
  }
}

// Check for fetch availability
if (typeof fetch === 'undefined') {
  console.log('Note: Using Node.js < 18. Tests may be limited.');
  global.fetch = require('node-fetch');
}

runTests().then(code => process.exit(code)).catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
