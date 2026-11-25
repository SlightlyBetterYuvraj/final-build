import dotenv from 'dotenv';
dotenv.config();

import { AuthService } from '../src/services/authService.js';
import { TimetableRepository } from '../src/data/repository.js';

async function verifyAuth() {
  console.log('--- Verifying Real Supabase Authentication ---');
  const repo = new TimetableRepository();
  const auth = new AuthService(repo);

  // 1. Patient Zero Login
  console.log('Attempting login with Patient Zero Admin credentials...');
  const { token, user } = await auth.login('admin@university.edu', 'AdminPass#2026!');
  console.log('✓ Login Successful!');
  console.log(`  User ID:    ${user.id}`);
  console.log(`  Email:      ${user.email}`);
  console.log(`  Role:       ${user.role}`);
  console.log(`  Full Name:  ${user.fullName}`);
  console.log(`  Entity ID:  ${user.entityId}`);
  console.log(`  Token Len:  ${token.length}`);

  // 2. Token Verification
  console.log('\nVerifying Bearer token against Supabase Auth...');
  const verified = await auth.verifyToken(token);
  console.log('✓ Token Verified!');
  console.log(`  Verified Email: ${verified.email}`);
  console.log(`  Verified Role:  ${verified.role}`);

  // 3. Negative test: invalid credentials
  console.log('\nTesting negative case (invalid password)...');
  try {
    await auth.login('admin@university.edu', 'WrongPassword123!');
    console.error('FAIL: Expected login to fail with invalid password!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✓ Correctly rejected: ${err.message}`);
  }

  // 4. Test Teacher login
  console.log('\nTesting teacher login...');
  const teacherRes = await auth.login('teacher@university.edu', 'TeacherPass#2026!');
  console.log(`✓ Teacher login verified! Role: ${teacherRes.user.role}, Name: ${teacherRes.user.fullName}`);

  // 5. Test Student login
  console.log('\nTesting student login...');
  const studentRes = await auth.login('student@university.edu', 'StudentPass#2026!');
  console.log(`✓ Student login verified! Role: ${studentRes.user.role}, Name: ${studentRes.user.fullName}`);

  console.log('\n=============================================');
  console.log('✓ All Real Supabase Auth checks passed!');
  console.log('=============================================\n');
}

verifyAuth().catch((err) => {
  console.error('Fatal auth verification error:', err);
  process.exit(1);
});
