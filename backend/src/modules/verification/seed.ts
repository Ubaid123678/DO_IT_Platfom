import { connectDatabase } from '../../config/database.js';
import { SkillCategoryModel, SkillItemModel } from './verification.model.js';

const categories = [
  // ───────── PHYSICAL (20 categories) ─────────
  {
    name: 'Plumbing',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Pipe Installation & Repair', requires_certificate: true },
      { name: 'Drainage & Sewer Systems', requires_certificate: true },
      { name: 'Water Heater Maintenance', requires_certificate: true },
      { name: 'Fixture Installation (Faucets, Sinks, Toilets)', requires_certificate: false },
      { name: 'Leak Detection & Repair', requires_certificate: true },
    ],
  },
  {
    name: 'Electrical Work',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Wiring & Rewiring', requires_certificate: true },
      { name: 'Circuit Breaker & Panel Installation', requires_certificate: true },
      { name: 'Lighting Installation & Repair', requires_certificate: false },
      { name: 'Electrical Safety Inspection', requires_certificate: true },
      { name: 'Smart Home Wiring', requires_certificate: false },
    ],
  },
  {
    name: 'AC & HVAC Services',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'AC Installation & Repair', requires_certificate: true },
      { name: 'AC Maintenance & Servicing', requires_certificate: false },
      { name: 'Duct Cleaning & Repair', requires_certificate: false },
      { name: 'Heating System Repair', requires_certificate: true },
      { name: 'Thermostat Installation', requires_certificate: false },
    ],
  },
  {
    name: 'Home Cleaning',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'General House Cleaning', requires_certificate: false },
      { name: 'Deep Cleaning', requires_certificate: false },
      { name: 'Move-In / Move-Out Cleaning', requires_certificate: false },
      { name: 'Carpet & Upholstery Cleaning', requires_certificate: false },
      { name: 'Window & Glass Cleaning', requires_certificate: false },
    ],
  },
  {
    name: 'Painting & Decorating',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Interior Wall Painting', requires_certificate: false },
      { name: 'Exterior Painting', requires_certificate: false },
      { name: 'Wallpaper Installation & Removal', requires_certificate: false },
      { name: 'Texture & Finish Coating', requires_certificate: false },
      { name: 'Furniture Refinishing', requires_certificate: false },
    ],
  },
  {
    name: 'Carpentry & Furniture',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Custom Furniture Making', requires_certificate: false },
      { name: 'Cabinet Installation & Repair', requires_certificate: false },
      { name: 'Door & Window Repair', requires_certificate: false },
      { name: 'Wood Polishing & Finishing', requires_certificate: false },
      { name: 'Deck & Pergola Construction', requires_certificate: false },
    ],
  },
  {
    name: 'Gardening & Landscaping',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Lawn Mowing & Trimming', requires_certificate: false },
      { name: 'Tree Trimming & Removal', requires_certificate: false },
      { name: 'Garden Design & Planting', requires_certificate: false },
      { name: 'Irrigation System Installation', requires_certificate: false },
      { name: 'Weed Control & Fertilization', requires_certificate: false },
    ],
  },
  {
    name: 'Pest Control',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 24,
    skills: [
      { name: 'Insect Control (Cockroaches, Ants, Spiders)', requires_certificate: false },
      { name: 'Rodent Control', requires_certificate: false },
      { name: 'Termite Treatment & Prevention', requires_certificate: true },
      { name: 'Mosquito Control', requires_certificate: false },
      { name: 'Fumigation Services', requires_certificate: true },
    ],
  },
  {
    name: 'Home Repair & Maintenance',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Drywall Repair & Installation', requires_certificate: false },
      { name: 'Tile & Grout Repair', requires_certificate: false },
      { name: 'Caulking & Weatherproofing', requires_certificate: false },
      { name: 'Door & Hinge Repair', requires_certificate: false },
      { name: 'General Handyman Services', requires_certificate: false },
    ],
  },
  {
    name: 'Moving & Packing',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Local Residential Moving', requires_certificate: false },
      { name: 'Packing & Unpacking', requires_certificate: false },
      { name: 'Furniture Disassembly & Assembly', requires_certificate: false },
      { name: 'Loading & Unloading', requires_certificate: false },
      { name: 'Piano & Heavy Item Moving', requires_certificate: false },
    ],
  },
  {
    name: 'Flooring & Tiling',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Tile Installation (Ceramic/Porcelain)', requires_certificate: false },
      { name: 'Hardwood Flooring Installation', requires_certificate: false },
      { name: 'Laminate & Vinyl Flooring', requires_certificate: false },
      { name: 'Carpet Installation', requires_certificate: false },
      { name: 'Grout Cleaning & Sealing', requires_certificate: false },
    ],
  },
  {
    name: 'Vehicle Services',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Car Wash & Detailing', requires_certificate: false },
      { name: 'Oil Change & Fluid Check', requires_certificate: false },
      { name: 'Tire Rotation & Replacement', requires_certificate: false },
      { name: 'Brake Pad Replacement', requires_certificate: true },
      { name: 'Battery Replacement & Testing', requires_certificate: false },
    ],
  },
  {
    name: 'Roofing & Gutters',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Roof Repair & Leak Fix', requires_certificate: true },
      { name: 'Gutter Cleaning & Repair', requires_certificate: false },
      { name: 'Roof Replacement (Shingles/Metal)', requires_certificate: true },
      { name: 'Skylight Installation', requires_certificate: true },
    ],
  },
  {
    name: 'Locksmith Services',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 24,
    skills: [
      { name: 'Lock Installation & Repair', requires_certificate: false },
      { name: 'Key Duplication & Programming', requires_certificate: false },
      { name: 'Emergency Lockout Service', requires_certificate: false },
      { name: 'Smart Lock Installation', requires_certificate: false },
      { name: 'Safe Opening & Repair', requires_certificate: true },
    ],
  },
  {
    name: 'Appliance Repair',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Refrigerator & Freezer Repair', requires_certificate: false },
      { name: 'Washing Machine & Dryer Repair', requires_certificate: false },
      { name: 'Oven & Stove Repair', requires_certificate: false },
      { name: 'Dishwasher Repair', requires_certificate: false },
      { name: 'Microwave & Small Appliance Repair', requires_certificate: false },
    ],
  },
  {
    name: 'Concrete & Masonry',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Driveway & Walkway Paving', requires_certificate: false },
      { name: 'Brick & Block Laying', requires_certificate: true },
      { name: 'Retaining Wall Construction', requires_certificate: false },
      { name: 'Concrete Slab & Foundation', requires_certificate: true },
      { name: 'Stucco & Plaster Work', requires_certificate: false },
    ],
  },
  {
    name: 'Pool Maintenance',
    job_type: 'physical' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Pool Cleaning & Skimming', requires_certificate: false },
      { name: 'Chemical Balancing & Treatment', requires_certificate: false },
      { name: 'Pump & Filter Repair', requires_certificate: false },
      { name: 'Pool Tile & Surface Cleaning', requires_certificate: false },
      { name: 'Pool Cover Installation', requires_certificate: false },
    ],
  },
  {
    name: 'Waterproofing',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Roof Waterproofing', requires_certificate: false },
      { name: 'Basement Waterproofing', requires_certificate: true },
      { name: 'Bathroom & Kitchen Waterproofing', requires_certificate: false },
      { name: 'Terrace & Balcony Coating', requires_certificate: false },
      { name: 'Crack Injection & Sealant', requires_certificate: false },
    ],
  },
  {
    name: 'Glass & Mirror Work',
    job_type: 'physical' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Window Glass Replacement', requires_certificate: false },
      { name: 'Mirror Installation & Cutting', requires_certificate: false },
      { name: 'Shower Screen Installation', requires_certificate: false },
      { name: 'Glass Table Top & Shelving', requires_certificate: false },
      { name: 'Storefront Glass Repair', requires_certificate: false },
    ],
  },
  {
    name: 'Welding & Metal Fabrication',
    job_type: 'physical' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Arc & MIG Welding', requires_certificate: true },
      { name: 'Gate & Railing Fabrication', requires_certificate: false },
      { name: 'Metal Structure Repair', requires_certificate: true },
      { name: 'Custom Metal Furniture', requires_certificate: false },
    ],
  },

  // ───────── DIGITAL (20 categories) ─────────
  {
    name: 'Web Development',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Frontend Development (React/Next.js)', requires_certificate: false, supports_auto_test: true },
      { name: 'Backend Development (Node.js/Python)', requires_certificate: false, supports_auto_test: true },
      { name: 'Full Stack Development', requires_certificate: false, supports_auto_test: true },
      { name: 'WordPress & CMS Development', requires_certificate: false },
      { name: 'E-commerce Development (Shopify/WooCommerce)', requires_certificate: false },
    ],
  },
  {
    name: 'Mobile App Development',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'iOS Development (Swift)', requires_certificate: false, supports_auto_test: true },
      { name: 'Android Development (Kotlin)', requires_certificate: false, supports_auto_test: true },
      { name: 'Cross-Platform (React Native/Flutter)', requires_certificate: false, supports_auto_test: true },
      { name: 'App UI/UX Design', requires_certificate: false },
    ],
  },
  {
    name: 'Graphic Design',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Logo & Brand Identity Design', requires_certificate: false },
      { name: 'Social Media Graphics', requires_certificate: false },
      { name: 'Print Design (Flyers, Brochures, Business Cards)', requires_certificate: false },
      { name: 'Photo Editing & Retouching', requires_certificate: false },
      { name: 'Packaging & Label Design', requires_certificate: false },
    ],
  },
  {
    name: 'Digital Marketing',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Search Engine Optimization (SEO)', requires_certificate: false },
      { name: 'Social Media Advertising (Facebook/Instagram/TikTok)', requires_certificate: false },
      { name: 'Google Ads & PPC Campaigns', requires_certificate: false },
      { name: 'Email Marketing (Mailchimp/Klaviyo)', requires_certificate: false },
      { name: 'Content Marketing Strategy', requires_certificate: false },
    ],
  },
  {
    name: 'Writing & Translation',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Content Writing & Blogging', requires_certificate: false },
      { name: 'Copywriting', requires_certificate: false },
      { name: 'Translation (Multi-Language)', requires_certificate: false },
      { name: 'Technical Writing', requires_certificate: false },
      { name: 'Proofreading & Editing', requires_certificate: false },
    ],
  },
  {
    name: 'Data Entry & Virtual Assistance',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Data Entry & Database Cleanup', requires_certificate: false },
      { name: 'Virtual Administrative Support', requires_certificate: false },
      { name: 'Email & Calendar Management', requires_certificate: false },
      { name: 'CRM Data Management (HubSpot/Salesforce)', requires_certificate: false },
      { name: 'Research & Lead Generation', requires_certificate: false },
    ],
  },
  {
    name: 'Social Media Management',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Content Creation & Scheduling', requires_certificate: false },
      { name: 'Community Management & Engagement', requires_certificate: false },
      { name: 'Analytics & Performance Reporting', requires_certificate: false },
      { name: 'Influencer Outreach', requires_certificate: false },
      { name: 'Brand Voice & Strategy', requires_certificate: false },
    ],
  },
  {
    name: 'Video Editing & Animation',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 48,
    skills: [
      { name: 'Video Editing (Adobe Premiere/Final Cut)', requires_certificate: false },
      { name: 'Motion Graphics & Titles', requires_certificate: false },
      { name: '2D Animation (After Effects)', requires_certificate: false },
      { name: '3D Animation (Blender/Maya)', requires_certificate: false },
      { name: 'VFX & Compositing', requires_certificate: false },
    ],
  },
  {
    name: 'Photography',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Portrait Photography', requires_certificate: false },
      { name: 'Event Photography (Weddings, Parties)', requires_certificate: false },
      { name: 'Product Photography', requires_certificate: false },
      { name: 'Real Estate Photography', requires_certificate: false },
      { name: 'Photo Retouching & Restoration', requires_certificate: false },
    ],
  },
  {
    name: 'UI/UX Design',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Wireframing & Prototyping (Figma/Sketch)', requires_certificate: false },
      { name: 'User Research & Testing', requires_certificate: false },
      { name: 'Interaction Design', requires_certificate: false },
      { name: 'Design System Creation', requires_certificate: false },
    ],
  },
  {
    name: 'Cloud & DevOps',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'AWS / GCP / Azure Setup & Management', requires_certificate: true },
      { name: 'CI/CD Pipeline Setup', requires_certificate: false },
      { name: 'Docker & Kubernetes', requires_certificate: false },
      { name: 'Infrastructure as Code (Terraform)', requires_certificate: false },
      { name: 'Monitoring & Logging (Datadog/Grafana)', requires_certificate: false },
    ],
  },
  {
    name: 'Cybersecurity',
    job_type: 'digital' as const,
    risk_tier: 'high' as const,
    sla_hours: 72,
    skills: [
      { name: 'Penetration Testing', requires_certificate: true },
      { name: 'Vulnerability Assessment', requires_certificate: true },
      { name: 'Security Audit & Compliance', requires_certificate: true },
      { name: 'Firewall & Network Security Setup', requires_certificate: true },
    ],
  },
  {
    name: 'Database Administration',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'SQL Query Optimization', requires_certificate: false },
      { name: 'Database Migration & Backup', requires_certificate: false },
      { name: 'NoSQL Setup (MongoDB/DynamoDB)', requires_certificate: false },
      { name: 'Database Performance Tuning', requires_certificate: false },
    ],
  },
  {
    name: 'Data Science & Machine Learning',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 72,
    skills: [
      { name: 'Data Analysis & Visualization (Python/R)', requires_certificate: false },
      { name: 'Machine Learning Model Training', requires_certificate: false },
      { name: 'Natural Language Processing (NLP)', requires_certificate: false },
      { name: 'Computer Vision', requires_certificate: false },
      { name: 'AI Chatbot Development', requires_certificate: false },
    ],
  },
  {
    name: 'Game Development',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 72,
    skills: [
      { name: 'Unity Game Development', requires_certificate: false },
      { name: 'Unreal Engine Development', requires_certificate: false },
      { name: '2D Game Art & Pixel Art', requires_certificate: false },
      { name: 'Game Testing & QA', requires_certificate: false },
    ],
  },
  {
    name: 'Technical Support & IT',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'IT Helpdesk & Remote Support', requires_certificate: false },
      { name: 'Network Setup (Router/Switch/Wi-Fi)', requires_certificate: false },
      { name: 'Software Installation & Troubleshooting', requires_certificate: false },
      { name: 'Computer Repair & Upgrades', requires_certificate: false },
      { name: 'Printer & Peripheral Setup', requires_certificate: false },
    ],
  },
  {
    name: 'Voice Over & Audio Production',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'Voice Recording & Narration', requires_certificate: false },
      { name: 'Audio Editing & Mixing', requires_certificate: false },
      { name: 'Podcast Production', requires_certificate: false },
      { name: 'Sound Design & Foley', requires_certificate: false },
      { name: 'Music Production & Beat Making', requires_certificate: false },
    ],
  },
  {
    name: 'CRM & Marketing Automation',
    job_type: 'digital' as const,
    risk_tier: 'low' as const,
    sla_hours: 24,
    skills: [
      { name: 'HubSpot Setup & Management', requires_certificate: false },
      { name: 'Salesforce Administration', requires_certificate: true },
      { name: 'Workflow Automation (Zapier/Make)', requires_certificate: false },
      { name: 'Lead Scoring & Nurture Campaigns', requires_certificate: false },
    ],
  },
  {
    name: 'E-Commerce Management',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 48,
    skills: [
      { name: 'Shopify Store Setup & Customization', requires_certificate: false },
      { name: 'Product Listing & Optimization', requires_certificate: false },
      { name: 'Amazon FBA & Seller Central', requires_certificate: false },
      { name: 'Conversion Rate Optimization (CRO)', requires_certificate: false },
      { name: 'Inventory & Order Management', requires_certificate: false },
    ],
  },
  {
    name: 'AR/VR & 3D Modeling',
    job_type: 'digital' as const,
    risk_tier: 'medium' as const,
    sla_hours: 72,
    skills: [
      { name: '3D Modeling (Blender/3ds Max)', requires_certificate: false },
      { name: 'VR Application Development', requires_certificate: false },
      { name: 'AR Filters & Effects', requires_certificate: false },
      { name: '3D Product Visualization', requires_certificate: false },
      { name: 'Virtual Tour Creation', requires_certificate: false },
    ],
  },
];

async function seed() {
  try {
    await connectDatabase();

    const existing = await SkillCategoryModel.countDocuments();
    if (existing > 0) {
      console.log(`Database already has ${existing} categories. Dropping existing data and re-seeding...`);
      await SkillItemModel.deleteMany({});
      await SkillCategoryModel.deleteMany({});
    }

    for (const cat of categories) {
      const category = await SkillCategoryModel.create({
        name: cat.name,
        job_type: cat.job_type,
        risk_tier: cat.risk_tier,
        sla_hours: cat.sla_hours,
        active: true,
      });

      const skillDocs = cat.skills.map((skill) => ({
        category_id: category._id,
        name: skill.name,
        requires_certificate: skill.requires_certificate,
        active: true,
      }));

      await SkillItemModel.insertMany(skillDocs);
      console.log(`Seeded category: ${cat.name} (${cat.skills.length} skills)`);
    }

    console.log(`\nSeed complete! ${categories.length} categories created.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
