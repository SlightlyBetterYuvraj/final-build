/**
 * PlanMyClass Visual Identity & Enterprise Academic Schedule Management Platform.
 * Features:
 * - Brand Landing Page Hero ("Smarter Timetables, Brighter Days") with 2.5D graphics and value props
 * - Role Selection Gate (Admin, Teacher, Student) with soft pastel cards
 * - Role-Based Secure Login Modal with custom role graphics & Supabase Auth integration
 * - Student Timetable Dashboard with color-coded badges, 2-slot lab spanning, and live alerts
 * - Teacher Dashboard with personal schedule, slot drawer, quick cancel/reschedule, and empty room finder
 * - Admin Command Center with summary metrics, campus audit grid, modular management, CP-SAT solver console, user provisioning, and room utilization matrix
 * - Trademark bottom-wave graphical divider anchoring the page
 * Adheres strictly to D01–D50, DEC-01–DEC-15, and AGENTS.md.
 */

export function renderHtmlUI(config?: { supabaseUrl?: string; supabaseAnonKey?: string }): string {
  const ICONS = {
    calendar: `<svg class="lucide lucide-calendar" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,
    dashboard: `<svg class="lucide lucide-layout-dashboard" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
    modules: `<svg class="lucide lucide-layers" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 17.5"/></svg>`,
    students: `<svg class="lucide lucide-graduation-cap" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
    faculty: `<svg class="lucide lucide-users" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    matrix: `<svg class="lucide lucide-building" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
    solver: `<svg class="lucide lucide-zap" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    profile: `<svg class="lucide lucide-user" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    security: `<svg class="lucide lucide-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    logout: `<svg class="lucide lucide-log-out" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
    login: `<svg class="lucide lucide-key" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="16.5" r="5.5"/></svg>`,
    bell: `<svg class="lucide lucide-bell" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
    search: `<svg class="lucide lucide-search" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    coffee: `<svg class="lucide lucide-coffee" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/><line x1="17" x2="19" y1="11" y2="11"/><path d="M17 15h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2"/></svg>`,
    leave: `<svg class="lucide lucide-calendar-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.8-1.1"/><path d="M3 10h7"/><path d="M21 15V6a2 2 0 0 0-2-2H9"/><path d="m2 2 20 20"/><path d="M16 2v4"/><path d="M8 2v1"/></svg>`,
    check: `<svg class="lucide lucide-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    alert: `<svg class="lucide lucide-alert-circle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    close: `<svg class="lucide lucide-x" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`,
    refresh: `<svg class="lucide lucide-refresh-cw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    plus: `<svg class="lucide lucide-plus" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
    sparkles: `<svg class="lucide lucide-sparkles" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    room: `<svg class="lucide lucide-map-pin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    cohort: `<svg class="lucide lucide-users-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    user: `<svg class="lucide lucide-user-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
    arrowRight: `<svg class="lucide lucide-arrow-right" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    arrowLeft: `<svg class="lucide lucide-arrow-left" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    shield: `<svg class="lucide lucide-shield" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    globe: `<svg class="lucide lucide-globe" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    book: `<svg class="lucide lucide-book-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    microscope: `<svg class="lucide lucide-microscope" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`,
    trash: `<svg class="lucide lucide-trash-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    package: `<svg class="lucide lucide-package" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    feedback: `<svg class="lucide lucide-message-square" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    heart: `<svg class="lucide lucide-heart" width="14" height="14" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    palette: `<svg class="lucide lucide-palette" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    chevronRight: `<svg class="lucide lucide-chevron-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    chevronLeft: `<svg class="lucide lucide-chevron-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    lock: `<svg class="lucide lucide-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    upload: `<svg class="lucide lucide-upload" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
    database: `<svg class="lucide lucide-database" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlanMyClass • Enterprise Academic Timetable Management</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='2'><rect width='18' height='18' x='3' y='4' rx='2'/><path d='M3 10h18'/><path d='M8 2v4'/><path d='M16 2v4'/></svg>">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    :root {
      /* JKLU Official Brand Tokens (Flame Orange #E87722 Primary Accent + Lotus Blue #1E73BE Paired) */
      --background: #F8FAFC;
      --foreground: #1A1A1A;
      --card: #FFFFFF;
      --card-foreground: #1A1A1A;
      --popover: #FFFFFF;
      --popover-foreground: #1A1A1A;
      --primary: #E87722;
      --primary-foreground: #FFFFFF;
      --primary-hover: #C96114;
      --secondary: #F1F5F9;
      --secondary-foreground: #1A1A1A;
      --muted: #F1F5F9;
      --muted-foreground: #4A5568;
      --accent: #FDF1E8;
      --accent-foreground: #E87722;
      --destructive: #DC2626;
      --destructive-foreground: #FFFFFF;
      --border: #E2E8F0;
      --input: #E2E8F0;
      --ring: #E87722;
      --radius: 0.5rem; /* 8px */

      /* Surface & Layout Aliases */
      --bg-canvas: #F8FAFC;
      --bg-surface: #FFFFFF;
      --bg-surface-hover: #F1F5F9;
      --bg-rail: #FFFFFF;
      --bg-active-pill: #FDF1E8;

      --primary-light: #FDF1E8;
      --primary-border: #FDBA74;
      --primary-orange: #E87722;
      --primary-orange-hover: #C96114;
      --primary-orange-light: #FDF1E8;
      --primary-blue: #1E73BE;
      --primary-blue-hover: #145591;
      --primary-blue-light: #EBF4FC;

      /* Brand Palette */
      --brand-orange: #E87722;
      --brand-orange-hover: #C96114;
      --brand-orange-light: #FDF1E8;
      --brand-blue: #1E73BE;
      --brand-blue-hover: #145591;
      --brand-blue-light: #EBF4FC;

      --accent-pink: #E11D48;
      --accent-pink-light: #FFF1F2;
      --accent-blue: #1E73BE;
      --accent-blue-light: #EBF4FC;
      --accent-amber: #E87722;
      --accent-amber-light: #FDF1E8;
      --accent-emerald: #059669;
      --accent-emerald-light: #ECFDF5;
      --accent-purple: #1E73BE;
      --accent-purple-light: #EBF4FC;
      --danger: #DC2626;
      --danger-light: #FEF2F2;

      --bg: #F8FAFC;
      --border-subtle: #E2E8F0;
      --border-focus: #E87722;
      --text: #1A1A1A;
      --text-main: #1A1A1A;
      --text-muted: #4A5568;
      --text-subtle: #94A3B8;

      --radius-xs: 6px;
      --radius-sm: 8px;
      --radius-md: 10px;
      --radius-lg: 12px;

      --shadow-subtle: 0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
      --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03);

      /* Semantic Status Pills */
      --status-scheduled-bg: #ECFDF5;
      --status-scheduled-text: #047857;
      --status-scheduled-border: #A7F3D0;
      --status-cancelled-bg: #FEF2F2;
      --status-cancelled-text: #B91C1C;
      --status-cancelled-border: #FECACA;
      --status-rescheduled-bg: #FFFBEB;
      --status-rescheduled-text: #B45309;
      --status-rescheduled-border: #FDE68A;
      --status-extraclass-bg: #EEF2FF;
      --status-extraclass-text: #4338CA;
      --status-extraclass-border: #C7D2FE;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    h1, h2, h3, h4, .brand-font { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; letter-spacing: -0.025em; }

    body {
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      overflow-x: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation Bar */
    .navbar {
      height: 76px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border-bottom: 2px solid var(--border);
      border-image: linear-gradient(90deg, #1E73BE 0%, #1E73BE 45%, #E87722 55%, #E87722 100%) 1;
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 8px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      cursor: pointer;
    }
    .brand-logo-img {
      height: 60px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      border-radius: 8px;
      background: #FFFFFF;
      padding: 4px 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(30, 115, 190, 0.15);
    }
    .logo-icon {
      width: 36px;
      height: 36px;
      background: var(--brand-orange);
      border-radius: var(--radius-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      box-shadow: 0 1px 2px rgba(232, 119, 34, 0.2);
    }
    .logo-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #1E73BE;
    }
    .logo-text span {
      color: #E87722;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .nav-link {
      font-size: 14px;
      font-weight: 500;
      color: var(--muted-foreground);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 6px;
      position: relative;
    }
    .nav-link:hover {
      color: #1E73BE;
      background: #EBF4FC;
    }
    .nav-link.active {
      color: #1E73BE;
      font-weight: 600;
      background: #EBF4FC;
    }
    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -18px;
      left: 10px;
      right: 10px;
      height: 3px;
      background: #E87722;
      border-radius: 3px 3px 0 0;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Buttons (shadcn/ui New York / Slate Specification) */
    .btn {
      height: 36px;
      padding: 0 14px;
      border-radius: var(--radius-xs);
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      white-space: nowrap;
      user-select: none;
    }
    .btn:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--brand-orange);
    }
    .btn-primary {
      background: var(--brand-orange);
      color: #FFFFFF;
      border-color: var(--brand-orange);
      box-shadow: 0 1px 2px rgba(232, 119, 34, 0.25);
    }
    .btn-primary:hover {
      background: var(--brand-orange-hover);
      border-color: var(--brand-orange-hover);
      box-shadow: 0 2px 4px rgba(201, 97, 20, 0.3);
      transform: none;
    }
    .btn-blue {
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
      box-shadow: 0 1px 2px rgba(30, 115, 190, 0.25);
    }
    .btn-blue:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }
    .btn-secondary {
      background: #FFFFFF;
      border: 1px solid var(--border);
      color: var(--foreground);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
    }
    .btn-secondary:hover {
      background: var(--muted);
      border-color: #CBD5E1;
      color: var(--foreground);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--foreground);
    }
    .btn-outline:hover {
      background: var(--muted);
      color: var(--foreground);
    }
    .btn-ghost {
      background: transparent;
      border: 1px solid transparent;
      color: var(--muted-foreground);
    }
    .btn-ghost:hover {
      background: var(--muted);
      color: var(--foreground);
    }
    .btn-accent {
      background: var(--accent);
      color: var(--primary);
      border: 1px solid var(--primary-border);
    }
    .btn-accent:hover {
      background: #DBEAFE;
    }
    .btn-danger, .btn-destructive {
      background: var(--destructive);
      color: var(--destructive-foreground);
      border-color: var(--destructive);
    }
    .btn-danger:hover, .btn-destructive:hover {
      background: #B91C1C;
      border-color: #B91C1C;
    }
    .btn-outline-danger {
      background: transparent;
      border: 1px solid #FECACA;
      color: var(--destructive);
    }
    .btn-outline-danger:hover {
      background: #FEF2F2;
    }

    /* Main Container */
    .main-content {
      flex: 1;
      max-width: 1380px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
    }

    /* PAGE 1: HERO LANDING SECTION (shadcn/ui Spec) */
    .hero-section {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 56px 48px;
      margin-bottom: 32px;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 40px;
      align-items: center;
      box-shadow: var(--shadow-subtle);
      position: relative;
      overflow: hidden;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent);
      color: var(--primary);
      border: 1px solid var(--primary-border);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .hero-title {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.15;
      color: var(--foreground);
      letter-spacing: -0.03em;
      margin-bottom: 16px;
    }
    .hero-title span {
      color: var(--primary);
    }
    .hero-desc {
      font-size: 15px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 540px;
    }
    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-graphic {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .hero-card-stack {
      width: 100%;
      max-width: 420px;
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px;
      color: var(--foreground);
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
      position: relative;
    }
    .hero-mock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .hero-mock-chip {
      background: var(--muted);
      color: var(--foreground);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: var(--radius-xs);
      font-size: 12px;
      font-weight: 600;
    }
    .hero-mock-class {
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: var(--radius-xs);
      padding: 12px 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hero-mock-class-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-xs);
      background: #FFFFFF;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--primary);
    }

    /* 4 Value Proposition Cards */
    .value-props-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }
    .value-prop-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px;
      box-shadow: var(--shadow-subtle);
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .value-prop-card:hover {
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08);
      border-color: #CBD5E1;
      transform: translateY(-2px);
    }
    .vp-icon-bubble {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-xs);
      background: var(--accent);
      border: 1px solid var(--primary-border);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .vp-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 8px;
      letter-spacing: -0.015em;
    }
    .vp-desc {
      font-size: 13px;
      color: var(--muted-foreground);
      line-height: 1.5;
    }

    /* PAGE 2: ROLE SELECTION GATE */
    .role-gate-section {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 40px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-subtle);
      text-align: center;
    }
    .role-gate-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--foreground);
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    .role-gate-subtitle {
      font-size: 14px;
      color: var(--muted-foreground);
      margin-bottom: 32px;
    }
    .role-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      text-align: left;
    }
    .role-select-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-shadow: var(--shadow-subtle);
    }
    .role-select-card:hover {
      border-color: #CBD5E1;
      background: #FFFFFF;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08);
      transform: translateY(-2px);
    }
    .role-select-card.active {
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: 0 0 0 2px rgba(232, 119, 34, 0.25);
    }
    .role-card-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 16px;
    }
    .role-card-name {
      font-size: 18px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 6px;
      letter-spacing: -0.015em;
    }
    .role-card-desc {
      font-size: 13px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    /* Day Navigation Pill Bar */
    .day-selector-bar {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-subtle);
      flex-wrap: wrap;
      gap: 12px;
    }
    .day-pills-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .day-pill {
      background: #FFFFFF;
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      padding: 6px 14px;
      border-radius: var(--radius-xs);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .day-pill:hover {
      background: var(--muted);
      color: var(--foreground);
    }
    .day-pill.active {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    }
    .active-day-heading {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* The Timetable Grid Card */
    .timetable-wrapper-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px;
      box-shadow: var(--shadow-subtle);
    }
      margin-bottom: 32px;
      box-shadow: var(--shadow-md);
    }
    .grid-header-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .grid-header-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
    }
    .grid-header-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Table Styles */
    .table-scroll {
      overflow-x: auto;
      width: 100%;
    }
    table.tt-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px;
      min-width: 1100px;
      table-layout: fixed;
    }
    table.tt-grid th {
      background: #F1F4FA;
      color: var(--text-muted);
      padding: 12px 8px;
      border-radius: 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    table.tt-grid th.col-track {
      width: 170px;
      text-align: left;
      padding-left: 14px;
      background: var(--primary-light);
      color: var(--primary);
    }
    table.tt-grid th.col-lunch {
      background: var(--accent-amber-light);
      color: var(--accent-amber);
      border: 1px dashed var(--accent-amber);
    }
    table.tt-grid th .th-time {
      display: block;
      font-size: 11px;
      font-weight: normal;
      opacity: 0.8;
      margin-top: 2px;
    }

    table.tt-grid td {
      vertical-align: top;
      padding: 6px;
      border-radius: 12px;
      background: #FDFEFE;
      border: 1px solid var(--border);
      height: 105px;
    }
    table.tt-grid td.cell-track {
      background: #FAF9FE;
      border: 1px solid #E8E5FA;
      padding: 14px;
      font-weight: 700;
      color: var(--primary);
      font-size: 13px;
      height: auto;
    }
    table.tt-grid td.slot-lunch-break {
      background: var(--accent-amber-light);
      border: 1px dashed var(--accent-amber);
      text-align: center;
      padding: 16px 6px;
      vertical-align: middle;
    }
    table.tt-grid td.slot-free {
      background: #FAFAFC;
      border: 1px dashed #CBD5E1;
      text-align: center;
      padding: 14px 4px;
      color: #94A3B8;
      vertical-align: middle;
      transition: all 0.15s ease;
    }
    table.tt-grid td.slot-free:hover {
      background: var(--primary-light);
      border-color: var(--primary);
    }

    /* Class Occurrence Cards (Bounded Scrollable Container & Cancellation Styling) */
    .class-card {
      border-radius: 12px;
      padding: 8px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      height: 100%;
      max-height: 98px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }
    .class-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .class-card-scroll-body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      padding-right: 2px;
    }
    .class-card-scroll-body::-webkit-scrollbar {
      width: 4px;
    }
    .class-card-scroll-body::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    .class-card-scroll-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    .class-lecture {
      background: var(--accent-blue-light);
      border: 1px solid #BAE6FD;
      color: #0369A1;
    }
    .class-practical {
      background: var(--accent-purple-light);
      border: 1px solid #E9D5FF;
      color: #6B21A8;
    }
    .class-tutorial {
      background: var(--accent-amber-light);
      border: 1px solid #FDE68A;
      color: #B45309;
    }
    .class-extra {
      background: var(--accent-emerald-light);
      border: 1px solid #A7F3D0;
      color: #047857;
    }
    .class-cancelled {
      background: #FEE2E2 !important;
      border: 1px dashed #FCA5A5 !important;
      color: #991B1B !important;
      box-shadow: none !important;
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .badge-pill-lec { background: #0284C7; color: #fff; }
    .badge-pill-lab { background: #7C3AED; color: #fff; }
    .badge-pill-tut { background: #D97706; color: #fff; }
    .badge-pill-extra { background: #059669; color: #fff; }
    .badge-pill-cancel { background: #DC2626; color: #fff; }

    .class-code { font-weight: 800; font-size: 13px; }
    .class-meta { font-size: 11px; margin-top: 2px; opacity: 0.9; }

    /* Modal Styles */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(6px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card-custom {
      background: #FFFFFF;
      border-radius: var(--radius-sm);
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
      border: 1px solid var(--border);
      overflow: hidden;
      animation: modalPop 0.2s ease-out;
    }
    @keyframes modalPop {
      0% { opacity: 0; transform: scale(0.96); }
      100% { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      background: #FAFBFD;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* Sub-nav tabs for Admin (shadcn/ui Spec) */
    .admin-nav-pills {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      background: #FFFFFF;
      padding: 4px;
      border-radius: var(--radius-xs);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-subtle);
      flex-wrap: wrap;
    }
    .admin-pill-btn {
      background: transparent;
      border: none;
      padding: 6px 14px;
      border-radius: var(--radius-xs);
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .admin-pill-btn:hover {
      color: var(--foreground);
      background: var(--muted);
    }
    .admin-pill-btn.active {
      background: var(--primary);
      color: var(--primary-foreground);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    }

    /* Admin Multi-Page Command Center */
    .admin-hero-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .admin-hero-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px;
      box-shadow: var(--shadow-subtle);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.15s ease;
      cursor: pointer;
      position: relative;
    }
    .admin-hero-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08);
      border-color: #CBD5E1;
    }
    .admin-hero-card-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .admin-hero-card-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 8px;
      letter-spacing: -0.015em;
    }
    .admin-hero-card-desc {
      font-size: 13px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .admin-subpage-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 18px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-subtle);
    }
    .table-search-input {
      height: 36px;
      padding: 0 12px;
      border-radius: var(--radius-xs);
      border: 1px solid var(--border);
      font-size: 13px;
      width: 100%;
      max-width: 320px;
      background: #FFFFFF;
      color: var(--foreground);
      transition: all 0.15s ease;
    }
    .table-search-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 3.5px rgba(232, 119, 34, 0.25);
    }
    .tt-week-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .tt-week-table th {
      background: #F8FAFC;
      border: 1px solid var(--border);
      padding: 12px 10px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      text-align: center;
    }
    .tt-week-table td {
      border: 1px solid var(--border);
      padding: 8px;
      vertical-align: top;
      height: 90px;
      background: #FFFFFF;
    }
    .tt-week-table td.week-slot-period {
      width: 120px;
      background: #F8FAFC;
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      text-align: center;
      vertical-align: middle;
      height: auto;
    }

    /* Content Cards & Forms (shadcn/ui Spec) */
    .card-box {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px;
      box-shadow: var(--shadow-subtle);
      margin-bottom: 24px;
    }
    .card-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-box-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.015em;
    }
    .card-box-desc {
      font-size: 13px;
      color: var(--muted-foreground);
      margin-bottom: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 6px;
    }
    .form-control {
      height: 36px;
      width: 100%;
      background: #FFFFFF;
      border: 1px solid var(--border);
      padding: 0 12px;
      border-radius: var(--radius-xs);
      font-size: 13px;
      color: var(--foreground);
      transition: all 0.15s ease;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 3.5px rgba(232, 119, 34, 0.25);
    }

    /* Modern Data Tables */
    .data-table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow-x: auto;
      max-height: 320px;
    }
    table.styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    table.styled-table th {
      background: #F8FAFC;
      padding: 10px 14px;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    table.styled-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }
    table.styled-table tr:hover td {
      background: #F8F9FE;
    }

    /* Status Tags */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .status-badge-published { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
    .status-badge-draft { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
    .status-badge-superseded { background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1; }

    /* Footer Bottom Wave */
    .footer-wave-wrap {
      margin-top: auto;
      background: #FFFFFF;
      border-top: 1px solid var(--border);
      padding: 32px 24px;
      text-align: center;
      position: relative;
    }
    .footer-wave-svg {
      width: 100%;
      height: 60px;
      position: absolute;
      top: -60px;
      left: 0;
      pointer-events: none;
    }
    .footer-text {
      font-size: 13px;
      color: var(--text-muted);
    }
    .footer-text strong {
      color: var(--primary);
    }

    /* Drawer Styles */
    .drawer-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1050;
      justify-content: flex-end;
    }
    .drawer-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 480px;
      height: 100%;
      box-shadow: -10px 0 30px rgba(0,0,0,0.15);
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      animation: slideInRight 0.25s ease-out;
    }
    @keyframes slideInRight {
      0% { transform: translateX(100%); }
      100% { transform: translateX(0); }
    }

    /* Notification Toasts */
    .toast-box {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      padding: 14px 20px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: none;
      align-items: center;
      gap: 10px;
      animation: slideUpToast 0.2s ease;
    }
    @keyframes slideUpToast {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .toast-success { background: #059669; color: #FFFFFF; }
    .toast-error { background: #DC2626; color: #FFFFFF; }

    @media (max-width: 900px) {
      .hero-section { grid-template-columns: 1fr; padding: 36px 24px; }
      .navbar { padding: 12px 16px; }
      .main-content { padding: 16px; }
    }

    /* Tabular Numerals on Metrics, Times, and Periods */
    .tabular-nums, #metricTerms, #metricRooms, #metricTeachers, #metricSections, #metricTimetables,
    .th-time, .slot-time, .badge-pill, .active-day-heading {
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum';
    }

    /* Enterprise App Layout Frame (Fixed Left Rail + Top Utility Bar) */
    .app-layout-shell {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background: var(--bg-canvas);
    }

    /* Left Sidebar Rail (256px fixed - shadcn/ui Spec) */
    .app-sidebar-rail {
      width: 256px;
      min-width: 256px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 120;
      transition: transform 0.2s ease, width 0.2s ease;
      overflow-y: auto;
    }

    .rail-header {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }

    .rail-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
    }

    .rail-brand-img {
      height: 52px;
      width: auto;
      max-width: 180px;
      object-fit: contain;
      border-radius: 6px;
      background: #FFFFFF;
      padding: 3px 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .rail-brand-logo {
      width: 32px;
      height: 32px;
      background: var(--brand-orange);
      border-radius: var(--radius-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 1px 2px rgba(232, 119, 34, 0.25);
    }

    .rail-brand-text {
      font-size: 16px;
      font-weight: 700;
      color: #1E73BE;
      letter-spacing: -0.025em;
    }

    .rail-brand-text span {
      color: #E87722;
    }

    .rail-content {
      flex: 1;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .rail-section-header {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0 8px;
      margin-bottom: 6px;
    }

    .rail-nav-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .rail-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-xs);
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .rail-nav-item:hover {
      background: var(--muted);
      color: var(--foreground);
    }

    .rail-nav-item.active {
      background: var(--accent);
      color: var(--primary);
      font-weight: 600;
      border-color: transparent;
    }

    .rail-nav-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    .rail-nav-item.active .rail-nav-icon {
      color: var(--primary);
    }

    .rail-footer {
      padding: 12px 14px;
      border-top: 1px solid var(--border-subtle);
      background: #FAFAFC;
    }

    .rail-user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .rail-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--accent);
      border: 1px solid var(--primary-border);
      color: var(--primary);
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .rail-user-info {
      flex: 1;
      min-width: 0;
    }

    .rail-user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rail-user-role {
      font-size: 11px;
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Main Viewport Workspace */
    .app-main-viewport {
      margin-left: 256px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100vh;
    }

    /* Sticky Top Utility Bar */
    .app-top-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 56px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 2px solid var(--border-subtle);
      border-image: linear-gradient(90deg, #1E73BE 0%, #1E73BE 45%, #E87722 55%, #E87722 100%) 1;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .topbar-breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .topbar-breadcrumb span.active {
      color: var(--text-main);
      font-weight: 700;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .topbar-icon-btn {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-xs);
      border: 1px solid var(--border-subtle);
      background: #FFFFFF;
      color: #1E73BE;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .topbar-icon-btn:hover {
      background: #EBF4FC;
      border-color: #BFDBFE;
      color: #145591;
    }

    .topbar-badge-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: #E87722;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 2px rgba(232, 119, 34, 0.4);
    }

    /* Notification Dropdown Popover */
    .notif-popover {
      position: absolute;
      top: 48px;
      right: 0;
      width: 360px;
      background: #FFFFFF;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03);
      display: none;
      flex-direction: column;
      z-index: 150;
      overflow: hidden;
    }

    .notif-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notif-list {
      max-height: 280px;
      overflow-y: auto;
      padding: 8px 0;
    }

    .notif-item {
      padding: 10px 16px;
      border-bottom: 1px solid #F1F5F9;
      font-size: 12px;
      color: var(--foreground);
      line-height: 1.4;
    }

    .notif-item:last-child {
      border-bottom: none;
    }

    .notif-item .notif-time {
      font-size: 10px;
      color: var(--muted-foreground);
      margin-top: 4px;
    }

    /* Primary CTAs in Enterprise Palette */
    .btn-primary {
      background: var(--brand-orange) !important;
      color: #FFFFFF !important;
      box-shadow: 0 1px 2px rgba(232, 119, 34, 0.25) !important;
      border: 1px solid var(--brand-orange) !important;
    }
    .btn-primary:hover {
      background: var(--brand-orange-hover) !important;
      border-color: var(--brand-orange-hover) !important;
      box-shadow: 0 2px 4px rgba(201, 97, 20, 0.3) !important;
    }
    .btn-secondary {
      background: #FFFFFF !important;
      border: 1px solid var(--border-subtle) !important;
      color: var(--text-main) !important;
      box-shadow: var(--shadow-subtle) !important;
    }
    .btn-secondary:hover {
      background: var(--bg-surface-hover) !important;
      border-color: #CBD5E1 !important;
      color: var(--text-main) !important;
    }

    /* Semantic Status Badges & Pills */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
    }
    .status-badge-published {
      background: var(--status-scheduled-bg) !important;
      color: var(--status-scheduled-text) !important;
      border: 1px solid var(--status-scheduled-border) !important;
    }
    .status-badge-draft {
      background: var(--status-rescheduled-bg) !important;
      color: var(--status-rescheduled-text) !important;
      border: 1px solid var(--status-rescheduled-border) !important;
    }
    .status-badge-superseded {
      background: #F1F5F9 !important;
      color: #64748B !important;
      border: 1px solid #CBD5E1 !important;
    }
    .badge-pill-cancel {
      background: var(--status-cancelled-bg) !important;
      color: var(--status-cancelled-text) !important;
      border: 1px solid var(--status-cancelled-border) !important;
    }

    /* Card adjustments */
    .card-box {
      border: 1px solid var(--border-subtle) !important;
      border-radius: var(--radius-md) !important;
      box-shadow: var(--shadow-subtle) !important;
    }

    /* Rail Viewport Layout */
    body.has-rail .app-main-viewport {
      margin-left: 260px;
    }

    .mobile-rail-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.45);
      z-index: 89;
      backdrop-filter: blur(2px);
    }
    .mobile-rail-backdrop.active {
      display: block;
    }

    .auth-modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 900px) {
      #mobileMenuToggleBtn {
        display: inline-flex !important;
      }
      .app-sidebar-rail {
        transform: translateX(-100%);
        z-index: 90;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .app-sidebar-rail.mobile-open {
        transform: translateX(0);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
      }
      .app-main-viewport,
      body.has-rail .app-main-viewport {
        margin-left: 0 !important;
      }
    }

    @media (max-width: 640px) {
      .auth-modal-grid {
        grid-template-columns: 1fr !important;
      }
    }


    /* Enterprise High-Density Modern Tables */
    .data-table, table.data-table, table.styled-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      font-size: 13px;
      overflow: hidden;
    }

    .data-table thead th, table.data-table thead th, table.styled-table thead th {
      background: #F8FAFC;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-subtle);
      border-right: none;
      text-align: left;
    }

    .data-table tbody td, table.data-table tbody td, table.styled-table tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #F1F5F9;
      color: var(--text-main);
      vertical-align: middle;
      font-size: 13px;
    }

    .data-table tbody tr:last-child td, table.data-table tbody tr:last-child td, table.styled-table tbody tr:last-child td {
      border-bottom: none;
    }

    .data-table tbody tr:hover td, table.data-table tbody tr:hover td, table.styled-table tbody tr:hover td {
      background: #F8FAFC;
    }

    /* Timetable Grid Modernization */
    table.tt-grid {
      border-collapse: separate;
      border-spacing: 4px;
      background: transparent;
      width: 100%;
    }

    table.tt-grid th {
      background: #F8FAFC !important;
      border: 1px solid var(--border-subtle) !important;
      border-radius: var(--radius-xs) !important;
      color: var(--text-muted) !important;
      padding: 8px 6px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.04em !important;
    }

    table.tt-grid th.col-track {
      background: #F1F5F9 !important;
      color: var(--text-main) !important;
      border-color: #CBD5E1 !important;
    }

    table.tt-grid th.col-lunch {
      background: #FFFBEB !important;
      border: 1px dashed #FCD34D !important;
      color: #B45309 !important;
    }

    table.tt-grid td {
      border: 1px solid var(--border-subtle) !important;
      border-radius: var(--radius-sm) !important;
      background: var(--bg-surface) !important;
      padding: 4px !important;
      height: 108px !important;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02) !important;
    }

    table.tt-grid td.cell-track {
      background: #F8FAFC !important;
      border: 1px solid var(--border-subtle) !important;
      color: var(--text-main) !important;
      font-weight: 700 !important;
      padding: 12px !important;
    }

    table.tt-grid td.slot-lunch-break {
      background: repeating-linear-gradient(
        -45deg,
        #FFFDF7,
        #FFFDF7 8px,
        #FFFBEB 8px,
        #FFFBEB 16px
      ) !important;
      border: 1px dashed #FDE68A !important;
      color: #92400E !important;
      text-align: center !important;
    }

    table.tt-grid td.slot-free {
      background: #FAFAFC !important;
      border: 1px dashed #E2E8F0 !important;
      color: #94A3B8 !important;
    }

    table.tt-grid td.slot-free:hover {
      background: #EFF6FF !important;
      border-color: #BFDBFE !important;
    }

    /* Stale-Package Warning Banner & Solver Infeasibility Block */
    .stale-package-banner {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-left: 4px solid #D97706;
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #92400E;
    }

    .solver-infeasible-block {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-left: 4px solid #DC2626;
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      margin-top: 14px;
      font-size: 12px;
      color: #991B1B;
      line-height: 1.5;
    }


    /* Timetable Grid Layout: Desktop Period-by-Period Vertical Columns, Mobile Stacked Cards */
    .schedule-grid-canvas {
      display: flex;
      flex-direction: row;
      gap: 14px;
      width: 100%;
      margin-top: 12px;
      overflow-x: auto;
      padding-bottom: 12px;
      scroll-behavior: smooth;
    }

    .period-card-cell {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-subtle);
      display: flex;
      flex-direction: column;
      min-height: 220px;
      flex: 1 1 220px;
      min-width: 210px;
      transition: all 0.15s ease;
      position: relative;
      overflow: hidden;
    }

    .period-card-cell.two-slot-span {
      flex: 2 1 440px;
      min-width: 400px;
    }

    /* Active Period Column Highlight (JKLU Orange / Blue Theme) */
    .period-card-cell.active-period-column {
      border: 2px solid var(--brand-orange);
      box-shadow: 0 4px 12px rgba(232, 119, 34, 0.18);
    }
    .period-card-cell.active-period-column .period-card-header {
      background: var(--brand-orange-light);
      border-bottom: 1px solid var(--brand-orange);
    }
    .period-card-cell.active-period-column .period-title {
      color: var(--brand-orange);
    }

    /* Mobile Layout (< 768px): Strictly preserve vertical stacked cards layout pixel-for-pixel */
    @media (max-width: 767px) {
      .schedule-grid-canvas {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        overflow-x: visible;
        padding-bottom: 0;
      }
      .period-card-cell {
        flex: none;
        width: 100%;
        min-width: 0;
      }
      .period-card-cell.two-slot-span {
        grid-column: span 1;
        flex: none;
        min-width: 0;
      }
    }

    .period-card-header {
      padding: 10px 14px;
      background: #F8FAFC;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .period-label-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .period-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-main);
    }

    .period-time-range {
      font-size: 11px;
      font-family: var(--font-mono, monospace);
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }

    .period-card-body {
      padding: 14px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
    }

    .class-card-unclipped {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
      cursor: pointer;
    }

    .class-card-unclipped:hover {
      opacity: 0.95;
    }

    .class-course-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.35;
      white-space: normal;
      word-break: break-word;
    }

    .class-metadata-grid {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding-top: 8px;
      margin-top: auto;
    }

    .class-metadata-row {
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: normal;
      word-break: break-word;
    }

    .lunch-period-cell {
      background: repeating-linear-gradient(
        -45deg,
        #FFFDF7,
        #FFFDF7 10px,
        #FFFBEB 10px,
        #FFFBEB 20px
      ) !important;
      border: 1px dashed #FCD34D !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      min-height: 180px;
    }

    .free-period-cell {
      background: #FAFAFC;
      border: 1px dashed #E2E8F0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
      min-height: 180px;
      color: var(--text-muted);
    }

    .free-period-cell:hover {
      background: #F1F5F9;
      border-color: #CBD5E1;
    }

  </style>
</head>
<body>

  <!-- Public Top Navigation Bar (Shown on Landing, Roles, About, Feedback views) -->
  <nav class="navbar" id="publicNavbar">
    <a class="brand-logo" onclick="switchView('landing')">
      <img src="/assets/logo.jpg" alt="JK Lakshmipat University" class="brand-logo-img">
      <div class="logo-text">PlanMy<span>Class</span></div>
    </a>

    <div class="nav-links" id="mainNavLinks">
      <a class="nav-link" id="navLinkHome" onclick="switchView('landing')">Home</a>
      <a class="nav-link" id="navLinkDashboard" style="display: none;" onclick="goToRespectiveDashboard()">${ICONS.dashboard} Dashboard</a>
      <a class="nav-link" id="navLinkFeedback" onclick="switchView('feedback')">Feedback</a>
      <a class="nav-link" id="navLinkAbout" onclick="switchView('about')">About</a>
    </div>

    <div class="nav-actions">
      <!-- Unauthenticated View -->
      <div id="unauthNav">
        <button class="btn btn-primary" onclick="openLoginModal()">${ICONS.login} Sign In</button>
      </div>

      <!-- Authenticated View -->
      <div id="authNav" style="display: none; align-items: center; gap: 12px;">
        <span class="status-badge" id="navRoleBadge" style="background:#EBF4FC; color:#1E73BE; border:1px solid #BFDBFE; font-weight:600;">${ICONS.shield} Admin</span>
        <div style="font-size: 13px; font-weight: 600; color: var(--foreground);" id="navUserName"></div>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="handleLogout()">${ICONS.logout} Sign Out</button>
      </div>
    </div>
  </nav>

  <!-- Enterprise Application Shell Frame -->
  <div class="app-layout-shell" id="appLayoutShell">

    <!-- Fixed Left Navigation Rail (256px) -->
    <aside class="app-sidebar-rail" id="appSidebarRail" style="display: none;">
      <!-- Rail Header -->
      <div class="rail-header">
        <div class="rail-brand" onclick="goToRespectiveDashboard()">
          <img src="/assets/logo.jpg" alt="JK Lakshmipat University" class="rail-brand-img">
          <div class="rail-brand-text">PlanMy<span>Class</span></div>
        </div>
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="switchView('landing')" title="View Public Portal">
          ${ICONS.globe}
        </button>
      </div>

      <!-- Rail Navigation Content (Role-Scoped) -->
      <div class="rail-content">

        <!-- ADMIN WORKSPACE GROUP -->
        <div id="railAdminGroup" style="display: none; flex-direction: column; gap: 16px;">
          <div class="rail-nav-group">
            <div class="rail-section-header">Overview</div>
            <a class="rail-nav-item active" id="railItemAdminHub" onclick="switchAdminPage('hub')">
              <span class="rail-nav-icon">${ICONS.dashboard}</span> Command Center
            </a>
            <a class="rail-nav-item" id="railItemAdminTimetables" onclick="switchAdminPage('timetables')">
              <span class="rail-nav-icon">${ICONS.calendar}</span> Timetables Explorer
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">Academics</div>
            <a class="rail-nav-item" id="railItemAdminModules" onclick="switchAdminPage('modules')">
              <span class="rail-nav-icon">${ICONS.modules}</span> Modules & Hierarchy
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">People & Spaces</div>
            <a class="rail-nav-item" id="railItemAdminStudents" onclick="switchAdminPage('students')">
              <span class="rail-nav-icon">${ICONS.students}</span> Student Directory
            </a>
            <a class="rail-nav-item" id="railItemAdminFaculty" onclick="switchAdminPage('faculty')">
              <span class="rail-nav-icon">${ICONS.faculty}</span> Faculty Registry
            </a>
            <a class="rail-nav-item" id="railItemAdminMatrix" onclick="switchAdminPage('matrix')">
              <span class="rail-nav-icon">${ICONS.matrix}</span> Room Matrix Heatmap
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">Optimization</div>
            <a class="rail-nav-item" id="railItemAdminSolver" onclick="switchAdminPage('solver')">
              <span class="rail-nav-icon">${ICONS.solver}</span> CP-SAT Solver & Drafts
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">System</div>
            <a class="rail-nav-item" id="railItemAdminProfile" onclick="switchUserSubPage('profile')">
              <span class="rail-nav-icon">${ICONS.profile}</span> My Profile
            </a>
            <a class="rail-nav-item" id="railItemAdminSecurity" onclick="switchUserSubPage('security')">
              <span class="rail-nav-icon">${ICONS.security}</span> Password & Security
            </a>
          </div>
        </div>

        <!-- TEACHER WORKSPACE GROUP -->
        <div id="railTeacherGroup" style="display: none; flex-direction: column; gap: 16px;">
          <div class="rail-nav-group">
            <div class="rail-section-header">Schedule</div>
            <a class="rail-nav-item active" id="railItemTeacherSchedule" onclick="switchUserSubPage('schedule')">
              <span class="rail-nav-icon">${ICONS.calendar}</span> My Timetable
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">Faculty Operations</div>
            <a class="rail-nav-item" id="railItemTeacherExtra" onclick="switchUserSubPage('teacher-extra')">
              <span class="rail-nav-icon">${ICONS.plus}</span> Book Extra Class
            </a>
            <a class="rail-nav-item" id="railItemTeacherRooms" onclick="switchUserSubPage('teacher-rooms')">
              <span class="rail-nav-icon">${ICONS.matrix}</span> Empty Room Finder
            </a>
            <a class="rail-nav-item" id="railItemTeacherLeave" onclick="switchUserSubPage('teacher-leave')">
              <span class="rail-nav-icon">${ICONS.leave}</span> Leave & Unavailability
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">Account</div>
            <a class="rail-nav-item" id="railItemTeacherProfile" onclick="switchUserSubPage('profile')">
              <span class="rail-nav-icon">${ICONS.profile}</span> My Profile
            </a>
            <a class="rail-nav-item" id="railItemTeacherSecurity" onclick="switchUserSubPage('security')">
              <span class="rail-nav-icon">${ICONS.security}</span> Password & Security
            </a>
          </div>
        </div>

        <!-- STUDENT WORKSPACE GROUP -->
        <div id="railStudentGroup" style="display: none; flex-direction: column; gap: 16px;">
          <div class="rail-nav-group">
            <div class="rail-section-header">Schedule</div>
            <a class="rail-nav-item active" id="railItemStudentSchedule" onclick="switchUserSubPage('schedule')">
              <span class="rail-nav-icon">${ICONS.calendar}</span> Academic Timetable
            </a>
          </div>

          <div class="rail-nav-group">
            <div class="rail-section-header">Account</div>
            <a class="rail-nav-item" id="railItemStudentProfile" onclick="switchUserSubPage('profile')">
              <span class="rail-nav-icon">${ICONS.profile}</span> My Profile
            </a>
            <a class="rail-nav-item" id="railItemStudentSecurity" onclick="switchUserSubPage('security')">
              <span class="rail-nav-icon">${ICONS.security}</span> Password & Security
            </a>
          </div>
        </div>

      </div>

      <!-- Rail Footer (User Profile & Logout) -->
      <div class="rail-footer">
        <div class="rail-user-card" onclick="switchUserSubPage('profile')" style="cursor:pointer;" title="View My Profile">
          <div class="rail-user-avatar" id="railUserAvatar">U</div>
          <div class="rail-user-info">
            <div class="rail-user-name" id="railUserName">Signed In User</div>
            <div class="rail-user-role" id="railUserRole">Verified Session</div>
          </div>
        </div>
        <button class="btn btn-secondary" style="width: 100%; padding: 7px; font-size: 12px; justify-content: center;" onclick="handleLogout()">
          ${ICONS.logout} Sign Out
        </button>
      </div>
    </aside>
    <!-- Mobile Rail Backdrop -->
    <div id="mobileRailBackdrop" class="mobile-rail-backdrop" onclick="toggleMobileRail(false)"></div>

    <!-- Main Viewport (Contains Top Bar and Page Content) -->
    <div class="app-main-viewport" id="appMainViewport">

      <!-- Sticky Top Utility Bar (Shown on Dashboard & Authenticated Views) -->
      <header class="app-top-bar" id="appTopBar" style="display: none;">
        <!-- Mobile Navigation Menu Toggle -->
        <button class="topbar-icon-btn" id="mobileMenuToggleBtn" onclick="toggleMobileRail()" title="Toggle Navigation Menu" style="display: none; align-items: center; justify-content: center; margin-right: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <!-- Breadcrumbs -->
        <div class="topbar-breadcrumb" id="topbarBreadcrumb">
          <span style="color: #1E73BE; font-weight: 700;">PlanMy<span style="color: #E87722;">Class</span></span>
          <span style="color: #94A3B8;">/</span>
          <span class="active" id="topbarActivePage">Command Center</span>
        </div>

        <!-- Right Utility Actions -->
        <div class="topbar-actions">
          <!-- Notification Bell -->
          <div style="position: relative;">
            <button class="topbar-icon-btn" id="notifBellBtn" onclick="toggleNotifPopover()" title="System Notifications">
              ${ICONS.bell}
              <span class="topbar-badge-dot" id="notifBadgeCount">3</span>
            </button>

            <!-- Notifications Dropdown Popover -->
            <div class="notif-popover" id="notifPopover">
              <div class="notif-header">
                <span>Recent System Audits</span>
                <span class="status-badge status-badge-published" style="font-size: 10px;">Live Realtime</span>
              </div>
              <div class="notif-list" id="notifListContainer">
                <div id="notifPopoverItems">
                  <div class="notif-item">
                    <strong>Timetable Version Active</strong>
                    <div>Institutional semester schedule hydrated cleanly.</div>
                    <div class="notif-time">Just now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Context-Aware Primary Action Button -->
          <button class="btn btn-primary" id="topbarPrimaryCta" onclick="handleTopbarPrimaryCta()">
            Primary Action
          </button>
        </div>
      </header>

      <main class="main-content">
    
    <!-- Toast notifications -->
    <div id="appToast" class="toast-box"></div>

    <!-- ==================================================================== -->
    <!-- VIEW 1: BRAND LANDING PAGE HERO (Page 1 in Spec) -->
    <!-- ==================================================================== -->
    <div id="landingView">
      <div class="hero-section">
        <div>
          <div class="hero-badge">${ICONS.sparkles} Next-Generation University Schedule Engine</div>
          <h1 class="hero-title">Smarter Timetables, <span>Brighter Days</span></h1>
          <p class="hero-desc">
            A simple and smart solution for students, teachers, and admins to manage and generate academic schedules effortlessly. Backed by Google OR-Tools CP-SAT constraint optimization.
          </p>

        </div>

        <div class="hero-graphic">
          <div class="hero-card-stack">
            <div class="hero-mock-header">
              <span class="hero-mock-chip">Monday • Term 3</span>
              <span style="font-size: 13px; font-weight: 600; color: #047857; display: flex; align-items: center; gap: 4px;">${ICONS.check} Verified Conflict-Free</span>
            </div>
            <div class="hero-mock-class">
              <div class="hero-mock-class-icon">${ICONS.book}</div>
              <div>
                <div style="font-weight: 700; font-size: 14px;">CS201 Data Structures</div>
                <div style="font-size: 12px; color: var(--muted-foreground);">09:00–10:00 • Room 101 (Floor 1)</div>
              </div>
            </div>
            <div class="hero-mock-class">
              <div class="hero-mock-class-icon" style="color:var(--primary);">${ICONS.microscope}</div>
              <div>
                <div style="font-weight: 700; font-size: 14px;">CS201 Lab (Batch 3A1)</div>
                <div style="font-size: 12px; color: var(--muted-foreground);">10:00–12:00 • Lab 1 (2-Slot Spanning)</div>
              </div>
            </div>
            <div style="margin-top: 16px; font-size: 12px; color: #B45309; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px;">
              ${ICONS.coffee} Non-Teaching Lunch Interval at 12:00–13:00 (DEC-04)
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Dynamic Value Proposition Cards -->
      <div class="value-props-grid">
        <div class="value-prop-card" onclick="switchView('dashboard')">
          <div class="vp-icon-bubble">${ICONS.calendar}</div>
          <div class="vp-title">View Timetable</div>
          <div class="vp-desc">Personalized calendars for students and teachers with color-coded classes, practical lab spans, and instant venue guidance.</div>
        </div>
        <div class="value-prop-card" onclick="handleExploreDashboard('admin', 'solver')">
          <div class="vp-icon-bubble">${ICONS.solver}</div>
          <div class="vp-title">Smart Generation</div>
          <div class="vp-desc">OR-Tools CP-SAT constraint optimization generates clash-free schedules across concurrent semesters in under 300ms.</div>
        </div>
        <div class="value-prop-card" onclick="handleExploreDashboard('student')">
          <div class="vp-icon-bubble">${ICONS.bell}</div>
          <div class="vp-title">Real-Time Updates</div>
          <div class="vp-desc">Post-commit live subscriptions deliver immediate alerts for cancellations, venue relocations, and extra classes.</div>
        </div>
        <div class="value-prop-card" onclick="switchView('roles')">
          <div class="vp-icon-bubble">${ICONS.faculty}</div>
          <div class="vp-title">Multi-User Access</div>
          <div class="vp-desc">Dedicated, role-isolated workspaces for Students, Faculty, and University Administrators with Supabase Auth.</div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- VIEW 2: ROLE SELECTION GATE (Page 2 in Spec) -->
    <!-- ==================================================================== -->
    <div id="rolesView" style="display: none;">
      <div class="role-gate-section">
        <h2 class="role-gate-title">Select Your Academic Portal</h2>
        <p class="role-gate-subtitle">Choose your institutional role to access tailored scheduling tools and calendar views.</p>

        <div class="role-cards-container">
          <!-- Student Card -->
          <div class="role-select-card" id="roleCardStudent">
            <div>
              <div class="role-card-avatar" style="background: #EFF6FF; color: var(--primary);">${ICONS.students}</div>
              <div class="role-card-name">Student Portal</div>
              <div class="role-card-desc">
                View your section lectures, practical lab groups, elective subjects, and real-time alerts for room changes or cancellations.
              </div>
            </div>
            <button class="btn btn-secondary" onclick="handleRoleGateClick('student')" style="width: 100%;">
              Enter as Student ${ICONS.arrowRight}
            </button>
          </div>

          <!-- Teacher Card -->
          <div class="role-select-card" id="roleCardTeacher">
            <div>
              <div class="role-card-avatar" style="background: #F8FAFC; color: #475569; border: 1px solid var(--border);">${ICONS.faculty}</div>
              <div class="role-card-name">Teacher Hub</div>
              <div class="role-card-desc">
                Review your assigned lectures and labs, cancel/reschedule individual occurrences, claim free teaching slots, and submit unavailability.
              </div>
            </div>
            <button class="btn btn-secondary" onclick="handleRoleGateClick('teacher')" style="width: 100%;">
              Enter as Teacher ${ICONS.arrowRight}
            </button>
          </div>

          <!-- Admin Card -->
          <div class="role-select-card" id="roleCardAdmin">
            <div>
              <div class="role-card-avatar" style="background: #EFF6FF; color: var(--primary);">${ICONS.shield}</div>
              <div class="role-card-name">Admin Command Center</div>
              <div class="role-card-desc">
                Configure curriculum, manage venues and instructors, run CP-SAT generation, stage drafts, publish timetables, and provision users.
              </div>
            </div>
            <button class="btn btn-primary" onclick="handleRoleGateClick('admin')" style="width: 100%;">
              Enter as Administrator ${ICONS.arrowRight}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- VIEW 3: MAIN DASHBOARD & TIMETABLE GRID (Pages 4, 5, 6 in Spec) -->
    <!-- ==================================================================== -->
    <div id="dashboardView" style="display: none;">

      <!-- ================================================================== -->
      <!-- A. STUDENT & TEACHER SCHEDULE VIEW (For Students, Faculty & Guest) -->
      <!-- ================================================================== -->
      <div id="userScheduleView" style="display: none;">

        <!-- Day Navigation Pill Bar -->
        <div class="day-selector-bar">
          <div class="day-pills-group">
            <button class="day-pill active" id="dayPill0" onclick="setDay(0)">Mon</button>
            <button class="day-pill" id="dayPill1" onclick="setDay(1)">Tue</button>
            <button class="day-pill" id="dayPill2" onclick="setDay(2)">Wed</button>
            <button class="day-pill" id="dayPill3" onclick="setDay(3)">Thu</button>
            <button class="day-pill" id="dayPill4" onclick="setDay(4)">Fri</button>
          </div>

          <div class="active-day-heading" id="activeDayText">
            ${ICONS.calendar} Monday • September 7, 2026
          </div>

          <!-- Verified User Identity Display -->
          <div id="activeUserBadge" style="display: flex; gap: 8px; align-items: center;">
            <span id="activeUserRoleTag" class="status-badge" style="background:#F1F5F9; color:#64748B; font-size: 11px; padding: 4px 10px;">${ICONS.shield} Guest / Read-Only</span>
            <span id="activeUserEmailTag" style="font-size: 12px; color: var(--text-muted); font-weight: 500;">(Unauthenticated)</span>
          </div>
        </div>

        <!-- Unauthenticated Guest Banner -->
        <div id="guestNotice" class="card-box" style="padding: 12px 18px; margin-bottom: 20px; background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; font-size: 13px; display: none; justify-content: space-between; align-items: center; border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${ICONS.shield}</span>
            <span><strong>Guest Mode:</strong> You are viewing academic timetables in read-only guest mode. Sign in with institutional credentials for role-specific workflows.</span>
          </div>
          <button class="btn btn-primary" style="padding: 6px 14px; font-size: 12px;" onclick="openLoginModal()">${ICONS.login} Sign In</button>
        </div>

        <!-- The Timetable Grid Card -->
        <div class="timetable-wrapper-card">
          <div class="grid-header-meta">
            <div>
              <h2 class="grid-header-title" id="gridTitle">Daily Schedule Grid</h2>
              <p class="grid-header-subtitle">
                Periods 1 to 8 • Period 4 Non-Teaching Lunch Interval (DEC-04) • 2-Slot Practical Labs (D44)
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" onclick="prevDay()" style="padding: 6px 12px; font-size: 12px;">${ICONS.arrowLeft} Prev Day</button>
              <button class="btn btn-secondary" onclick="nextDay()" style="padding: 6px 12px; font-size: 12px;">Next Day ${ICONS.arrowRight}</button>
            </div>
          </div>

          <div class="table-scroll">
            <div id="timetableGridWrapper">
              <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                Loading timetable schedule...
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SEPARATE WORKSTATION SUB-PAGES (Clean Single-Purpose Views) -->
        
        <!-- SUB-PAGE: USER PROFILE (Student, Teacher, Admin) -->
        <div id="userSubPageProfile" style="display: none; max-width: 860px; margin: 0 auto; padding-top: 10px;">
          <div class="card-box" style="padding: 28px;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
              <div class="rail-user-avatar" style="width: 56px; height: 56px; font-size: 24px;" id="profileAvatarLg">U</div>
              <div>
                <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0;" id="studentProfileName">Institutional User</h2>
                <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;" id="studentProfileMeta">Verified Session Member</div>
              </div>
            </div>

            <!-- Student Cohort Details (Visible for Students) -->
            <div id="profileStudentSection" style="margin-top: 18px; border-top: 1px solid var(--border-subtle); padding-top: 18px;">
              <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Active Academic Cohorts & Enrolled Modules</h4>
              <ul id="studentCohortsList" style="list-style: none; font-size: 13px; line-height: 2; color: var(--text-muted);">
                <li>Enrolled Section: <strong style="color:var(--text-main);" id="stdSecLabel">Section 3A (sec-3A)</strong></li>
                <li>Practical Lab Batch: <strong style="color:var(--text-main);" id="stdBatchLabel">Batch 3A1 (batch-3A1)</strong></li>
                <li>Elective Group: <strong style="color:var(--text-main);" id="stdElecLabel">Applied Machine Learning</strong></li>
              </ul>
              <div style="margin-top: 18px; border-top: 1px solid var(--border-subtle); padding-top: 18px;">
                <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                  ${ICONS.bell} Student Inbox & Schedule Alerts
                </h4>
                <div id="studentInbox"></div>
              </div>
            </div>

            <!-- Faculty Details (Visible for Teachers) -->
            <div id="profileTeacherSection" style="display: none; margin-top: 18px; border-top: 1px solid var(--border-subtle); padding-top: 18px;">
              <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Faculty Workload & Contact Allocation</h4>
              <ul style="list-style: none; font-size: 13px; line-height: 2; color: var(--text-muted);">
                <li>Daily Contact Limit: <strong style="color:var(--text-main);">Max 4 Hours / Day (PRD D33)</strong></li>
                <li>Leave Protocol: <strong style="color:var(--text-main);">Administrative Review & Occurrence Re-allocation (D29, D30)</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- SUB-PAGE: PASSWORD & SECURITY -->
        <div id="userSubPageSecurity" style="display: none; max-width: 600px; margin: 0 auto; padding-top: 10px;">
          <div class="card-box" style="padding: 28px;">
            <h3 class="card-box-title">Account Security & Password Update</h3>
            <p class="card-box-desc">Update your institutional login password securely. Your next login will require this password.</p>
            <div class="form-group" style="margin-bottom: 16px;">
              <label>New Institutional Password (minimum 6 characters):</label>
              <input type=password id="studentNewPassword" class="form-control" placeholder="••••••••">
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="handleStudentChangePassword()">Update Password</button>
          </div>
        </div>

        <!-- SUB-PAGE: TEACHER BOOK EXTRA CLASS -->
        <div id="userSubPageTeacherExtra" style="display: none; max-width: 760px; margin: 0 auto; padding-top: 10px;">
          <div class="card-box" style="padding: 28px;">
            <h3 class="card-box-title">Book One-Off Extra Class</h3>
            <p class="card-box-desc">Search freed or unoccupied slots to schedule an extra academic session (D02, D25).</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Date:</label>
                <input type="date" id="extraDate" class="form-control" value="2026-09-08">
              </div>
              <div class="form-group">
                <label>Session Type (Activity):</label>
                <select id="extraActivity" class="form-control" onchange="onExtraActivityChange()">
                  <option value="L">Lecture (1 hour)</option>
                  <option value="T">Tutorial (1 hour)</option>
                  <option value="P">Practical / Lab (2 hours)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Course Offering:</label>
                <select id="extraCourseOffering" class="form-control" onchange="onExtraOfferingChange()"></select>
              </div>
              <div class="form-group">
                <label>Target Cohort / Section / Batch:</label>
                <select id="extraTarget" class="form-control"></select>
              </div>
            </div>
            <button class="btn btn-primary" onclick="queryFreeSlots()">Search Free Slots</button>
            <div id="slotsResults" style="margin-top: 16px;"></div>
          </div>
        </div>

        <!-- SUB-PAGE: TEACHER EMPTY ROOM FINDER -->
        <div id="userSubPageTeacherRooms" style="display: none; max-width: 760px; margin: 0 auto; padding-top: 10px;">
          <div class="card-box" style="padding: 28px;">
            <h3 class="card-box-title">Empty Classroom Finder</h3>
            <p class="card-box-desc">Quickly find empty rooms on campus for impromptu study sessions or office hours.</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Select Period Slot:</label>
                <select id="finderSlot" class="form-control" onchange="runEmptyRoomFinder()">
                  <option value="1">Period 1 (09:00 - 10:00)</option>
                  <option value="2">Period 2 (10:00 - 11:00)</option>
                  <option value="3">Period 3 (11:00 - 12:00)</option>
                  <option value="5">Period 5 (13:00 - 14:00)</option>
                  <option value="6">Period 6 (14:00 - 15:00)</option>
                  <option value="7">Period 7 (15:00 - 16:00)</option>
                  <option value="8">Period 8 (16:00 - 17:00)</option>
                </select>
              </div>
            </div>
            <div id="finderResults" style="font-size: 13px; color: var(--text-muted); margin-top: 12px;">
              Select a period to list free classrooms.
            </div>
          </div>
        </div>

        <!-- SUB-PAGE: TEACHER LEAVE & UNAVAILABILITY -->
        <div id="userSubPageTeacherLeave" style="display: none; max-width: 760px; margin: 0 auto; padding-top: 10px;">
          <div class="card-box" style="padding: 28px;">
            <h3 class="card-box-title">Submit Unavailability Request</h3>
            <p class="card-box-desc">Request leave for a date. Admin review confirms absence and resolves occurrences (D29, D30).</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Date:</label>
                <input type="date" id="unavailDate" class="form-control" value="2026-09-09">
              </div>
              <div class="form-group">
                <label>Period Range:</label>
                <div style="display:flex; gap:8px;">
                  <input type="number" id="unavailStart" class="form-control" value="1" min="1" max="8">
                  <input type="number" id="unavailEnd" class="form-control" value="4" min="1" max="8">
                </div>
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label>Reason:</label>
              <input type="text" id="unavailReason" class="form-control" placeholder="Conference / Medical leave">
            </div>
            <button class="btn btn-secondary" onclick="submitUnavailability()">Submit Absence Request</button>
          </div>
        </div>

      <!-- ================================================================== -->
      <!-- B. ADMIN COMMAND CENTER (Modular, Page-Separated Architecture)     -->
      <!-- ================================================================== -->
      <div id="adminDashboardView" style="display: none;">

        <!-- PAGE 0: ADMIN COMMAND HUB LANDING -->
        <div id="adminPageHub">
          <!-- Welcome & Status Banner -->
          <div class="card-box" style="padding: 28px; background: linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%); border-left: 4px solid var(--primary); margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <span class="status-badge" style="background:var(--primary-light); color:var(--primary); font-size:11px; padding:4px 10px; margin-bottom:8px; display:inline-block;">${ICONS.shield} Root Academic Authority</span>
                <h2 style="font-size: 26px; font-weight: 800; color: var(--text); margin-bottom: 6px;">Admin Command Center</h2>
                <p style="font-size: 14px; color: var(--text-muted); margin: 0; max-width: 640px;">
                  Institutional scheduling authority, curriculum modules, student & faculty accounts, venue utilization, and CP-SAT generation.
                </p>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="handleWipeDatabase()" style="padding: 8px 14px; font-size: 12px; color:#DC2626; border-color:#FECACA; background:#FEF2F2; font-weight:700;">${ICONS.trash} Wipe Database</button>
                <button class="btn btn-secondary" onclick="resetToSimpleMockData()" style="padding: 8px 14px; font-size: 12px; color:var(--text);">${ICONS.solver} Load Solver Fixture</button>
                <button class="btn btn-primary" onclick="loadDemoSchedule()" style="padding: 8px 14px; font-size: 12px;">${ICONS.sparkles} 1-Click Demo</button>
              </div>
            </div>
          </div>

          <!-- 3-Column Enterprise KPI Stat Cards (All 5 IDs Preserved) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin-bottom: 28px;">
            
            <!-- Card 1: Official Published Schedules & Cohorts -->
            <div class="card-box" style="padding: 22px; margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Published Timetables</span>
                  <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 4px;" id="metricTimetables">0</div>
                </div>
                <span class="status-badge status-badge-published" style="font-size: 11px;">Active Base</span>
              </div>
              <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
                <span>Student Cohorts</span>
                <span class="status-badge" style="background: var(--bg-surface-hover); color: var(--text-main); font-weight: 700;" id="metricSections">0</span>
              </div>
            </div>

            <!-- Card 2: Campus Venues & Space Optimization -->
            <div class="card-box" style="padding: 22px; margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Registered Venues</span>
                  <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 4px;" id="metricRooms">0</div>
                </div>
                <span class="status-badge" style="background: var(--primary-light); color: var(--primary-blue); font-size: 11px;">LT & Labs</span>
              </div>
              <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
                <span>Campus Space Matrix</span>
                <span style="color: var(--primary-blue); font-weight: 600; cursor: pointer;" onclick="switchAdminPage('matrix')">View Heatmap ${ICONS.arrowRight}</span>
              </div>
            </div>

            <!-- Card 3: Teaching Faculty & Academic Terms -->
            <div class="card-box" style="padding: 22px; margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Faculty Instructors</span>
                  <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 4px;" id="metricTeachers">0</div>
                </div>
                <span class="status-badge" style="background: #F5F3FF; color: #7C3AED; font-size: 11px;">Workload Ready</span>
              </div>
              <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
                <span>Academic Terms</span>
                <span class="status-badge" style="background: var(--bg-surface-hover); color: var(--text-main); font-weight: 700;" id="metricTerms">0</span>
              </div>
            </div>

          </div>

          <!-- 6 Primary Navigation Cards -->
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 16px;">Operational Workspaces</h3>
          <div class="admin-hero-grid">
            
            <!-- Page Card 1: View Timetables -->
            <div class="admin-hero-card" onclick="switchAdminPage('timetables')">
              <div>
                <div class="admin-hero-card-icon" style="background:#EDE9FE; color:#5842E3;">${ICONS.calendar}</div>
                <div class="admin-hero-card-title">View All Timetables</div>
                <div class="admin-hero-card-desc">
                  Interactive campus schedule viewer: filter by Section / Batch, Faculty Member, Classroom Venue, or Master Matrix in Day or Week Grid views.
                </div>
              </div>
              <button class="btn btn-primary" style="width: 100%;" onclick="switchAdminPage('timetables')">Open Timetable Explorer ${ICONS.arrowRight}</button>
            </div>

            <!-- Page Card 2: Academic Modules -->
            <div class="admin-hero-card" onclick="switchAdminPage('modules')">
              <div>
                <div class="admin-hero-card-icon" style="background:#E0F2FE; color:#0284C7;">${ICONS.modules}</div>
                <div class="admin-hero-card-title">Academic Modules & Hierarchy</div>
                <div class="admin-hero-card-desc">
                  Configure Academic Terms, Sections, Practical Sub-Batches, Course Catalog, Theory (L), Tutorial (T), and Practical (P) contact hours.
                </div>
              </div>
              <button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage('modules')">Manage Modules ${ICONS.arrowRight}</button>
            </div>

            <!-- Page Card 3: Student Management -->
            <div class="admin-hero-card" onclick="switchAdminPage('students')">
              <div>
                <div class="admin-hero-card-icon" style="background:#DCFCE7; color:#059669;">${ICONS.students}</div>
                <div class="admin-hero-card-title">Student Management</div>
                <div class="admin-hero-card-desc">
                  Search student directory, provision new student accounts, change student passwords, bulk CSV upload, and manage cohort transfers.
                </div>
              </div>
              <button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage('students')">Manage Students ${ICONS.arrowRight}</button>
            </div>

            <!-- Page Card 4: Faculty Management -->
            <div class="admin-hero-card" onclick="switchAdminPage('faculty')">
              <div>
                <div class="admin-hero-card-icon" style="background:#FCE8F3; color:#E05697;">${ICONS.faculty}</div>
                <div class="admin-hero-card-title">Faculty Management</div>
                <div class="admin-hero-card-desc">
                  Search faculty directory, add professors, change faculty passwords, configure weekly availability/max hours, and approve leave requests.
                </div>
              </div>
              <button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage('faculty')">Manage Faculty ${ICONS.arrowRight}</button>
            </div>

            <!-- Page Card 5: Room Utilization Matrix -->
            <div class="admin-hero-card" onclick="switchAdminPage('matrix')">
              <div>
                <div class="admin-hero-card-icon" style="background:#FEF3C7; color:#D97706;">${ICONS.matrix}</div>
                <div class="admin-hero-card-title">Room Utilization Matrix</div>
                <div class="admin-hero-card-desc">
                  Campus space optimization, classroom occupancy heatmap across all 8 periods, room capacity metrics, and vacant slot discovery.
                </div>
              </div>
              <button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage('matrix')">View Room Matrix ${ICONS.arrowRight}</button>
            </div>

            <!-- Page Card 6: CP-SAT Solver & Publication -->
            <div class="admin-hero-card" onclick="switchAdminPage('solver')">
              <div>
                <div class="admin-hero-card-icon" style="background:#FEE2E2; color:#DC2626;">${ICONS.solver}</div>
                <div class="admin-hero-card-title">CP-SAT Solver & Publication</div>
                <div class="admin-hero-card-desc">
                  Compile academic input packages, run Google OR-Tools CP-SAT constraint generation with live SSE logs, review drafts, and 1-click publish.
                </div>
              </div>
              <button class="btn btn-secondary" style="width: 100%;" onclick="switchAdminPage('solver')">Launch Solver Console ${ICONS.arrowRight}</button>
            </div>

          </div>
        </div>

        <!-- SUB-PAGE HEADER (Visible when inside any of the 6 sub-pages) -->
        <div id="adminSubPageHeader" class="admin-subpage-bar" style="display: none;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <button class="btn btn-secondary" onclick="switchAdminPage('hub')" style="padding: 6px 12px; font-size: 12px;">
              ${ICONS.arrowLeft} Back to Admin Hub
            </button>
            <h2 id="adminBreadcrumbTitle" style="font-size: 17px; font-weight: 800; color: var(--text); margin: 0;"></h2>
          </div>
          <div class="admin-nav-pills" style="margin-bottom: 0; padding: 4px; border: none; box-shadow: none;">
            <button class="admin-pill-btn" id="adminSubBtnTimetables" onclick="switchAdminPage('timetables')">${ICONS.calendar} Timetables</button>
            <button class="admin-pill-btn" id="adminSubBtnModules" onclick="switchAdminPage('modules')">${ICONS.modules} Modules</button>
            <button class="admin-pill-btn" id="adminSubBtnStudents" onclick="switchAdminPage('students')">${ICONS.students} Students</button>
            <button class="admin-pill-btn" id="adminSubBtnFaculty" onclick="switchAdminPage('faculty')">${ICONS.faculty} Faculty</button>
            <button class="admin-pill-btn" id="adminSubBtnMatrix" onclick="switchAdminPage('matrix')">${ICONS.matrix} Room Matrix</button>
            <button class="admin-pill-btn" id="adminSubBtnSolver" onclick="switchAdminPage('solver')">${ICONS.solver} Solver</button>
          </div>
        </div>

        <!-- ================================================================ -->
        <!-- SUB-PAGE 1: VIEW ALL TIMETABLES (Campus Schedule Explorer)       -->
        <!-- ================================================================ -->
        <div id="adminPageTimetables" class="admin-page-pane" style="display: none;">
          
          <!-- Filters & Target Selector Card -->
          <div class="card-box" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 class="card-box-title">Choose Timetable to View</h3>
                <p class="card-box-desc" style="margin-bottom: 0;">Filter schedules campus-wide by Section cohort, Faculty instructor, or Classroom venue.</p>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary" id="ttFormatDayBtn" onclick="setAdminTtFormat('day')" style="padding: 6px 12px; font-size: 12px; background:var(--primary); color:#fff; display:inline-flex; align-items:center; gap:6px;">${ICONS.calendar} Day View</button>
                <button class="btn btn-secondary" id="ttFormatWeekBtn" onclick="setAdminTtFormat('week')" style="padding: 6px 12px; font-size: 12px; display:inline-flex; align-items:center; gap:6px;">${ICONS.calendar} Full Week View</button>
              </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; background:#F8FAFC; border:1px solid var(--border); padding:16px; border-radius:12px;">
              <div style="flex: 1; min-width: 180px;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text); display: block; margin-bottom: 6px;">1. Filter Scope:</label>
                <select id="adminTtScopeSelect" class="form-control" onchange="handleAdminTtScopeChange(this.value)">
                  <option value="section">Student Section / Batch</option>
                  <option value="teacher">Faculty Instructor</option>
                  <option value="room">Classroom / Lab Venue</option>
                  <option value="master">Campus Master Overview</option>
                </select>
              </div>

              <div style="flex: 1.5; min-width: 220px;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text); display: block; margin-bottom: 6px;">2. Specific Target Schedule:</label>
                <select id="adminTtTargetSelect" class="form-control" onchange="handleAdminTtTargetChange(this.value)">
                  <option value="all">Loading options...</option>
                </select>
              </div>

              <div style="flex: 1; min-width: 160px;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text); display: block; margin-bottom: 6px;">3. Academic Term:</label>
                <select id="adminTtTermSelect" class="form-control" onchange="renderAdminTimetable()"></select>
              </div>

              <div style="flex: 1; min-width: 160px;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text); display: block; margin-bottom: 6px;">4. Timetable Version:</label>
                <select id="adminTtVersionSelect" class="form-control" onchange="renderAdminTimetable()"></select>
              </div>
            </div>
          </div>

          <!-- Day Navigation Pill Bar (Only active in Day View) -->
          <div id="adminTtDayBar" class="day-selector-bar" style="margin-bottom: 20px;">
            <div class="day-pills-group">
              <button class="day-pill active" id="adminDayPill0" onclick="setAdminDay(0)">Mon</button>
              <button class="day-pill" id="adminDayPill1" onclick="setAdminDay(1)">Tue</button>
              <button class="day-pill" id="adminDayPill2" onclick="setAdminDay(2)">Wed</button>
              <button class="day-pill" id="adminDayPill3" onclick="setAdminDay(3)">Thu</button>
              <button class="day-pill" id="adminDayPill4" onclick="setAdminDay(4)">Fri</button>
            </div>
            <div class="active-day-heading" id="adminActiveDayText" style="display:inline-flex; align-items:center; gap:6px;">
              ${ICONS.calendar} Monday • September 7, 2026
            </div>
            <div>
              <span id="adminTtActiveTargetBadge" class="status-badge" style="background:var(--primary-light); color:var(--primary);">Section A</span>
            </div>
          </div>

          <!-- Timetable Grid Output -->
          <div class="timetable-wrapper-card">
            <div class="table-scroll">
              <div id="adminTimetableGridWrapper">
                <div style="padding: 40px; text-align: center; color: var(--text-muted); display:flex; align-items:center; justify-content:center; gap:8px;">
                  ${ICONS.refresh} Select target and loading schedule...
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ================================================================ -->
        <!-- SUB-PAGE 2: ACADEMIC MODULES & HIERARCHY                         -->
        <!-- ================================================================ -->
        <div id="adminPageModules" class="admin-page-pane" style="display: none;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
            <!-- Terms Card -->
            <div class="card-box">
              <h3 class="card-box-title">1. Academic Terms & Calendar</h3>
              <p class="card-box-desc">Configure academic cycles and operating boundaries (PRD §4).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Term ID:</label>
                  <input type="text" id="termId" class="form-control" value="term-2026-autumn">
                </div>
                <div class="form-group">
                  <label>Year Label:</label>
                  <input type="text" id="termYear" class="form-control" value="2026-2027">
                </div>
                <div class="form-group">
                  <label>Semester Number:</label>
                  <input type="number" id="termSem" class="form-control" value="1" min="1" max="8">
                </div>
                <div class="form-group">
                  <label>Cycle:</label>
                  <select id="termCycle" class="form-control">
                    <option value="odd">Odd Cycle</option>
                    <option value="even">Even Cycle</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleCreateTerm()">Create Term</button>
              <div style="margin-top: 16px;" class="table-scroll">
                <table class="data-table"><thead><tr><th>ID</th><th>Year</th><th>Sem</th><th>Cycle</th><th>Status</th></tr></thead><tbody id="termsTableBody"></tbody></table>
              </div>
            </div>

            <!-- Sections Card -->
            <div class="card-box">
              <h3 class="card-box-title">2. Sections (Class Cohorts)</h3>
              <p class="card-box-desc">Manage primary cohorts for lecture courses.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Section ID:</label>
                  <input type="text" id="secId" class="form-control" placeholder="sec-B">
                </div>
                <div class="form-group">
                  <label>Name:</label>
                  <input type="text" id="secName" class="form-control" placeholder="Section B">
                </div>
                <div class="form-group">
                  <label>Academic Term:</label>
                  <select id="secTermSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Expected Count:</label>
                  <input type="number" id="secCount" class="form-control" value="60">
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleCreateSection()">Add Section</button>
              <div style="margin-top: 16px;" class="table-scroll">
                <table class="data-table"><thead><tr><th>ID</th><th>Term</th><th>Name</th><th>Capacity</th></tr></thead><tbody id="sectionsTableBody"></tbody></table>
              </div>
            </div>

            <!-- Batches Card -->
            <div class="card-box">
              <h3 class="card-box-title">3. Practical Sub-Batches</h3>
              <p class="card-box-desc">Sub-cohorts for parallel laboratory practical sessions.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Batch ID:</label>
                  <input type="text" id="batchId" class="form-control" placeholder="batch-B1">
                </div>
                <div class="form-group">
                  <label>Parent Section:</label>
                  <select id="batchSecSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Name:</label>
                  <input type="text" id="batchName" class="form-control" placeholder="Batch B1">
                </div>
                <div class="form-group">
                  <label>Expected Count:</label>
                  <input type="number" id="batchCount" class="form-control" value="30">
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleCreateBatch()">Add Batch</button>
              <div style="margin-top: 16px;" class="table-scroll">
                <table class="data-table"><thead><tr><th>ID</th><th>Section</th><th>Name</th><th>Count</th></tr></thead><tbody id="batchesTableBody"></tbody></table>
              </div>
            </div>
          </div>

          <!-- Courses & Offerings Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <!-- Courses Card -->
            <div class="card-box">
              <h3 class="card-box-title">4. Course Catalog & LTP Contact Hours</h3>
              <p class="card-box-desc">Strict guardrail: Practical hours must be an even integer (2-slot lab blocks).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Academic Term:</label>
                  <select id="courseTermSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Course Code:</label>
                  <input type="text" id="courseCode" class="form-control" placeholder="CS301">
                </div>
                <div class="form-group">
                  <label>Course Name:</label>
                  <input type="text" id="courseName" class="form-control" placeholder="Database Systems">
                </div>
                <div class="form-group">
                  <label>Lecture Hours (L):</label>
                  <input type="number" id="courseL" class="form-control" value="3" min="0">
                </div>
                <div class="form-group">
                  <label>Tutorial Hours (T):</label>
                  <input type="number" id="courseT" class="form-control" value="1" min="0">
                </div>
                <div class="form-group">
                  <label>Practical Hours (P):</label>
                  <input type="number" id="courseP" class="form-control" value="2" min="0" step="2">
                </div>
                <div class="form-group">
                  <label>Venue Requirement:</label>
                  <select id="courseRoomType" class="form-control">
                    <option value="lecture_hall">Lecture Hall</option>
                    <option value="lab">Computer Laboratory</option>
                    <option value="seminar">Seminar Room</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleCreateCourse()">Register Course</button>
              <div style="margin-top: 16px;" class="table-scroll">
                <table class="data-table"><thead><tr><th>Code</th><th>Name</th><th>L-T-P</th><th>Room Type</th></tr></thead><tbody id="coursesTableBody"></tbody></table>
              </div>
            </div>

            <!-- Course Offerings Card -->
            <div class="card-box">
              <h3 class="card-box-title">5. Course Offerings (Instructor & Cohort Mapping)</h3>
              <p class="card-box-desc">Map courses to faculty and target cohorts (with optional L/T/P component filter).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Course:</label>
                  <select id="offCourseSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Instructor:</label>
                  <select id="offTeacherSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Target Type:</label>
                  <select id="offTargetType" class="form-control" onchange="handleOffTargetTypeChange()">
                    <option value="section">Section</option>
                    <option value="batch">Practical Batch</option>
                    <option value="elective_group">Elective Group</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Target ID:</label>
                  <select id="offTargetIdSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Component Split (Optional):</label>
                  <select id="offComponent" class="form-control">
                    <option value="">All (Full Course)</option>
                    <option value="L">Lecture Only (L)</option>
                    <option value="T">Tutorial Only (T)</option>
                    <option value="P">Practical Only (P)</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleCreateOffering()">Create Course Offering</button>
              <div style="margin-top: 16px;" class="table-scroll">
                <table class="data-table"><thead><tr><th>Course</th><th>Instructor</th><th>Target</th><th>Component</th></tr></thead><tbody id="offeringsTableBody"></tbody></table>
              </div>
            </div>
          </div>
        </div>

        <!-- ================================================================ -->
        <!-- SUB-PAGE 3: STUDENT MANAGEMENT                                   -->
        <!-- ================================================================ -->
        <div id="adminPageStudents" class="admin-page-pane" style="display: none;">
          
          <!-- Live Student Directory Table -->
          <div class="card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 class="card-box-title" style="display:flex; align-items:center; gap:8px;">${ICONS.students} Student Directory & Cohorts</h3>
                <p class="card-box-desc" style="margin-bottom:0;">Live authoritative records from PostgreSQL students and profiles tables.</p>
              </div>
              <input type="text" id="studentSearchInput" class="table-search-input" placeholder="Search by name, roll, or email..." oninput="renderStudentsTable(this.value)">
            </div>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Full Name</th>
                    <th>Institutional Email</th>
                    <th>Section</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="studentsTableBody">
                  <tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Loading students...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 4 Student Operational Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            
            <!-- 1. Add Student Individually -->
            <div class="card-box">
              <h3 class="card-box-title">1. Provision New Student</h3>
              <p class="card-box-desc">Create verified student account with section and practical batch enrollment.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Full Name:</label>
                  <input type="text" id="stdAddName" class="form-control" placeholder="Aarav Patel">
                </div>
                <div class="form-group">
                  <label>Institutional Email:</label>
                  <input type="email" id="stdAddEmail" class="form-control" placeholder="aarav@university.edu">
                </div>
                <div class="form-group">
                  <label>Roll Number / Entity ID:</label>
                  <input type="text" id="stdAddRoll" class="form-control" placeholder="2025BTECH201">
                </div>
                <div class="form-group">
                  <label>Section Cohort:</label>
                  <select id="stdAddSection" class="form-control" onchange="handleStdAddSectionChange()"></select>
                </div>
                <div class="form-group">
                  <label>Practical Batch:</label>
                  <select id="stdAddBatch" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Initial Password:</label>
                  <input type="text" id="stdAddPassword" class="form-control" value="" placeholder="Temporary password">
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleIndividualAddStudent()">Provision Student Account</button>
            </div>

            <!-- 2. Change / Reset Student Password -->
            <div class="card-box">
              <h3 class="card-box-title">2. Change Student Password</h3>
              <p class="card-box-desc">Reset password for any enrolled student directly without manual email resets.</p>
              <div class="form-group" style="margin-bottom: 12px;">
                <label>Select Student or Enter Email:</label>
                <input type="text" id="resetStdTargetEmail" class="form-control" placeholder="Enter student email">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label>New Secure Password (min 6 characters):</label>
                <input type="password" id="resetStdNewPassword" class="form-control" placeholder="NewPassword#2026!">
              </div>
              <button class="btn btn-primary" onclick="handleAdminResetUserPassword('student')">Update Student Password</button>
            </div>

            <!-- 3. Bulk Add Students (CSV) -->
            <div class="card-box">
              <h3 class="card-box-title">3. Bulk Student Provisioning (CSV)</h3>
              <p class="card-box-desc">Format: <code>roll_number, full_name, email, section_id, batch_id, password</code></p>
              <div class="form-group" style="margin-bottom: 12px;">
                <textarea id="bulkStudentCsvArea" class="form-control" rows="4" placeholder="2025BTECH301, Rohan Sharma, rohan@university.edu, sec-A, batch-A1, Pass@123
2025BTECH302, Priya Singh, priya@university.edu, sec-A, batch-A2, Pass@123"></textarea>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" onclick="prefillSampleStudentCsv()" style="font-size:12px;">Load Sample Template</button>
                <button class="btn btn-primary" onclick="handleBulkUploadStudents()">Validate & Provision CSV Batch</button>
              </div>
            </div>

            <!-- 4. Student Group Transfer -->
            <div class="card-box">
              <h3 class="card-box-title">4. Student Cohort Transfer (D27, D28)</h3>
              <p class="card-box-desc">Reassign a student to a different section or batch with effective date bounds.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Student:</label>
                  <select id="transferStudentSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Transfer Type:</label>
                  <select id="transferTypeSelect" class="form-control" onchange="handleTransferTypeChange()">
                    <option value="section">Section</option>
                    <option value="batch">Practical Batch</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Target Group:</label>
                  <select id="transferTargetSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Effective Date:</label>
                  <input type="date" id="transferEffectiveDate" class="form-control" value="2026-09-08">
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleExecuteStudentTransfer()">Execute Student Transfer</button>
            </div>

          </div>
        </div>

        <!-- ================================================================ -->
        <!-- SUB-PAGE 4: FACULTY MANAGEMENT                                   -->
        <!-- ================================================================ -->
        <div id="adminPageFaculty" class="admin-page-pane" style="display: none;">
          
          <!-- Live Faculty Directory Table -->
          <div class="card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 class="card-box-title" style="display:flex; align-items:center; gap:8px;">${ICONS.faculty} Faculty Instructors Directory</h3>
                <p class="card-box-desc" style="margin-bottom:0;">Live records from PostgreSQL teachers and profiles tables.</p>
              </div>
              <input type="text" id="facultySearchInput" class="table-search-input" placeholder="Search faculty by name, department, or email..." oninput="renderFacultyTable(this.value)">
            </div>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Instructor & Email</th>
                    <th>Employee ID</th>
                    <th>Workload Limit</th>
                    <th>Status</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="teachersTableBody">
                  <tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">Loading faculty...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 4 Faculty Operational Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            
            <!-- 1. Add Faculty Member -->
            <div class="card-box">
              <h3 class="card-box-title">1. Provision New Faculty Member</h3>
              <p class="card-box-desc">Register faculty in institutional directory and create Supabase Auth credentials.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Full Name:</label>
                  <input type="text" id="facultyAddName" class="form-control" placeholder="Dr. Vikram Rao">
                </div>
                <div class="form-group">
                  <label>Institutional Email:</label>
                  <input type="email" id="facultyAddEmail" class="form-control" placeholder="vikram@university.edu">
                </div>
                <div class="form-group">
                  <label>Employee ID:</label>
                  <input type="text" id="facultyAddEmpId" class="form-control" placeholder="EMP-2026-09">
                </div>
                <div class="form-group">
                  <label>Initial Password:</label>
                  <input type="text" id="facultyAddPassword" class="form-control" value="" placeholder="Temporary password">
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleIndividualAddFaculty()">Provision Faculty Account</button>
            </div>

            <!-- 2. Change / Reset Faculty Password -->
            <div class="card-box">
              <h3 class="card-box-title">2. Change Faculty Password</h3>
              <p class="card-box-desc">Update or reset credentials for faculty instructors directly.</p>
              <div class="form-group" style="margin-bottom: 12px;">
                <label>Select Faculty or Enter Email:</label>
                <input type="text" id="resetFacultyTargetEmail" class="form-control" placeholder="Enter faculty email">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label>New Secure Password (min 6 characters):</label>
                <input type="password" id="resetFacultyNewPassword" class="form-control" placeholder="NewTeacherPass#2026!">
              </div>
              <button class="btn btn-primary" onclick="handleAdminResetUserPassword('faculty')">Update Faculty Password</button>
            </div>

            <!-- 3. Faculty Working Availability -->
            <div class="card-box">
              <h3 class="card-box-title">3. Faculty Availability & Workload Rules</h3>
              <p class="card-box-desc">Configure maximum teaching hours per day and available weekly teaching days.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Faculty Instructor:</label>
                  <select id="availTeacherSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Max Hours per Day:</label>
                  <input type="number" id="availMaxHours" class="form-control" value="4" min="1" max="8">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label>Available Days (Working Days):</label>
                  <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:4px;">
                    <label style="font-size:12px;"><input type="checkbox" id="availDay1" checked> Mon</label>
                    <label style="font-size:12px;"><input type="checkbox" id="availDay2" checked> Tue</label>
                    <label style="font-size:12px;"><input type="checkbox" id="availDay3" checked> Wed</label>
                    <label style="font-size:12px;"><input type="checkbox" id="availDay4" checked> Thu</label>
                    <label style="font-size:12px;"><input type="checkbox" id="availDay5" checked> Fri</label>
                  </div>
                </div>
              </div>
              <button class="btn btn-primary" onclick="handleSaveTeacherAvailability()">Save Faculty Availability</button>
            </div>

            <!-- 4. Faculty Leave Requests -->
            <div class="card-box">
              <h3 class="card-box-title">4. Faculty Leave & Absence Requests</h3>
              <p class="card-box-desc">Review submitted unavailability requests. Approval automatically confirms leave and resolves occurrences.</p>
              <div id="adminUnavailList" style="max-height: 220px; overflow-y: auto;">
                Loading leave requests...
              </div>
            </div>

          </div>
        </div>

        <!-- ================================================================ -->
        <!-- SUB-PAGE 5: ROOM UTILIZATION MATRIX (Space Optimization)         -->
        <!-- ================================================================ -->
        <div id="adminPageMatrix" class="admin-page-pane" style="display: none;">
          <div class="card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 class="card-box-title" style="display:flex; align-items:center; gap:8px;">${ICONS.matrix} Campus Room Utilization & Venue Optimization</h3>
                <p class="card-box-desc" style="margin-bottom:0;">Live occupancy heatmap of all registered rooms and laboratories across Periods 1 to 8.</p>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text);">Select Day:</label>
                <select id="matrixDaySelect" class="form-control" style="width: auto;" onchange="setDay(parseInt(this.value, 10))">
                  <option value="0">Monday</option>
                  <option value="1">Tuesday</option>
                  <option value="2">Wednesday</option>
                  <option value="3">Thursday</option>
                  <option value="4">Friday</option>
                </select>
              </div>
            </div>
            <div id="roomMatrixContainer">Loading matrix...</div>
          </div>
        </div>

        <!-- ================================================================ -->
        <!-- SUB-PAGE 6: CP-SAT SOLVER & PUBLICATION HUB                      -->
        <!-- ================================================================ -->
        <div id="adminPageSolver" class="admin-page-pane" style="display: none;">
          
          <!-- Bulk Curriculum CSV Ingestion & Sample Dataset -->
          <div class="card-box" style="margin-bottom: 24px; border-left: 4px solid var(--primary);">
            <div class="card-box-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 8px;">
              <div>
                <h3 class="card-box-title" style="margin: 0; font-size: 16px;">Curriculum CSV Bulk Ingestion & Demo Dataset</h3>
                <p class="card-box-desc" style="margin: 4px 0 0 0;">Upload curriculum CSVs (terms, sections, batches, rooms, teachers, courses, offerings, students) or load sample data in 1-click.</p>
              </div>
              <button class="btn btn-secondary" onclick="loadSamplePresentationCsvPack()" style="display:inline-flex; align-items:center; gap:6px; background:#EEF2FF; color:var(--primary); border-color:#C7D2FE; font-weight:600;">
                ${ICONS.database} Load Presentation Sample CSV Pack
              </button>
            </div>

            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 14px; padding: 12px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px;">
              <input type="file" id="curriculumCsvFileInput" multiple accept=".csv" style="display:none;" onchange="handleCurriculumCsvFilesSelected(this.files)">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('curriculumCsvFileInput').click()" style="display:inline-flex; align-items:center; gap:6px;">
                ${ICONS.upload} Select CSV Files...
              </button>
              <button type="button" class="btn btn-primary" id="btnUploadCurriculumCsvs" onclick="submitSelectedCurriculumCsvs()" style="display:inline-flex; align-items:center; gap:6px;" disabled>
                ${ICONS.check} Ingest Selected Files
              </button>
              <span id="curriculumCsvFileStatus" style="font-size: 13px; color: var(--text-muted);">
                No CSV files selected. Supported: academic_terms.csv, sections.csv, batches.csv, rooms.csv, teachers.csv, courses.csv, course_offerings.csv, students_bulk_upload.csv
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
            
            <!-- Generation Package Compiler -->
            <div class="card-box">
              <h3 class="card-box-title">1. Compile Generator Package (D45)</h3>
              <p class="card-box-desc">Assembles full institutional constraints, offering matrices, and venue capacities into versioned JSON payload.</p>
              <div class="form-group" style="margin-bottom: 12px;">
                <label>Target Academic Term:</label>
                <select id="compileTermSelect" class="form-control"></select>
              </div>
              <div style="margin-bottom: 14px;">
                <label style="font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" id="solverDirectlyPublish" checked> Directly publish to live campus timetable on solve
                </label>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button class="btn btn-secondary" onclick="handleCompilePackage()" style="display:inline-flex; align-items:center; gap:6px;">${ICONS.package} Compile Package</button>
                <button class="btn btn-primary" onclick="handleTriggerSolver(false)" style="display:inline-flex; align-items:center; gap:6px;">${ICONS.solver} Run CP-SAT Solver</button>
                <button class="btn btn-primary" onclick="handleTriggerSolver(true)" style="display:inline-flex; align-items:center; gap:6px; background:#059669; border-color:#059669;">${ICONS.check} Run & Directly Publish</button>
              </div>
            </div>

            <!-- Staged Draft Review & Conflict Audit -->
            <div class="card-box">
              <h3 class="card-box-title">2. Staged Draft & Publication Review</h3>
              <p class="card-box-desc">Audit staged draft occurrences and conflict safety before 1-click campus publication.</p>
              <div id="stagedDraftReview">
                <div style="padding: 14px; background: #F8FAFC; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--text-muted);">
                  No uncommitted draft staged. Compile package or run CP-SAT solver above.
                </div>
              </div>
            </div>
          </div>

          <!-- Live SSE Solver Execution Console -->
          <div class="card-box" style="margin-bottom: 24px;">
            <div class="card-box-header">
              <h3 class="card-box-title">Live Solver Telemetry & Execution Log</h3>
              <span class="status-badge status-badge-published" id="solverStatusBadge">Ready</span>
            </div>
            <div id="solverLogConsole" style="background:#0F172A; color:#38BDF8; font-family:monospace; font-size:12px; padding:16px; border-radius:8px; height:200px; overflow-y:auto; line-height:1.6;">
              [SYSTEM] Solver Runner online at port 5001. Awaiting package compilation...
            </div>
          </div>

          <!-- Version Archive & Rollback (D13, D40) -->
          <div class="card-box">
            <h3 class="card-box-title">3. Version Archive & Rollback Controls</h3>
            <p class="card-box-desc">Audit historical timetable versions and restore previous conflict-free schedules.</p>
            <div class="table-scroll">
              <table class="data-table"><thead><tr><th>Version</th><th>Term</th><th>Status</th><th>Published At</th><th>Actions</th></tr></thead><tbody id="versionsTableBody"></tbody></table>
            </div>
          </div>
        </div>

      </div>
      
    </div>

    <!-- ==================================================================== -->
    <!-- VIEW: DEDICATED FEEDBACK PAGE                                        -->
    <!-- ==================================================================== -->
    <div id="feedbackView" style="display: none; max-width: 900px; margin: 0 auto; padding: 20px 0;">
      <!-- Main Feedback Header Card -->
      <div class="card-box" style="padding: 32px; background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%); border-top: 4px solid var(--primary); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: #EEF2FF; color: var(--primary); display: flex; align-items: center; justify-content: center;">${ICONS.feedback}</div>
          <div>
            <h2 style="font-size: 24px; font-weight: 800; color: var(--text); margin: 0;">Tell us about the app and submit feedback</h2>
            <p style="font-size: 14px; color: var(--text-muted); margin: 4px 0 0 0;">We value your insights and experience using PlanMyClass. Let us know how we can improve.</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px;">
        <!-- Feedback Submission Form -->
        <div class="card-box" style="padding: 24px;">
          <h3 class="card-box-title" style="margin-bottom: 6px;">Submit Your Feedback</h3>
          <p class="card-box-desc">Share bug reports, feature ideas, or scheduling workflow thoughts.</p>
          
          <div class="form-grid" style="grid-template-columns: 1fr; gap: 14px; margin-bottom: 16px;">
            <div class="form-group">
              <label>Your Name</label>
              <input type="text" id="feedbackSenderName" class="form-control" placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label>Your Email / Institutional ID</label>
              <input type="email" id="feedbackSenderEmail" class="form-control" placeholder="name@jklu.edu.in">
            </div>
            <div class="form-group">
              <label>Topic / Category</label>
              <select id="feedbackCategory" class="form-control">
                <option value="ui_ux">UI & Usability Experience</option>
                <option value="schedule">Timetable & Slot Conflicts</option>
                <option value="feature">Feature Request & Suggestions</option>
                <option value="bug">Bug Report / Performance</option>
                <option value="other">General Feedback</option>
              </select>
            </div>
            <div class="form-group">
              <label>Your Message / Feedback</label>
              <textarea id="feedbackMessage" class="form-control" rows="4" style="resize: vertical; font-family: inherit;" placeholder="Please describe your experience or suggestions in detail..."></textarea>
            </div>
          </div>
          
          <button class="btn btn-primary" onclick="submitFeedbackForm()" style="width: 100%; padding: 12px; font-weight: 700;">
            Submit Feedback
          </button>
        </div>

        <!-- Designated Team Contact Email Addresses -->
        <div class="card-box" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 class="card-box-title" style="margin-bottom: 6px;">Designated Team Contacts</h3>
            <p class="card-box-desc">Direct reach-out channels to the core development and product team.</p>

            <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 18px;">
              <!-- Contact 1: Yuvraj Singh Rathore -->
              <div style="display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: #FFFFFF;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: #EEF2FF; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">YR</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 14px; color: var(--text);">Yuvraj Singh Rathore</div>
                  <a href="mailto:yuvrajsinghrathore@jklu.edu.in" style="font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 600;">yuvrajsinghrathore@jklu.edu.in</a>
                </div>
              </div>

              <!-- Contact 2: Aadrika Roy -->
              <div style="display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: #FFFFFF;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: #FCE8F3; color: #E05697; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">AR</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 14px; color: var(--text);">Aadrika Roy</div>
                  <a href="mailto:aadrikaroy@jklu.edu.in" style="font-size: 12px; color: #E05697; text-decoration: none; font-weight: 600;">aadrikaroy@jklu.edu.in</a>
                </div>
              </div>

              <!-- Contact 3: Priecy Gandhi -->
              <div style="display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: #FFFFFF;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">PG</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 14px; color: var(--text);">Priecy Gandhi</div>
                  <a href="mailto:priecygandhi@jklu.edu.in" style="font-size: 12px; color: #D97706; text-decoration: none; font-weight: 600;">priecygandhi@jklu.edu.in</a>
                </div>
              </div>

              <!-- Contact 4: Chirag -->
              <div style="display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: #FFFFFF;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;">CC</div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 14px; color: var(--text);">Chirag</div>
                  <a href="mailto:chirag@jklu.edu.in" style="font-size: 12px; color: #0284C7; text-decoration: none; font-weight: 600;">chirag@jklu.edu.in</a>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 12px; background: #F8FAFC; border-radius: 10px; font-size: 12px; color: var(--text-muted); text-align: center;">
            Institutional response time: typically within 24–48 academic working hours.
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- VIEW: DEDICATED ABOUT PAGE                                           -->
    <!-- ==================================================================== -->
    <div id="aboutView" style="display: none; max-width: 900px; margin: 0 auto; padding: 20px 0;">
      <!-- Hero Dedication Card -->
      <div class="card-box" style="padding: 40px 32px; background: linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%); border-top: 4px solid var(--primary); text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 20px; background: #EDE9FE; margin-bottom: 16px;">
          ${ICONS.calendar}
        </div>
        <h1 style="font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 12px;">PlanMy<span style="color: var(--primary);">Class</span></h1>
        
        <div style="font-size: 20px; font-weight: 700; color: var(--text); margin: 16px 0; line-height: 1.4;">
          Built for JKLU with <span style="display:inline-flex; vertical-align:middle; margin:0 4px;">${ICONS.heart}</span> by Yuvraj, Aadrika, Priecy, and Chirag
        </div>
        
        <p style="font-size: 14px; color: var(--text-muted); max-width: 600px; margin: 0 auto; line-height: 1.6;">
          An academic timetable scheduling, conflict management, and live classroom orchestration platform designed to streamline student, teacher, and institutional operations across campus.
        </p>
      </div>

      <!-- Architecture & Tech Stack Details -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
        <div class="card-box" style="padding: 24px;">
          <div style="margin-bottom: 8px; color:var(--primary);">${ICONS.solver}</div>
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text);">Google OR-Tools CP-SAT</h4>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0;">
            High-speed constraint satisfaction solver generating conflict-free multi-semester timetables in under 300ms.
          </p>
        </div>

        <div class="card-box" style="padding: 24px;">
          <div style="margin-bottom: 8px; color:var(--primary);">${ICONS.security}</div>
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text);">Supabase & PostgreSQL</h4>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0;">
            Authoritative transactional data store with verified session authentication and institutional role-based access control.
          </p>
        </div>

        <div class="card-box" style="padding: 24px;">
          <div style="margin-bottom: 8px; color:var(--primary);">${ICONS.palette}</div>
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text);">Dynamic Color & Clean UX</h4>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0;">
            Sleek pastel visual identity with bounded scrollable cards, responsive navigation, and instant cancellation indicators.
          </p>
        </div>
      </div>
    </div>

  </main>
    </div><!-- /.app-main-viewport -->
  </div><!-- /.app-layout-shell -->

  <!-- ==================================================================== -->
  <!-- MODAL: LOGIN / AUTHENTICATION (Page 3 in Spec) -->
  <!-- ==================================================================== -->
  <div id="loginModal" class="modal-overlay">
    <div class="modal-card-custom auth-modal-grid" style="max-width: 720px;">
      
      <!-- Left Column: Form -->
      <div style="padding: 32px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
          <img src="/assets/logo.jpg" alt="JK Lakshmipat University" class="brand-logo-img" style="height:32px;">
          <div class="logo-text" style="font-size:18px;">PlanMy<span>Class</span></div>
        </div>

        <h3 id="authModalTitle" style="font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 6px;">Sign In to PlanMyClass</h3>
        <p id="authModalDesc" style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Step 1: Select your role persona to proceed.</p>

        <div id="modalAlertBox" style="display: none; padding: 10px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; font-weight: 600;"></div>

        <!-- Step 1: Role Persona Selection Pane -->
        <div id="roleSelectPane">
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            <div onclick="selectAuthRole('student')" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.15s ease; background: #FFFFFF;" onmouseover="this.style.borderColor='var(--primary)'; this.style.background='#F8FAFC';" onmouseout="this.style.borderColor='var(--border)'; this.style.background='#FFFFFF';">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center;">${ICONS.students}</div>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 14px; color: var(--text);">Student Portal</div>
                <div style="font-size: 11px; color: var(--text-muted);">Personalized section, batches & real-time notices</div>
              </div>
              <span style="color: var(--primary); display:flex; align-items:center;">${ICONS.chevronRight}</span>
            </div>

            <div onclick="selectAuthRole('teacher')" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.15s ease; background: #FFFFFF;" onmouseover="this.style.borderColor='var(--primary)'; this.style.background='#F8FAFC';" onmouseout="this.style.borderColor='var(--border)'; this.style.background='#FFFFFF';">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: #FCE8F3; color: #E05697; display: flex; align-items: center; justify-content: center;">${ICONS.faculty}</div>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 14px; color: var(--text);">Faculty Hub</div>
                <div style="font-size: 11px; color: var(--text-muted);">Teaching timetable, slot drawer & leave requests</div>
              </div>
              <span style="color: var(--primary); display:flex; align-items:center;">${ICONS.chevronRight}</span>
            </div>

            <div onclick="selectAuthRole('admin')" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.15s ease; background: #FFFFFF;" onmouseover="this.style.borderColor='var(--primary)'; this.style.background='#F8FAFC';" onmouseout="this.style.borderColor='var(--border)'; this.style.background='#FFFFFF';">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: #EDE9FE; color: var(--primary); display: flex; align-items: center; justify-content: center;">${ICONS.shield}</div>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 14px; color: var(--text);">Administrator</div>
                <div style="font-size: 11px; color: var(--text-muted);">Full campus management & CP-SAT generator</div>
              </div>
              <span style="color: var(--primary); display:flex; align-items:center;">${ICONS.chevronRight}</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Login Credentials Pane -->
        <div id="loginFormPane" style="display: none;">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px; display:inline-flex; align-items:center; gap:4px;" onclick="switchAuthPane('roleSelect')">${ICONS.chevronLeft} Change Role</button>
            <span id="activeRolePersonaBadge" class="status-badge" style="background:var(--primary-light); color:var(--primary); font-size:11px; display:inline-flex; align-items:center; gap:4px;">${ICONS.shield} Administrator</span>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label>Institutional Email</label>
            <input type="email" id="loginEmail" class="form-control" value="" placeholder="Enter your email">
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label>Password</label>
            <input type="password" id="loginPassword" class="form-control" value="" placeholder="••••••••">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <a href="javascript:void(0)" onclick="switchAuthPane('forgot')" style="font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 600;">Forgot Password?</a>
            <span style="font-size: 11px; color: var(--text-muted);">Supabase Auth Verified</span>
          </div>
          <button class="btn btn-primary" onclick="handleLogin()" style="width: 100%; padding: 11px;">Sign In to PlanMyClass</button>
          
          <div style="margin-top: 14px; text-align: center; font-size: 12px; color: var(--text-muted);">
            Need access? Contact your university administrator.
          </div>
        </div>

        <!-- Password Recovery Pane -->
        <div id="forgotFormPane" style="display: none;">
          <div class="form-group" style="margin-bottom: 16px;">
            <label>Institutional Email</label>
            <input type="email" id="forgotEmail" class="form-control" placeholder="Enter your email">
          </div>
          <button class="btn btn-primary" onclick="handleForgotPassword()" style="width: 100%; padding: 11px; margin-bottom: 12px;">Dispatch Reset Link</button>
          <button class="btn btn-secondary" onclick="switchAuthPane('login')" style="width: 100%;">Back to Login</button>
        </div>
      </div>

      <!-- Right Column: Visual Graphic -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
        <button onclick="closeLoginModal()" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer;">&times;</button>
        
        <div>
          <span style="background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:0.04em;">PlanMyClass Cloud</span>
          <h4 style="font-size: 24px; font-weight: 800; margin-top: 16px; line-height: 1.3;">One Smart System for the Whole Campus.</h4>
          <p style="font-size: 13px; opacity: 0.85; margin-top: 8px;">Seamlessly synchronizing thousands of student cohorts, faculty rooms, and contact hours in real time.</p>
        </div>

        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 12px; font-size: 12px; display:flex; align-items:center; gap:8px;">
          ${ICONS.lock} Enterprise Row-Level Security & Role Verification
        </div>
      </div>

    </div>
  </div>

  <!-- ==================================================================== -->
  <!-- DRAWER: OCCURRENCE DETAILS & OVERRIDE (Page 5 in Spec) -->
  <!-- ==================================================================== -->
  <div id="occurrenceDrawer" class="drawer-overlay" onclick="closeDrawer(event)">
    <div class="drawer-card" onclick="event.stopPropagation()">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 20px;">
          <h3 style="font-size: 18px; font-weight: 700; color: var(--text);" id="drawerTitle">Class Session Details</h3>
          <button onclick="closeDrawer()" style="background: transparent; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer;">&times;</button>
        </div>

        <div id="drawerBody">
          <!-- Populated dynamically -->
        </div>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 20px; display: flex; flex-direction: column; gap: 8px;">
        <div id="drawerTeacherActions">
          <!-- Cancel / Reschedule buttons -->
        </div>
        <button class="btn btn-secondary" onclick="closeDrawer()" style="width: 100%;">Close Details</button>
      </div>
    </div>
  </div>

  <!-- ==================================================================== -->
  <!-- MODAL: QUICK BOOK EXTRA CLASS (Interactive Timetable Slot Booking)   -->
  <!-- ==================================================================== -->
  <div id="quickBookExtraModal" class="modal-overlay" onclick="closeQuickBookModal(event)">
    <div class="modal-card-custom" style="max-width: 540px;" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <h3 id="qbModalTitle" style="font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 2px;">Book Extra Class Session</h3>
          <p id="qbModalSubtitle" style="font-size: 12px; color: var(--text-muted); margin: 0;">Configure session type, cohort, and venue for this slot.</p>
        </div>
        <button type="button" class="btn btn-ghost" onclick="closeQuickBookModal()" style="padding: 4px 8px; font-size: 20px; line-height: 1; border:none; background:transparent; cursor:pointer;">&times;</button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Date & Slot Summary Bar -->
        <div style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Scheduled Date</div>
            <div id="qbDateDisplay" style="font-size: 13px; font-weight: 600; color: var(--text);">Monday, 2026-09-07</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Selected Period</div>
            <div id="qbPeriodDisplay" style="font-size: 13px; font-weight: 700; color: var(--primary);">Period 2 (10:00 – 11:00)</div>
          </div>
        </div>

        <input type="hidden" id="qbDate">
        <input type="hidden" id="qbDayOfWeek">

        <!-- Time Period Selector -->
        <div class="form-group">
          <label style="font-size: 12px; font-weight: 600;">Time Period / Slot:</label>
          <select id="qbSlotSelect" class="form-control" onchange="onQbSlotChange()"></select>
        </div>

        <!-- Activity / Session Type -->
        <div class="form-group">
          <label style="font-size: 12px; font-weight: 600;">Session Type (Activity):</label>
          <select id="qbActivity" class="form-control" onchange="onQbActivityChange()">
            <option value="L">Lecture (1 hour)</option>
            <option value="T">Tutorial (1 hour)</option>
            <option value="P">Practical / Lab (2 consecutive hours)</option>
          </select>
        </div>

        <!-- Course Offering -->
        <div class="form-group">
          <label style="font-size: 12px; font-weight: 600;">Course Offering:</label>
          <select id="qbCourseOffering" class="form-control" onchange="onQbOfferingChange()"></select>
        </div>

        <!-- Target Cohort / Batch -->
        <div class="form-group">
          <label style="font-size: 12px; font-weight: 600;">Target Cohort / Section / Batch:</label>
          <select id="qbTarget" class="form-control"></select>
        </div>

        <!-- Room / Venue -->
        <div class="form-group">
          <label style="font-size: 12px; font-weight: 600;">Classroom / Lab Venue:</label>
          <select id="qbRoom" class="form-control"></select>
        </div>

        <!-- Error Alert Container -->
        <div id="qbErrorBox" style="display: none; padding: 10px 12px; border-radius: 8px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #DC2626; font-size: 12px; font-weight: 600;"></div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
          <button type="button" class="btn btn-secondary" onclick="closeQuickBookModal()">Cancel</button>
          <button type="button" class="btn btn-primary" id="qbSubmitBtn" onclick="submitQuickBookExtra()">Confirm & Book Class</button>
        </div>
      </div>
    </div>
  </div>



  <!-- ==================================================================== -->
  <!-- JAVASCRIPT LOGIC & STATE (100% Preserved & Enhanced) -->
  <!-- ==================================================================== -->
  <script>
    function escapeHtml(val) {
      if (val === null || val === undefined) return '';
      return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const SVG_ICONS = {
      calendar: '<svg class="lucide lucide-calendar" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
      dashboard: '<svg class="lucide lucide-layout-dashboard" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
      modules: '<svg class="lucide lucide-layers" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 17.5"/></svg>',
      students: '<svg class="lucide lucide-graduation-cap" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
      faculty: '<svg class="lucide lucide-users" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      matrix: '<svg class="lucide lucide-building" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
      solver: '<svg class="lucide lucide-zap" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      profile: '<svg class="lucide lucide-user" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      security: '<svg class="lucide lucide-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
      logout: '<svg class="lucide lucide-log-out" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
      login: '<svg class="lucide lucide-key" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="16.5" r="5.5"/></svg>',
      bell: '<svg class="lucide lucide-bell" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
      search: '<svg class="lucide lucide-search" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
      coffee: '<svg class="lucide lucide-coffee" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/><line x1="17" x2="19" y1="11" y2="11"/><path d="M17 15h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2"/></svg>',
      leave: '<svg class="lucide lucide-calendar-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.8-1.1"/><path d="M3 10h7"/><path d="M21 15V6a2 2 0 0 0-2-2H9"/><path d="m2 2 20 20"/><path d="M16 2v4"/><path d="M8 2v1"/></svg>',
      check: '<svg class="lucide lucide-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      alert: '<svg class="lucide lucide-alert-circle" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      close: '<svg class="lucide lucide-x" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>',
      refresh: '<svg class="lucide lucide-refresh-cw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
      plus: '<svg class="lucide lucide-plus" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>',
      sparkles: '<svg class="lucide lucide-sparkles" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
      room: '<svg class="lucide lucide-map-pin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
      cohort: '<svg class="lucide lucide-users-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      user: '<svg class="lucide lucide-user-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
      arrowRight: '<svg class="lucide lucide-arrow-right" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
      arrowLeft: '<svg class="lucide lucide-arrow-left" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
      shield: '<svg class="lucide lucide-shield" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
      globe: '<svg class="lucide lucide-globe" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      book: '<svg class="lucide lucide-book-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      microscope: '<svg class="lucide lucide-microscope" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>',
      trash: '<svg class="lucide lucide-trash-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
      package: '<svg class="lucide lucide-package" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
      feedback: '<svg class="lucide lucide-message-square" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      heart: '<svg class="lucide lucide-heart" width="14" height="14" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
      palette: '<svg class="lucide lucide-palette" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
      chevronRight: '<svg class="lucide lucide-chevron-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
      chevronLeft: '<svg class="lucide lucide-chevron-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
      lock: '<svg class="lucide lucide-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    };
    const DAYS = [
      { dayOfWeek: 1, name: 'Monday', short: 'Mon', date: '2026-09-07' },
      { dayOfWeek: 2, name: 'Tuesday', short: 'Tue', date: '2026-09-08' },
      { dayOfWeek: 3, name: 'Wednesday', short: 'Wed', date: '2026-09-09' },
      { dayOfWeek: 4, name: 'Thursday', short: 'Thu', date: '2026-09-10' },
      { dayOfWeek: 5, name: 'Friday', short: 'Fri', date: '2026-09-11' },
    ];

    const PERIODS = [
      { index: 1, label: 'Period 1', time: '09:00 – 10:00', isLunch: false },
      { index: 2, label: 'Period 2', time: '10:00 – 11:00', isLunch: false },
      { index: 3, label: 'Period 3', time: '11:00 – 12:00', isLunch: false },
      { index: 4, label: 'Period 4 (Lunch)', time: '12:00 – 13:00', isLunch: true },
      { index: 5, label: 'Period 5', time: '13:00 – 14:00', isLunch: false },
      { index: 6, label: 'Period 6', time: '14:00 – 15:00', isLunch: false },
      { index: 7, label: 'Period 7', time: '15:00 – 16:00', isLunch: false },
      { index: 8, label: 'Period 8', time: '16:00 – 17:00', isLunch: false },
    ];

    let currentUser = null;
    let authToken = localStorage.getItem('timetable_auth_token') || '';
    let currentRole = 'student';
    let currentMainView = 'landing'; // 'landing', 'roles', 'dashboard'
    let currentState = {};
    let activeDayIndex = 0;
    let adminGroupBy = 'section';
    let adminFilterVal = 'all';

    const SUPABASE_URL = "${config?.supabaseUrl || ''}";
    const SUPABASE_ANON_KEY = "${config?.supabaseAnonKey || ''}";
    let realtimeEventSource = null;
    let supabaseChannelOccurrences = null;
    let supabaseChannelOutbox = null;

    // View Switching
    function switchView(viewName) {
      currentMainView = viewName;
      document.getElementById('landingView').style.display = viewName === 'landing' ? 'block' : 'none';
      document.getElementById('rolesView').style.display = viewName === 'roles' ? 'block' : 'none';
      document.getElementById('dashboardView').style.display = viewName === 'dashboard' ? 'block' : 'none';
      const feedbackEl = document.getElementById('feedbackView');
      if (feedbackEl) feedbackEl.style.display = viewName === 'feedback' ? 'block' : 'none';
      const aboutEl = document.getElementById('aboutView');
      if (aboutEl) aboutEl.style.display = viewName === 'about' ? 'block' : 'none';

      document.getElementById('navLinkHome')?.classList.toggle('active', viewName === 'landing');
      document.getElementById('navLinkFeedback')?.classList.toggle('active', viewName === 'feedback');
      document.getElementById('navLinkAbout')?.classList.toggle('active', viewName === 'about');
      document.getElementById('navLinkDashboard')?.classList.toggle('active', viewName === 'dashboard');
      document.getElementById('navLinkRoleGate')?.classList.toggle('active', viewName === 'roles');

      const isDashboardMode = (viewName === 'dashboard');
      const rail = document.getElementById('appSidebarRail');
      const topbar = document.getElementById('appTopBar');
      const pubNav = document.getElementById('publicNavbar');
      const viewport = document.getElementById('appMainViewport');

      toggleMobileRail(false);

      if (isDashboardMode) {
        if (rail) rail.style.display = 'flex';
        if (topbar) topbar.style.display = 'flex';
        if (pubNav) pubNav.style.display = 'none';
        document.body.classList.add('has-rail');
        if (viewport) viewport.style.marginLeft = '';
      } else {
        if (rail) rail.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
        if (pubNav) pubNav.style.display = 'flex';
        document.body.classList.remove('has-rail');
        if (viewport) viewport.style.marginLeft = '';
      }

      if (viewName === 'dashboard') {
        updateRoleViews();
      }
      updateTopbarCtaAndBreadcrumb();
    }

    function toggleMobileRail(forceState) {
      const rail = document.getElementById('appSidebarRail');
      const backdrop = document.getElementById('mobileRailBackdrop');
      if (!rail) return;
      const shouldOpen = (typeof forceState === 'boolean') ? forceState : !rail.classList.contains('mobile-open');
      rail.classList.toggle('mobile-open', shouldOpen);
      if (backdrop) backdrop.classList.toggle('active', shouldOpen);
    }

    async function submitFeedbackForm() {
      const fbText = document.getElementById('feedbackMessage')?.value;

      if (!fbText || fbText.trim().length === 0) {
        showMsg('Please write a message before submitting feedback.', true);
        return;
      }

      try {
        await api('/api/feedback', {
          method: 'POST',
          body: JSON.stringify({ message: fbText.trim(), category: 'general' })
        });
        showMsg('Thank you for your feedback! The institutional committee has received your input.', false);
        const msgInput = document.getElementById('feedbackMessage');
        if (msgInput) msgInput.value = '';
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Toast Helper
    function showMsg(message, isError) {
      const toast = document.getElementById('appToast');
      if (!toast) return;
      toast.className = 'toast-box ' + (isError ? 'toast-error' : 'toast-success');
      toast.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + (isError ? SVG_ICONS.alert : SVG_ICONS.check) + ' ' + escapeHtml(message) + '</span>';
      toast.style.display = 'flex';
      setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }

    // Authenticated API request helper
    async function api(path, options) {
      options = options || {};
      options.headers = options.headers || {};
      if (options.body) {
        options.headers['Content-Type'] = 'application/json';
      }
      if (authToken) {
        options.headers['Authorization'] = 'Bearer ' + authToken;
      }
      const res = await fetch(path, options);
      const text = await res.text();
      let data = {};
      if (text && text.trim().length > 0) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: text };
        }
      }
      if (!res.ok) {
        throw new Error(data.message || data.error || ('Request failed (' + res.status + ')'));
      }
      return data;
    }

    // Real-Time Subscriptions
    function setupRealtime() {
      teardownRealtime();

      // 1. Supabase Realtime Channels (PostgreSQL publication events)
      if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

          // Schedule overrides / class occurrences mutations
          supabaseChannelOccurrences = client.channel('public:class_occurrences')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'class_occurrences' }, (payload) => {
              handleRealtimeUpdate();
              if (payload.eventType === 'UPDATE' && payload.new && payload.new.status === 'cancelled') {
                showMsg('Class occurrence on ' + (payload.new.date || 'today') + ' was cancelled.', true);
              } else if (payload.eventType === 'UPDATE') {
                showMsg('Schedule updated: slot ' + (payload.new.start_slot || '') + ' modified.', false);
              }
            })
            .subscribe();

          // Notifications outbox table real-time subscription
          supabaseChannelOutbox = client.channel('public:notification_outbox')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_outbox' }, (payload) => {
              if (payload.new) {
                handleIncomingNotification(payload.new);
              }
            })
            .subscribe();
        } catch (e) {
          console.warn('[Realtime] Supabase warning:', e);
        }
      }

      // 2. Fallback Server-Sent Events (SSE) Stream
      if (window.EventSource) {
        try {
          realtimeEventSource = new EventSource('/api/realtime/stream');
          realtimeEventSource.onmessage = function(e) {
            try {
              const event = JSON.parse(e.data);
              if (event.type === 'OCCURRENCE_MUTATED' || event.type === 'TIMETABLE_PUBLISHED') {
                handleRealtimeUpdate();
              } else if (event.type === 'NOTIFICATION_DISPATCHED' && event.data) {
                handleIncomingNotification(event.data);
              }
            } catch (err) {}
          };
        } catch (e) {
          console.warn('[Realtime] SSE warning:', e);
        }
      }
    }

    function teardownRealtime() {
      if (realtimeEventSource) { try { realtimeEventSource.close(); } catch {} realtimeEventSource = null; }
      if (supabaseChannelOccurrences) { try { supabaseChannelOccurrences.unsubscribe(); } catch {} supabaseChannelOccurrences = null; }
      if (supabaseChannelOutbox) { try { supabaseChannelOutbox.unsubscribe(); } catch {} supabaseChannelOutbox = null; }
    }

    function handleIncomingNotification(rawNotif) {
      if (!rawNotif) return;
      const effectiveRole = (currentUser && authToken) ? currentUser.role : currentRole;
      const targetStudent = (currentUser && currentUser.entityId) ? currentUser.entityId : 'stud-1';

      // Check role/recipient filter
      const recipientId = rawNotif.recipient_student_id || rawNotif.recipientStudentId;
      if (effectiveRole === 'student' && recipientId && recipientId !== targetStudent) {
        return; // Notification addressed to a different student
      }

      const notifObj = {
        id: rawNotif.id || ('n-' + Date.now()),
        recipientStudentId: recipientId,
        title: rawNotif.title || 'Schedule Notice',
        message: rawNotif.message || rawNotif.details || 'A timetable modification occurred.',
        createdAt: rawNotif.created_at || rawNotif.createdAt || new Date().toISOString(),
        status: rawNotif.status || 'delivered'
      };

      // Prepend to current state notifications
      currentState.notifications = currentState.notifications || [];
      const alreadyExists = currentState.notifications.some(n => n.id === notifObj.id);
      if (!alreadyExists) {
        currentState.notifications.unshift(notifObj);
      }

      // Automatically increment unread badge counter
      const badge = document.getElementById('notifBadgeCount');
      if (badge) {
        const currentCount = parseInt(badge.textContent || '0', 10) || 0;
        badge.textContent = (currentCount + 1).toString();
      }

      // Refresh notification dropdown and student inbox views
      renderNotifPopoverList();
      renderStudentInbox();

      // Non-intrusive toast alert
      showMsg(notifObj.title + ': ' + notifObj.message, false);
    }

    let debounceTimer = null;
    function handleRealtimeUpdate() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadState().then(() => showMsg('Timetable updated in real time.', false));
      }, 300);
    }

    // Role Switching
    function selectRole(role) {
      if (currentUser && authToken) {
        if (currentUser.role !== 'admin' && currentUser.role !== role) {
          showMsg('Your verified session role is ' + currentUser.role + '. You cannot switch roles without logging in with those credentials.', true);
          return;
        }
      } else {
        if (role !== 'student') {
          openLoginModal(role);
          return;
        }
      }
      currentRole = role;
      currentUserSubPage = 'schedule';
      if (role === 'admin') currentAdminPage = 'hub';

      document.getElementById('roleCardStudent')?.classList.toggle('active', role === 'student');
      document.getElementById('roleCardTeacher')?.classList.toggle('active', role === 'teacher');
      document.getElementById('roleCardAdmin')?.classList.toggle('active', role === 'admin');

      if (currentMainView === 'dashboard') {
        updateRoleViews();
      }
    }

    function handleRoleGateClick(role) {
      if (currentUser && authToken) {
        if (currentUser.role === role || currentUser.role === 'admin') {
          selectRole(role);
          switchView('dashboard');
        } else {
          showMsg('You are currently signed in as ' + currentUser.role + '. Sign out to access the ' + role + ' portal.', true);
        }
      } else {
        openLoginModal(role);
      }
    }

    function goToRespectiveDashboard() {
      if (currentUser && authToken) {
        selectRole(currentUser.role);
        switchView('dashboard');
        if (currentUser.role === 'admin') {
          switchAdminPage('hub');
        }
      } else {
        openLoginModal();
      }
    }

    function handleExploreDashboard(targetRole, tab) {
      if (currentUser && authToken) {
        if (targetRole === 'admin' && currentUser.role !== 'admin') {
          showMsg('Administrator credentials required to access this feature.', true);
          return;
        }
        selectRole(currentUser.role);
        switchView('dashboard');
        if (tab && currentUser.role === 'admin') {
          switchAdminPage(tab);
        }
      } else {
        if (targetRole === 'admin') {
          currentRole = 'admin';
          switchView('dashboard');
          if (tab) switchAdminPage(tab);
        } else if (targetRole === 'teacher') {
          openLoginModal(targetRole);
        } else {
          selectRole('student');
          switchView('dashboard');
        }
      }
    }

    function prefillAuth(role) {
      const emailEl = document.getElementById('loginEmail');
      const passEl = document.getElementById('loginPassword');
      if (emailEl) emailEl.value = '';
      if (passEl) passEl.value = '';
    }

    function updateRoleViews() {
      const effectiveRole = (currentUser && authToken) ? currentRole : 'student';

      if (effectiveRole === 'admin') {
        switchAdminPage(currentAdminPage || 'hub');
      } else {
        switchUserSubPage(currentUserSubPage || 'schedule');
        if (effectiveRole === 'student') renderStudentInbox();
        if (effectiveRole === 'teacher' && currentUserSubPage === 'teacher-rooms') runEmptyRoomFinder();
      }
    }

    // Day Cycling
    function setDay(index) {
      activeDayIndex = Math.max(0, Math.min(DAYS.length - 1, index));
      for (let i = 0; i < DAYS.length; i++) {
        const pill = document.getElementById('dayPill' + i);
        if (pill) pill.className = 'day-pill ' + (i === activeDayIndex ? 'active' : '');
      }
      const dayObj = DAYS[activeDayIndex];
      const text = document.getElementById('activeDayText');
      if (text) text.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.calendar + ' ' + dayObj.name + ' • September ' + dayObj.date.split('-')[2] + ', 2026</span>';
      renderSingleDayGrid();
      if (currentRole === 'teacher') runEmptyRoomFinder();
      if (currentRole === 'admin') renderRoomMatrix();
    }

    function prevDay() { if (activeDayIndex > 0) setDay(activeDayIndex - 1); }
    function nextDay() { if (activeDayIndex < DAYS.length - 1) setDay(activeDayIndex + 1); }

    // Load Complete Campus State
    async function loadState() {
      try {
        const res = await fetch('/api/state');
        currentState = await res.json();
        
        // Populate Metric counters
        document.getElementById('metricTerms').textContent = (currentState.academicTerms || []).length;
        document.getElementById('metricRooms').textContent = (currentState.rooms || []).length;
        document.getElementById('metricTeachers').textContent = (currentState.teachers || []).length;
        document.getElementById('metricSections').textContent = (currentState.sections || []).length;
        document.getElementById('metricTimetables').textContent = (currentState.timetableVersions || []).filter(v => v.status === 'published').length;

        populateFormDropdowns();
        populateSolverTerms();
        renderAdminTables();
        renderSingleDayGrid();
        renderStagedDraftsReview();
        populateAdminTimetableTargets();
        renderStudentsTable();
        renderFacultyTable();
        renderAdminTimetable();
      } catch (err) {
        showMsg('Failed to load state: ' + err.message, true);
      }
    }

    // Grid Rendering
    function renderSingleDayGrid() {
      const container = document.getElementById('timetableGridWrapper');
      if (!container) return;

      const activeDay = DAYS[activeDayIndex];
      const allOccurrences = currentState.classOccurrences || [];
      const scheduledClasses = currentState.scheduledClasses || [];

      const roomsMap = new Map((currentState.rooms || []).map(r => [r.id, r]));
      const teachersMap = new Map((currentState.teachers || []).map(t => [t.id, t]));
      const coursesMap = new Map((currentState.courses || []).map(c => [c.id, c]));
      const sectionsMap = new Map((currentState.sections || []).map(s => [s.id, s]));
      const batchesMap = new Map((currentState.batches || []).map(b => [b.id, b]));
      const offeringsMap = new Map((currentState.courseOfferings || []).map(o => [o.id, o]));

      // Filter active non-superseded occurrences for the day
      let dayOccs = allOccurrences.filter(o => o.date === activeDay.date && o.status !== 'superseded');
      if (dayOccs.length === 0) {
        dayOccs = allOccurrences.filter(o => o.dayOfWeek === activeDay.dayOfWeek && o.status !== 'superseded');
      }
      if (dayOccs.length === 0 && scheduledClasses.length > 0) {
        dayOccs = scheduledClasses.filter(c => c.dayOfWeek === activeDay.dayOfWeek).map(c => ({
          ...c, date: activeDay.date, status: 'scheduled'
        }));
      }

      let relevantOccs = [];

      if (currentRole === 'student') {
        const studentEntity = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
        const studentObj = (currentState.students || []).find(s => s.id === studentEntity || s.rollNumber === studentEntity);
        const studentId = studentObj ? studentObj.id : studentEntity;
        const studentName = (currentUser && currentUser.role === 'student') ? (currentUser.fullName || studentObj?.name || currentUser.email) : (studentObj ? studentObj.name : 'Charlie Brown');
        const rollLabel = studentObj ? studentObj.rollNumber : studentId;

        const studentSections = new Set();
        const studentBatches = new Set();
        const studentElectives = new Set();

        (currentState.studentGroupMemberships || []).filter(m => {
          if (m.studentId !== studentId) return false;
          if (m.effectiveStartDate && m.effectiveStartDate > activeDay.date) return false;
          if (m.effectiveEndDate && m.effectiveEndDate < activeDay.date) return false;
          return true;
        }).forEach(m => {
          if (m.groupType === 'section') studentSections.add(m.groupId);
          if (m.groupType === 'batch') studentBatches.add(m.groupId);
        });
        if (studentSections.size === 0) studentSections.add('sec-A');
        if (studentBatches.size === 0) studentBatches.add('batch-A1');

        (currentState.electiveAssignments || []).filter(ea => ea.studentId === studentId && ea.status === 'active').forEach(ea => {
          studentElectives.add(ea.electiveGroupId);
        });

        relevantOccs = dayOccs.filter(o => {
          if (o.targetType === 'section') return studentSections.has(o.targetId);
          if (o.targetType === 'batch') return studentBatches.has(o.targetId);
          if (o.targetType === 'elective_group') return studentElectives.has(o.targetId);
          return false;
        });

        // Update profile labels if present
        const pName = document.getElementById('studentProfileName');
        if (pName) pName.textContent = studentName;
        const pMeta = document.getElementById('studentProfileMeta');
        if (pMeta) pMeta.textContent = 'Roll ' + rollLabel;
        const pSec = document.getElementById('stdSecLabel');
        if (pSec) pSec.textContent = Array.from(studentSections).join(', ');
        const pBatch = document.getElementById('stdBatchLabel');
        if (pBatch) pBatch.textContent = Array.from(studentBatches).join(', ');

      } else if (currentRole === 'teacher') {
        const teacherEntity = (currentUser && currentUser.role === 'teacher' && currentUser.entityId) ? currentUser.entityId : 't-1';
        relevantOccs = dayOccs.filter(o => o.teacherId === teacherEntity);
      } else {
        // Admin or fallback
        relevantOccs = dayOccs;
      }

      // Render 4-Column x 2-Row Full-Canvas Grid
      container.innerHTML = renderResponsiveCanvasGrid(relevantOccs, roomsMap, teachersMap, coursesMap, offeringsMap);
    }

    function renderResponsiveCanvasGrid(occurrences, roomsMap, teachersMap, coursesMap, offeringsMap) {
      let html = '<div class="schedule-grid-canvas">';

      // Determine active period based on current wall clock hour
      const currentHour = new Date().getHours();
      // Schedule mapping: P1(9:00), P2(10:00), P3(11:00), P4(12:00), P5(13:00), P6(14:00), P7(15:00), P8(16:00)
      const currentSlotIndex = (currentHour >= 9 && currentHour < 17) ? (currentHour - 8) : 1;

      let p = 1;
      while (p <= 8) {
        const isActivePeriod = (p === currentSlotIndex);
        const activeClass = isActivePeriod ? ' active-period-column' : '';

        if (p === 4) {
          // Period 4 Non-Teaching Lunch Interval (DEC-04)
          html += '<div class="period-card-cell lunch-period-cell' + activeClass + '">' +
            '<div style="margin-bottom:8px; color:#B45309; display:flex; justify-content:center;">' + SVG_ICONS.coffee.replace('width="16"', 'width="28"').replace('height="16"', 'height="28"') + '</div>' +
            '<div style="font-size:13px; font-weight:800; color:#92400E; text-transform:uppercase; letter-spacing:0.04em;">Period 4 • Lunch Break</div>' +
            '<div style="font-size:11px; color:#B45309; margin-top:4px;">12:00 – 13:00 • Non-Teaching Interval (DEC-04)</div>' +
            (isActivePeriod ? '<div style="margin-top:8px;"><span class="status-badge" style="background:var(--brand-orange); color:#FFFFFF; font-size:10px;">Current Period</span></div>' : '') +
          '</div>';
          p++;
          continue;
        }

        const periodMeta = PERIODS.find(x => x.index === p) || { label: 'Period ' + p, time: '' };
        const slotOccs = (occurrences || []).filter(o => o.startSlot === p);

        if (slotOccs.length === 0) {
          // Free Slot
          html += '<div class="period-card-cell free-period-cell' + activeClass + '">' +
            '<div class="period-card-header" style="width:100%; border-radius:var(--radius-md) var(--radius-md) 0 0;">' +
              '<div class="period-label-wrap">' +
                '<span class="period-title">' + periodMeta.label + '</span>' +
                '<span class="period-time-range">' + periodMeta.time + '</span>' +
              '</div>' +
              (isActivePeriod ? '<span class="status-badge" style="background:var(--brand-orange); color:#FFFFFF; font-size:10px;">Active Slot</span>' : '<span class="status-badge" style="background:#F1F5F9; color:#64748B; font-size:10px;">Free Period</span>') +
            '</div>' +
            '<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px;">' +
              '<span style="font-size:12px; font-weight:600; color:var(--text-muted);">No Academic Commitment</span>' +
              (currentRole === 'teacher' ? '<button class="btn btn-secondary" style="padding:4px 10px; font-size:11px; margin-top:8px;" onclick="openQuickBookExtraModal(' + p + ')">+ Book Extra</button>' : '') +
            '</div>' +
          '</div>';
          p++;
        } else {
          // One or more occurrences
          // Period 4 is strictly non-teaching lunch interval (DEC-04). Multi-slot labs cannot span across lunch.
          const isTwoSlotLab = (slotOccs.some(o => o.duration === 2 || o.activityType === 'P')) && p !== 3 && p !== 4 && p < 8;
          const spanClass = (isTwoSlotLab ? ' two-slot-span' : '') + activeClass;
          const endPeriodMeta = isTwoSlotLab ? (PERIODS.find(x => x.index === p + 1) || periodMeta) : periodMeta;
          const combinedTime = isTwoSlotLab ? (periodMeta.time.split('–')[0].trim() + ' – ' + endPeriodMeta.time.split('–')[1].trim()) : periodMeta.time;

          html += '<div class="period-card-cell' + spanClass + '">';

          // Card Header with Period Label & Combined Time
          html += '<div class="period-card-header">' +
            '<div class="period-label-wrap">' +
              '<span class="period-title">' + periodMeta.label + (isTwoSlotLab ? ' & ' + endPeriodMeta.label : '') + '</span>' +
              '<span class="period-time-range">' + combinedTime + '</span>' +
            '</div>' +
            '<div style="display:flex; gap:6px; align-items:center;">' +
              (isActivePeriod ? '<span class="status-badge" style="background:var(--brand-orange); color:#FFFFFF; font-size:10px;">Active Slot</span>' : '') +
              (isTwoSlotLab ? '<span class="status-badge" style="background:#EEF2FF; color:#4338CA; border:1px solid #C7D2FE; font-size:10px;">2-Slot Practical</span>' : '') +
            '</div>' +
          '</div>';

          // Card Body with Unclipped Details
          html += '<div class="period-card-body">';
          slotOccs.forEach(o => {
            html += renderFullDetailOccurrence(o, roomsMap, teachersMap, coursesMap, offeringsMap);
          });
          html += '</div>';

          html += '</div>';
          p += (isTwoSlotLab ? 2 : 1);
        }
      }

      html += '</div>';
      return html;
    }

    function renderFullDetailOccurrence(o, roomsMap, teachersMap, coursesMap, offeringsMap) {
      const offering = offeringsMap.get(o.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : null;
      const courseCode = course ? course.code : 'CS201';
      const courseName = course ? course.name : 'Course Session';
      const teacher = teachersMap.get(o.teacherId);
      const teacherName = teacher ? teacher.name : o.teacherId;
      const room = roomsMap.get(o.roomId) || { roomNumber: o.roomId, building: 'Academic Block', floor: 1 };

      const isCancelled = (o.status === 'cancelled');

      // Component Pills
      let compLabel = 'LECTURE • 1H';
      let compBg = '#EFF6FF';
      let compColor = '#2563EB';
      let compBorder = '#BFDBFE';

      if (o.activityType === 'P' || o.duration === 2) {
        compLabel = 'LAB • 2H';
        compBg = '#F5F3FF';
        compColor = '#7C3AED';
        compBorder = '#DDD6FE';
      } else if (o.activityType === 'T') {
        compLabel = 'TUTORIAL • 1H';
        compBg = '#FFFBEB';
        compColor = '#B45309';
        compBorder = '#FDE68A';
      } else if (o.isExtraClass) {
        compLabel = 'EXTRA CLASS';
        compBg = '#ECFDF5';
        compColor = '#047857';
        compBorder = '#A7F3D0';
      }

      // Status Pill
      let statusLabel = 'SCHEDULED';
      let statusBg = '#ECFDF5';
      let statusColor = '#047857';
      let statusBorder = '#A7F3D0';

      if (isCancelled) {
        statusLabel = 'CANCELLED';
        statusBg = '#FEF2F2';
        statusColor = '#B91C1C';
        statusBorder = '#FECACA';
      } else if (o.isExtraClass) {
        statusLabel = 'CONFIRMED EXTRA';
        statusBg = '#EEF2FF';
        statusColor = '#4338CA';
        statusBorder = '#C7D2FE';
      }

      const cardBg = isCancelled ? '#FEF2F2' : (course && course.cardBgColor ? course.cardBgColor : '#FFFFFF');
      const cardBorder = isCancelled ? '#FCA5A5' : (course && course.borderColor ? course.borderColor : 'var(--border-subtle)');

      return '<div class="class-card-unclipped" style="background:' + cardBg + '; border:1px solid ' + cardBorder + '; border-radius:var(--radius-sm); padding:12px;" data-occ-id="' + escapeHtml(o.id) + '" onclick="openDrawer(this.dataset.occId)">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">' +
          '<span class="status-badge" style="background:' + compBg + '; color:' + compColor + '; border:1px solid ' + compBorder + '; font-size:10px;">' + compLabel + '</span>' +
          '<span class="status-badge" style="background:' + statusBg + '; color:' + statusColor + '; border:1px solid ' + statusBorder + '; font-size:10px;">' + statusLabel + '</span>' +
        '</div>' +
        '<div style="margin-top:6px;">' +
          '<span style="font-size:12px; font-weight:800; color:var(--text-main); font-family:var(--font-mono, monospace); margin-right:6px;">' + escapeHtml(courseCode) + '</span>' +
          '<span class="class-course-title" style="' + (isCancelled ? 'text-decoration:line-through; opacity:0.75;' : '') + '">' + escapeHtml(courseName) + '</span>' +
        '</div>' +
        (o.targetId ? '<div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-top:2px; display:inline-flex; align-items:center; gap:4px;">' + SVG_ICONS.cohort + ' ' + (o.targetType === 'batch' ? 'Practical Batch: ' : 'Cohort: ') + escapeHtml(o.targetId) + '</div>' : '') +
        '<div class="class-metadata-grid">' +
          '<div class="class-metadata-row"><span style="display:inline-flex; align-items:center;">' + SVG_ICONS.user + '</span><strong>' + escapeHtml(teacherName) + '</strong></div>' +
          '<div class="class-metadata-row"><span style="display:inline-flex; align-items:center;">' + SVG_ICONS.room + '</span><span>Room ' + escapeHtml(room.roomNumber) + ' • ' + escapeHtml(room.building) + ' (Floor ' + escapeHtml(room.floor) + ')</span></div>' +
          (isCancelled && o.cancellationReason ? '<div style="margin-top:4px; padding:4px 8px; background:rgba(254,202,202,0.6); border-radius:4px; color:#991B1B; font-weight:700; font-size:11px; display:flex; align-items:center; gap:4px;">' + SVG_ICONS.alert + ' Reason: ' + escapeHtml(o.cancellationReason) + '</div>' : '') +
        '</div>' +
      '</div>';
    }


    // Render individual occurrence card
    function renderOccurrenceCard(o, roomsMap, teachersMap, coursesMap, offeringsMap) {
      const offering = offeringsMap.get(o.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : null;
      const courseCode = course ? course.code : 'CS201';
      const courseName = course ? course.name : 'Data Structures';
      const teacher = teachersMap.get(o.teacherId);
      const teacherName = teacher ? teacher.name : o.teacherId;
      const room = roomsMap.get(o.roomId) || { roomNumber: o.roomId, building: 'Main Block', floor: 1 };

      const isCancelled = o.status === 'cancelled';
      let cardClass = 'class-lecture';
      let badgeLabel = 'SCHEDULED';
      let badgeBg = '#ECFDF5';
      let badgeText = '#047857';
      let badgeBorder = '#A7F3D0';

      if (o.activityType === 'P' || o.duration === 2) {
        cardClass = 'class-practical';
        badgeLabel = 'LAB • 2H';
        badgeBg = '#EEF2FF';
        badgeText = '#4338CA';
        badgeBorder = '#C7D2FE';
      } else if (o.activityType === 'T') {
        cardClass = 'class-tutorial';
        badgeLabel = 'TUTORIAL';
        badgeBg = '#FFFBEB';
        badgeText = '#B45309';
        badgeBorder = '#FDE68A';
      } else if (o.isExtraClass) {
        cardClass = 'class-extra';
        badgeLabel = 'EXTRA CLASS';
        badgeBg = '#EEF2FF';
        badgeText = '#4338CA';
        badgeBorder = '#C7D2FE';
      }

      let inlineStyle = 'border: 1px solid var(--border-subtle);';
      if (isCancelled) {
        cardClass = 'class-cancelled';
        badgeLabel = 'CANCELLED';
        badgeBg = '#FEF2F2';
        badgeText = '#B91C1C';
        badgeBorder = '#FECACA';
        inlineStyle = 'background: #FEF2F2 !important; color: #991B1B !important; border: 1px dashed #FCA5A5 !important;';
      } else if (course && course.cardBgColor && course.fontColor) {
        inlineStyle = 'background: ' + course.cardBgColor + ' !important; color: ' + course.fontColor + ' !important;' +
          (course.borderColor ? ' border: 1px solid ' + course.borderColor + ' !important;' : ' border: 1px solid rgba(0,0,0,0.08) !important;');
        badgeBg = 'rgba(255, 255, 255, 0.85)';
        badgeText = course.fontColor;
        badgeBorder = course.borderColor || 'rgba(0,0,0,0.12)';
      }

      const badgeStyle = 'background:' + badgeBg + '; color:' + badgeText + '; border:1px solid ' + badgeBorder + '; font-size:9px; padding:2px 6px; border-radius:4px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase;';

      return '<div class="class-card ' + cardClass + '" style="' + inlineStyle + '" data-occ-id="' + escapeHtml(o.id) + '" onclick="openDrawer(this.dataset.occId)">' +
        '<div class="class-card-scroll-body">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
            '<span class="badge-pill" style="' + badgeStyle + '">' + badgeLabel + '</span>' +
            (o.activityType === 'P' ? '<span style="font-size:10px; font-weight:700; opacity:0.8;">2-Slot</span>' : '') +
          '</div>' +
          '<div class="class-code" style="color:inherit; font-size:12px; font-weight:700;">' + escapeHtml(courseCode) + ' ' + (isCancelled ? '<span style="text-decoration:line-through; opacity:0.8;">' + escapeHtml(courseName) + '</span>' : escapeHtml(courseName)) + '</div>' +
          '<div class="class-meta" style="color:inherit; opacity:0.85; font-size:11px; display:flex; align-items:center; gap:4px;"><span style="display:inline-flex;">' + SVG_ICONS.room + '</span> Room ' + escapeHtml(room.roomNumber) + ' (' + escapeHtml(room.building) + ')</div>' +
          '<div class="class-meta" style="color:inherit; opacity:0.85; font-size:11px; display:flex; align-items:center; gap:4px;"><span style="display:inline-flex;">' + SVG_ICONS.faculty + '</span> ' + escapeHtml(teacherName) + '</div>' +
          (o.targetId ? '<div class="class-meta" style="color:inherit; opacity:0.8; font-size:10px; display:flex; align-items:center; gap:4px;"><span style="display:inline-flex;">' + SVG_ICONS.cohort + '</span> ' + (o.targetType === 'batch' ? 'Batch ' : 'Section ') + escapeHtml(o.targetId) + '</div>' : '') +
          (isCancelled && o.cancellationReason ? '<div style="font-size:10px; color:#991B1B; font-weight:700; margin-top:4px; padding:2px 6px; background:rgba(254,202,202,0.7); border-radius:4px; display:flex; align-items:center; gap:4px;"><span style="display:inline-flex;">' + SVG_ICONS.alert + '</span> Reason: ' + escapeHtml(o.cancellationReason) + '</div>' : '') +
        '</div>' +
      '</div>';
    }

    // Occurrence Details Drawer (Page 5 Spec Requirement)
    function openDrawer(occId) {
      const occ = (currentState.classOccurrences || []).find(o => o.id === occId);
      if (!occ) return;

      const offeringsMap = new Map((currentState.courseOfferings || []).map(o => [o.id, o]));
      const coursesMap = new Map((currentState.courses || []).map(c => [c.id, c]));
      const roomsMap = new Map((currentState.rooms || []).map(r => [r.id, r]));
      const teachersMap = new Map((currentState.teachers || []).map(t => [t.id, t]));

      const offering = offeringsMap.get(occ.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : null;
      const room = roomsMap.get(occ.roomId);
      const teacher = teachersMap.get(occ.teacherId);

      document.getElementById('drawerTitle').textContent = (course ? course.code + ' — ' + course.name : 'Session Details');

      const roomLabel = room ? (room.roomNumber + ' (' + room.building + ', Floor ' + room.floor + ')') : (occ.roomId || 'TBA');
      const teacherLabel = teacher ? (teacher.name + ' (' + (teacher.empId || '') + ')') : (occ.teacherId || 'TBA');
      const targetLabel = (occ.targetType ? occ.targetType.toUpperCase() + ' ' : '') + (occ.targetId || '');

      let bodyHtml = '<div style="font-size:13px; line-height:1.7;">' +
        '<div style="margin-bottom:12px;"><strong>Activity Type:</strong> ' + (occ.activityType === 'P' ? 'Practical Lab (2 consecutive hours)' : occ.activityType === 'T' ? 'Tutorial' : 'Lecture') + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Venue:</strong> Room ' + escapeHtml(roomLabel) + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Instructor:</strong> ' + escapeHtml(teacherLabel) + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Target Cohort:</strong> ' + escapeHtml(targetLabel) + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Current Status:</strong> <span class="status-badge ' + (occ.status === 'scheduled' ? 'status-badge-published' : 'status-badge-superseded') + '">' + escapeHtml(occ.status ? occ.status.toUpperCase() : 'UNKNOWN') + '</span></div>' +
        (occ.cancellationReason ? '<div style="margin-bottom:12px; color:#991B1B;"><strong>Cancellation Reason:</strong> ' + escapeHtml(occ.cancellationReason) + '</div>' : '') +
        (occ.notes ? '<div style="margin-bottom:12px; color:var(--text-muted);"><strong>Notes:</strong> ' + escapeHtml(occ.notes) + '</div>' : '') +
      '</div>';

      document.getElementById('drawerBody').innerHTML = bodyHtml;

      const actionsEl = document.getElementById('drawerTeacherActions');
      if (currentRole === 'teacher' || currentRole === 'admin') {
        if (occ.status === 'scheduled') {
          actionsEl.innerHTML = '<div style="display:flex; gap:8px;">' +
            '<button class="btn btn-outline-danger" style="flex:1;" data-occ-id="' + escapeHtml(occ.id) + '" onclick="cancelOccurrencePrompt(this.dataset.occId)">Cancel Session</button>' +
            '<button class="btn btn-primary" style="flex:1;" data-occ-id="' + escapeHtml(occ.id) + '" onclick="rescheduleOccurrencePrompt(this.dataset.occId)">Reschedule</button>' +
          '</div>';
        } else {
          actionsEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted); text-align:center;">This occurrence is already cancelled.</div>';
        }
      } else {
        actionsEl.innerHTML = '';
      }

      document.getElementById('occurrenceDrawer').style.display = 'flex';
    }

    function closeDrawer() {
      document.getElementById('occurrenceDrawer').style.display = 'none';
    }

    // Prompt cancel occurrence with reason
    async function cancelOccurrencePrompt(occId) {
      const reason = prompt('Please enter a cancellation reason for students:');
      if (reason === null) return;
      try {
        await api('/api/classes/occurrences/' + occId + '/cancel', {
          method: 'POST',
          body: JSON.stringify({ reason: reason || 'Faculty operational leave' })
        });
        showMsg('Class occurrence cancelled. Students notified instantly.', false);
        closeDrawer();
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Prompt reschedule occurrence
    async function rescheduleOccurrencePrompt(occId) {
      const newDate = prompt('Enter new date (YYYY-MM-DD):', '2026-09-08');
      if (!newDate) return;
      const newSlot = prompt('Enter new period slot index (1 to 8):', '2');
      if (!newSlot) return;

      try {
        const [y, m, d] = newDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const dayOfWeek = dt.getDay() === 0 ? 7 : dt.getDay();

        await api('/api/classes/occurrences/' + occId + '/reschedule', {
          method: 'POST',
          body: JSON.stringify({
            date: newDate,
            dayOfWeek: dayOfWeek,
            startSlot: parseInt(newSlot, 10)
          })
        });
        showMsg('Occurrence rescheduled successfully.', false);
        closeDrawer();
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Empty Classroom Finder (Spec Page 5)
    function runEmptyRoomFinder() {
      const slot = parseInt(document.getElementById('finderSlot')?.value || document.getElementById('finderSlotSelect')?.value || '1', 10);
      const activeDay = DAYS[activeDayIndex];
      const rooms = currentState.rooms || [];
      const occs = (currentState.classOccurrences || []).filter(o => o.date === activeDay.date && o.status === 'scheduled');

      const occupiedRooms = new Set();
      occs.forEach(o => {
        const occEnd = o.startSlot + o.duration - 1;
        if (slot >= o.startSlot && slot <= occEnd) {
          occupiedRooms.add(o.roomId);
        }
      });

      const freeRooms = rooms.filter(r => !occupiedRooms.has(r.id));
      const resEl = document.getElementById('finderResults');
      if (!resEl) return;

      if (freeRooms.length === 0) {
        resEl.innerHTML = '<span style="color:#DC2626;">No free rooms found during Period ' + slot + '.</span>';
      } else {
        let html = '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">';
        freeRooms.forEach(r => {
          html += '<span style="background:var(--accent-emerald-light); color:#047857; border:1px solid #A7F3D0; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700;">' +
            'Room ' + r.roomNumber + ' (' + r.building + ', Cap ' + r.capacity + ')' +
          '</span>';
        });
        html += '</div>';
        resEl.innerHTML = '<strong>' + freeRooms.length + ' Free Rooms Available on ' + activeDay.name + ' Period ' + slot + ':</strong>' + html;
      }
    }

    // Room Utilization Matrix (Spec Page 6)
    function renderRoomMatrix() {
      const container = document.getElementById('roomMatrixContainer');
      if (!container) return;
      const activeDay = DAYS[activeDayIndex];
      const rooms = currentState.rooms || [];
      const occs = (currentState.classOccurrences || []).filter(o => o.date === activeDay.date && o.status === 'scheduled');

      if (rooms.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:36px; background:#FFFFFF; border:1px dashed var(--border); border-radius:12px;">' +
          '<div style="font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px;">No Venues or Rooms Configured</div>' +
          '<div style="font-size:12px; color:var(--text-muted);">Add rooms and lecture halls under Modular Management to view utilization metrics.</div>' +
        '</div>';
        return;
      }

      let html = '<div style="margin-bottom:12px; font-size:13px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">' +
        '<div>Viewing room occupancy on <strong>' + activeDay.name + '</strong> (' + activeDay.date + ')</div>' +
        '<div style="display:flex; gap:12px; font-size:11px;">' +
          '<span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:2px; background:#EFF6FF; border:1px solid #BFDBFE; display:inline-block;"></span> Occupied</span>' +
          '<span style="display:inline-flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; border-radius:2px; background:#ECFDF5; border:1px solid #A7F3D0; display:inline-block;"></span> Vacant</span>' +
        '</div>' +
      '</div>';

      html += '<table class="styled-table"><thead><tr><th style="width:220px;">Room / Venue</th>';
      for (let s = 1; s <= 8; s++) {
        html += '<th style="text-align:center;">P' + s + (s === 4 ? '<br><small style="font-size:9px; opacity:0.8;">(Lunch)</small>' : '') + '</th>';
      }
      html += '</tr></thead><tbody>';

      rooms.forEach(r => {
        html += '<tr>' +
          '<td>' +
            '<div style="font-weight:700; color:var(--text-main);">Room ' + r.roomNumber + '</div>' +
            '<div style="font-size:11px; color:var(--text-muted);">' + r.building + ' • Cap: ' + r.capacity + ' (' + r.roomType + ')</div>' +
          '</td>';

        for (let s = 1; s <= 8; s++) {
          if (s === 4) {
            html += '<td style="background:#FFFBEB; text-align:center; color:#92400E; font-size:10px; font-weight:700;">Lunch</td>';
            continue;
          }
          const occInSlot = occs.find(o => o.roomId === r.id && s >= o.startSlot && s <= (o.startSlot + o.duration - 1));
          if (occInSlot) {
            html += '<td style="background:#EFF6FF; border-left:2px solid #2563EB; color:#1D4ED8; text-align:center; font-weight:700; font-size:11px;">' + (occInSlot.activityType === 'P' ? 'LAB' : 'CLASS') + '</td>';
          } else {
            html += '<td style="background:#ECFDF5; color:#047857; text-align:center; font-size:11px; font-weight:600;">FREE</td>';
          }
        }
        html += '</tr>';
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    }

    // Admin Tab Navigation
    function switchAdminTab(tabKey) {
      const tabs = ['hierarchy', 'courses', 'venues', 'solver', 'operations', 'users', 'matrix'];
      tabs.forEach(k => {
        const pane = document.getElementById('adminTab' + k.charAt(0).toUpperCase() + k.slice(1));
        const btn = document.getElementById('tabBtn' + k.charAt(0).toUpperCase() + k.slice(1));
        if (pane) pane.style.display = k === tabKey ? 'block' : 'none';
        if (btn) btn.className = 'admin-pill-btn ' + (k === tabKey ? 'active' : '');
      });
      if (tabKey === 'matrix') renderRoomMatrix();
    }

    // Auth & Login Modal
    function openLoginModal(role) {
      const modal = document.getElementById('loginModal');
      const alertBox = document.getElementById('modalAlertBox');
      if (alertBox) alertBox.style.display = 'none';
      if (role) {
        selectAuthRole(role);
      } else {
        switchAuthPane('roleSelect');
      }
      if (modal) modal.style.display = 'flex';
    }
    function closeLoginModal() {
      const modal = document.getElementById('loginModal');
      if (modal) modal.style.display = 'none';
    }
    function selectAuthRole(role) {
      prefillAuth(role);
      const badge = document.getElementById('activeRolePersonaBadge');
      if (badge) {
        if (role === 'admin') badge.innerHTML = '<span style="display:inline-flex; align-items:center; gap:4px;">' + SVG_ICONS.shield + ' Administrator</span>';
        else if (role === 'teacher') badge.innerHTML = '<span style="display:inline-flex; align-items:center; gap:4px;">' + SVG_ICONS.faculty + ' Faculty Hub</span>';
        else badge.innerHTML = '<span style="display:inline-flex; align-items:center; gap:4px;">' + SVG_ICONS.students + ' Student Portal</span>';
      }
      switchAuthPane('login');
    }
    function switchAuthPane(pane) {
      const rolePane = document.getElementById('roleSelectPane');
      const loginPane = document.getElementById('loginFormPane');
      const forgotPane = document.getElementById('forgotFormPane');
      const title = document.getElementById('authModalTitle');
      const desc = document.getElementById('authModalDesc');
      const alertBox = document.getElementById('modalAlertBox');
      if (alertBox) alertBox.style.display = 'none';

      if (rolePane) rolePane.style.display = pane === 'roleSelect' ? 'block' : 'none';
      if (loginPane) loginPane.style.display = pane === 'login' ? 'block' : 'none';
      if (forgotPane) forgotPane.style.display = pane === 'forgot' ? 'block' : 'none';

      if (title && desc) {
        if (pane === 'roleSelect') {
          title.textContent = 'Sign In to PlanMyClass';
          desc.textContent = 'Step 1: Select your role persona to proceed.';
        } else if (pane === 'login') {
          title.textContent = 'Sign In to PlanMyClass';
          desc.textContent = 'Step 2: Enter your institutional credentials.';
        } else if (pane === 'forgot') {
          title.textContent = 'Password Recovery';
          desc.textContent = 'Enter your institutional email to dispatch a recovery link.';
        }
      }
    }

    async function handleLogin() {
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      const alertBox = document.getElementById('modalAlertBox');

      if (!email || !password) {
        if (alertBox) {
          alertBox.textContent = 'Please enter both email and password.';
          alertBox.style.background = '#FEF2F2';
          alertBox.style.color = '#DC2626';
          alertBox.style.display = 'block';
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');

        authToken = data.token;
        currentUser = data.user;
        currentRole = currentUser.role;
        localStorage.setItem('timetable_auth_token', authToken);

        closeLoginModal();
        updateAuthNav();
        selectRole(currentUser.role);
        switchView('dashboard');
        showMsg('Signed in successfully as ' + currentUser.fullName, false);
        await loadState();
      } catch (err) {
        if (alertBox) {
          alertBox.textContent = err.message;
          alertBox.style.background = '#FEF2F2';
          alertBox.style.color = '#DC2626';
          alertBox.style.display = 'block';
        }
      }
    }

    function handleLogout() {
      authToken = '';
      currentUser = null;
      currentRole = 'student';
      localStorage.removeItem('timetable_auth_token');
      updateAuthNav();
      updateRoleViews();
      switchView('landing');
      showMsg('Logged out successfully.', false);
    }

    async function handleForgotPassword() {
      const email = document.getElementById('forgotEmail')?.value;
      if (!email) { showMsg('Please enter your institutional email.', true); return; }
      try {
        await api('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email, redirectTo: window.location.origin })
        });
        showMsg('If the account exists, a reset link has been dispatched.', false);
        switchAuthPane('login');
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function updateAuthNav() {
      const unauth = document.getElementById('unauthNav');
      const auth = document.getElementById('authNav');
      const roleBadge = document.getElementById('navRoleBadge');
      const userName = document.getElementById('navUserName');
      const activeRoleTag = document.getElementById('activeUserRoleTag');
      const activeEmailTag = document.getElementById('activeUserEmailTag');
      const guestNotice = document.getElementById('guestNotice');
      const dashLink = document.getElementById('navLinkDashboard');

      const railAvatar = document.getElementById('railUserAvatar');
      const railName = document.getElementById('railUserName');
      const railRole = document.getElementById('railUserRole');
      const railAdmin = document.getElementById('railAdminGroup');
      const railTeacher = document.getElementById('railTeacherGroup');
      const railStudent = document.getElementById('railStudentGroup');

      if (currentUser && authToken) {
        if (unauth) unauth.style.display = 'none';
        if (auth) auth.style.display = 'flex';
        if (dashLink) dashLink.style.display = 'flex';
        if (guestNotice) guestNotice.style.display = 'none';
        const icons = { admin: 'Administrator', teacher: 'Faculty', student: 'Student' };
        if (roleBadge) {
          roleBadge.textContent = icons[currentUser.role] || currentUser.role;
        }
        if (userName) userName.textContent = currentUser.fullName || currentUser.email;
        if (activeRoleTag) {
          activeRoleTag.textContent = icons[currentUser.role] || currentUser.role;
          activeRoleTag.style.background = currentUser.role === 'admin' ? 'var(--primary-light)' : (currentUser.role === 'teacher' ? '#FFF1F2' : '#F0F9FF');
          activeRoleTag.style.color = currentUser.role === 'admin' ? 'var(--primary-blue)' : (currentUser.role === 'teacher' ? '#E11D48' : '#0284C7');
        }
        if (activeEmailTag) {
          activeEmailTag.textContent = currentUser.email;
        }

        // Left Rail User Card
        if (railAvatar) railAvatar.textContent = (currentUser.fullName || currentUser.email || 'U').charAt(0).toUpperCase();
        if (railName) railName.textContent = currentUser.fullName || currentUser.email;
        if (railRole) railRole.textContent = icons[currentUser.role] || currentUser.role;

        // Show role-scoped rail sections
        if (railAdmin) railAdmin.style.display = (currentUser.role === 'admin') ? 'flex' : 'none';
        if (railTeacher) railTeacher.style.display = (currentUser.role === 'teacher') ? 'flex' : 'none';
        if (railStudent) railStudent.style.display = (currentUser.role === 'student') ? 'flex' : 'none';

      } else {
        if (unauth) unauth.style.display = 'flex';
        if (auth) auth.style.display = 'none';
        if (dashLink) dashLink.style.display = 'none';
        if (guestNotice) guestNotice.style.display = 'flex';
        if (activeRoleTag) {
          activeRoleTag.textContent = 'Unauthenticated • Read-Only';
          activeRoleTag.style.background = '#F1F5F9';
          activeRoleTag.style.color = '#64748B';
        }
        if (activeEmailTag) {
          activeEmailTag.textContent = '(Guest)';
        }

        if (railAvatar) railAvatar.textContent = 'G';
        if (railName) railName.textContent = 'Guest Preview';
        if (railRole) railRole.textContent = 'Read-Only';
        if (railAdmin) railAdmin.style.display = 'none';
        if (railTeacher) railTeacher.style.display = 'none';
        if (railStudent) railStudent.style.display = 'flex';
      }
      updateTopbarCtaAndBreadcrumb();
    }

    // Student Inbox Notifications
    function renderStudentInbox() {
      const inboxEl = document.getElementById('studentInbox');
      if (!inboxEl) return;
      const targetStudent = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
      const notifications = (currentState.notifications || []).filter(n => !n.recipientStudentId || n.recipientStudentId === targetStudent);
      const badge = document.getElementById('notifBadgeCount');
      if (badge) badge.textContent = notifications.length.toString();

      if (notifications.length === 0) {
        inboxEl.innerHTML = '<div style="font-size:13px; color:var(--text-muted); padding:10px 0; display:flex; align-items:center; gap:6px;">' + SVG_ICONS.sparkles + ' All caught up! No unread notifications.</div>';
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
      notifications.slice(-6).reverse().forEach(n => {
        const title = escapeHtml(n.title || 'Schedule Notice');
        const msg = escapeHtml(n.message || n.details || '');
        const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'Recent';
        html += '<div style="background:#F8FAFC; border:1px solid var(--border); border-left:3px solid var(--primary); padding:10px 12px; border-radius:8px; font-size:12px;">' +
          '<div style="font-weight:700; color:var(--text);">' + title + '</div>' +
          '<div style="color:var(--text-muted); margin-top:2px;">' + msg + '</div>' +
          '<div style="font-size:10px; color:#94A3B8; margin-top:4px;">' + timeStr + '</div>' +
        '</div>';
      });
      html += '</div>';
      inboxEl.innerHTML = html;
    }

    // Student Password Change
    async function handleStudentChangePassword() {
      const newPassword = document.getElementById('studentNewPassword')?.value;
      if (!newPassword || newPassword.length < 6) {
        showMsg('Password must be at least 6 characters.', true);
        return;
      }
      try {
        const data = await api('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ newPassword })
        });
        showMsg(data.message || 'Password updated successfully!', false);
        const pwdInput = document.getElementById('studentNewPassword');
        if (pwdInput) pwdInput.value = '';
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Populate Dropdowns in Admin & Teacher panels
    function populateFormDropdowns() {
      const terms = currentState.academicTerms || [];
      const sections = currentState.sections || [];
      const teachers = currentState.teachers || [];
      const courses = currentState.courses || [];

      // Sec Term Select
      const secTerm = document.getElementById('secTermSelect');
      if (secTerm) secTerm.innerHTML = terms.map(t => '<option value="' + t.id + '">' + t.yearLabel + ' (Sem ' + t.semesterNumber + ')</option>').join('');

      // Batch Sec Select
      const batchSec = document.getElementById('batchSecSelect');
      if (batchSec) batchSec.innerHTML = sections.map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');

      // Course Term Select
      const courseTerm = document.getElementById('courseTermSelect');
      if (courseTerm) courseTerm.innerHTML = terms.map(t => '<option value="' + t.id + '">' + t.yearLabel + ' (Sem ' + t.semesterNumber + ')</option>').join('');

      // Offering Selects
      const offCourse = document.getElementById('offCourseSelect');
      if (offCourse) offCourse.innerHTML = courses.map(c => '<option value="' + c.id + '">' + c.code + ': ' + c.name + '</option>').join('');

      const offTeacher = document.getElementById('offTeacherSelect');
      if (offTeacher) offTeacher.innerHTML = teachers.map(t => '<option value="' + t.id + '">' + t.name + ' (' + t.empId + ')</option>').join('');

      handleOffTargetTypeChange();
      renderProvisioningEntityOptions();
      populateTeacherExtraDropdowns();
    }

    function handleOffTargetTypeChange() {
      const type = document.getElementById('offTargetType')?.value || 'section';
      const sel = document.getElementById('offTargetIdSelect');
      if (!sel) return;

      if (type === 'section') {
        sel.innerHTML = (currentState.sections || []).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');
      } else if (type === 'batch') {
        sel.innerHTML = (currentState.batches || []).map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');
      } else {
        sel.innerHTML = '<option value="elg-ai">Applied Machine Learning</option><option value="elg-cloud">Cloud Computing</option>';
      }
    }

    function handleProvRoleChange() {
      const role = document.getElementById('provRole')?.value;
      const enrollmentFields = document.getElementById('provStudentEnrollmentFields');
      if (enrollmentFields) enrollmentFields.style.display = role === 'student' ? 'block' : 'none';
    }

    function renderProvisioningEntityOptions() {
      const secSel = document.getElementById('provStudentSection');
      if (secSel) secSel.innerHTML = (currentState.sections || []).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');
      handleProvSectionChange();
    }

    function handleProvSectionChange() {
      const secId = document.getElementById('provStudentSection')?.value;
      const batchSel = document.getElementById('provStudentBatch');
      if (!batchSel) return;
      const batches = (currentState.batches || []).filter(b => !secId || b.sectionId === secId);
      batchSel.innerHTML = batches.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');

      const elecSel = document.getElementById('provStudentElective');
      if (elecSel) elecSel.innerHTML = '<option value="">-- No Elective / Core Only --</option><option value="elg-ai">Applied Machine Learning</option><option value="elg-cloud">Cloud Systems</option>';
    }

    // User Provisioning (Admin)
    async function handleProvisionUser() {
      const name = document.getElementById('provName')?.value.trim();
      const email = document.getElementById('provEmail')?.value.trim();
      const role = document.getElementById('provRole')?.value;
      const entityId = document.getElementById('provEntityId')?.value.trim();
      const password = document.getElementById('provPassword')?.value;

      if (!name || !email || !role) {
        showMsg('Please provide Name, Email, and Role.', true);
        return;
      }

      let studentDetails = undefined;
      if (role === 'student') {
        const sec = document.getElementById('provStudentSection')?.value;
        const batch = document.getElementById('provStudentBatch')?.value;
        const elec = document.getElementById('provStudentElective')?.value;
        studentDetails = {
          rollNumber: entityId || ('2025BTECH' + Math.floor(100 + Math.random() * 900)),
          sectionId: sec || undefined,
          batchId: batch || undefined,
          electiveGroupId: elec || undefined,
        };
      }

      try {
        const data = await api('/api/auth/admin/provision-user', {
          method: 'POST',
          body: JSON.stringify({
            name, email, role,
            entityId: entityId || (studentDetails ? studentDetails.rollNumber : undefined),
            password, studentDetails
          })
        });

        showMsg('User ' + data.user.fullName + ' provisioned successfully as ' + data.user.role + '!', false);
        if (document.getElementById('provName')) document.getElementById('provName').value = '';
        if (document.getElementById('provEmail')) document.getElementById('provEmail').value = '';
        if (document.getElementById('provEntityId')) document.getElementById('provEntityId').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Solver Actions
    async function triggerGeneration() {
      const statusBox = document.getElementById('generationStatusBox');
      if (statusBox) statusBox.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.solver + ' Invoking Python CP-SAT solver...</span>';
      try {
        const terms = (currentState.academicTerms || []).map(t => t.id);
        const data = await api('/api/generation/request', {
          method: 'POST',
          body: JSON.stringify({ termIds: terms })
        });
        if (data.status === 'optimal' || data.status === 'feasible') {
          if (statusBox) statusBox.innerHTML = '<span style="color:#059669; font-weight:700; display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.check + ' Solver Optimal (' + (data.solveTimeMs || 250) + 'ms): ' + data.classesCount + ' classes staged as draft Version ' + data.draftVersionNumber + '!</span>';
          showMsg('Solver succeeded. Staged draft ready for publication.', false);
          await loadState();
        } else {
          if (statusBox) statusBox.innerHTML = '<span style="color:#DC2626; display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.close + ' Infeasible: ' + escapeHtml(data.message || data.error) + '</span>';
        }
      } catch (err) {
        if (statusBox) statusBox.innerHTML = '<span style="color:#DC2626; display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.close + ' Generation Error: ' + escapeHtml(err.message) + '</span>';
        showMsg(err.message, true);
      }
    }

    async function compilePackage() {
      try {
        const terms = (currentState.academicTerms || []).map(t => t.id);
        const data = await api('/api/generation/compile-package', {
          method: 'POST',
          body: JSON.stringify({ termIds: terms })
        });
        showMsg('Package compiled successfully: Revision ' + data.package.inputRevision, false);
      } catch (err) { showMsg(err.message, true); }
    }

    function downloadPackage() {
      window.open('/api/generation/package/download', '_blank');
    }

    // Staged Drafts Review & Publish
    function renderStagedDraftsReview() {
      const container = document.getElementById('stagedDraftsList') || document.getElementById('stagedDraftReview');
      if (!container) return;
      const drafts = (currentState.timetableVersions || []).filter(v => v.status === 'draft');

      if (drafts.length === 0) {
        container.innerHTML = '<div style="padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:13px; color:var(--text-muted);">No uncommitted drafts pending publication. Use the actions on the left to compile a package or run CP-SAT.</div>';
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
      drafts.forEach(d => {
        const isStale = (currentState.catalogRevision && d.inputRevision && d.inputRevision < currentState.catalogRevision);
        html += '<div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-left:4px solid var(--primary-blue); padding:16px; border-radius:var(--radius-sm); box-shadow:var(--shadow-subtle);">' +
          (isStale ? '<div class="stale-package-banner"><span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.alert + ' <strong>Stale Input Package:</strong></span> Academic modules have been modified since Draft Version ' + escapeHtml(d.versionNumber) + ' was compiled. Re-compiling recommended before publication (D50).</div>' : '') +
          '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">' +
            '<div>' +
              '<div style="font-weight:700; font-size:14px; color:var(--text-main);">Draft Version ' + escapeHtml(d.versionNumber) + ' <span class="status-badge status-badge-draft" style="font-size:10px;">Pending Publish</span></div>' +
              '<div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Term: <strong>' + escapeHtml(d.termId) + '</strong> • Created: ' + (d.createdAt ? new Date(d.createdAt).toLocaleString() : 'Recent') + '</div>' +
            '</div>' +
            '<button class="btn btn-primary" data-draft-id="' + escapeHtml(d.id) + '" onclick="publishDraft(this.dataset.draftId)" style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.check + ' Publish Official Schedule</button>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
    }

    async function publishDraft(versionId) {
      if (!confirm('Publish official timetable? Prior version will be superseded atomically.')) return;
      try {
        const data = await api('/api/timetable/versions/' + versionId + '/publish', { method: 'POST' });
        showMsg('Timetable published! Instantiated ' + data.instantiatedOccurrences + ' occurrences.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Reset and Demo schedule loaders
    async function handleWipeDatabase() {
      if (!confirm('Wipe the entire database clean? All timetables, courses, and venues will be removed.')) return;
      try {
        const res = await api('/api/admin/wipe-database', { method: 'POST' });
        showMsg(res.message || 'Database wiped 100% clean!', false);
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function resetToSimpleMockData() {
      if (!confirm('Reset campus state to single-cohort simple mock data?')) return;
      try {
        const data = await api('/api/demo/reset-to-simple', { method: 'POST' });
        showMsg(data.message, false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function loadDemoSchedule() {
      try {
        const data = await api('/api/demo/seed-and-publish', { method: 'POST' });
        showMsg('Loaded & published verified demo schedule with ' + data.instantiatedOccurrences + ' occurrences!', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Render Admin Tables
    function renderAdminTables() {
      // Terms
      const termsBody = document.getElementById('termsTableBody');
      if (termsBody) {
        const terms = currentState.academicTerms || [];
        termsBody.innerHTML = terms.length > 0 ? terms.map(t =>
          '<tr><td>' + escapeHtml(t.id) + '</td><td>' + escapeHtml(t.yearLabel) + '</td><td>' + escapeHtml(t.semesterNumber) + '</td><td>' + escapeHtml(t.cycle) + '</td><td><span class="status-badge status-badge-published">' + escapeHtml(t.status) + '</span></td></tr>'
        ).join('') : '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No academic terms found. Use the form below to create a term.</td></tr>';
      }

      // Sections
      const secBody = document.getElementById('sectionsTableBody');
      if (secBody) {
        const secs = currentState.sections || [];
        secBody.innerHTML = secs.length > 0 ? secs.map(s =>
          '<tr><td>' + escapeHtml(s.id) + '</td><td>' + escapeHtml(s.termId) + '</td><td>' + escapeHtml(s.name) + '</td><td>' + escapeHtml(s.expectedCount) + '</td></tr>'
        ).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No sections configured.</td></tr>';
      }

      // Batches
      const batchBody = document.getElementById('batchesTableBody');
      if (batchBody) {
        const batches = currentState.batches || [];
        batchBody.innerHTML = batches.length > 0 ? batches.map(b =>
          '<tr><td>' + escapeHtml(b.id) + '</td><td>' + escapeHtml(b.sectionId) + '</td><td>' + escapeHtml(b.name) + '</td><td>' + escapeHtml(b.expectedCount) + '</td></tr>'
        ).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No practical batches configured.</td></tr>';
      }

      // Courses
      const coursesBody = document.getElementById('coursesTableBody');
      if (coursesBody) {
        const courses = currentState.courses || [];
        coursesBody.innerHTML = courses.length > 0 ? courses.map(c =>
          '<tr><td>' + escapeHtml(c.code) + '</td><td>' + escapeHtml(c.name) + '</td><td>' + escapeHtml(c.lectureHours) + 'L / ' + escapeHtml(c.tutorialHours) + 'T / ' + escapeHtml(c.practicalHours) + 'P</td><td>' + escapeHtml(c.requiredRoomType) + '</td></tr>'
        ).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No courses configured.</td></tr>';
      }

      // Offerings
      const offBody = document.getElementById('offeringsTableBody');
      if (offBody) {
        const offs = currentState.courseOfferings || [];
        const cMap = new Map((currentState.courses || []).map(c => [c.id, c.code]));
        const tMap = new Map((currentState.teachers || []).map(t => [t.id, t.name]));
        offBody.innerHTML = offs.length > 0 ? offs.map(o =>
          '<tr><td>' + escapeHtml(cMap.get(o.courseId) || o.courseId) + '</td><td>' + escapeHtml(tMap.get(o.teacherId) || o.teacherId) + '</td><td>' + escapeHtml(o.targetType) + ' ' + escapeHtml(o.targetId) + '</td><td>' + escapeHtml(o.component || 'All') + '</td></tr>'
        ).join('') : '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No course offerings assigned.</td></tr>';
      }

      // Rooms
      const roomsBody = document.getElementById('roomsTableBody');
      if (roomsBody) {
        const rooms = currentState.rooms || [];
        roomsBody.innerHTML = rooms.length > 0 ? rooms.map(r =>
          '<tr><td>Room ' + escapeHtml(r.roomNumber) + '</td><td>' + escapeHtml(r.building) + '</td><td>' + escapeHtml(r.floor) + '</td><td>' + escapeHtml(r.capacity) + '</td><td>' + escapeHtml(r.roomType) + '</td></tr>'
        ).join('') : '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No venues or rooms added yet.</td></tr>';
      }

      // Teachers
      const teachersBody = document.getElementById('teachersTableBody');
      if (teachersBody) {
        const teachers = currentState.teachers || [];
        teachersBody.innerHTML = teachers.length > 0 ? teachers.map(t =>
          '<tr><td>' + escapeHtml(t.name) + '</td><td>' + escapeHtml(t.empId) + '</td><td>' + escapeHtml(t.email) + '</td></tr>'
        ).join('') : '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">No faculty instructors registered yet.</td></tr>';
      }

      // Versions
      const versionsBody = document.getElementById('versionsTableBody');
      if (versionsBody) {
        const versions = currentState.timetableVersions || [];
        versionsBody.innerHTML = versions.length > 0 ? versions.map(v =>
          '<tr><td>Version ' + escapeHtml(v.versionNumber) + '</td><td>' + escapeHtml(v.termId) + '</td><td><span class="status-badge ' + (v.status === 'published' ? 'status-badge-published' : 'status-badge-superseded') + '">' + escapeHtml(v.status) + '</span></td><td>' + (v.publishedAt ? new Date(v.publishedAt).toLocaleString() : '—') + '</td><td>' + (v.status === 'superseded' ? '<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="restoreVersion(\\'' + escapeHtml(v.id) + '\\')">Restore</button>' : '—') + '</td></tr>'
        ).join('') : '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No published or draft timetables found.</td></tr>';
      }
    }

    async function restoreVersion(versionId) {
      if (!confirm('Restore this timetable version as active published?')) return;
      try {
        await api('/api/timetable/versions/' + versionId + '/restore', { method: 'POST' });
        showMsg('Version restored successfully.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Teacher slot query & booking
    function populateTeacherExtraDropdowns() {
      const offSel = document.getElementById('extraCourseOffering');
      const targetSel = document.getElementById('extraTarget');
      const actSel = document.getElementById('extraActivity');
      if (!offSel || !targetSel) return;

      const teacherId = (currentUser && currentUser.role === 'teacher' && currentUser.entityId)
        ? currentUser.entityId
        : (currentState.teachers && currentState.teachers[0]?.id);

      const allOfferings = currentState.courseOfferings || [];
      const teacherOfferings = allOfferings.filter(o => !teacherId || o.teacherId === teacherId);
      const offeringsToUse = teacherOfferings.length > 0 ? teacherOfferings : allOfferings;

      const courses = currentState.courses || [];
      const sections = currentState.sections || [];
      const batches = currentState.batches || [];

      // 1. Course Offerings
      if (offeringsToUse.length === 0) {
        offSel.innerHTML = '<option value="">-- No Course Offerings Found --</option>';
      } else {
        offSel.innerHTML = offeringsToUse.map(o => {
          const c = courses.find(x => x.id === o.courseId);
          let targetName = '';
          if (o.targetType === 'batch') {
            const b = batches.find(x => x.id === o.targetId);
            targetName = b ? 'Batch ' + b.name : o.targetId;
          } else {
            const s = sections.find(x => x.id === o.targetId);
            targetName = s ? 'Section ' + s.name : o.targetId;
          }
          const comp = o.componentType ? (o.componentType.charAt(0).toUpperCase() + o.componentType.slice(1)) : (o.activityType === 'P' ? 'Practical' : 'Lecture');
          const code = c ? c.code : 'COURSE';
          const name = c ? c.name : o.id;
          return '<option value="' + escapeHtml(o.id) + '" data-target="' + escapeHtml(o.targetId || '') + '" data-type="' + escapeHtml(o.targetType || 'section') + '" data-activity="' + (o.activityType || (o.componentType === 'practical' ? 'P' : 'L')) + '" data-term="' + escapeHtml(o.termId || '') + '">' +
            escapeHtml(code + ' — ' + name + ' (' + comp + ' • ' + targetName + ')') +
          '</option>';
        }).join('');
      }

      // 2. Target Cohort (Sections & Batches)
      let targetHtml = '';
      if (sections.length > 0) {
        targetHtml += '<optgroup label="Sections">';
        sections.forEach(s => {
          targetHtml += '<option value="' + escapeHtml(s.id) + '" data-type="section">Section ' + escapeHtml(s.name) + '</option>';
        });
        targetHtml += '</optgroup>';
      }
      if (batches.length > 0) {
        targetHtml += '<optgroup label="Sub-Batches (Lab / Tutorials)">';
        batches.forEach(b => {
          targetHtml += '<option value="' + escapeHtml(b.id) + '" data-type="batch">Batch ' + escapeHtml(b.name) + '</option>';
        });
        targetHtml += '</optgroup>';
      }
      targetSel.innerHTML = targetHtml || '<option value="">-- No Cohorts Available --</option>';

      // Sync selection with first offering
      onExtraOfferingChange();
    }

    function onExtraOfferingChange() {
      const offSel = document.getElementById('extraCourseOffering');
      const targetSel = document.getElementById('extraTarget');
      const actSel = document.getElementById('extraActivity');
      if (!offSel) return;

      const opt = offSel.options[offSel.selectedIndex];
      if (!opt) return;

      const targetId = opt.getAttribute('data-target');
      const act = opt.getAttribute('data-activity');

      if (targetId && targetSel) {
        targetSel.value = targetId;
      }
      if (act && actSel) {
        actSel.value = act;
      }
    }

    function onExtraActivityChange() {
      // User manual activity change
    }

    function resolveTeacherExtraContext() {
      const teacherId = (currentUser && currentUser.role === 'teacher' && currentUser.entityId) ? currentUser.entityId : (currentState.teachers && currentState.teachers[0]?.id);

      const teacherOfferings = (currentState.courseOfferings || []).filter(o => !teacherId || o.teacherId === teacherId);
      const selectedOfferingId = document.getElementById('extraCourseOffering')?.value;
      const courseOfferingId = selectedOfferingId || (teacherOfferings[0]?.id) || (currentState.courseOfferings && currentState.courseOfferings[0]?.id) || 'off-1';

      const foundOffering = (currentState.courseOfferings || []).find(o => o.id === courseOfferingId);
      const termId = foundOffering?.termId || (currentState.academicTerms && currentState.academicTerms.length > 0 ? currentState.academicTerms[0].id : 'term-1');

      const selectedTargetId = document.getElementById('extraTarget')?.value;
      const targetId = selectedTargetId || foundOffering?.targetId || (currentState.sections && currentState.sections[0]?.id) || 'sec-1';
      const targetType = (currentState.batches && currentState.batches.some(b => b.id === targetId)) ? 'batch' : (foundOffering?.targetType || 'section');

      return { termId, courseOfferingId, targetId, targetType, teacherId };
    }

    async function queryFreeSlots() {
      const date = document.getElementById('extraDate')?.value;
      if (!date) {
        showMsg('Please select a date first.', true);
        return;
      }
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayOfWeek = dt.getDay() === 0 ? 7 : dt.getDay();
      const activityType = document.getElementById('extraActivity')?.value || 'L';
      const ctx = resolveTeacherExtraContext();

      try {
        const data = await api('/api/classes/extra/slots?date=' + date + '&dayOfWeek=' + dayOfWeek + '&activityType=' + activityType + '&targetId=' + ctx.targetId + '&courseOfferingId=' + ctx.courseOfferingId);
        const resEl = document.getElementById('slotsResults');
        if (!resEl) return;

        if (!data.slots || data.slots.length === 0) {
          resEl.innerHTML = '<div style="padding:12px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; color:#DC2626; font-size:13px; font-weight:600;">No conflict-free slots available on this date for the selected cohort and session type.</div>';
          return;
        }

        let html = '<div style="font-size:13px; font-weight:700; margin-bottom:8px; color:var(--text);">Available Free Slots (' + data.slots.length + ' found):</div><div style="display:flex; flex-direction:column; gap:8px;">';
        data.slots.slice(0, 10).forEach(s => {
          const roomCap = s.capacity ? (' • Cap: ' + s.capacity) : '';
          const roomTypeTag = s.roomType ? (' • ' + s.roomType) : '';
          html += '<div style="background:#FFFFFF; border:1px solid var(--border); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">' +
            '<div>' +
              '<div style="font-weight:700; font-size:13px; color:var(--text);">' +
                'Period ' + s.startSlot + (activityType === 'P' ? ' & ' + (s.startSlot + 1) : '') +
                (s.freedByCancellation ? ' <span class="status-badge" style="background:#ECFDF5; color:#059669; font-size:10px;">Freed by Cancellation</span>' : '') +
              '</div>' +
              '<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">' +
                escapeHtml(s.roomNumber) + ' (' + escapeHtml(s.building) + ')' + roomTypeTag + roomCap +
              '</div>' +
            '</div>' +
            '<button class="btn btn-primary" style="padding:6px 12px; font-size:12px;" onclick="bookExtraClassDirect(\\'' + date + '\\', ' + dayOfWeek + ', ' + s.startSlot + ', \\'' + escapeHtml(s.roomId) + '\\', \\'' + activityType + '\\')">Book This Slot</button>' +
          '</div>';
        });
        html += '</div>';
        resEl.innerHTML = html;
      } catch (err) { showMsg(err.message, true); }
    }

    async function bookExtraClassDirect(date, dayOfWeek, startSlot, roomId, activityType) {
      const ctx = resolveTeacherExtraContext();
      try {
        await api('/api/extra/book', {
          method: 'POST',
          body: JSON.stringify({
            termId: ctx.termId,
            courseOfferingId: ctx.courseOfferingId,
            targetId: ctx.targetId,
            targetType: ctx.targetType,
            date,
            dayOfWeek,
            startSlot,
            roomId,
            activityType
          })
        });
        showMsg('Extra class booked! Students notified.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    function openQuickBookExtraModal(slot) {
      const modal = document.getElementById('quickBookExtraModal');
      if (!modal) return;

      const activeDay = (DAYS && DAYS[activeDayIndex]) ? DAYS[activeDayIndex] : (DAYS && DAYS[0]) ? DAYS[0] : { dayOfWeek: 1, name: 'Monday', date: '2026-09-07' };
      const periodMeta = PERIODS.find(x => x.index === slot) || { label: 'Period ' + slot, time: '' };

      const qbDate = document.getElementById('qbDate');
      const qbDow = document.getElementById('qbDayOfWeek');
      const qbDateDisplay = document.getElementById('qbDateDisplay');
      const qbPeriodDisplay = document.getElementById('qbPeriodDisplay');

      if (qbDate) qbDate.value = activeDay.date;
      if (qbDow) qbDow.value = activeDay.dayOfWeek;
      if (qbDateDisplay) qbDateDisplay.textContent = activeDay.name + ', ' + activeDay.date;
      if (qbPeriodDisplay) qbPeriodDisplay.textContent = periodMeta.label + ' (' + periodMeta.time + ')';

      // 1. Populate period slot select (Periods 1 to 8, excluding period 4 lunch)
      const slotSel = document.getElementById('qbSlotSelect');
      if (slotSel) {
        slotSel.innerHTML = PERIODS.filter(p => p.index !== 4).map(p =>
          '<option value="' + p.index + '"' + (p.index === slot ? ' selected' : '') + '>' +
            escapeHtml(p.label + ' (' + p.time + ')') +
          '</option>'
        ).join('');
      }

      // 2. Populate offerings for teacher
      const teacherId = (currentUser && currentUser.role === 'teacher' && currentUser.entityId)
        ? currentUser.entityId
        : (currentState.teachers && currentState.teachers[0]?.id);

      const allOfferings = currentState.courseOfferings || [];
      const teacherOfferings = allOfferings.filter(o => !teacherId || o.teacherId === teacherId);
      const offeringsToUse = teacherOfferings.length > 0 ? teacherOfferings : allOfferings;

      const courses = currentState.courses || [];
      const sections = currentState.sections || [];
      const batches = currentState.batches || [];

      const offSel = document.getElementById('qbCourseOffering');
      if (offSel) {
        if (offeringsToUse.length === 0) {
          offSel.innerHTML = '<option value="">-- No Courses Assigned --</option>';
        } else {
          offSel.innerHTML = offeringsToUse.map(o => {
            const c = courses.find(x => x.id === o.courseId);
            let targetName = '';
            if (o.targetType === 'batch') {
              const b = batches.find(x => x.id === o.targetId);
              targetName = b ? 'Batch ' + b.name : o.targetId;
            } else {
              const s = sections.find(x => x.id === o.targetId);
              targetName = s ? 'Section ' + s.name : o.targetId;
            }
            const comp = o.componentType ? (o.componentType.charAt(0).toUpperCase() + o.componentType.slice(1)) : (o.activityType === 'P' ? 'Practical' : 'Lecture');
            const code = c ? c.code : 'COURSE';
            const name = c ? c.name : o.id;
            return '<option value="' + escapeHtml(o.id) + '" data-target="' + escapeHtml(o.targetId || '') + '" data-type="' + escapeHtml(o.targetType || 'section') + '" data-activity="' + (o.activityType || (o.componentType === 'practical' ? 'P' : 'L')) + '" data-term="' + escapeHtml(o.termId || '') + '">' +
              escapeHtml(code + ' — ' + name + ' (' + comp + ' • ' + targetName + ')') +
            '</option>';
          }).join('');
        }
      }

      // 3. Populate Target Cohorts
      const targetSel = document.getElementById('qbTarget');
      if (targetSel) {
        let targetHtml = '';
        if (sections.length > 0) {
          targetHtml += '<optgroup label="Sections">';
          sections.forEach(s => {
            targetHtml += '<option value="' + escapeHtml(s.id) + '" data-type="section">Section ' + escapeHtml(s.name) + '</option>';
          });
          targetHtml += '</optgroup>';
        }
        if (batches.length > 0) {
          targetHtml += '<optgroup label="Sub-Batches (Lab / Tutorials)">';
          batches.forEach(b => {
            targetHtml += '<option value="' + escapeHtml(b.id) + '" data-type="batch">Batch ' + escapeHtml(b.name) + '</option>';
          });
          targetHtml += '</optgroup>';
        }
        targetSel.innerHTML = targetHtml || '<option value="">-- No Cohorts Available --</option>';
      }

      // 4. Populate Rooms & sync defaults
      populateQbRooms();
      onQbOfferingChange();

      // Clear previous error
      const errBox = document.getElementById('qbErrorBox');
      if (errBox) {
        errBox.style.display = 'none';
        errBox.textContent = '';
      }

      modal.style.display = 'flex';
    }

    function populateQbRooms() {
      const roomSel = document.getElementById('qbRoom');
      if (!roomSel) return;
      const rooms = currentState.rooms || [];
      const activity = document.getElementById('qbActivity')?.value || 'L';

      const ltRooms = rooms.filter(r => r.active && r.roomType === 'LT');
      const labRooms = rooms.filter(r => r.active && (r.roomType === 'P' || r.roomType === 'Lab'));

      let html = '';
      if (activity === 'P') {
        if (labRooms.length > 0) {
          html += '<optgroup label="Laboratories (Matching Lab Session)">';
          labRooms.forEach(r => {
            html += '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.roomNumber + ' (' + r.building + ', Fl ' + r.floor + ') — Lab [Cap: ' + r.capacity + ']') + '</option>';
          });
          html += '</optgroup>';
        }
        if (ltRooms.length > 0) {
          html += '<optgroup label="Other Venues">';
          ltRooms.forEach(r => {
            html += '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.roomNumber + ' (' + r.building + ') — LT [Cap: ' + r.capacity + ']') + '</option>';
          });
          html += '</optgroup>';
        }
      } else {
        if (ltRooms.length > 0) {
          html += '<optgroup label="Classrooms & Lecture Halls (Matching Theory Session)">';
          ltRooms.forEach(r => {
            html += '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.roomNumber + ' (' + r.building + ', Fl ' + r.floor + ') — LT [Cap: ' + r.capacity + ']') + '</option>';
          });
          html += '</optgroup>';
        }
        if (labRooms.length > 0) {
          html += '<optgroup label="Laboratories">';
          labRooms.forEach(r => {
            html += '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.roomNumber + ' (' + r.building + ') — Lab [Cap: ' + r.capacity + ']') + '</option>';
          });
          html += '</optgroup>';
        }
      }
      roomSel.innerHTML = html || '<option value="">-- No Active Rooms --</option>';
    }

    function onQbOfferingChange() {
      const offSel = document.getElementById('qbCourseOffering');
      const targetSel = document.getElementById('qbTarget');
      const actSel = document.getElementById('qbActivity');
      if (!offSel) return;

      const opt = offSel.options[offSel.selectedIndex];
      if (!opt) return;

      const targetId = opt.getAttribute('data-target');
      const act = opt.getAttribute('data-activity');

      if (targetId && targetSel) {
        targetSel.value = targetId;
      }
      if (act && actSel) {
        actSel.value = act;
        populateQbRooms();
      }
    }

    function onQbActivityChange() {
      populateQbRooms();
    }

    function onQbSlotChange() {
      const slotVal = parseInt(document.getElementById('qbSlotSelect')?.value, 10);
      const periodMeta = PERIODS.find(x => x.index === slotVal) || { label: 'Period ' + slotVal, time: '' };
      const periodDisplay = document.getElementById('qbPeriodDisplay');
      if (periodDisplay) {
        periodDisplay.textContent = periodMeta.label + ' (' + periodMeta.time + ')';
      }
    }

    function closeQuickBookModal(e) {
      if (e && e.target && e.target.id !== 'quickBookExtraModal' && !e.target.classList.contains('btn-ghost') && !e.target.classList.contains('btn-secondary')) {
        return;
      }
      const modal = document.getElementById('quickBookExtraModal');
      if (modal) modal.style.display = 'none';
    }

    async function submitQuickBookExtra() {
      const errBox = document.getElementById('qbErrorBox');
      const submitBtn = document.getElementById('qbSubmitBtn');
      if (errBox) errBox.style.display = 'none';

      const date = document.getElementById('qbDate')?.value;
      const dayOfWeek = parseInt(document.getElementById('qbDayOfWeek')?.value, 10);
      const startSlot = parseInt(document.getElementById('qbSlotSelect')?.value, 10);
      const activityType = document.getElementById('qbActivity')?.value || 'L';
      const courseOfferingId = document.getElementById('qbCourseOffering')?.value;
      const targetId = document.getElementById('qbTarget')?.value;
      const roomId = document.getElementById('qbRoom')?.value;

      if (!courseOfferingId) {
        if (errBox) { errBox.textContent = 'Please select a Course Offering.'; errBox.style.display = 'block'; }
        return;
      }
      if (!targetId) {
        if (errBox) { errBox.textContent = 'Please select a Target Cohort / Batch.'; errBox.style.display = 'block'; }
        return;
      }
      if (!roomId) {
        if (errBox) { errBox.textContent = 'Please select a Classroom / Venue.'; errBox.style.display = 'block'; }
        return;
      }

      // Check practical 2-slot constraints
      if (activityType === 'P') {
        if (startSlot === 3) {
          if (errBox) { errBox.textContent = 'A 2-hour practical lab cannot start at Period 3 as it spans across the Period 4 lunch interval.'; errBox.style.display = 'block'; }
          return;
        }
        if (startSlot === 8) {
          if (errBox) { errBox.textContent = 'A 2-hour practical lab cannot start at Period 8 as it exceeds university day schedule.'; errBox.style.display = 'block'; }
          return;
        }
      }

      const offSel = document.getElementById('qbCourseOffering');
      const opt = offSel?.options[offSel.selectedIndex];
      const termId = opt?.getAttribute('data-term') || (currentState.academicTerms && currentState.academicTerms[0]?.id) || 'term-1';

      const targetSel = document.getElementById('qbTarget');
      const targetOpt = targetSel?.options[targetSel.selectedIndex];
      const targetType = targetOpt?.getAttribute('data-type') || (currentState.batches && currentState.batches.some(b => b.id === targetId) ? 'batch' : 'section');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Booking...';
      }

      try {
        await api('/api/extra/book', {
          method: 'POST',
          body: JSON.stringify({
            termId,
            courseOfferingId,
            targetType,
            targetId,
            date,
            dayOfWeek,
            startSlot,
            roomId,
            activityType
          })
        });

        closeQuickBookModal();
        showMsg('Extra class successfully booked on Period ' + startSlot + '! Students notified.', false);
        await loadState();
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message || 'Failed to book extra class.';
          errBox.style.display = 'block';
        } else {
          showMsg(err.message, true);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Book Class';
        }
      }
    }

    function quickBookTeacherSlot(slot) {
      openQuickBookExtraModal(slot);
    }

    async function submitUnavailability() {
      try {
        await api('/api/teachers/unavailability/request', {
          method: 'POST',
          body: JSON.stringify({
            date: document.getElementById('unavailDate')?.value,
            startSlot: parseInt(document.getElementById('unavailStart')?.value, 10),
            endSlot: parseInt(document.getElementById('unavailEnd')?.value, 10),
            reason: document.getElementById('unavailReason')?.value || 'Operational leave'
          })
        });
        showMsg('Leave request submitted. Admin will review.', false);
      } catch (err) { showMsg(err.message, true); }
    }

    function updateAdminGrouping(val) { adminGroupBy = val; renderSingleDayGrid(); }
    function updateAdminFilterVal(val) { adminFilterVal = val; renderSingleDayGrid(); }


    // ========================================================================
    // UNIFIED PAGE NAVIGATION & WORKSTATION CONTROLS (Student, Faculty & Admin)
    // ========================================================================
    let currentUserSubPage = 'schedule'; // 'schedule', 'profile', 'security', 'teacher-extra', 'teacher-rooms', 'teacher-leave'
    let currentAdminPage = 'hub'; // 'hub', 'timetables', 'modules', 'students', 'faculty', 'matrix', 'solver'
    let adminTtFormat = 'day'; // 'day' or 'week'
    let adminTtScope = 'section'; // 'section', 'teacher', 'room', 'master'
    let adminTtTarget = 'all';
    let adminTtDayIndex = 0;

    function switchUserSubPage(pageKey) {
      currentUserSubPage = pageKey;
      if (currentMainView !== 'dashboard') {
        switchView('dashboard');
        return;
      }

      const userSched = document.getElementById('userScheduleView');
      const adminDash = document.getElementById('adminDashboardView');
      const profilePage = document.getElementById('userSubPageProfile');
      const securityPage = document.getElementById('userSubPageSecurity');
      const teacherExtra = document.getElementById('userSubPageTeacherExtra');
      const teacherRooms = document.getElementById('userSubPageTeacherRooms');
      const teacherLeave = document.getElementById('userSubPageTeacherLeave');

      const allSubPages = [profilePage, securityPage, teacherExtra, teacherRooms, teacherLeave];

      if (pageKey === 'schedule') {
        if (adminDash) adminDash.style.display = 'none';
        allSubPages.forEach(el => { if (el) el.style.display = 'none'; });
        if (userSched) userSched.style.display = 'block';
        renderSingleDayGrid();
      } else {
        if (userSched) userSched.style.display = 'none';
        if (adminDash) adminDash.style.display = 'none';
        allSubPages.forEach(el => { if (el) el.style.display = 'none'; });

        if (pageKey === 'profile') {
          if (profilePage) profilePage.style.display = 'block';
          populateUserProfilePage();
        } else if (pageKey === 'security') {
          if (securityPage) securityPage.style.display = 'block';
        } else if (pageKey === 'teacher-extra') {
          if (teacherExtra) teacherExtra.style.display = 'block';
          populateTeacherExtraDropdowns();
        } else if (pageKey === 'teacher-rooms') {
          if (teacherRooms) teacherRooms.style.display = 'block';
          runEmptyRoomFinder();
        } else if (pageKey === 'teacher-leave') {
          if (teacherLeave) teacherLeave.style.display = 'block';
        }
      }

      highlightActiveRailLink(pageKey);
      updateTopbarCtaAndBreadcrumb();
    }

    function populateUserProfilePage() {
      const pName = document.getElementById('studentProfileName');
      const pMeta = document.getElementById('studentProfileMeta');
      const avatarLg = document.getElementById('profileAvatarLg');
      const studentSec = document.getElementById('profileStudentSection');
      const teacherSec = document.getElementById('profileTeacherSection');

      const effectiveRole = (currentUser && authToken) ? currentUser.role : currentRole;
      const displayName = currentUser ? (currentUser.fullName || currentUser.email) : (effectiveRole === 'teacher' ? 'Faculty Instructor' : (effectiveRole === 'admin' ? 'System Administrator' : 'Guest Student'));
      const initial = displayName.charAt(0).toUpperCase();

      if (pName) pName.textContent = displayName;
      if (avatarLg) avatarLg.textContent = initial;

      if (effectiveRole === 'student') {
        if (studentSec) studentSec.style.display = 'block';
        if (teacherSec) teacherSec.style.display = 'none';
        if (pMeta) {
          const roll = (currentUser && currentUser.entityId) ? currentUser.entityId : 'ST-2026-3A';
          pMeta.textContent = 'Enrolled Student • Roll ' + roll;
        }
      } else if (effectiveRole === 'teacher') {
        if (studentSec) studentSec.style.display = 'none';
        if (teacherSec) teacherSec.style.display = 'block';
        if (pMeta) {
          const tid = (currentUser && currentUser.entityId) ? currentUser.entityId : 't-1';
          pMeta.textContent = 'Faculty Instructor • Academic Staff (' + tid + ')';
        }
      } else {
        if (studentSec) studentSec.style.display = 'none';
        if (teacherSec) teacherSec.style.display = 'none';
        if (pMeta) pMeta.textContent = 'System Administrator • Full Permissions';
      }
    }

    function switchAdminPage(pageKey) {
      currentAdminPage = pageKey;
      currentUserSubPage = 'admin';
      if (currentMainView !== 'dashboard') {
        switchView('dashboard');
        return;
      }

      const adminDash = document.getElementById('adminDashboardView');
      if (adminDash) adminDash.style.display = 'block';
      const userSched = document.getElementById('userScheduleView');
      if (userSched) userSched.style.display = 'none';

      const allSubPages = ['userSubPageProfile', 'userSubPageSecurity', 'userSubPageTeacherExtra', 'userSubPageTeacherRooms', 'userSubPageTeacherLeave'];
      allSubPages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      const hubEl = document.getElementById('adminPageHub');
      const headerEl = document.getElementById('adminSubPageHeader');
      const titleEl = document.getElementById('adminBreadcrumbTitle');

      const pages = ['timetables', 'modules', 'students', 'faculty', 'matrix', 'solver'];
      const pageTitles = {
        timetables: 'Campus Timetable Explorer & Filter',
        modules: 'Academic Modules, Terms & Curriculum LTP',
        students: 'Student Management, Directory & Passwords',
        faculty: 'Faculty Instructors & Workload Rules',
        matrix: 'Room Utilization Matrix & Heatmap',
        solver: 'CP-SAT Solver Runner & Publication Hub'
      };

      // Highlight active Left Rail item
      highlightActiveRailLink(pageKey);

      if (pageKey === 'hub') {
        if (hubEl) hubEl.style.display = 'block';
        if (headerEl) headerEl.style.display = 'none';
        pages.forEach(p => {
          const el = document.getElementById('adminPage' + p.charAt(0).toUpperCase() + p.slice(1));
          if (el) el.style.display = 'none';
        });
      } else {
        if (hubEl) hubEl.style.display = 'none';
        if (headerEl) headerEl.style.display = 'flex';
        if (titleEl) titleEl.textContent = pageTitles[pageKey] || pageKey;

        pages.forEach(p => {
          const el = document.getElementById('adminPage' + p.charAt(0).toUpperCase() + p.slice(1));
          const btn = document.getElementById('adminSubBtn' + p.charAt(0).toUpperCase() + p.slice(1));
          if (el) el.style.display = (p === pageKey) ? 'block' : 'none';
          if (btn) btn.className = 'admin-pill-btn ' + (p === pageKey ? 'active' : '');
        });

        if (pageKey === 'timetables') {
          populateAdminTimetableTargets();
          renderAdminTimetable();
        } else if (pageKey === 'students') {
          renderStudentsTable();
          populateStudentFormDropdowns();
        } else if (pageKey === 'faculty') {
          renderFacultyTable();
          populateFacultyFormDropdowns();
          renderAdminLeaveRequests();
        } else if (pageKey === 'matrix') {
          renderRoomMatrix();
        } else if (pageKey === 'solver') {
          populateSolverTerms();
          renderStagedDraftsReview();
        }
      }
      updateTopbarCtaAndBreadcrumb();
    }

    // ========================================================================
    // 1. ADMIN TIMETABLE EXPLORER: TARGET SELECTOR & DUAL VIEW (DAY + FULL WEEK)
    // ========================================================================
    function setAdminTtFormat(fmt) {
      adminTtFormat = fmt;
      const dayBtn = document.getElementById('ttFormatDayBtn');
      const weekBtn = document.getElementById('ttFormatWeekBtn');
      const dayBar = document.getElementById('adminTtDayBar');

      if (fmt === 'day') {
        if (dayBtn) { dayBtn.style.background = 'var(--primary)'; dayBtn.style.color = '#fff'; }
        if (weekBtn) { weekBtn.style.background = '#fff'; weekBtn.style.color = 'var(--text)'; }
        if (dayBar) dayBar.style.display = 'flex';
      } else {
        if (weekBtn) { weekBtn.style.background = 'var(--primary)'; weekBtn.style.color = '#fff'; }
        if (dayBtn) { dayBtn.style.background = '#fff'; dayBtn.style.color = 'var(--text)'; }
        if (dayBar) dayBar.style.display = 'none';
      }
      renderAdminTimetable();
    }

    function setAdminDay(idx) {
      adminTtDayIndex = Math.max(0, Math.min(DAYS.length - 1, idx));
      for (let i = 0; i < DAYS.length; i++) {
        const pill = document.getElementById('adminDayPill' + i);
        if (pill) pill.className = 'day-pill ' + (i === adminTtDayIndex ? 'active' : '');
      }
      const dayObj = DAYS[adminTtDayIndex];
      const text = document.getElementById('adminActiveDayText');
      if (text) text.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.calendar + ' ' + dayObj.name + ' • September ' + dayObj.date.split('-')[2] + ', 2026</span>';
      renderAdminTimetable();
    }

    function handleAdminTtScopeChange(scope) {
      adminTtScope = scope;
      const targetSel = document.getElementById('adminTtTargetSelect');
      if (!targetSel) return;

      let html = '<option value="all">-- All Targets in Scope --</option>';
      if (scope === 'section') {
        (currentState.sections || []).forEach(s => {
          html += '<option value="' + s.id + '">Section ' + s.name + '</option>';
        });
        (currentState.batches || []).forEach(b => {
          html += '<option value="batch:' + b.id + '">Practical Batch ' + b.name + '</option>';
        });
      } else if (scope === 'teacher') {
        (currentState.teachers || []).forEach(t => {
          html += '<option value="' + t.id + '">' + t.name + ' (' + t.empId + ')</option>';
        });
      } else if (scope === 'room') {
        (currentState.rooms || []).forEach(r => {
          html += '<option value="' + r.id + '">Room ' + r.roomNumber + ' (' + r.building + ' • Cap: ' + r.capacity + ')</option>';
        });
      } else if (scope === 'master') {
        html = '<option value="all">Entire Campus Master Schedule</option>';
      }
      targetSel.innerHTML = html;
      adminTtTarget = 'all';
      renderAdminTimetable();
    }

    function handleAdminTtTargetChange(target) {
      adminTtTarget = target;
      renderAdminTimetable();
    }

    function populateAdminTimetableTargets() {
      const scopeSel = document.getElementById('adminTtScopeSelect');
      if (scopeSel && !scopeSel.value) scopeSel.value = 'section';
      handleAdminTtScopeChange(scopeSel ? scopeSel.value : 'section');

      const termSel = document.getElementById('adminTtTermSelect');
      if (termSel) {
        const terms = currentState.academicTerms || [];
        termSel.innerHTML = terms.map(t => '<option value="' + t.id + '">' + t.yearLabel + ' (Sem ' + t.semesterNumber + ')</option>').join('');
      }

      const verSel = document.getElementById('adminTtVersionSelect');
      if (verSel) {
        const versions = currentState.timetableVersions || [];
        if (versions.length === 0) {
          verSel.innerHTML = '<option value="active">Active Published Timetable</option>';
        } else {
          verSel.innerHTML = '<option value="active">Active Published Timetable</option>' +
            versions.map(v => '<option value="' + v.id + '">Version ' + v.versionNumber + ' (' + v.status + ')</option>').join('');
        }
      }
    }

    function renderAdminTimetable() {
      const container = document.getElementById('adminTimetableGridWrapper');
      if (!container) return;

      const badge = document.getElementById('adminTtActiveTargetBadge');
      if (badge) {
        let label = 'Scope: ' + adminTtScope.toUpperCase();
        if (adminTtTarget !== 'all') {
          if (adminTtScope === 'section') {
            const sec = (currentState.sections || []).find(s => s.id === adminTtTarget);
            label = sec ? ('Section ' + sec.name) : adminTtTarget;
          } else if (adminTtScope === 'teacher') {
            const t = (currentState.teachers || []).find(x => x.id === adminTtTarget);
            label = t ? t.name : adminTtTarget;
          } else if (adminTtScope === 'room') {
            const r = (currentState.rooms || []).find(x => x.id === adminTtTarget);
            label = r ? ('Room ' + r.roomNumber) : adminTtTarget;
          }
        } else {
          label += ' (All Cohorts/Venues)';
        }
        badge.textContent = label;
      }

      const roomsMap = new Map((currentState.rooms || []).map(r => [r.id, r]));
      const teachersMap = new Map((currentState.teachers || []).map(t => [t.id, t]));
      const coursesMap = new Map((currentState.courses || []).map(c => [c.id, c]));
      const sectionsMap = new Map((currentState.sections || []).map(s => [s.id, s]));
      const batchesMap = new Map((currentState.batches || []).map(b => [b.id, b]));
      const offeringsMap = new Map((currentState.courseOfferings || []).map(o => [o.id, o]));

      const allOccurrences = currentState.classOccurrences || [];
      const scheduledClasses = currentState.scheduledClasses || [];

      // Determine active occurrences (filter out superseded)
      let activeOccs = allOccurrences.filter(o => o.status !== 'superseded');
      if (activeOccs.length === 0 && scheduledClasses.length > 0) {
        activeOccs = scheduledClasses.map(c => ({
          ...c,
          date: DAYS.find(d => d.dayOfWeek === c.dayOfWeek)?.date || '2026-09-07',
          status: 'scheduled'
        }));
      }

      const termId = document.getElementById('adminTtTermSelect')?.value;
      const versionId = document.getElementById('adminTtVersionSelect')?.value;

      // Filter occurrences by termId if selected
      if (termId && termId !== 'all') {
        activeOccs = activeOccs.filter(o => {
          if (o.termId) return o.termId === termId;
          const off = offeringsMap.get(o.courseOfferingId);
          if (off && off.termId) return off.termId === termId;
          const sec = sectionsMap.get(o.targetId);
          if (sec && sec.termId) return sec.termId === termId;
          if (o.timetableVersionId) {
            const ver = (currentState.timetableVersions || []).find(v => v.id === o.timetableVersionId);
            if (ver && ver.termId) return ver.termId === termId;
          }
          return true;
        });
      }

      // Filter occurrences by versionId if selected
      if (versionId && versionId !== 'active') {
        activeOccs = activeOccs.filter(o => o.timetableVersionId === versionId);
      } else if (versionId === 'active') {
        const activeVer = (currentState.timetableVersions || []).find(v => v.status === 'published' && (!termId || termId === 'all' || v.termId === termId));
        if (activeVer) {
          activeOccs = activeOccs.filter(o => !o.timetableVersionId || o.timetableVersionId === activeVer.id);
        }
      }

      if (activeOccs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:48px 24px; background:#FFFFFF; border:1px dashed var(--border); border-radius:12px; margin:16px 0;">' +
          '<div style="font-size:15px; font-weight:700; color:var(--text); margin-bottom:6px;">No Timetable Scheduled Yet</div>' +
          '<div style="font-size:13px; color:var(--text-muted); max-width:460px; margin:0 auto 16px;">The database is completely clean and empty. Create terms, courses, and venues under Modular Management, then run generation or import drafts to publish timetables.</div>' +
          '<button class="btn btn-primary" onclick="switchAdminPage(\\'hub\\')" style="font-size:12px; padding:6px 14px;">Go to Hub</button>' +
        '</div>';
        return;
      }

      // Check if user selected FULL WEEK VIEW
      if (adminTtFormat === 'week') {
        renderAdminFullWeekGrid(container, activeOccs, roomsMap, teachersMap, coursesMap, offeringsMap, batchesMap);
      } else {
        renderAdminDayGrid(container, activeOccs, roomsMap, teachersMap, coursesMap, offeringsMap, batchesMap);
      }
    }

    function renderAdminDayGrid(container, activeOccs, roomsMap, teachersMap, coursesMap, offeringsMap, batchesMap) {
      const activeDay = DAYS[adminTtDayIndex];
      let dayOccs = activeOccs.filter(o => o.date === activeDay.date || o.dayOfWeek === activeDay.dayOfWeek);

      let targetOccs = dayOccs;

      if (adminTtScope === 'section') {
        if (adminTtTarget.startsWith('batch:')) {
          const batchId = adminTtTarget.replace('batch:', '');
          targetOccs = dayOccs.filter(o => o.targetType === 'batch' && o.targetId === batchId);
        } else if (adminTtTarget !== 'all') {
          targetOccs = dayOccs.filter(o => {
            if (o.targetType === 'section' && o.targetId === adminTtTarget) return true;
            if (o.targetType === 'batch') {
              const b = batchesMap.get(o.targetId);
              return b && b.sectionId === adminTtTarget;
            }
            return false;
          });
        }
      } else if (adminTtScope === 'teacher' && adminTtTarget !== 'all') {
        targetOccs = dayOccs.filter(o => o.teacherId === adminTtTarget);
      } else if (adminTtScope === 'room' && adminTtTarget !== 'all') {
        targetOccs = dayOccs.filter(o => o.roomId === adminTtTarget);
      }

      container.innerHTML = renderResponsiveCanvasGrid(targetOccs, roomsMap, teachersMap, coursesMap, offeringsMap);
    }

    function renderAdminFullWeekGrid(container, activeOccs, roomsMap, teachersMap, coursesMap, offeringsMap, batchesMap) {
      // Filter occurrences for selected target across all days
      let targetOccs = activeOccs;
      if (adminTtScope === 'section') {
        if (adminTtTarget.startsWith('batch:')) {
          const batchId = adminTtTarget.replace('batch:', '');
          targetOccs = activeOccs.filter(o => o.targetType === 'batch' && o.targetId === batchId);
        } else if (adminTtTarget !== 'all') {
          targetOccs = activeOccs.filter(o => {
            if (o.targetType === 'section' && o.targetId === adminTtTarget) return true;
            if (o.targetType === 'batch') {
              const b = batchesMap.get(o.targetId);
              return b && b.sectionId === adminTtTarget;
            }
            return false;
          });
        }
      } else if (adminTtScope === 'teacher' && adminTtTarget !== 'all') {
        targetOccs = activeOccs.filter(o => o.teacherId === adminTtTarget);
      } else if (adminTtScope === 'room' && adminTtTarget !== 'all') {
        targetOccs = activeOccs.filter(o => o.roomId === adminTtTarget);
      }

      let html = '<div style="margin-bottom:12px; font-weight:700; color:var(--text); font-size:14px; display:flex; align-items:center; gap:6px;">' + SVG_ICONS.calendar + ' Full 5-Day Weekly Matrix (Monday – Friday)</div>';
      html += '<table class="tt-grid"><thead><tr>';
      html += '<th class="col-track">Day of Week</th>';
      PERIODS.forEach(p => {
        const thClass = p.isLunch ? 'col-period col-lunch' : 'col-period';
        html += '<th class="' + thClass + '">' + escapeHtml(p.label) + '<span class="th-time">' + escapeHtml(p.time) + '</span></th>';
      });
      html += '</tr></thead><tbody>';

      DAYS.forEach(day => {
        const dayOccs = targetOccs.filter(o => o.date === day.date || o.dayOfWeek === day.dayOfWeek);
        html += '<tr><td class="cell-track"><strong>' + escapeHtml(day.name) + '</strong><br><small style="color:var(--text-muted);">' + escapeHtml(day.date) + '</small></td>';
        for (let slot = 1; slot <= 8; slot++) {
          if (slot === 4) {
            html += '<td class="slot-lunch-break"><div style="margin-bottom:4px; color:var(--accent-amber); display:flex; justify-content:center;">' + SVG_ICONS.coffee + '</div><strong style="color:var(--accent-amber); font-size:11px;">Lunch</strong></td>';
            continue;
          }
          const slotOccs = dayOccs.filter(o => o.startSlot === slot);
          const continuingOccs = (slot !== 4 && slot !== 5) ? dayOccs.filter(o => o.startSlot === slot - 1 && (o.duration === 2 || o.activityType === 'P') && (slot - 1 !== 3)) : [];

          if (slotOccs.length === 0 && continuingOccs.length === 0) {
            html += '<td class="slot-free"><span style="font-size:11px; color:#94A3B8;">Free</span></td>';
          } else {
            html += '<td>';
            slotOccs.forEach(o => {
              html += renderOccurrenceCard(o, roomsMap, teachersMap, coursesMap, offeringsMap);
            });
            continuingOccs.forEach(o => {
              const offering = offeringsMap.get(o.courseOfferingId);
              const course = offering ? coursesMap.get(offering.courseId) : null;
              const code = course ? course.code : 'LAB';
              html += '<div style="background:#F1F5F9; border:1px dashed #CBD5E1; border-radius:6px; padding:6px; font-size:11px; color:var(--text-muted); text-align:center; margin-top:2px;">' +
                '<span style="font-weight:700; color:var(--primary);">' + escapeHtml(code) + '</span><br>' +
                '<span style="font-size:10px;">(Lab Cont. from P' + (slot - 1) + ')</span>' +
              '</div>';
            });
            html += '</td>';
          }
        }
        html += '</tr>';
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    }

    // ========================================================================
    // 2. STUDENT MANAGEMENT: DIRECTORY, PROVISIONING, PASSWORD RESET & CSV
    // ========================================================================
    function renderStudentsTable(filterText) {
      const tbody = document.getElementById('studentsTableBody');
      if (!tbody) return;

      const students = currentState.students || [];
      const sectionsMap = new Map((currentState.sections || []).map(s => [s.id, s.name]));
      const batchesMap = new Map((currentState.batches || []).map(b => [b.id, b.name]));
      const members = currentState.studentGroupMemberships || [];

      let filtered = students;
      if (filterText && filterText.trim()) {
        const q = filterText.trim().toLowerCase();
        filtered = students.filter(s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted); font-size:13px;">No student records match the search filter.</td></tr>';
        return;
      }

      let html = '';
      filtered.forEach(s => {
        const sSecMem = members.find(m => m.studentId === s.id && m.groupType === 'section');
        const sBatchMem = members.find(m => m.studentId === s.id && m.groupType === 'batch');
        const secLabel = sSecMem ? (sectionsMap.get(sSecMem.groupId) || sSecMem.groupId) : 'Unassigned';
        const batchLabel = sBatchMem ? (batchesMap.get(sBatchMem.groupId) || sBatchMem.groupId) : 'Unassigned';
        const email = s.email || (s.rollNumber.toLowerCase() + '@university.edu');
        const initial = (s.name || 'S').charAt(0).toUpperCase();

        html += '<tr>' +
          '<td>' +
            '<div style="display:flex; align-items:center; gap:10px;">' +
              '<div style="width:32px; height:32px; border-radius:50%; background:var(--primary-light); color:var(--primary-blue); font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center;">' + escapeHtml(initial) + '</div>' +
              '<div>' +
                '<div style="font-weight:700; color:var(--text-main);">' + escapeHtml(s.name) + '</div>' +
                '<div style="font-size:11px; color:var(--text-muted);">' + escapeHtml(email) + '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span style="font-family:var(--font-mono, monospace); font-weight:700; font-size:12px; color:var(--text-main);">' + escapeHtml(s.rollNumber) + '</span></td>' +
          '<td><span class="status-badge" style="background:var(--bg-surface-hover); color:var(--text-main); font-size:11px;">' + escapeHtml(secLabel) + '</span></td>' +
          '<td><span class="status-badge" style="background:#EFF6FF; color:#2563EB; font-size:11px;">' + escapeHtml(batchLabel) + '</span></td>' +
          '<td><span class="status-badge status-badge-published">Enrolled</span></td>' +
          '<td style="text-align:right;">' +
            '<button class="btn btn-secondary" style="padding:4px 10px; font-size:11px; display:inline-flex; align-items:center; gap:4px;" data-role="student" data-email="' + escapeHtml(email) + '" onclick="prefillResetPasswordModal(this.dataset.role, this.dataset.email)">' + SVG_ICONS.login + ' Reset Pass</button>' +
          '</td>' +
        '</tr>';
      });
      tbody.innerHTML = html;
    }

    function populateStudentFormDropdowns() {
      const secSel = document.getElementById('stdAddSection');
      if (secSel) {
        secSel.innerHTML = (currentState.sections || []).map(s => '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>').join('');
      }
      handleStdAddSectionChange();

      // Transfer student select
      const tStdSel = document.getElementById('transferStudentSelect');
      if (tStdSel) {
        tStdSel.innerHTML = (currentState.students || []).map(s => '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + ' (' + escapeHtml(s.rollNumber) + ')</option>').join('');
      }
      handleTransferTypeChange();
    }

    function handleStdAddSectionChange() {
      const secId = document.getElementById('stdAddSection')?.value;
      const batchSel = document.getElementById('stdAddBatch');
      if (!batchSel) return;
      const batches = (currentState.batches || []).filter(b => !secId || b.sectionId === secId);
      batchSel.innerHTML = batches.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');
    }

    async function handleIndividualAddStudent() {
      const name = document.getElementById('stdAddName')?.value.trim();
      const email = document.getElementById('stdAddEmail')?.value.trim();
      const rollNumber = document.getElementById('stdAddRoll')?.value.trim();
      const sectionId = document.getElementById('stdAddSection')?.value;
      const batchId = document.getElementById('stdAddBatch')?.value;
      const password = document.getElementById('stdAddPassword')?.value;

      if (!name || !email || !rollNumber) {
        showMsg('Please fill in Student Name, Institutional Email, and Roll Number.', true);
        return;
      }

      try {
        const data = await api('/api/auth/admin/provision-user', {
          method: 'POST',
          body: JSON.stringify({
            name, email, role: 'student',
            entityId: rollNumber,
            password: password || 'StudentPass#2026!',
            studentDetails: { rollNumber, sectionId, batchId }
          })
        });
        showMsg('Student ' + name + ' provisioned successfully!', false);
        if (document.getElementById('stdAddName')) document.getElementById('stdAddName').value = '';
        if (document.getElementById('stdAddEmail')) document.getElementById('stdAddEmail').value = '';
        if (document.getElementById('stdAddRoll')) document.getElementById('stdAddRoll').value = '';
        await loadState();
        renderStudentsTable();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function prefillResetPasswordModal(role, email) {
      if (role === 'student') {
        const inp = document.getElementById('resetStdTargetEmail');
        if (inp) {
          inp.value = email;
          inp.focus();
        }
        showMsg('Ready to reset password for ' + email, false);
      } else {
        const inp = document.getElementById('resetFacultyTargetEmail');
        if (inp) {
          inp.value = email;
          inp.focus();
        }
        showMsg('Ready to reset password for ' + email, false);
      }
    }

    async function handleAdminResetUserPassword(role) {
      const targetEmail = role === 'student'
        ? document.getElementById('resetStdTargetEmail')?.value.trim()
        : document.getElementById('resetFacultyTargetEmail')?.value.trim();

      const newPassword = role === 'student'
        ? document.getElementById('resetStdNewPassword')?.value
        : document.getElementById('resetFacultyNewPassword')?.value;

      if (!targetEmail) {
        showMsg('Please specify target user email.', true);
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        showMsg('New password must be at least 6 characters.', true);
        return;
      }

      try {
        const data = await api('/api/auth/admin/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            targetEmail,
            newPassword,
            role: role === 'faculty' ? 'teacher' : 'student'
          })
        });
        showMsg(data.message, false);
        if (role === 'student') {
          if (document.getElementById('resetStdNewPassword')) document.getElementById('resetStdNewPassword').value = '';
        } else {
          if (document.getElementById('resetFacultyNewPassword')) document.getElementById('resetFacultyNewPassword').value = '';
        }
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function prefillSampleStudentCsv() {
      const area = document.getElementById('bulkStudentCsvArea');
      if (area) {
        area.value = '2025BTECH401, Aarush Verma, aarush@university.edu, sec-A, batch-A1, Student#2026\\n' +
          '2025BTECH402, Ananya Roy, ananya@university.edu, sec-A, batch-A2, Student#2026\\n' +
          '2025BTECH403, Devendra Seth, dev@university.edu, sec-A, batch-A1, Student#2026';
      }
    }

    async function handleBulkUploadStudents() {
      const area = document.getElementById('bulkStudentCsvArea');
      if (!area || !area.value.trim()) {
        showMsg('Please paste CSV student rows first.', true);
        return;
      }

      const lines = area.value.trim().split(String.fromCharCode(10)).map(l => l.trim()).filter(l => l.length > 0);
      const parsedStudents = [];

      for (const line of lines) {
        if (line.toLowerCase().startsWith('roll') || line.toLowerCase().startsWith('name')) continue;
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const roll = parts[0];
          const name = parts[1];
          const email = parts[2] || (roll.toLowerCase() + '@university.edu');
          const sectionId = parts[3] || 'sec-A';
          const batchId = parts[4] || 'batch-A1';
          const password = parts[5] || 'StudentPass#2026!';

          if (roll && name) {
            parsedStudents.push({
              rollNumber: roll,
              name,
              email,
              sectionId,
              batchId,
              password
            });
          }
        }
      }

      if (parsedStudents.length === 0) {
        showMsg('No valid student records found in CSV input.', true);
        return;
      }

      const btn = document.querySelector('button[onclick="handleBulkUploadStudents()"]');
      const origText = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Uploading & Provisioning ' + parsedStudents.length + ' students...';
      }

      try {
        const res = await api('/api/admin/students/bulk', {
          method: 'POST',
          body: JSON.stringify({ students: parsedStudents })
        });
        showMsg('Bulk provisioning complete! ' + (res.insertedCount || res.count || parsedStudents.length) + ' student records synchronized.', false);
        area.value = '';
        await loadState();
        renderStudentsTable();
      } catch (err) {
        showMsg('Bulk upload failed: ' + err.message, true);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = origText;
        }
      }
    }

    function handleTransferTypeChange() {
      const type = document.getElementById('transferTypeSelect')?.value || 'section';
      const targetSel = document.getElementById('transferTargetSelect');
      if (!targetSel) return;
      if (type === 'section') {
        targetSel.innerHTML = (currentState.sections || []).map(s => '<option value="' + escapeHtml(s.id) + '">Section ' + escapeHtml(s.name) + '</option>').join('');
      } else {
        targetSel.innerHTML = (currentState.batches || []).map(b => '<option value="' + escapeHtml(b.id) + '">Batch ' + escapeHtml(b.name) + '</option>').join('');
      }
    }

    async function handleExecuteStudentTransfer() {
      const studentId = document.getElementById('transferStudentSelect')?.value;
      const groupType = document.getElementById('transferTypeSelect')?.value;
      const targetGroupId = document.getElementById('transferTargetSelect')?.value;
      const effectiveStartDate = document.getElementById('transferEffectiveDate')?.value;

      if (!studentId || !targetGroupId) {
        showMsg('Please select student and destination group.', true);
        return;
      }

      try {
        await api('/api/students/transfer', {
          method: 'POST',
          body: JSON.stringify({
            studentId: studentId,
            newGroupId: targetGroupId,
            newGroupType: groupType,
            effectiveDate: effectiveStartDate
          })
        });
        showMsg('Student transferred successfully with effective bounds!', false);
        await loadState();
        renderStudentsTable();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // ========================================================================
    // 3. FACULTY MANAGEMENT: DIRECTORY, PROVISIONING, AVAILABILITY & LEAVES
    // ========================================================================
    function renderFacultyTable(filterText) {
      const tbody = document.getElementById('teachersTableBody');
      if (!tbody) return;

      const teachers = currentState.teachers || [];
      let filtered = teachers;
      if (filterText && filterText.trim()) {
        const q = filterText.trim().toLowerCase();
        filtered = teachers.filter(t =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.empId && t.empId.toLowerCase().includes(q)) ||
          (t.email && t.email.toLowerCase().includes(q))
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted); font-size:13px;">No faculty records match the search filter.</td></tr>';
        return;
      }

      let html = '';
      filtered.forEach(t => {
        const initial = (t.name || 'F').charAt(0).toUpperCase();
        const email = t.email || (t.id + '@university.edu');
        html += '<tr>' +
          '<td>' +
            '<div style="display:flex; align-items:center; gap:10px;">' +
              '<div style="width:32px; height:32px; border-radius:50%; background:#F5F3FF; color:#7C3AED; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center;">' + escapeHtml(initial) + '</div>' +
              '<div>' +
                '<div style="font-weight:700; color:var(--text-main);">' + escapeHtml(t.name) + '</div>' +
                '<div style="font-size:11px; color:var(--text-muted);">' + escapeHtml(email) + '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span style="font-family:var(--font-mono, monospace); font-weight:700; font-size:12px; color:var(--text-main);">' + escapeHtml(t.empId) + '</span></td>' +
          '<td><span class="status-badge" style="background:#ECFDF5; color:#047857; font-size:11px;">Max 4 Hrs/Day</span></td>' +
          '<td><span class="status-badge status-badge-published">Active Faculty</span></td>' +
          '<td style="text-align:right;">' +
            '<button class="btn btn-secondary" style="padding:4px 10px; font-size:11px; display:inline-flex; align-items:center; gap:4px;" data-role="faculty" data-email="' + escapeHtml(email) + '" onclick="prefillResetPasswordModal(this.dataset.role, this.dataset.email)">' + SVG_ICONS.login + ' Reset Pass</button>' +
          '</td>' +
        '</tr>';
      });
      tbody.innerHTML = html;
    }

    function populateFacultyFormDropdowns() {
      const availSel = document.getElementById('availTeacherSelect');
      if (availSel) {
        availSel.innerHTML = (currentState.teachers || []).map(t => '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name) + ' (' + escapeHtml(t.empId) + ')</option>').join('');
      }
    }

    async function handleIndividualAddFaculty() {
      const name = document.getElementById('facultyAddName')?.value.trim();
      const email = document.getElementById('facultyAddEmail')?.value.trim();
      const empId = document.getElementById('facultyAddEmpId')?.value.trim();
      const password = document.getElementById('facultyAddPassword')?.value;

      if (!name || !email || !empId) {
        showMsg('Please fill in Faculty Name, Institutional Email, and Employee ID.', true);
        return;
      }

      try {
        await api('/api/auth/admin/provision-user', {
          method: 'POST',
          body: JSON.stringify({
            name, email, role: 'teacher',
            entityId: empId,
            password: password || 'TeacherPass#2026!'
          })
        });
        showMsg('Faculty member ' + name + ' registered successfully!', false);
        if (document.getElementById('facultyAddName')) document.getElementById('facultyAddName').value = '';
        if (document.getElementById('facultyAddEmail')) document.getElementById('facultyAddEmail').value = '';
        if (document.getElementById('facultyAddEmpId')) document.getElementById('facultyAddEmpId').value = '';
        await loadState();
        renderFacultyTable();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function handleSaveTeacherAvailability() {
      const teacherId = document.getElementById('availTeacherSelect')?.value;
      const maxHours = parseInt(document.getElementById('availMaxHours')?.value || '4', 10);
      if (!teacherId) {
        showMsg('Please select a faculty member first.', true);
        return;
      }
      try {
        await api('/api/resources/teachers/' + teacherId + '/availability', {
          method: 'POST',
          body: JSON.stringify({ maxDailyHours: maxHours })
        });
        showMsg('Faculty teaching availability rules saved for ' + teacherId + ' (Max ' + maxHours + 'h/day).', false);
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function renderAdminLeaveRequests() {
      const el = document.getElementById('adminUnavailList');
      if (!el) return;
      const leaves = currentState.teacherUnavailability || [];
      if (leaves.length === 0) {
        el.innerHTML = '<div style="font-size:13px; color:var(--text-muted); padding:8px 0; display:flex; align-items:center; gap:6px;">' + SVG_ICONS.sparkles + ' No pending leave or absence requests.</div>';
        return;
      }
      let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
      leaves.forEach(l => {
        html += '<div style="background:#FFFFFF; border:1px solid var(--border); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div><strong>' + escapeHtml(l.teacherId) + '</strong>: ' + escapeHtml(l.date) + ' (Slots ' + escapeHtml(l.startSlot) + '–' + escapeHtml(l.endSlot) + ')<div style="font-size:11px; color:var(--text-muted);">' + escapeHtml(l.reason) + ' • Status: ' + escapeHtml(l.status) + '</div></div>' +
          (l.status === 'pending' ? '<button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" onclick="approveLeaveRequest(\\'' + escapeHtml(l.id) + '\\')">Approve Leave</button>' : '<span class="status-badge status-badge-published">Approved</span>') +
        '</div>';
      });
      html += '</div>';
      el.innerHTML = html;
    }

    async function approveLeaveRequest(leaveId) {
      try {
        await api('/api/teachers/unavailability/' + leaveId + '/approve', { method: 'POST' });
        showMsg('Leave request approved and conflicts resolved!', false);
        await loadState();
        renderAdminLeaveRequests();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // ========================================================================
    // 4. ACADEMIC MODULES HANDLERS
    // ========================================================================
    async function handleCreateTerm() {
      const termId = document.getElementById('termId')?.value;
      const yearLabel = document.getElementById('termYear')?.value;
      const semesterNumber = parseInt(document.getElementById('termSem')?.value || '1', 10);
      const cycle = document.getElementById('termCycle')?.value || 'odd';
      const isEven = cycle === 'even';
      const startDate = isEven ? '2027-01-05' : '2026-08-01';
      const endDate = isEven ? '2027-05-30' : '2026-12-24';
      try {
        await api('/api/academic/terms', {
          method: 'POST',
          body: JSON.stringify({ id: termId, yearLabel, semesterNumber, cycle, startDate, endDate, status: 'active' })
        });
        showMsg('Academic Term created.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function handleCreateSection() {
      const name = document.getElementById('secName')?.value;
      const termId = document.getElementById('secTermSelect')?.value;
      const expectedCount = parseInt(document.getElementById('secCount')?.value || '60', 10);
      try {
        await api('/api/academic/sections', {
          method: 'POST',
          body: JSON.stringify({ name, termId, expectedCount })
        });
        showMsg('Section created.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function handleCreateBatch() {
      const name = document.getElementById('batchName')?.value;
      const sectionId = document.getElementById('batchSecSelect')?.value;
      const expectedCount = parseInt(document.getElementById('batchCount')?.value || '30', 10);
      try {
        await api('/api/academic/batches', {
          method: 'POST',
          body: JSON.stringify({ name, sectionId, expectedCount })
        });
        showMsg('Practical Batch created.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function handleCreateCourse() {
      const code = document.getElementById('courseCode')?.value;
      const name = document.getElementById('courseName')?.value;
      const lectureHours = parseInt(document.getElementById('courseL')?.value || '3', 10);
      const tutorialHours = parseInt(document.getElementById('courseT')?.value || '0', 10);
      const practicalHours = parseInt(document.getElementById('courseP')?.value || '2', 10);
      const requiredRoomType = document.getElementById('courseRoomType')?.value || 'lecture_hall';
      const termId = document.getElementById('courseTermSelect')?.value || (currentState.academicTerms || [])[0]?.id || 'term-1';

      if (practicalHours % 2 !== 0) {
        showMsg('ERR_ODD_P_HOURS: Practical hours must be even (2-slot lab blocks).', true);
        return;
      }

      try {
        await api('/api/catalog/courses', {
          method: 'POST',
          body: JSON.stringify({ code, name, termId, lectureHours, tutorialHours, practicalHours, requiredRoomType })
        });
        showMsg('Course registered.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function handleCreateOffering() {
      const courseId = document.getElementById('offCourseSelect')?.value;
      const teacherId = document.getElementById('offTeacherSelect')?.value;
      const targetType = document.getElementById('offTargetType')?.value;
      const targetId = document.getElementById('offTargetIdSelect')?.value;
      const component = document.getElementById('offComponent')?.value || undefined;

      try {
        await api('/api/catalog/offerings', {
          method: 'POST',
          body: JSON.stringify({ courseId, teacherId, targetType, targetId, component })
        });
        showMsg('Course Offering mapped.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // ========================================================================
    // 5. SOLVER RUNNER & SSE STREAMING
    // ========================================================================
    var selectedCurriculumCsvFiles = [];

    function handleCurriculumCsvFilesSelected(fileList) {
      selectedCurriculumCsvFiles = [];
      var statusEl = document.getElementById('curriculumCsvFileStatus');
      var uploadBtn = document.getElementById('btnUploadCurriculumCsvs');
      if (!fileList || fileList.length === 0) {
        if (statusEl) statusEl.textContent = 'No CSV files selected.';
        if (uploadBtn) uploadBtn.disabled = true;
        return;
      }
      var filesArr = Array.from(fileList);
      selectedCurriculumCsvFiles = filesArr;
      if (statusEl) {
        statusEl.textContent = filesArr.length + ' file(s) selected: ' + filesArr.map(function(f) { return f.name; }).join(', ');
      }
      if (uploadBtn) uploadBtn.disabled = false;
    }

    async function submitSelectedCurriculumCsvs() {
      if (!selectedCurriculumCsvFiles || selectedCurriculumCsvFiles.length === 0) {
        showMsg('Please select one or more CSV files first.', true);
        return;
      }
      var uploadBtn = document.getElementById('btnUploadCurriculumCsvs');
      if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Importing...'; }
      try {
        var payloadFiles = [];
        for (var i = 0; i < selectedCurriculumCsvFiles.length; i++) {
          var file = selectedCurriculumCsvFiles[i];
          var text = await file.text();
          payloadFiles.push({ filename: file.name, content: text });
        }
        var res = await api('/api/admin/curriculum/csv-import', {
          method: 'POST',
          body: JSON.stringify({ files: payloadFiles })
        });
        showMsg(res.message || 'CSVs imported successfully!', false);
        var log = document.getElementById('solverLogConsole');
        var nl = String.fromCharCode(10);
        if (log) log.innerHTML += nl + '[CSV IMPORT] ' + (res.message || 'Import successful.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      } finally {
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = 'Ingest Selected Files'; }
      }
    }

    async function loadSamplePresentationCsvPack() {
      if (!confirm('Load official presentation sample CSV pack (terms, sections, batches, rooms, teachers, courses, offerings)?')) {
        return;
      }
      var log = document.getElementById('solverLogConsole');
      var nl = String.fromCharCode(10);
      if (log) log.innerHTML += nl + '[DEMO] Ingesting sample presentation CSV dataset...';

      var sampleFiles = [
        {
          filename: 'academic_terms.csv',
          content: [
            'id,year_label,semester_number,start_date,end_date,cycle,status',
            'term_2026_odd,2026-2027,1,2026-08-01,2026-12-15,odd,active'
          ].join(nl)
        },
        {
          filename: 'sections.csv',
          content: [
            'id,term_id,name,expected_count,active',
            'sec_cs_1a,term_2026_odd,CS-1A,60,true',
            'sec_cs_1b,term_2026_odd,CS-1B,60,true'
          ].join(nl)
        },
        {
          filename: 'batches.csv',
          content: [
            'id,section_id,name,expected_count,active',
            'batch_cs_1a_1,sec_cs_1a,CS-1A-B1,30,true',
            'batch_cs_1a_2,sec_cs_1a,CS-1A-B2,30,true',
            'batch_cs_1b_1,sec_cs_1b,CS-1B-B1,30,true',
            'batch_cs_1b_2,sec_cs_1b,CS-1B-B2,30,true'
          ].join(nl)
        },
        {
          filename: 'rooms.csv',
          content: [
            'id,room_number,building,floor,capacity,room_type,active',
            'room_lt1,LT-1,Academic Block A,1,100,lecture,true',
            'room_lt2,LT-2,Academic Block A,1,80,lecture,true',
            'room_lab1,Lab-1,Computing Block,2,35,lab,true',
            'room_lab2,Lab-2,Computing Block,2,35,lab,true',
            'room_tut1,T-101,Academic Block A,2,40,tutorial,true'
          ].join(nl)
        },
        {
          filename: 'teachers.csv',
          content: [
            'id,emp_id,name,email,active',
            'fac_01,EMP001,Dr. Ananya Sharma,ananya.sharma@jklu.edu.in,true',
            'fac_02,EMP002,Prof. Rajesh Verma,rajesh.verma@jklu.edu.in,true',
            'fac_03,EMP003,Dr. Vikram Singh,vikram.singh@jklu.edu.in,true',
            'fac_04,EMP004,Prof. Neha Gupta,neha.gupta@jklu.edu.in,true'
          ].join(nl)
        },
        {
          filename: 'courses.csv',
          content: [
            'id,code,name,term_id,lecture_hours,tutorial_hours,practical_hours,required_room_type',
            'c_cs101,CS101,Introduction to Programming,term_2026_odd,3,0,2,lab',
            'c_ma101,MA101,Linear Algebra & Calculus,term_2026_odd,3,1,0,lecture',
            'c_cs102,CS102,Digital Logic Design,term_2026_odd,3,0,2,lab'
          ].join(nl)
        },
        {
          filename: 'course_offerings.csv',
          content: [
            'id,course_id,term_id,teacher_id,target_type,target_id',
            'off_cs101_1a,c_cs101,term_2026_odd,fac_01,section,sec_cs_1a',
            'off_cs101_1b,c_cs101,term_2026_odd,fac_01,section,sec_cs_1b',
            'off_ma101_1a,c_ma101,term_2026_odd,fac_02,section,sec_cs_1a',
            'off_ma101_1b,c_ma101,term_2026_odd,fac_02,section,sec_cs_1b',
            'off_cs102_1a,c_cs102,term_2026_odd,fac_03,section,sec_cs_1a',
            'off_cs102_1b,c_cs102,term_2026_odd,fac_04,section,sec_cs_1b'
          ].join(nl)
        },
        {
          filename: 'students_bulk_upload.csv',
          content: [
            'roll_number,name,email,section_id,batch_id,initial_password',
            '2026CS001,Aarav Sharma,aarav.sharma@jklu.edu.in,sec_cs_1a,batch_cs_1a_1,Pass@123',
            '2026CS002,Diya Patel,diya.patel@jklu.edu.in,sec_cs_1a,batch_cs_1a_2,Pass@123',
            '2026CS003,Rohan Mehta,rohan.mehta@jklu.edu.in,sec_cs_1b,batch_cs_1b_1,Pass@123'
          ].join(nl)
        }
      ];

      try {
        var res = await api('/api/admin/curriculum/csv-import', {
          method: 'POST',
          body: JSON.stringify({ files: sampleFiles })
        });
        showMsg(res.message || 'Sample CSV Pack loaded successfully!', false);
        if (log) log.innerHTML += nl + '[DEMO] ' + (res.message || 'Sample Pack loaded.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
        if (log) log.innerHTML += nl + '[ERROR] Failed to load sample pack: ' + err.message;
      }
    }

    function populateSolverTerms() {
      var sel = document.getElementById('compileTermSelect');
      if (sel) {
        var terms = currentState.academicTerms || [];
        var prevVal = sel.value;
        if (terms.length === 0) {
          sel.innerHTML = '<option value="">No academic terms loaded</option>';
        } else {
          sel.innerHTML = terms.map(function(t) {
            return '<option value="' + t.id + '">' + (t.yearLabel || 'Academic Year') + ' (Sem ' + t.semesterNumber + ')</option>';
          }).join('');
          if (prevVal && terms.some(function(t) { return t.id === prevVal; })) {
            sel.value = prevVal;
          }
        }
      }
    }

    async function handleCompilePackage() {
      var termSelect = document.getElementById('compileTermSelect');
      var termId = termSelect ? termSelect.value : '';
      if (!termId && termSelect && termSelect.options.length > 0 && termSelect.options[0].value) {
        termSelect.selectedIndex = 0;
        termId = termSelect.value;
      }
      if (!termId) {
        showMsg('Please load curriculum CSVs or select an academic term first.', true);
        return;
      }
      try {
        var data = await api('/api/generation/compile-package', {
          method: 'POST',
          body: JSON.stringify({ termIds: [termId] })
        });
        showMsg('Package compiled successfully: Revision ' + data.package.inputRevision, false);
        var log = document.getElementById('solverLogConsole');
        var nl = String.fromCharCode(10);
        if (log) log.innerHTML += nl + '[PACKAGE] Compiled input revision ' + data.package.inputRevision + ' with ' + (data.package.courseOfferings || []).length + ' offerings for term ' + termId + '.';
      } catch (err) { showMsg(err.message, true); }
    }

    async function handleTriggerSolver(forceDirectPublish) {
      var badge = document.getElementById('solverStatusBadge');
      var log = document.getElementById('solverLogConsole');
      var nl = String.fromCharCode(10);
      var checkbox = document.getElementById('solverDirectlyPublish');
      var directlyPublish = forceDirectPublish === true || (forceDirectPublish !== false && checkbox && checkbox.checked);

      var termSelect = document.getElementById('compileTermSelect');
      var termId = termSelect ? termSelect.value : '';
      if (!termId && termSelect && termSelect.options.length > 0 && termSelect.options[0].value) {
        termSelect.selectedIndex = 0;
        termId = termSelect.value;
      }
      if (!termId) {
        showMsg('Please load curriculum CSVs or select an academic term first.', true);
        if (badge) { badge.textContent = 'Awaiting Term'; badge.className = 'status-badge'; }
        return;
      }

      if (badge) { badge.textContent = 'Solving...'; badge.className = 'status-badge status-badge-draft'; }
      if (log) log.innerHTML += nl + '[SOLVER] Dispatching CP-SAT generation request to cloud solver (Direct Publish: ' + directlyPublish + ')...';

      try {
        var data = await api('/api/generation/request', {
          method: 'POST',
          body: JSON.stringify({
            termIds: [termId],
            directlyPublish: directlyPublish
          })
        });

        if (data.status === 'infeasible' || data.status === 'INFEASIBLE') {
          if (badge) { badge.textContent = 'Infeasible'; badge.className = 'status-badge badge-pill-cancel'; }
          if (log) {
            log.innerHTML += nl + '[ERROR] CP-SAT reported model INFEASIBLE (D21).';
            if (data.message) log.innerHTML += nl + '[DIAGNOSTICS] ' + data.message;
          }
          showMsg('Solver returned INFEASIBLE. Review constraint capacities.', true);
        } else if (data.status === 'unavailable') {
          if (badge) { badge.textContent = 'Unavailable'; badge.className = 'status-badge badge-pill-cancel'; }
          if (log) log.innerHTML += nl + '[SOLVER] Result: unavailable. ' + (data.message || '');
          showMsg(data.message || 'Solver service unavailable', true);
        } else {
          if (badge) { badge.textContent = data.published ? 'Published' : 'Complete'; badge.className = 'status-badge status-badge-published'; }
          if (log) {
            log.innerHTML += nl + '[SOLVER] Result: succeeded (' + (data.solveTimeMs || 500) + 'ms). ' +
              (data.published ? 'Directly Published Version ' : 'Staged Draft Version ') +
              (data.draftVersionNumber || 1) + ' with ' + (data.classesCount || 0) + ' classes.';
          }
          showMsg(data.message || ('Solver succeeded! ' + (data.published ? 'Timetable published live to campus!' : 'Draft version staged.')), false);
        }
        await loadState();
      } catch (err) {
        if (badge) { badge.textContent = 'Failed'; badge.className = 'status-badge badge-pill-cancel'; }
        if (log) log.innerHTML += nl + '[ERROR] Generation failed: ' + err.message;
        showMsg(err.message, true);
      }
    }


    // Enterprise Topbar & Shortcut Utilities
    function updateTopbarCtaAndBreadcrumb() {
      const topTitle = document.getElementById('topbarActivePage');
      const cta = document.getElementById('topbarPrimaryCta');
      if (!topTitle || !cta) return;

      const effectiveRole = (currentUser && authToken) ? currentUser.role : currentRole;

      // Configure Dynamic Breadcrumbs and Contextual Primary CTA
      if (effectiveRole === 'admin') {
        if (currentUserSubPage === 'profile') {
          topTitle.textContent = 'Administrator Profile';
          cta.style.display = 'none';
        } else if (currentUserSubPage === 'security') {
          topTitle.textContent = 'Account Security';
          cta.style.display = 'none';
        } else {
          const titles = {
            hub: 'Command Center',
            timetables: 'Timetable Explorer',
            modules: 'Modules & Curriculum LTP',
            students: 'Student Directory',
            faculty: 'Faculty Registry',
            matrix: 'Room Utilization Matrix',
            solver: 'CP-SAT Solver Console'
          };
          topTitle.textContent = titles[currentAdminPage || 'hub'] || 'Admin Hub';

          if (currentAdminPage === 'solver') {
            cta.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.solver + ' Run Solver</span>';
            cta.style.display = 'inline-flex';
            cta.onclick = handleTriggerSolver;
          } else if (currentAdminPage === 'timetables') {
            cta.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.refresh + ' Refresh Grid</span>';
            cta.style.display = 'inline-flex';
            cta.onclick = renderAdminTimetable;
          } else if (currentAdminPage === 'modules') {
            cta.textContent = '+ Create Term';
            cta.style.display = 'inline-flex';
            cta.onclick = () => {
              const input = document.getElementById('termYear');
              if (input) { input.scrollIntoView({ behavior: 'smooth' }); input.focus(); }
            };
          } else if (currentAdminPage === 'students') {
            cta.textContent = '+ Provision Student';
            cta.style.display = 'inline-flex';
            cta.onclick = () => {
              const input = document.getElementById('stdAddName');
              if (input) { input.scrollIntoView({ behavior: 'smooth' }); input.focus(); }
            };
          } else if (currentAdminPage === 'faculty') {
            cta.textContent = '+ Register Faculty';
            cta.style.display = 'inline-flex';
            cta.onclick = () => {
              const input = document.getElementById('facultyAddName');
              if (input) { input.scrollIntoView({ behavior: 'smooth' }); input.focus(); }
            };
          } else if (currentAdminPage === 'matrix') {
            cta.innerHTML = '<span style="display:inline-flex; align-items:center; gap:6px;">' + SVG_ICONS.refresh + ' Refresh Matrix</span>';
            cta.style.display = 'inline-flex';
            cta.onclick = renderRoomMatrix;
          } else {
            cta.style.display = 'none';
          }
        }
      } else if (effectiveRole === 'teacher') {
        const titles = {
          'schedule': 'Faculty Timetable Workstation',
          'teacher-extra': 'Book Extra Class',
          'teacher-rooms': 'Empty Classroom Finder',
          'teacher-leave': 'Leave & Unavailability Request',
          'profile': 'Faculty Profile',
          'security': 'Account Security'
        };
        topTitle.textContent = titles[currentUserSubPage || 'schedule'] || 'Faculty Workstation';

        if (currentUserSubPage === 'schedule') {
          cta.textContent = '+ Book Extra Class';
          cta.style.display = 'inline-flex';
          cta.onclick = () => switchUserSubPage('teacher-extra');
        } else {
          cta.style.display = 'none';
        }
      } else {
        const titles = {
          'schedule': 'Academic Timetable',
          'profile': 'Student Profile',
          'security': 'Account Security'
        };
        topTitle.textContent = titles[currentUserSubPage || 'schedule'] || 'Student Portal';
        cta.style.display = 'none';
      }
    }

    function handleTopbarPrimaryCta() {
      const effectiveRole = (currentUser && authToken) ? currentUser.role : currentRole;
      if (effectiveRole === 'teacher' && currentUserSubPage === 'schedule') {
        switchUserSubPage('teacher-extra');
      } else if (effectiveRole === 'admin') {
        if (currentAdminPage === 'solver') handleTriggerSolver();
        else if (currentAdminPage === 'timetables') renderAdminTimetable();
        else if (currentAdminPage === 'matrix') renderRoomMatrix();
      }
    }


    // Explicit Role Workstation Focus Handlers
    function focusSchedule() {
      switchUserSubPage('schedule');
    }

    function focusTeacherExtraClass() {
      switchUserSubPage('teacher-extra');
    }

    function focusTeacherLeave() {
      switchUserSubPage('teacher-leave');
    }

    function focusTeacherRoomFinder() {
      switchUserSubPage('teacher-rooms');
    }

    function focusStudentInbox() {
      toggleNotifPopover();
    }

    function focusStudentSecurity() {
      switchUserSubPage('security');
    }

    function highlightActiveRailLink(activeKey) {
      const allRailIds = [
        'railItemAdminHub', 'railItemAdminTimetables', 'railItemAdminModules',
        'railItemAdminStudents', 'railItemAdminFaculty', 'railItemAdminMatrix',
        'railItemAdminSolver', 'railItemAdminProfile', 'railItemAdminSecurity',
        'railItemTeacherSchedule', 'railItemTeacherExtra', 'railItemTeacherRooms',
        'railItemTeacherLeave', 'railItemTeacherProfile', 'railItemTeacherSecurity',
        'railItemStudentSchedule', 'railItemStudentProfile', 'railItemStudentSecurity'
      ];
      allRailIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
      });

      const effectiveRole = (currentUser && authToken) ? currentUser.role : currentRole;

      if (effectiveRole === 'admin') {
        if (activeKey === 'profile') {
          document.getElementById('railItemAdminProfile')?.classList.add('active');
        } else if (activeKey === 'security') {
          document.getElementById('railItemAdminSecurity')?.classList.add('active');
        } else {
          const keyCap = activeKey.charAt(0).toUpperCase() + activeKey.slice(1);
          document.getElementById('railItemAdmin' + keyCap)?.classList.add('active');
        }
      } else if (effectiveRole === 'teacher') {
        const teacherMap = {
          'schedule': 'railItemTeacherSchedule',
          'teacher-extra': 'railItemTeacherExtra',
          'teacher-rooms': 'railItemTeacherRooms',
          'teacher-leave': 'railItemTeacherLeave',
          'profile': 'railItemTeacherProfile',
          'security': 'railItemTeacherSecurity'
        };
        const targetId = teacherMap[activeKey];
        if (targetId) document.getElementById(targetId)?.classList.add('active');
      } else {
        const studentMap = {
          'schedule': 'railItemStudentSchedule',
          'profile': 'railItemStudentProfile',
          'security': 'railItemStudentSecurity'
        };
        const targetId = studentMap[activeKey];
        if (targetId) document.getElementById(targetId)?.classList.add('active');
      }
    }

    function toggleNotifPopover() {
      const popover = document.getElementById('notifPopover');
      if (!popover) return;
      const isOpen = popover.style.display === 'flex';
      popover.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        renderNotifPopoverList();
      }
    }

    function renderNotifPopoverList() {
      const listEl = document.getElementById('notifPopoverItems') || document.getElementById('notifListContainer');
      const badge = document.getElementById('notifBadgeCount');
      if (!listEl) return;

      const effectiveRole = (currentUser && authToken) ? currentUser.role : currentRole;

      if (effectiveRole === 'student') {
        // Render student-targeted alerts
        const targetStudent = (currentUser && currentUser.entityId) ? currentUser.entityId : 'stud-1';
        const notifs = (currentState && currentState.notifications) ? currentState.notifications.filter(n => !n.recipientStudentId || n.recipientStudentId === targetStudent) : [];
        if (badge) badge.textContent = notifs.length.toString();

        if (notifs.length === 0) {
          listEl.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px; display:flex; align-items:center; justify-content:center; gap:6px;">' + SVG_ICONS.sparkles + ' No schedule displacement notices.</div>';
          return;
        }

        listEl.innerHTML = notifs.slice(-6).reverse().map(n => {
          const title = escapeHtml(n.title || 'Schedule Notice');
          const msg = escapeHtml(n.message || n.details || 'Your class occurrence was updated.');
          const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
          return '<div class="notif-item"><strong>' + title + '</strong><div>' + msg + '</div><div class="notif-time">' + dateStr + '</div></div>';
        }).join('');
      } else {
        // Render institutional audit log events (for Admin & Teacher)
        const audits = (currentState && currentState.auditEvents) ? currentState.auditEvents.slice(-6).reverse() : [];
        if (badge) badge.textContent = audits.length.toString();

        if (audits.length === 0) {
          listEl.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:12px;">No recent system events.</div>';
          return;
        }

        listEl.innerHTML = audits.map(a => {
          const action = escapeHtml((a.action || 'AUDIT_RECORD').replace(/_/g, ' '));
          const dateStr = a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
          const details = escapeHtml(a.details || 'System event recorded.');
          const actor = a.performedBy ? (' <span style="font-size:10px; color:var(--text-muted);">(' + escapeHtml(a.performedBy) + ')</span>') : '';
          return '<div class="notif-item"><strong>' + action + actor + '</strong><div>' + details + '</div><div class="notif-time">' + dateStr + '</div></div>';
        }).join('');
      }
    }

    function handleGlobalSearch(term) {
      const q = (term || '').toLowerCase().trim();

      // 1. If on Students Page, filter students table
      const studentInput = document.getElementById('studentSearchInput');
      if (studentInput && currentAdminPage === 'students') {
        studentInput.value = term;
        renderStudentsTable(term);
        return;
      }

      // 2. If on Faculty Page, filter faculty table
      const facultyInput = document.getElementById('facultySearchInput');
      if (facultyInput && currentAdminPage === 'faculty') {
        facultyInput.value = term;
        renderFacultyTable(term);
        return;
      }

      // 3. Filter active timetable grid occurrences
      const classCards = document.querySelectorAll('.class-card, .class-card-unclipped');
      if (classCards.length > 0) {
        classCards.forEach(card => {
          if (!q) {
            card.style.opacity = '1';
            card.style.filter = 'none';
          } else {
            const text = (card.textContent || '').toLowerCase();
            if (text.includes(q)) {
              card.style.opacity = '1';
              card.style.filter = 'none';
              card.style.boxShadow = '0 0 0 2px var(--primary-blue)';
            } else {
              card.style.opacity = '0.25';
              card.style.filter = 'grayscale(60%)';
              card.style.boxShadow = 'none';
            }
          }
        });
      }

      // 4. Filter generic data tables
      const tableRows = document.querySelectorAll('.data-table tbody tr, table.styled-table tbody tr');
      if (tableRows.length > 0 && currentAdminPage !== 'students' && currentAdminPage !== 'faculty') {
        tableRows.forEach(row => {
          if (!q) {
            row.style.display = '';
          } else {
            const rowText = (row.textContent || '').toLowerCase();
            row.style.display = rowText.includes(q) ? '' : 'none';
          }
        });
      }
    }

    // Close popovers on outside click
    window.addEventListener('click', function(e) {
      const popover = document.getElementById('notifPopover');
      const btn = document.getElementById('notifBellBtn');
      if (popover && btn && !popover.contains(e.target) && !btn.contains(e.target)) {
        popover.style.display = 'none';
      }
    });

    // Init Application
    async function init() {
      if (authToken) {
        try {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + authToken } });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            currentUser = data.user;
            currentRole = currentUser.role;
          } else {
            authToken = '';
            currentUser = null;
            currentRole = 'student';
            localStorage.removeItem('timetable_auth_token');
          }
        } catch {
          authToken = '';
          currentUser = null;
          currentRole = 'student';
          localStorage.removeItem('timetable_auth_token');
        }
      } else {
        currentUser = null;
        currentRole = 'student';
      }

      updateAuthNav();
      setupRealtime();
      await loadState();
      switchView(authToken ? 'dashboard' : 'landing');
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
