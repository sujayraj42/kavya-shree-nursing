import { CourseItem, NoticeItem, ApprovalItem, FacultyItem, HospitalTieupItem, GalleryItem, FaqItem, DownloadItem } from '../services/content.service';

export const FALLBACK_COURSES: CourseItem[] = [
  {
    id: 'anm',
    title: 'Auxiliary Nursing & Midwifery (ANM)',
    subtitle: '2-Year Diploma Program',
    content: 'Foundational healthcare diploma program preparing female candidates in maternal and child healthcare, community health, and first aid.',
    data: {
      code: 'ANM',
      duration: '2 Years (Full Time)',
      level: 'Diploma',
      eligibility: '10+2 passed in Arts or Science with minimum 40-45% marks. Minimum age 17 years.',
      seats: 'As per regulatory council notification',
      fees: 'Contact admissions desk for transparent institutional fee schedule',
      careerOptions: [
        'Primary Health Centre (PHC) Nurse',
        'Community Health Worker',
        'Maternal & Child Health Assistant',
        'Rural Health Sub-Center Incharge'
      ],
      syllabus: [
        'Community Health Nursing, Health Promotion, Primary Health Care Nursing',
        'Child Health Nursing, Midwifery, Health Center Management'
      ]
    }
  },
  {
    id: 'gnm',
    title: 'General Nursing & Midwifery (GNM)',
    subtitle: '3-Year Diploma with 6-Month Internship',
    content: 'Comprehensive clinical nursing program equipping students with in-depth knowledge of bedside patient care, medical-surgical nursing, and pediatric healthcare.',
    data: {
      code: 'GNM',
      duration: '3 Years (Full Time)',
      level: 'Diploma',
      eligibility: '10+2 with English and 40% aggregate in qualifying examination (Science PCB preferred).',
      seats: 'As per regulatory council notification',
      fees: 'Contact admissions desk for transparent institutional fee schedule',
      careerOptions: [
        'Staff Nurse in Government & Private Hospitals',
        'Intensive Care Unit (ICU) Specialist Nurse',
        'Industrial Nurse',
        'State Healthcare Department Nurse'
      ],
      syllabus: [
        'Year 1: Bio-Sciences, Behavioral Sciences, Nursing Foundations, Community Health',
        'Year 2: Medical-Surgical Nursing I & II, Pharmacology, Mental Health Nursing',
        'Year 3: Midwifery & Gynaecological Nursing, Community Health II, 6-Month Mandatory Clinical Internship'
      ]
    }
  },
  {
    id: 'bsc-nursing',
    title: 'Bachelor of Science in Nursing (B.Sc.)',
    subtitle: '4-Year Professional University Degree',
    content: 'Premier undergraduate degree combining biological sciences, advanced nursing clinical procedures, pharmacology, community health research, and hospital administration.',
    data: {
      code: 'B.Sc. Nursing',
      duration: '4 Years (Full Time)',
      level: 'Undergraduate Degree',
      eligibility: '10+2 passed with Physics, Chemistry, Biology (PCB) and English with statutory minimum percentage.',
      seats: 'As per regulatory council notification',
      fees: 'Contact admissions desk for transparent institutional fee schedule',
      careerOptions: [
        'Clinical Nursing Officer (Govt & Private Hospitals)',
        'Nursing Supervisor / Ward Administrator',
        'Military & Railway Nursing Services',
        'International Healthcare Professional'
      ],
      syllabus: [
        'Year 1: Anatomy & Physiology, Nutrition & Biochemistry, Nursing Foundations, Psychology',
        'Year 2: Pharmacology, Pathology & Genetics, Medical-Surgical Nursing I, Sociology',
        'Year 3: Medical-Surgical II, Child Health Nursing, Mental Health Nursing, Nursing Research',
        'Year 4: Midwifery, Community Health Nursing II, Nursing Management, Clinical Internship'
      ]
    }
  },
  {
    id: 'post-basic-bsc',
    title: 'Post Basic B.Sc. Nursing',
    subtitle: '2-Year Bridge Degree for Registered GNM Nurses',
    content: 'Advanced degree enabling diploma-qualified registered nurses to elevate clinical skills, administrative competencies, and educational qualifications to a degree standard.',
    data: {
      code: 'P.B. B.Sc.',
      duration: '2 Years (Full Time)',
      level: 'Post-Diploma Degree',
      eligibility: 'Registered GNM (General Nursing & Midwifery) with State Nursing Registration Council.',
      seats: 'As per regulatory council notification',
      fees: 'Contact admissions desk for transparent institutional fee schedule',
      careerOptions: [
        'Nursing Superintendent / Assistant Director',
        'Clinical Instructor / Tutor',
        'Speciality Critical Care Manager',
        'Healthcare Quality Auditor'
      ],
      syllabus: [
        'Year 1: Nursing Foundation Review, Maternal Nursing, Child Health, Microbiology',
        'Year 2: Sociology, Community Health Nursing, Mental Health, Introduction to Nursing Education & Administration'
      ]
    }
  },
  {
    id: 'msc-nursing',
    title: 'Master of Science in Nursing (M.Sc.)',
    subtitle: '2-Year Postgraduate Specialization',
    content: 'Postgraduate clinical program cultivating nurse specialists, clinical researchers, nursing collegiate faculty, and hospital executives.',
    data: {
      code: 'M.Sc. Nursing',
      duration: '2 Years (Full Time)',
      level: 'Postgraduate Degree',
      eligibility: 'B.Sc. Nursing / Post Basic B.Sc. with minimum 55% aggregate and minimum 1 year clinical experience.',
      seats: 'As per regulatory council notification',
      fees: 'Contact admissions desk for transparent institutional fee schedule',
      careerOptions: [
        'Assistant Professor / Nursing College Faculty',
        'Chief Nursing Officer (CNO)',
        'Clinical Nurse Specialist',
        'Healthcare Policy Researcher'
      ],
      syllabus: [
        'Year 1: Nursing Education, Advanced Nursing Practice, Nursing Research & Statistics',
        'Year 2: Clinical Speciality (Medical-Surgical / Community / Obstetrics / Child Health), Nursing Management, Dissertation'
      ]
    }
  }
];

