import dotenv from 'dotenv';
dotenv.config();

// Ensure APP_ENV is production for this test so legacy headers are strictly rejected
process.env.APP_ENV = 'production';
delete (process.env as any).NODE_ENV;

const BASE_URL = 'http://localhost:3000';

async function runE2EValidation() {
  console.log('================================================================');
  console.log('Production Hardening & E2E Auth Flow Verification');
  console.log('Target Server:', BASE_URL);
  console.log('Environment: APP_ENV =', process.env.APP_ENV);
  console.log('================================================================\n');

  // 1. Unauthenticated Request Guard
  console.log('1. Testing Unauthenticated Access to Admin Route (/api/generation/compile-package)...');
  const res1 = await fetch(`${BASE_URL}/api/generation/compile-package`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termId: 'term-1' }),
  });
  console.log(`   Response Status: ${res1.status} (Expected: 401)`);
  const body1 = await res1.json();
  console.log(`   Response Body:`, body1);
  if (res1.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, received ${res1.status}`);
  }
  console.log('   ✓ Unauthenticated request was strictly rejected with 401 Unauthorized.\n');

  // 2. Spoofed / Mock Header Isolation Test
  console.log('2. Testing Spoofed Header (x-user-role: admin) in Live Mode...');
  const res2 = await fetch(`${BASE_URL}/api/generation/compile-package`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admin',
      'x-user-id': 'hacker',
    },
    body: JSON.stringify({ termId: 'term-1' }),
  });
  console.log(`   Response Status: ${res2.status} (Expected: 401)`);
  const body2 = await res2.json();
  console.log(`   Response Body:`, body2);
  if (res2.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for spoofed headers in non-test mode, received ${res2.status}`);
  }
  console.log('   ✓ Spoofed x-user-role header was strictly ignored and rejected with 401.\n');

  // 3. Real Supabase Login as Patient Zero Admin
  console.log('3. Authenticating Patient Zero Admin via POST /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@university.edu',
      password: 'AdminPass#2026!',
    }),
  });
  console.log(`   Login Status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success || !loginData.token) {
    throw new Error(`Patient Zero login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('   ✓ Login Successful!');
  console.log(`     User ID:   ${loginData.user.id}`);
  console.log(`     Email:     ${loginData.user.email}`);
  console.log(`     Role:      ${loginData.user.role}`);
  console.log(`     Full Name: ${loginData.user.fullName}`);
  const adminToken = loginData.token;
  console.log(`     JWT Length: ${adminToken.length}\n`);

  // 4. Verified Session Check via GET /api/auth/me
  console.log('4. Verifying Session via GET /api/auth/me using Bearer JWT...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const meData = await meRes.json();
  console.log(`   Status: ${meRes.status}`);
  console.log(`   Me Profile:`, meData.user);
  if (!meRes.ok || meData.user.role !== 'admin') {
    throw new Error(`Failed to verify admin profile: ${JSON.stringify(meData)}`);
  }
  console.log('   ✓ Supabase verified admin token successfully.\n');

  // 5. Authenticated Admin Route Access
  console.log('5. Executing Protected Admin Route (/api/generation/compile-package) with Bearer JWT...');
  const adminOpRes = await fetch(`${BASE_URL}/api/generation/compile-package`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ termId: 'term-1' }),
  });
  const adminOpData = await adminOpRes.json();
  console.log(`   Status: ${adminOpRes.status}`);
  console.log(`   Package Size: ${adminOpData.package?.inputVersion || 'Compiled'} | Courses: ${adminOpData.package?.classes?.length || 0}`);
  if (!adminOpRes.ok || !adminOpData.success) {
    throw new Error(`Admin route failed: ${JSON.stringify(adminOpData)}`);
  }
  console.log('   ✓ Admin operation permitted and executed successfully.\n');

  // 6. Student Login & Least-Privilege Role Authorization Test
  console.log('6. Authenticating Student via POST /api/auth/login...');
  const studLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student@university.edu',
      password: 'StudentPass#2026!',
    }),
  });
  const studData = await studLoginRes.json();
  if (!studLoginRes.ok || !studData.success) {
    throw new Error(`Student login failed: ${JSON.stringify(studData)}`);
  }
  const studentToken = studData.token;
  console.log(`   ✓ Student logged in (Role: ${studData.user.role}).`);

  console.log('7. Verifying Student is Forbidden from Admin Routes (403)...');
  const forbiddenRes = await fetch(`${BASE_URL}/api/generation/compile-package`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ termId: 'term-1' }),
  });
  console.log(`   Status: ${forbiddenRes.status} (Expected: 403)`);
  const forbiddenData = await forbiddenRes.json();
  console.log(`   Response Body:`, forbiddenData);
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for student accessing admin route, got ${forbiddenRes.status}`);
  }
  console.log('   ✓ Student strictly denied access with 403 Forbidden.\n');

  // 8. Python Generator Daemon Check (port 5001)
  console.log('8. Checking Python Generator Daemon Health on Port 5001...');
  const genRes = await fetch('http://localhost:5001/health');
  const genData = await genRes.json();
  console.log(`   Generator Status: ${genRes.status} | Body:`, genData);
  if (!genRes.ok || (genData.status !== 'healthy' && genData.status !== 'ok')) {
    throw new Error(`Generator daemon unhealthy: ${JSON.stringify(genData)}`);
  }
  console.log('   ✓ Generator daemon operational on port 5001.\n');

  console.log('================================================================');
  console.log('✓ All 8 Production Hardening E2E Verification Tests PASSED!');
  console.log('================================================================\n');
}

runE2EValidation().catch((err) => {
  console.error('Fatal E2E Validation Failure:', err);
  process.exit(1);
});
