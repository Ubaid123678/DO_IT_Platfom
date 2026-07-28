import { connectDatabase } from '../../config/database.js';
import { SkillCategoryModel, SkillItemModel } from './verification.model.js';

const categories = [
  {
    name: 'Plumbing',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    icon_url: null,
    skills: [
      { name: 'Pipe Installation & Repair', requires_certificate: true, supports_auto_test: false },
      { name: 'Drainage & Sewer Systems', requires_certificate: true, supports_auto_test: false },
      { name: 'Water Heater Maintenance', requires_certificate: true, supports_auto_test: false },
      { name: 'Fixture Installation', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Electrical Work',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    icon_url: null,
    skills: [
      { name: 'Wiring & Rewiring', requires_certificate: true, supports_auto_test: false },
      { name: 'Circuit Breaker Installation', requires_certificate: true, supports_auto_test: false },
      { name: 'Lighting Installation', requires_certificate: false, supports_auto_test: false },
      { name: 'Safety Inspection', requires_certificate: true, supports_auto_test: false },
    ],
  },
  {
    name: 'Home Cleaning',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    icon_url: null,
    skills: [
      { name: 'General House Cleaning', requires_certificate: false, supports_auto_test: false },
      { name: 'Deep Cleaning', requires_certificate: false, supports_auto_test: false },
      { name: 'Move-In / Move-Out Cleaning', requires_certificate: false, supports_auto_test: false },
      { name: 'Carpet & Upholstery Cleaning', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Home Repair & Maintenance',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    icon_url: null,
    skills: [
      { name: 'Carpentry & Woodwork', requires_certificate: false, supports_auto_test: false },
      { name: 'Drywall Repair', requires_certificate: false, supports_auto_test: false },
      { name: 'Painting & Wallpapering', requires_certificate: false, supports_auto_test: false },
      { name: 'Furniture Assembly', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Moving & Packing',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    icon_url: null,
    skills: [
      { name: 'Local Moving', requires_certificate: false, supports_auto_test: false },
      { name: 'Packing & Unpacking', requires_certificate: false, supports_auto_test: false },
      { name: 'Furniture Disassembly & Assembly', requires_certificate: false, supports_auto_test: false },
      { name: 'Loading & Unloading', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Web Development',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    icon_url: null,
    skills: [
      { name: 'Frontend Development (React/Next.js)', requires_certificate: false, supports_auto_test: true },
      { name: 'Backend Development (Node.js/Python)', requires_certificate: false, supports_auto_test: true },
      { name: 'Full Stack Development', requires_certificate: false, supports_auto_test: true },
      { name: 'WordPress & CMS', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Mobile App Development',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    icon_url: null,
    skills: [
      { name: 'iOS Development (Swift)', requires_certificate: false, supports_auto_test: true },
      { name: 'Android Development (Kotlin)', requires_certificate: false, supports_auto_test: true },
      { name: 'Cross-Platform (React Native/Flutter)', requires_certificate: false, supports_auto_test: true },
      { name: 'App UI/UX Design', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Graphic Design',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    icon_url: null,
    skills: [
      { name: 'Logo & Brand Identity', requires_certificate: false, supports_auto_test: false },
      { name: 'Social Media Graphics', requires_certificate: false, supports_auto_test: false },
      { name: 'Print Design (Flyers, Brochures)', requires_certificate: false, supports_auto_test: false },
      { name: 'Photo Editing & Retouching', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Writing & Translation',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    icon_url: null,
    skills: [
      { name: 'Content Writing & Blogging', requires_certificate: false, supports_auto_test: false },
      { name: 'Copywriting', requires_certificate: false, supports_auto_test: false },
      { name: 'Translation (multi-language)', requires_certificate: false, supports_auto_test: false },
      { name: 'Technical Writing', requires_certificate: false, supports_auto_test: false },
    ],
  },
  {
    name: 'Data Entry & Virtual Assistance',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    icon_url: null,
    skills: [
      { name: 'Data Entry', requires_certificate: false, supports_auto_test: false },
      { name: 'Virtual Administrative Support', requires_certificate: false, supports_auto_test: false },
      { name: 'Email & Calendar Management', requires_certificate: false, supports_auto_test: false },
      { name: 'CRM Data Management', requires_certificate: false, supports_auto_test: false },
    ],
  },
];

async function seed() {
  try {
    await connectDatabase();

    const existing = await SkillCategoryModel.countDocuments();
    if (existing > 0) {
      console.log(`Database already has ${existing} categories. Skipping seed.`);
      process.exit(0);
    }

    for (const cat of categories) {
      const category = await SkillCategoryModel.create({
        name: cat.name,
        job_type: cat.job_type,
        risk_tier: cat.risk_tier,
        sla_hours: cat.sla_hours,
        icon_url: cat.icon_url,
        active: true,
      });

      const skillDocs = cat.skills.map((skill) => ({
        category_id: category._id,
        name: skill.name,
        requires_certificate: skill.requires_certificate,
        supports_auto_test: skill.supports_auto_test,
        active: true,
      }));

      await SkillItemModel.insertMany(skillDocs);
      console.log(`Seeded category: ${cat.name} (${cat.skills.length} skills)`);
    }

    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
