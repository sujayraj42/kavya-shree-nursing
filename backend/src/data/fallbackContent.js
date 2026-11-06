'use strict';

const FALLBACK_CONTENT = {
  notices: [
    {
      id: 'notice-2026-01',
      title: 'Admissions Open for Academic Session 2026–2027',
      subtitle: 'Official Application Window Now Open',
      content: 'Applications are invited for ANM, GNM, and B.Sc. Nursing programs for the upcoming academic session. Candidates are advised to submit their preliminary enquiry or complete the online application.',
      data: {
        lastDate: '2026-08-31',
        isNoticeBarActive: true,
        bannerText: 'Admissions Open 2026: Apply online or call the admissions helpline for seat allocation guidance.',
        badge: 'Intake 2026',
        priority: 'high'
      },
      order: 1,
      isActive: true,
      createdAt: '2026-01-15T00:00:00.000Z'
    },
    {
      id: 'notice-2026-02',
      title: 'Counseling & Document Verification Desk',
      subtitle: 'Admissions Helpdesk Operational',
      content: 'Campus counseling desk is functional from 10:00 AM to 5:00 PM (Monday through Saturday). Prospective students and parents may visit for program briefing and campus inspection.',
      data: {
        lastDate: '2026-09-15',
        isNoticeBarActive: false,
        badge: 'Counseling',
        priority: 'medium'
      },
      order: 2,
      isActive: true,
      createdAt: '2026-02-01T00:00:00.000Z'
    }
  ],
  courses: [
    {
      id: 'anm',
      title: 'Auxiliary Nursing & Midwifery (ANM)',
      subtitle: '2-Year Diploma Program',
      content: 'A foundational diploma healthcare track focusing on community maternal and child healthcare, primary rural medical support, and emergency first response nursing.',
      data: {
        code: 'ANM',
        duration: '2 Years (Full Time)',
        level: 'Diploma',
        eligibility: '10+2 passed in Arts/Science/Commerce with minimum aggregate marks as per statutory norms.',
        seats: 'As per regulatory council notification',
        fees: 'Contact admissions desk for transparent institutional fee schedule',
        careerOptions: [
          'Primary Health Center (PHC) Nurse',
          'Community Health Worker / ASHA Coordinator',
          'Maternity & Child Health Assistant',
          'Rural Wellness Clinic Staff'
        ],
        syllabus: [
          'Year 1: Community Health Nursing, Health Promotion, Primary Healthcare Nursing, Child Health Nursing',
          'Year 2: Midwifery, Health Center Management, Clinical Field Practical Internship'
        ]
      },
      order: 1,
      isActive: true
    },
    {
      id: 'gnm',
      title: 'General Nursing & Midwifery (GNM)',
      subtitle: '3-Year Diploma with Clinical Internship',
      content: 'Comprehensive general nursing education preparing healthcare professionals for bedside patient management, medical-surgical nursing, and intensive hospital care.',
      data: {
        code: 'GNM',
        duration: '3 Years (Full Time)',
        level: 'Diploma',
        eligibility: '10+2 with English, Physics, Chemistry, Biology (PCB) or aggregate equivalent as per council directives.',
        seats: 'As per regulatory council notification',
        fees: 'Contact admissions desk for transparent institutional fee schedule',
        careerOptions: [
          'Staff Nurse in Super-Speciality Hospitals',
          'ICU / Emergency Critical Care Nurse',
          'Operation Theatre (OT) Nursing Specialist',
          'State Healthcare Department Nurse'
        ],
        syllabus: [
          'Year 1: Bio-Sciences, Behavioral Sciences, Nursing Foundations, Community Health',
          'Year 2: Medical-Surgical Nursing I & II, Pharmacology, Mental Health Nursing',
          'Year 3: Midwifery & Gynaecological Nursing, Community Health II, 6-Month Mandatory Clinical Internship'
        ]
      },
      order: 2,
      isActive: true
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
      },
      order: 3,
      isActive: true
    },
    {
      id: 'post-basic-bsc',
      title: 'Post Basic B.Sc. Nursing',
      subtitle: '2-Year Bridge Degree for Registered GNM Nurses',
      content: 'Advanced degree enabling diploma-qualified registered nurses to advance clinical skills, administrative competencies, and educational qualifications to a degree standard.',
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
      },
      order: 4,
      isActive: true
    },
    {
      id: 'msc-nursing',
      title: 'Master of Science in Nursing (M.Sc.)',
      subtitle: '2-Year Postgraduate Specialization',
      content: 'Master-level qualification emphasizing clinical research, nurse educatorship, healthcare leadership, and speciality medical disciplines.',
      data: {
        code: 'M.Sc. Nursing',
        duration: '2 Years (Full Time)',
        level: 'Postgraduate Degree',
        eligibility: 'B.Sc. Nursing or Post Basic B.Sc. Nursing with minimum aggregate marks and required clinical experience.',
        seats: 'As per regulatory council notification',
        fees: 'Contact admissions desk for transparent institutional fee schedule',
        careerOptions: [
          'Professor / Nursing College Faculty',
          'Chief Nursing Officer (CNO)',
          'Clinical Nurse Specialist',
          'Healthcare Policy Researcher'
        ],
        syllabus: [
          'Year 1: Advanced Nursing Practice, Clinical Speciality I, Nursing Education, Research & Statistics',
          'Year 2: Nursing Management, Clinical Speciality II (MSN/Obs/Ped/Psych/CHN), Master Dissertation'
        ]
      },
      order: 5,
      isActive: true
    }
  ],
  approvals: [
    {
      id: 'app-01',
      title: 'Statutory Regulatory Framework',
      subtitle: 'State Nursing Registration Council & Affiliation',
      content: 'Institutional operations, syllabus delivery, and clinical practicals adhere strictly to statutory curriculum requirements established by the state health authorities and nursing examination councils.',
      data: {
        authority: 'State Nursing Examination Council & Affiliating University',
        status: 'Provisional Institutional Framework 2026',
        documentUrl: 'assets/documents/affiliation-provisional.pdf',
        documentType: 'PDF Document',
        noticeText: 'Official gazette certificates and statutory approval orders are retained on file at the institutional administration office.'
      },
      order: 1,
      isActive: true
    }
  ],
  faculty: [
    {
      id: 'fac-01',
      title: 'Department of Medical-Surgical Nursing',
      subtitle: 'Advanced Clinical Simulation & Critical Care',
      content: 'Instructional faculty mentoring students in patient management, intensive care units, and clinical simulation protocols.',
      data: {
        role: 'Associate Professor & Clinical Coordinator',
        qualification: 'M.Sc. Nursing (Medical-Surgical Speciality)',
        imageUrl: 'images/generated/faculty-1.webp',
        isPlaceholder: false,
        notice: 'Academic mentor'
      },
      order: 1,
      isActive: true
    },
    {
      id: 'fac-02',
      title: 'Department of Community Health Nursing',
      subtitle: 'Public Health, Rural Outreach & Prevention',
      content: 'Guiding healthcare outreach, community health centers (CHCs), maternal health, and pulse polio drives.',
      data: {
        role: 'Assistant Professor & Field Coordinator',
        qualification: 'M.Sc. Nursing (Community Health Speciality)',
        imageUrl: 'images/generated/faculty-2.webp',
        isPlaceholder: false,
        notice: 'Academic mentor'
      },
      order: 2,
      isActive: true
    },
    {
      id: 'fac-03',
      title: 'Department of Obstetrics & Gynecological Nursing',
      subtitle: 'Maternal Care & Midwifery Training',
      content: 'Specialized clinical instruction in antenatal protocols, labour room techniques, and neonatal bedside nursing.',
      data: {
        role: 'Senior Tutor & Midwifery Specialist',
        qualification: 'M.Sc. Nursing (OBG Speciality)',
        imageUrl: 'images/generated/faculty-3.webp',
        isPlaceholder: false,
        notice: 'Academic mentor'
      },
      order: 3,
      isActive: true
    },
    {
      id: 'fac-04',
      title: 'Department of Child Health (Pediatric) Nursing',
      subtitle: 'Neonatal & Pediatric Care Foundations',
      content: 'Educator mentoring pediatric resuscitation, developmental assessments, and child healthcare immunization schedules.',
      data: {
        role: 'Clinical Instructor & Pediatric Coordinator',
        qualification: 'M.Sc. Nursing (Pediatric Speciality)',
        imageUrl: 'images/generated/faculty-4.webp',
        isPlaceholder: false,
        notice: 'Academic mentor'
      },
      order: 4,
      isActive: true
    }
  ],
  hospitalTieups: [
    {
      id: 'hosp-01',
      title: 'District Civil Hospital & Clinical Centers',
      subtitle: 'In-Patient Medical & Surgical Training',
      content: 'Comprehensive clinical rotations across General Medicine, General Surgery, Pediatrics, and Emergency Trauma Care.',
      data: {
        location: 'Bihar Region',
        bedCapacity: '250+ Multi-Specialty Beds',
        specialties: ['General Medicine', 'Surgical Wards', 'Maternity Ward', 'Emergency Care']
      },
      order: 1,
      isActive: true
    },
    {
      id: 'hosp-02',
      title: 'Community Health Centers (CHCs) & Primary Centers',
      subtitle: 'Public Health & Immunization Outreach',
      content: 'Hands-on exposure to maternal health, pulse polio drives, adolescent nutrition, and rural healthcare delivery.',
      data: {
        location: 'Regional Primary Centers',
        bedCapacity: 'Community Healthcare Units',
        specialties: ['Primary Healthcare', 'Antenatal Care', 'Immunization', 'Family Welfare']
      },
      order: 2,
      isActive: true
    }
  ],
  gallery: [
    {
      id: 'gal-01',
      title: 'Campus Architecture & Academic Building',
      subtitle: 'Illustrative images',
      content: 'Modern multi-story academic campus equipped with lecture theaters, administrative offices, and library.',
      data: {
        category: 'Campus',
        imageUrl: 'images/generated/campus-hero-1600w.webp',
        thumbnailUrl: 'images/generated/campus-hero-800w.webp',
        alt: 'Kavya Shree Institute campus academic building'
      },
      order: 1,
      isActive: true
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
      },
      order: 2,
      isActive: true
    },
    {
      id: 'gal-03',
      title: 'Clinical Ward Practice & Bedside Care',
      subtitle: 'Illustrative images',
      content: 'Supervised clinical rotations under experienced nursing mentors.',
      data: {
        category: 'Clinical',
        imageUrl: 'images/generated/clinical-training-1600w.webp',
        thumbnailUrl: 'images/generated/clinical-training-800w.webp',
        alt: 'Clinical nursing training session'
      },
      order: 3,
      isActive: true
    },
    {
      id: 'gal-04',
      title: 'Academic Classrooms & Audio-Visual Lectures',
      subtitle: 'Illustrative images',
      content: 'Well-ventilated lecture halls equipped with anatomical models and digital learning aids.',
      data: {
        category: 'Classroom',
        imageUrl: 'images/generated/classroom-1600w.webp',
        thumbnailUrl: 'images/generated/classroom-800w.webp',
        alt: 'Nursing lecture hall and interactive classroom'
      },
      order: 4,
      isActive: true
    },
    {
      id: 'gal-05',
      title: 'Health Sciences Library & Study Space',
      subtitle: 'Illustrative images',
      content: 'Extensive collection of nursing textbooks, medical journals, and quiet reading zones.',
      data: {
        category: 'Campus',
        imageUrl: 'images/generated/library-1600w.webp',
        thumbnailUrl: 'images/generated/library-800w.webp',
        alt: 'Students studying in institutional library'
      },
      order: 5,
      isActive: true
    },
    {
      id: 'gal-06',
      title: 'Student Hostel & Campus Grounds',
      subtitle: 'Illustrative images',
      content: 'Safe residential accommodation with study lounges and clean mess facilities.',
      data: {
        category: 'Hostel',
        imageUrl: 'images/generated/campus-life-1600w.webp',
        thumbnailUrl: 'images/generated/campus-life-800w.webp',
        alt: 'Student residential facilities and grounds'
      },
      order: 6,
      isActive: true
    }
  ],
  faqs: [
    {
      id: 'faq-01',
      title: 'What are the recognized nursing courses offered for the 2026 session?',
      content: 'Kavya Shree Institute advertises 5 core programs: ANM (2 Years Diploma), GNM (3 Years Diploma), B.Sc. Nursing (4 Years Degree), Post Basic B.Sc. Nursing (2 Years), and M.Sc. Nursing (2 Years). All curriculums follow statutory council norms.',
      data: { category: 'Admissions' },
      order: 1,
      isActive: true
    },
    {
      id: 'faq-02',
      title: 'What is the minimum eligibility criteria for B.Sc. Nursing and GNM?',
      content: 'For B.Sc. Nursing, candidates must have passed 10+2 with Physics, Chemistry, Biology (PCB) and English. For GNM, 10+2 in Science is preferred, though Arts/Commerce candidates may be considered per council guidelines. Minimum age is 17 years.',
      data: { category: 'Eligibility' },
      order: 2,
      isActive: true
    },
    {
      id: 'faq-03',
      title: 'How can I submit my admission enquiry or application?',
      content: 'You can submit an enquiry online via the Admissions page, fill out the comprehensive Online Application form on our website, or visit our campus admissions consultation desk in person.',
      data: { category: 'Admissions' },
      order: 3,
      isActive: true
    },
    {
      id: 'faq-04',
      title: 'Are separate hostel facilities available for female students?',
      content: 'Yes, secure hostel accommodation with round-the-clock warden supervision, hygienic mess meals, and power backup is arranged for residential candidates.',
      data: { category: 'Campus & Facilities' },
      order: 4,
      isActive: true
    },
    {
      id: 'faq-05',
      title: 'Where do students receive practical clinical hospital training?',
      content: 'Students undergo mandatory clinical rotations at affiliated multi-specialty district hospitals, sub-divisional medical centers, and community health centers in the region.',
      data: { category: 'Clinical Training' },
      order: 5,
      isActive: true
    },
    {
      id: 'faq-06',
      title: 'What documents are required during document verification?',
      content: 'Candidates need: 10th and 12th original marksheets and passing certificates, Migration / Transfer certificate, Character certificate, Aadhaar card copy, recent passport-sized photographs, and Caste / Income certificate (if applicable).',
      data: { category: 'Documentation' },
      order: 6,
      isActive: true
    }
  ],
  downloads: [
    {
      id: 'dl-01',
      title: 'Official Academic Prospectus (Session 2026)',
      subtitle: 'Complete institutional handbook, course curricula, and campus guide',
      content: 'Comprehensive institutional overview containing program summaries, fee guidelines, code of conduct, and admissions process.',
      data: {
        fileType: 'PDF',
        fileSize: '2.4 MB',
        downloadUrl: 'assets/documents/prospectus-2026.pdf',
        category: 'Prospectus'
      },
      order: 1,
      isActive: true
    },
    {
      id: 'dl-02',
      title: 'Offline Admissions Application Form',
      subtitle: 'Printable application form for postal or in-person submission',
      content: 'Standard candidate admissions form for in-person submission at the college campus office.',
      data: {
        fileType: 'PDF',
        fileSize: '850 KB',
        downloadUrl: 'assets/documents/admission-form-2026.pdf',
        category: 'Forms'
      },
      order: 2,
      isActive: true
    },
    {
      id: 'dl-03',
      title: 'Syllabus & Course Structure Summary',
      subtitle: 'ANM, GNM, and B.Sc. academic outlines',
      content: 'Subject-wise breakdown and semester timetable outline for enrolled nursing students.',
      data: {
        fileType: 'PDF',
        fileSize: '1.1 MB',
        downloadUrl: 'assets/documents/syllabus-outline.pdf',
        category: 'Academic'
      },
      order: 3,
      isActive: true
    }
  ]
};

module.exports = {
  FALLBACK_CONTENT
};

