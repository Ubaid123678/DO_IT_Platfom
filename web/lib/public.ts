export const publicStats = {
  totalProviders: 12450,
  jobsCompleted: 89200,
  countriesActive: 47,
  averageRating: 4.8,
};

export const valueProps = [
  {
    icon: 'ShieldCheck',
    title: 'Verified Providers',
    description: 'Every provider passes KYC identity verification and skill assessments before joining.',
  },
  {
    icon: 'Wallet',
    title: 'Escrow Protection',
    description: 'Funds are held safely in escrow until you confirm the work is complete.',
  },
  {
    icon: 'Star',
    title: 'Rated & Reviewed',
    description: 'Real reviews from real clients — no fake ratings, no hidden feedback.',
  },
];

export const featuredCategories = [
  { slug: 'plumbing', name: 'Plumbing', icon: 'Wrench', providerCount: 1240 },
  { slug: 'electrical-work', name: 'Electrical Work', icon: 'Zap', providerCount: 980 },
  { slug: 'carpentry-furniture', name: 'Carpentry & Furniture', icon: 'Hammer', providerCount: 870 },
  { slug: 'web-development', name: 'Web Development', icon: 'Code', providerCount: 2100 },
  { slug: 'graphic-design', name: 'Graphic Design', icon: 'Palette', providerCount: 1650 },
  { slug: 'home-cleaning', name: 'Home Cleaning', icon: 'Sparkles', providerCount: 1100 },
  { slug: 'photography', name: 'Photography', icon: 'Camera', providerCount: 780 },
];

