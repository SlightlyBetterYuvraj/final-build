// Native global fetch in Node 18+

async function main() {
  console.log('Testing Admin Password Reset Endpoint...');

  // 1. Authenticate as Admin
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@university.edu', password: 'AdminPass#2026!' })
  });
  const loginData: any = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Admin login failed: ' + loginData.message);
  }
  const token = loginData.token;
  console.log('✓ Admin authenticated successfully.');

  // 2. Test Resetting Password for Student
  const resetRes = await fetch('http://localhost:3000/api/auth/admin/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      targetEmail: 'student@university.edu',
      newPassword: 'StudentNewPass#2026!'
    })
  });
  const resetData: any = await resetRes.json();
  console.log('Reset Response:', resetData);
  if (!resetRes.ok || !resetData.success) {
    throw new Error('Reset failed: ' + resetData.message);
  }
  console.log('✓ Successfully reset password for student@university.edu');

  // 3. Verify Login with New Password
  const newLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@university.edu', password: 'StudentNewPass#2026!' })
  });
  const newLoginData: any = await newLoginRes.json();
  if (!newLoginData.success) {
    throw new Error('Login with new password failed: ' + newLoginData.message);
  }
  console.log('✓ Student logged in with NEW password successfully!');

  // 4. Restore original password for ongoing test suite consistency
  const restoreRes = await fetch('http://localhost:3000/api/auth/admin/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      targetEmail: 'student@university.edu',
      newPassword: 'StudentPass#2026!'
    })
  });
  const restoreData: any = await restoreRes.json();
  if (!restoreData.success) {
    throw new Error('Restore failed');
  }
  console.log('✓ Restored original student password for test suite compatibility.');

  console.log('\n=============================================');
  console.log('✓ ALL ADMIN PASSWORD RESET CHECKS PASSED!');
  console.log('=============================================');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
