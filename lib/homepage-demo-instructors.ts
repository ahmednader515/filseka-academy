// Presentation-only demo profiles. These never create users or affect academy statistics.
export const HOMEPAGE_DEMO_INSTRUCTORS = [
  { name: "أحمد عادل", nameEn: "Ahmed Adel", subject: "التقديم الإذاعي", subjectEn: "Radio presenting", position: "8% 0%" },
  { name: "سارة محمود", nameEn: "Sara Mahmoud", subject: "إنتاج البودكاست", subjectEn: "Podcast production", position: "50% 0%" },
  { name: "كريم حسن", nameEn: "Karim Hassan", subject: "التصوير والإنتاج", subjectEn: "Filming & production", position: "92% 0%" },
  { name: "مريم علي", nameEn: "Mariam Ali", subject: "التدريب الإعلامي", subjectEn: "Media training", position: "8% 100%" },
  { name: "عمر طارق", nameEn: "Omar Tarek", subject: "صناعة المحتوى", subjectEn: "Content creation", position: "50% 100%" },
  { name: "نور خالد", nameEn: "Nour Khaled", subject: "التعليق الصوتي", subjectEn: "Voice coaching", position: "92% 100%" },
].map((profile, index) => ({
  id: `demo-instructor-${index + 1}`,
  name: profile.name,
  nameEn: profile.nameEn,
  teacherSubject: profile.subject,
  teacherSubjectEn: profile.subjectEn,
  teacherAvatarUrl: "/demo-instructors.png",
  demoAvatarPosition: profile.position,
  isDemo: true,
  createdAt: "2026-10-28T00:00:00.000Z",
  courses: [],
}));