export const allCategories = [
  // Physical
  { slug: 'plumbing', name: 'Plumbing', icon: 'Wrench', subcategoryCount: 5, type: 'physical' },
  { slug: 'electrical-work', name: 'Electrical Work', icon: 'Zap', subcategoryCount: 5, type: 'physical' },
  { slug: 'ac-hvac-services', name: 'AC & HVAC Services', icon: 'Fan', subcategoryCount: 5, type: 'physical' },
  { slug: 'home-cleaning', name: 'Home Cleaning', icon: 'Sparkles', subcategoryCount: 5, type: 'physical' },
  { slug: 'painting-decorating', name: 'Painting & Decorating', icon: 'Brush', subcategoryCount: 5, type: 'physical' },
  { slug: 'carpentry-furniture', name: 'Carpentry & Furniture', icon: 'Hammer', subcategoryCount: 5, type: 'physical' },
  { slug: 'gardening-landscaping', name: 'Gardening & Landscaping', icon: 'Leaf', subcategoryCount: 5, type: 'physical' },
  { slug: 'pest-control', name: 'Pest Control', icon: 'Bug', subcategoryCount: 5, type: 'physical' },
  { slug: 'home-repair-maintenance', name: 'Home Repair & Maintenance', icon: 'Tool', subcategoryCount: 5, type: 'physical' },
  { slug: 'moving-packing', name: 'Moving & Packing', icon: 'Truck', subcategoryCount: 5, type: 'physical' },
  { slug: 'flooring-tiling', name: 'Flooring & Tiling', icon: 'Grid', subcategoryCount: 5, type: 'physical' },
  { slug: 'vehicle-services', name: 'Vehicle Services', icon: 'Truck', subcategoryCount: 5, type: 'physical' },
  { slug: 'roofing-gutters', name: 'Roofing & Gutters', icon: 'Home', subcategoryCount: 4, type: 'physical' },
  { slug: 'locksmith-services', name: 'Locksmith Services', icon: 'Lock', subcategoryCount: 5, type: 'physical' },
  { slug: 'appliance-repair', name: 'Appliance Repair', icon: 'Cpu', subcategoryCount: 5, type: 'physical' },
  { slug: 'concrete-masonry', name: 'Concrete & Masonry', icon: 'Home', subcategoryCount: 5, type: 'physical' },
  { slug: 'pool-maintenance', name: 'Pool Maintenance', icon: 'Droplets', subcategoryCount: 5, type: 'physical' },
  { slug: 'waterproofing', name: 'Waterproofing', icon: 'Droplets', subcategoryCount: 5, type: 'physical' },
  { slug: 'glass-mirror-work', name: 'Glass & Mirror Work', icon: 'Square', subcategoryCount: 5, type: 'physical' },
  { slug: 'welding-metal-fabrication', name: 'Welding & Metal Fabrication', icon: 'Wrench', subcategoryCount: 4, type: 'physical' },

  // Digital
  { slug: 'web-development', name: 'Web Development', icon: 'Code', subcategoryCount: 5, type: 'digital' },
  { slug: 'mobile-app-development', name: 'Mobile App Development', icon: 'Smartphone', subcategoryCount: 4, type: 'digital' },
  { slug: 'graphic-design', name: 'Graphic Design', icon: 'Palette', subcategoryCount: 5, type: 'digital' },
  { slug: 'digital-marketing', name: 'Digital Marketing', icon: 'Megaphone', subcategoryCount: 5, type: 'digital' },
  { slug: 'writing-translation', name: 'Writing & Translation', icon: 'FileText', subcategoryCount: 5, type: 'digital' },
  { slug: 'data-entry-virtual-assistance', name: 'Data Entry & Virtual Assistance', icon: 'UserCog', subcategoryCount: 5, type: 'digital' },
  { slug: 'social-media-management', name: 'Social Media Management', icon: 'Globe', subcategoryCount: 5, type: 'digital' },
  { slug: 'video-editing-animation', name: 'Video Editing & Animation', icon: 'Video', subcategoryCount: 5, type: 'digital' },
  { slug: 'photography', name: 'Photography', icon: 'Camera', subcategoryCount: 5, type: 'digital' },
  { slug: 'ui-ux-design', name: 'UI/UX Design', icon: 'Layout', subcategoryCount: 4, type: 'digital' },
  { slug: 'cloud-devops', name: 'Cloud & DevOps', icon: 'Globe', subcategoryCount: 5, type: 'digital' },
  { slug: 'cybersecurity', name: 'Cybersecurity', icon: 'ShieldCheck', subcategoryCount: 4, type: 'digital' },
  { slug: 'database-administration', name: 'Database Administration', icon: 'Cpu', subcategoryCount: 4, type: 'digital' },
  { slug: 'data-science-machine-learning', name: 'Data Science & Machine Learning', icon: 'BarChart', subcategoryCount: 5, type: 'digital' },
  { slug: 'game-development', name: 'Game Development', icon: 'Grid', subcategoryCount: 4, type: 'digital' },
  { slug: 'technical-support-it', name: 'Technical Support & IT', icon: 'Tool', subcategoryCount: 5, type: 'digital' },
  { slug: 'voice-over-audio-production', name: 'Voice Over & Audio Production', icon: 'Mic', subcategoryCount: 5, type: 'digital' },
  { slug: 'crm-marketing-automation', name: 'CRM & Marketing Automation', icon: 'BarChart', subcategoryCount: 4, type: 'digital' },
  { slug: 'e-commerce-management', name: 'E-Commerce Management', icon: 'ShoppingBag', subcategoryCount: 5, type: 'digital' },
  { slug: 'ar-vr-3d-modeling', name: 'AR/VR & 3D Modeling', icon: 'Box', subcategoryCount: 5, type: 'digital' },

  // Errand
  { slug: 'parcel-document-delivery', name: 'Parcel & Document Delivery', icon: 'Truck', subcategoryCount: 5, type: 'errand' },
  { slug: 'personal-errands', name: 'Personal Errands', icon: 'Clipboard', subcategoryCount: 5, type: 'errand' },
  { slug: 'grocery-shopping-delivery', name: 'Grocery & Shopping Delivery', icon: 'ShoppingBag', subcategoryCount: 4, type: 'errand' },
  { slug: 'move-carry-light', name: 'Move & Carry (Light)', icon: 'Truck', subcategoryCount: 4, type: 'errand' },
];

export const howItWorksSteps = {
  client: [
    { number: 1, title: 'Post a Job', description: 'Describe what you need — category, budget, timeline, and location.' },
    { number: 2, title: 'Get Matched', description: 'Verified providers nearby or with matching skills get notified instantly.' },
    { number: 3, title: 'Choose & Hire', description: 'Review proposals, check ratings, and accept the best fit.' },
    { number: 4, title: 'Done & Reviewed', description: 'Confirm completion, release payment, and leave a review.' },
  ],
  provider: [
    { number: 1, title: 'Sign Up & Verify', description: 'Complete identity verification and choose up to 3 skill categories.' },
    { number: 2, title: 'Build Your Profile', description: 'Add portfolio, experience, availability, and verified skill badges.' },
    { number: 3, title: 'Submit Proposals', description: 'Bid on matched jobs — up to 10 active proposals at a time.' },
    { number: 4, title: 'Get Paid', description: 'Complete the work, get confirmed, and receive payout in your local currency.' },
  ],
};

