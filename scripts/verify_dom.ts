async function main() {
  const res = await fetch('http://localhost:3000/');
  const html = await res.text();
  const checks = [
    'adminDashboardView',
    'adminPageHub',
    'adminSubPageHeader',
    'adminPageTimetables',
    'adminPageModules',
    'adminPageStudents',
    'adminPageFaculty',
    'adminPageMatrix',
    'adminPageSolver',
    'adminTtScopeSelect',
    'adminTtTargetSelect',
    'adminTimetableGridWrapper',
    'resetStdTargetEmail',
    'resetFacultyTargetEmail',
    'bulkStudentCsvArea',
    'switchAdminPage',
    'renderAdminTimetable',
    'handleAdminResetUserPassword'
  ];

  const missing = checks.filter(c => !html.includes(c));
  if (missing.length === 0) {
    console.log('✓ All 18 Admin Modular DOM elements & handlers verified in live HTTP output!');
    process.exit(0);
  } else {
    console.error('Missing in DOM:', missing);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Verification error:', e);
  process.exit(1);
});