export const FALLBACK_NOTICES: NoticeItem[] = [
  {
    id: 'notice-2026-admissions',
    title: 'Admissions Open for Session 2026-2027',
    subtitle: 'Provisional Registrations Active',
    content: 'Provisional admissions consultation and registration are active for ANM, GNM, and B.Sc. Nursing programs.',
    data: {
      lastDate: '31 August 2026',
      isNoticeBarActive: true,
      bannerText: 'Admissions Open 2026: Provisional seat allocation and counseling desk operational.',
      badge: 'Admissions 2026',
      priority: 'high'
    },
    createdAt: '2026-04-01T00:00:00.000Z'
  }
];

export const FALLBACK_GALLERY: GalleryItem[] = [
  {
    id: 'gal-01',
    title: 'Campus Architecture & Academic Building',
    subtitle: 'Illustrative images',
    content: 'Modern academic campus equipped with lecture theaters, administrative offices, and library.',
    data: {
      category: 'Campus',
      imageUrl: 'images/generated/campus-hero-1600w.webp',
      thumbnailUrl: 'images/generated/campus-hero-800w.webp',
      alt: 'Kavya Shree Institute campus academic building'
    }
  },
  {
    id: 'gal-02',
    title: 'Nursing Skills & Simulation Laboratory',
    subtitle: 'Illustrative images',
    content: 'Hands-on practical training mannequins for injection technique, CPR, and vital sign monitoring.',
    data: {
      category: 'Labs',
      imageUrl: 'images/generated/skills-lab-1600w.webp',
      thumbnailUrl: 'images/generated/skills-lab-800w.webp',
      alt: 'Nursing students in clinical simulation laboratory'
    }
  }
];