export const testimonials = [
  {
    quote: 'Found a brilliant electrician in under an hour. The verification badges gave me total confidence.',
    author: 'Amina',
    role: 'Client',
    rating: 5,
  },
  {
    quote: 'The escrow system means I never chase payments. Work gets done, I get paid — simple.',
    author: 'Carlos',
    role: 'Provider',
    rating: 5,
  },
  {
    quote: 'Finally a platform where reviews are real. Helped me choose the right plumber for a tricky job.',
    author: 'Priya',
    role: 'Client',
    rating: 5,
  },
  {
    quote: 'Skill verification was straightforward. Now clients find me for exactly what I\'m certified in.',
    author: 'James',
    role: 'Provider',
    rating: 4,
  },
  {
    quote: 'Used it for a last-minute cleaning job. Provider arrived on time, did amazing work.',
    author: 'Fatima',
    role: 'Client',
    rating: 5,
  },
];

export const icons = {
  ShieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  Wallet: 'M21 12V7H5a2 2 0 0 1 0-4h14a2 2 0 0 1 2 2v5M3 3v18a2 2 0 0 0 2 2h14',
  Star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  Wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  Zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  Hammer: 'M15 12H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2zm-6-4h4v4H9V8zm8 6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5z',
  Code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  Palette: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z',
  Sparkles: 'M12 3v2m0 14v2m9-9h-2M5 12H3m16.5-7.5l-1.5 1.5M8 17.5l-1.5 1.5m12.7-12.7l-1.5-1.5M8 6.5l-1.5-1.5',
  GraduationCap: 'M21 21V12a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9M21 12a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2',
  Camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',
  CheckCircle2: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  ArrowRight: 'M5 12h14M12 5l7 7-7 7',
  Download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M17 10v10',
  Globe: 'M21 12a9 9 0 0 1-9 9M9 21a9 9 0 0 1-9-9M12 3a9 9 0 0 1 9 9M12 3v9',
  Fan: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M6 8a6 6 0 1 1 12 0M18 8a6 6 0 0 1-6 6',
  Brush: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 3.5L19 12l-4 4-2.5 2.5L22 18l-1-1L13 14z',
  Grid: 'M3 9h18M3 15h18M9 3v18M15 3v18',
  Home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  Leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 17 3.8a1 1 0 0 1 2 0c0 1.2-2.8 3.5-5 2-2.2-1.5-4.5-2-6.8-2A7 7 0 1 0 11 20zM12 22c4.5 0 6-1 6-4.5C18 16.5 15.5 16 12 16c-3.5 0-6 0.5-6 1.5C6 21 7.5 22 12 22z',
  Truck: 'M5 18h14M5 10H2v8h2.5M17 10h2.5v8M10 18v-6h4v6M7 18v-4h2v4M15 18v-8h2v8',
  Bug: 'M12 3a4 4 0 0 0-4 4v2a1 1 0 0 1-2 0V5a6 6 0 0 1 12 0v2a1 1 0 0 1-2 0V7a4 4 0 0 0-4-4zM8 15h8M6 13v4M16 13v4',
  Cpu: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6v6H9V9zM12 12h.01M9 15h.01M15 9h.01M15 15h.01',
  Lock: 'M12 17a2 2 0 0 1-2-2V10a2 2 0 0 1 4 0v5a2 2 0 0 1-2 2zM18 8h-3V5a3 3 0 0 0-6 0v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z',
  Tool: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76zM12 12h.01',
  Smartphone: 'M5 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5zM12 18a2 2 0 0 1-2-2V6a2 2 0 0 1 4 0v10a2 2 0 0 1-2 2z',
  Layout: 'M3 3h18v18H3V3zm8 0v18M16 3v18',
  FileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  Megaphone: 'M3 11l18-5v12L3 14v-3zM11.5 17.5A2.5 2.5 0 0 1 9 15c0-.9.4-1.7 1-2.2V7.5A2.5 2.5 0 0 1 11.5 5c.9 0 1.7.4 2.2 1v5.5c.6.5 1 1.3 1 2.2 0 1.4-1.1 2.5-2.5 2.5z',
  Search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  BarChart: 'M3 3v18h18M7 16h4M12 12h4M17 8h4',
  Languages: 'M5 8h14M5 12h14M5 16h14M4 4h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z',
  UserCog: 'M12 15a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3zM12 3a6 6 0 0 0-6 6v2a2 2 0 0 0 4 0v-2a4 4 0 0 1 8 0v2a2 2 0 0 0 4 0V9a6 6 0 0 0-6-6zM16 19h6v-2a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2z',
  Droplets: 'M12 2.7S5 10.2 5 14a7 7 0 0 0 14 0c0-3.8-7-11.3-7-11.3z',
  Square: 'M4 4h16v16H4z',
  ShoppingBag: 'M6 8h12l1 13H5L6 8zM9 8a3 3 0 0 1 6 0',
  Clipboard: 'M8 4h8v3H8zM6 5H4v16h16V5h-2M8 12h8M8 16h5',
  Box: 'M4 7l8-4 8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10',
  Video: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zM8 10l4 4-4 4V10z',
  Mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M9 19v2',
};