const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brainDir = process.env.BRAIN_DIR || path.join(__dirname, '../public/images/source');
const outDir = path.join(__dirname, '../public/images/generated');
const imagesDir = path.join(__dirname, '../public/images');

async function processAllImages() {
  console.log('Starting image pipeline processing...');

  const heroSource = path.join(brainDir, 'campus_hero_kavya_shree_1793951153938.jpg');
  const labSource = path.join(brainDir, 'nursing_foundation_lab_1793951237426.jpg');
  const classroomSource = path.join(brainDir, 'kavya_shree_lecture_theater_1793951259673.jpg');

  // 1. Campus Hero (1600w & 800w webp + png)
  console.log('Processing Campus Hero...');
  await sharp(heroSource)
    .resize(1600, null, { withoutEnlargement: false })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outDir, 'campus-hero-1600w.webp'));

  await sharp(heroSource)
    .resize(800, null, { withoutEnlargement: false })
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outDir, 'campus-hero-800w.webp'));

  await sharp(heroSource)
    .resize(1200, 675, { fit: 'cover' })
    .png({ quality: 90 })
    .toFile(path.join(imagesDir, 'kavya-shree-campus-hero.png'));

  // 2. Skills & Simulation Lab (1600w & 800w webp)
  console.log('Processing Skills Lab...');
  await sharp(labSource)
    .resize(1600, null, { withoutEnlargement: false })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outDir, 'skills-lab-1600w.webp'));

  await sharp(labSource)
    .resize(800, null, { withoutEnlargement: false })
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outDir, 'skills-lab-800w.webp'));

  // 3. Smart Classrooms & Lecture Hall (1600w & 800w webp)
  console.log('Processing Lecture Hall...');
  await sharp(classroomSource)
    .resize(1600, null, { withoutEnlargement: false })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(outDir, 'classroom-1600w.webp'));

  await sharp(classroomSource)
    .resize(800, null, { withoutEnlargement: false })
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outDir, 'classroom-800w.webp'));

  // 4. Dedicated Faculty Portraits (400x400 webp)
  console.log('Processing Faculty Portraits...');
  // Fac 1: Clinical Coordinator (male in white coat & stethoscope, campus hero background)
  await sharp(heroSource)
    .extract({ left: 560, top: 290, width: 220, height: 260 })
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(path.join(outDir, 'faculty-1.webp'));

  // Fac 2: Community Health Nursing Professor (female professor at smart board in lecture hall)
  await sharp(classroomSource)
    .extract({ left: 1010, top: 240, width: 180, height: 220 })
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(path.join(outDir, 'faculty-2.webp'));

  // Fac 3: Senior Tutor & Midwifery Specialist (female senior tutor at simulation bed)
  await sharp(labSource)
    .extract({ left: 630, top: 190, width: 240, height: 280 })
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(path.join(outDir, 'faculty-3.webp'));

  // Fac 4: Clinical Instructor & Pediatric Coordinator (young male instructor in lab coat)
  await sharp(labSource)
    .extract({ left: 1080, top: 160, width: 180, height: 220 })
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(path.join(outDir, 'faculty-4.webp'));

  // Clean up temporary test files
  ['test-fac-1.webp', 'test-fac-2.webp', 'test-fac-3.webp', 'test-fac-4.webp', 
   'test-head-1.webp', 'test-head-2.webp', 'test-head-3.webp', 'test-head-4.webp',
   'test-head-1b.webp', 'test-head-2b.webp', 'test-head-3b.webp',
   'test-fac-1c.webp', 'test-fac-2c.webp', 'test-fac-3c.webp', 'test-fac-4c.webp',
   'test-fac-3d.webp'].forEach(f => {
    const p = path.join(outDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  console.log('All images processed and deployed into public/images/ successfully!');
}

processAllImages().catch(err => {
  console.error('Error processing images:', err);
  process.exit(1);
});

