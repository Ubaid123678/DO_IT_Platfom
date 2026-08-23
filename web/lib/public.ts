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
  { slug: 'plumbing', name: 'Plumbing', icon: 'Wrench', subcategoryCount: 12, type: 'physical', description: 'Licensed plumbers for installations, repairs, and emergency services.' },
  { slug: 'electrical-work', name: 'Electrical Work', icon: 'Zap', subcategoryCount: 10, type: 'physical', description: 'Certified electricians for wiring, lighting, and electrical safety.' },
  { slug: 'ac-hvac-services', name: 'AC & HVAC Services', icon: 'Fan', subcategoryCount: 8, type: 'physical', description: 'Heating, cooling, and ventilation experts for year-round comfort.' },
  { slug: 'home-cleaning', name: 'Home Cleaning', icon: 'Sparkles', subcategoryCount: 7, type: 'physical', description: 'Trusted cleaners for recurring, deep, and move-in/out cleaning.' },
  { slug: 'painting-decorating', name: 'Painting & Decorating', icon: 'Brush', subcategoryCount: 9, type: 'physical', description: 'Interior and exterior painting with professional finishes.' },
  { slug: 'carpentry-furniture', name: 'Carpentry & Furniture', icon: 'Hammer', subcategoryCount: 11, type: 'physical', description: 'Custom woodwork, furniture assembly, and repair specialists.' },
  { slug: 'gardening-landscaping', name: 'Gardening & Landscaping', icon: 'Leaf', subcategoryCount: 10, type: 'physical', description: 'Garden design, lawn care, and outdoor transformations.' },
  { slug: 'pest-control', name: 'Pest Control', icon: 'Bug', subcategoryCount: 6, type: 'physical', description: 'Safe, effective pest removal and prevention services.' },
  { slug: 'home-repair-maintenance', name: 'Home Repair & Maintenance', icon: 'Tool', subcategoryCount: 15, type: 'physical', description: 'General handyman services for fixes big and small.' },
  { slug: 'moving-packing', name: 'Moving & Packing', icon: 'Truck', subcategoryCount: 8, type: 'physical', description: 'Local and long-distance moves with packing services.' },
  { slug: 'flooring-tiling', name: 'Flooring & Tiling', icon: 'Grid', subcategoryCount: 9, type: 'physical', description: 'Hardwood, tile, laminate, and vinyl installation experts.' },
  { slug: 'vehicle-services', name: 'Vehicle Services', icon: 'Truck', subcategoryCount: 7, type: 'physical', description: 'Mobile mechanics, detailing, and auto repair at your location.' },
  { slug: 'roofing-gutters', name: 'Roofing & Gutters', icon: 'Home', subcategoryCount: 6, type: 'physical', description: 'Roof repairs, replacements, and gutter cleaning/installation.' },
  { slug: 'locksmith-services', name: 'Locksmith Services', icon: 'Lock', subcategoryCount: 5, type: 'physical', description: 'Lockouts, rekeying, and security system installation.' },
  { slug: 'appliance-repair', name: 'Appliance Repair', icon: 'Cpu', subcategoryCount: 8, type: 'physical', description: 'Fix refrigerators, washers, ovens, and more.' },
  { slug: 'concrete-masonry', name: 'Concrete & Masonry', icon: 'Home', subcategoryCount: 7, type: 'physical', description: 'Driveways, patios, foundations, and stonework.' },
  { slug: 'pool-maintenance', name: 'Pool Maintenance', icon: 'Droplets', subcategoryCount: 6, type: 'physical', description: 'Cleaning, chemical balancing, and equipment repair.' },
  { slug: 'waterproofing', name: 'Waterproofing', icon: 'Droplets', subcategoryCount: 5, type: 'physical', description: 'Basement, foundation, and roof waterproofing solutions.' },
  { slug: 'glass-mirror-work', name: 'Glass & Mirror Work', icon: 'Square', subcategoryCount: 5, type: 'physical', description: 'Window repair, custom mirrors, and shower enclosures.' },
  { slug: 'welding-metal-fabrication', name: 'Welding & Metal Fabrication', icon: 'Wrench', subcategoryCount: 6, type: 'physical', description: 'Custom metalwork, gates, railings, and structural welding.' },

  // Digital
  { slug: 'web-development', name: 'Web Development', icon: 'Code', subcategoryCount: 14, type: 'digital', description: 'Full-stack developers for custom websites and web apps.' },
  { slug: 'mobile-app-development', name: 'Mobile App Development', icon: 'Smartphone', subcategoryCount: 10, type: 'digital', description: 'iOS, Android, and cross-platform app developers.' },
  { slug: 'graphic-design', name: 'Graphic Design', icon: 'Palette', subcategoryCount: 12, type: 'digital', description: 'Branding, logos, print, and digital design experts.' },
  { slug: 'digital-marketing', name: 'Digital Marketing', icon: 'Megaphone', subcategoryCount: 11, type: 'digital', description: 'SEO, PPC, email, and growth marketing specialists.' },
  { slug: 'writing-translation', name: 'Writing & Translation', icon: 'FileText', subcategoryCount: 9, type: 'digital', description: 'Copywriting, content, technical writing, and translation.' },
  { slug: 'data-entry-virtual-assistance', name: 'Data Entry & Virtual Assistance', icon: 'UserCog', subcategoryCount: 8, type: 'digital', description: 'Admin support, data processing, and executive assistance.' },
  { slug: 'social-media-management', name: 'Social Media Management', icon: 'Globe', subcategoryCount: 8, type: 'digital', description: 'Content creation, community management, and ad campaigns.' },
  { slug: 'video-editing-animation', name: 'Video Editing & Animation', icon: 'Video', subcategoryCount: 9, type: 'digital', description: 'Video editing, motion graphics, and animation services.' },
  { slug: 'photography', name: 'Photography', icon: 'Camera', subcategoryCount: 8, type: 'digital', description: 'Event, product, portrait, and commercial photography.' },
  { slug: 'ui-ux-design', name: 'UI/UX Design', icon: 'Layout', subcategoryCount: 7, type: 'digital', description: 'User research, wireframes, prototypes, and design systems.' },
  { slug: 'cloud-devops', name: 'Cloud & DevOps', icon: 'Globe', subcategoryCount: 8, type: 'digital', description: 'AWS, Azure, GCP, CI/CD, and infrastructure automation.' },
  { slug: 'cybersecurity', name: 'Cybersecurity', icon: 'ShieldCheck', subcategoryCount: 6, type: 'digital', description: 'Penetration testing, audits, and security hardening.' },
  { slug: 'database-administration', name: 'Database Administration', icon: 'Cpu', subcategoryCount: 6, type: 'digital', description: 'SQL/NoSQL design, optimization, and maintenance.' },
  { slug: 'data-science-machine-learning', name: 'Data Science & ML', icon: 'BarChart', subcategoryCount: 8, type: 'digital', description: 'ML models, analytics, visualization, and AI solutions.' },
  { slug: 'game-development', name: 'Game Development', icon: 'Grid', subcategoryCount: 7, type: 'digital', description: 'Unity, Unreal, 2D/3D, and multiplayer game dev.' },
  { slug: 'technical-support-it', name: 'Technical Support & IT', icon: 'Tool', subcategoryCount: 9, type: 'digital', description: 'Help desk, sysadmin, network, and IT consulting.' },
  { slug: 'voice-over-audio-production', name: 'Voice Over & Audio', icon: 'Mic', subcategoryCount: 6, type: 'digital', description: 'Voice acting, podcast editing, and sound design.' },
  { slug: 'crm-marketing-automation', name: 'CRM & Marketing Automation', icon: 'BarChart', subcategoryCount: 6, type: 'digital', description: 'Salesforce, HubSpot, automation workflows, and integrations.' },
  { slug: 'e-commerce-management', name: 'E-Commerce Management', icon: 'ShoppingBag', subcategoryCount: 8, type: 'digital', description: 'Shopify, WooCommerce, Amazon, and marketplace management.' },
  { slug: 'ar-vr-3d-modeling', name: 'AR/VR & 3D Modeling', icon: 'Box', subcategoryCount: 7, type: 'digital', description: '3D assets, AR/VR experiences, and product visualization.' },

  // Errand
  { slug: 'parcel-document-delivery', name: 'Parcel & Document Delivery', icon: 'Truck', subcategoryCount: 5, type: 'errand', description: 'Same-day and scheduled delivery for packages and documents.' },
  { slug: 'personal-errands', name: 'Personal Errands', icon: 'Clipboard', subcategoryCount: 7, type: 'errand', description: 'Prescription pickup, dry cleaning, appointments, and more.' },
  { slug: 'grocery-shopping-delivery', name: 'Grocery & Shopping Delivery', icon: 'ShoppingBag', subcategoryCount: 6, type: 'errand', description: 'Grocery runs, meal prep ingredients, and personal shopping.' },
  { slug: 'move-carry-light', name: 'Move & Carry (Light)', icon: 'Truck', subcategoryCount: 5, type: 'errand', description: 'Furniture moving, heavy lifting, and small load transport.' },
];

// Subcategories for each category
export const subcategories: Record<string, string[]> = {
  'plumbing': ['Pipe Repair & Replacement', 'Drain Cleaning', 'Water Heater Install/Repair', 'Fixture Installation', 'Leak Detection', 'Sewer Line Services', 'Bathroom Remodeling', 'Kitchen Plumbing', 'Gas Line Services', 'Backflow Testing', 'Emergency Plumbing', 'Water Filtration Systems'],
  'electrical-work': ['Wiring & Rewiring', 'Lighting Installation', 'Panel Upgrades', 'Outlet & Switch Repair', 'Smart Home Wiring', 'EV Charger Installation', 'Ceiling Fan Installation', 'Electrical Safety Inspection', 'Generator Installation', 'Outdoor Lighting'],
  'ac-hvac-services': ['AC Installation & Repair', 'Furnace Repair', 'Duct Cleaning', 'Thermostat Installation', 'Heat Pump Services', 'Indoor Air Quality', 'Preventive Maintenance', 'Emergency HVAC Repair'],
  'home-cleaning': ['Recurring House Cleaning', 'Deep Cleaning', 'Move-In/Out Cleaning', 'Post-Construction Cleaning', 'Window Cleaning', 'Carpet & Upholstery Cleaning', 'Eco-Friendly Cleaning'],
  'painting-decorating': ['Interior Painting', 'Exterior Painting', 'Wallpaper Installation', 'Cabinet Painting', 'Deck & Fence Staining', 'Drywall Repair', 'Texture & Popcorn Removal', 'Color Consultation', 'Commercial Painting'],
  'carpentry-furniture': ['Custom Furniture', 'Furniture Assembly', 'Cabinetry', 'Trim & Molding', 'Deck Building', 'Fence Repair', 'Door Installation', 'Window Repair', 'Shelving & Storage', 'Wood Restoration', 'Furniture Repair'],
  'gardening-landscaping': ['Lawn Care & Mowing', 'Garden Design', 'Tree & Shrub Care', 'Irrigation Systems', 'Hardscaping', 'Mulching & Weed Control', 'Seasonal Cleanup', 'Landscape Lighting', 'Sod Installation', 'Garden Maintenance'],
  'pest-control': ['General Pest Control', 'Termite Treatment', 'Rodent Control', 'Bed Bug Treatment', 'Mosquito & Tick Control', 'Wildlife Removal'],
  'home-repair-maintenance': ['Drywall Repair', 'Door & Window Repair', 'Gutter Cleaning', 'Caulking & Sealing', 'Weather Stripping', 'Fence Repair', 'Deck Repair', 'Siding Repair', 'Concrete Repair', 'Roof Leak Repair', 'Appliance Installation', 'Safety Modifications', 'Seasonal Maintenance', 'Smart Home Device Setup', 'General Handyman Tasks'],
  'moving-packing': ['Local Moving', 'Long-Distance Moving', 'Packing Services', 'Unpacking Services', 'Furniture Disassembly/Assembly', 'Piano Moving', 'Storage Solutions', 'Senior Moving Services'],
  'flooring-tiling': ['Hardwood Installation', 'Tile Installation', 'Laminate Flooring', 'Vinyl & LVP', 'Carpet Installation', 'Floor Refinishing', 'Subfloor Repair', 'Grout Cleaning & Repair', 'Heated Flooring'],
  'vehicle-services': ['Oil Change', 'Brake Service', 'Battery Replacement', 'Tire Services', 'Diagnostic Check', 'Mobile Detailing', 'Pre-Purchase Inspection'],
  'roofing-gutters': ['Roof Repair', 'Roof Replacement', 'Gutter Installation', 'Gutter Cleaning', 'Gutter Guard Installation', 'Roof Inspection'],
  'locksmith-services': ['Emergency Lockout', 'Lock Rekeying', 'Lock Installation', 'Key Duplication', 'Smart Lock Installation'],
  'appliance-repair': ['Refrigerator Repair', 'Washer/Dryer Repair', 'Oven/Stove Repair', 'Dishwasher Repair', 'Microwave Repair', 'HVAC Appliance Repair', 'Garbage Disposal Repair', 'Ice Maker Repair'],
  'concrete-masonry': ['Driveway Installation', 'Patio Installation', 'Foundation Repair', 'Retaining Walls', 'Stamped Concrete', 'Brick & Stone Work', 'Concrete Resurfacing'],
  'pool-maintenance': ['Weekly Pool Service', 'Chemical Balancing', 'Equipment Repair', 'Pool Opening/Closing', 'Leak Detection', 'Pool Renovation'],
  'waterproofing': ['Basement Waterproofing', 'Foundation Sealing', 'Crawl Space Encapsulation', 'Roof Waterproofing', 'French Drain Installation'],
  'glass-mirror-work': ['Window Repair & Replacement', 'Custom Mirrors', 'Shower Enclosures', 'Glass Tabletops', 'Storefront Glass'],
  'welding-metal-fabrication': ['Custom Gates & Fences', 'Railings & Stairs', 'Structural Welding', 'Metal Art & Decor', 'Trailer Repair', 'Equipment Repair'],

  'web-development': ['Frontend Development', 'Backend Development', 'Full-Stack Development', 'E-Commerce Development', 'CMS Development', 'API Development', 'Progressive Web Apps', 'Website Maintenance', 'Performance Optimization', 'Code Review & Audit', 'Migration Services', 'Custom Web Applications', 'Headless CMS', 'Web Accessibility'],
  'mobile-app-development': ['iOS Development', 'Android Development', 'React Native', 'Flutter Development', 'Cross-Platform', 'App UI/UX Design', 'App Testing & QA', 'App Store Deployment', 'App Maintenance', 'Enterprise Apps'],
  'graphic-design': ['Logo & Brand Identity', 'Print Design', 'Marketing Materials', 'Social Media Graphics', 'Packaging Design', 'Illustration', 'Infographic Design', 'Presentation Design', 'Merchandise Design', 'Environmental Graphics', 'Typography', 'Design Systems'],
  'digital-marketing': ['SEO Strategy', 'Google Ads (PPC)', 'Facebook/Instagram Ads', 'Email Marketing', 'Content Marketing', 'Conversion Rate Optimization', 'Marketing Analytics', 'Local SEO', 'Link Building', 'Marketing Automation', 'Growth Strategy'],
  'writing-translation': ['Copywriting', 'Blog & Article Writing', 'Technical Writing', 'Website Content', 'Product Descriptions', 'Editing & Proofreading', 'Translation Services', 'Localization', 'Creative Writing'],
  'data-entry-virtual-assistance': ['Data Entry', 'Web Research', 'Email Management', 'Calendar Management', 'Travel Arrangements', 'Customer Support', 'CRM Data Management', 'Document Formatting'],
  'social-media-management': ['Content Creation', 'Community Management', 'Social Media Strategy', 'Paid Social Ads', 'Influencer Outreach', 'Analytics & Reporting', 'Reputation Management', 'Crisis Management'],
  'video-editing-animation': ['Video Editing', 'Motion Graphics', '2D Animation', '3D Animation', 'Explainer Videos', 'Social Media Videos', 'Corporate Videos', 'Color Grading', 'Sound Design'],
  'photography': ['Event Photography', 'Product Photography', 'Portrait Photography', 'Real Estate Photography', 'Food Photography', 'Headshots', 'Commercial Photography', 'Photo Retouching'],
  'ui-ux-design': ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Design Systems', 'Interaction Design', 'Accessibility Audit'],
  'cloud-devops': ['AWS Architecture', 'Kubernetes & Docker', 'CI/CD Pipelines', 'Infrastructure as Code', 'Cloud Migration', 'Monitoring & Logging', 'Cost Optimization', 'Security & Compliance'],
  'cybersecurity': ['Penetration Testing', 'Vulnerability Assessment', 'Security Audit', 'Compliance (SOC2, ISO)', 'Incident Response', 'Security Training'],
  'database-administration': ['Database Design', 'Performance Tuning', 'Backup & Recovery', 'Migration Services', 'Replication & Clustering', 'NoSQL Optimization'],
  'data-science-machine-learning': ['ML Model Development', 'Data Analysis', 'Predictive Modeling', 'Computer Vision', 'NLP', 'Data Visualization', 'A/B Testing', 'Model Deployment'],
  'game-development': ['Unity Development', 'Unreal Engine', '2D Game Development', '3D Game Development', 'Multiplayer & Networking', 'Game Design', 'AR/VR Games'],
  'technical-support-it': ['Help Desk Support', 'System Administration', 'Network Configuration', 'Cybersecurity Basics', 'Cloud Services Support', 'Backup Solutions', 'Hardware Procurement', 'IT Strategy', 'Remote Monitoring'],
  'voice-over-audio-production': ['Voice Over Recording', 'Podcast Editing', 'Audiobook Narration', 'Sound Design', 'Audio Mixing & Mastering', 'Jingle Production'],
  'crm-marketing-automation': ['Salesforce Configuration', 'HubSpot Setup', 'Marketing Automation', 'Email Campaign Automation', 'Lead Scoring', 'CRM Integration'],
  'e-commerce-management': ['Shopify Development', 'WooCommerce Setup', 'Amazon Seller Central', 'Product Listing Optimization', 'Inventory Management', 'Order Fulfillment', 'Conversion Optimization', 'Multi-Channel Selling'],
  'ar-vr-3d-modeling': ['3D Modeling', 'AR Development', 'VR Development', 'Product Visualization', 'Architectural Visualization', 'Metaverse Development', '3D Animation'],

  'parcel-document-delivery': ['Same-Day Delivery', 'Scheduled Delivery', 'Document Courier', 'Package Tracking', 'Proof of Delivery'],
  'personal-errands': ['Prescription Pickup', 'Dry Cleaning', 'Appointment Waiting', 'Gift Shopping', 'Returns & Exchanges', 'Bill Payment', 'Notary Services'],
  'grocery-shopping-delivery': ['Grocery Shopping', 'Meal Kit Delivery', 'Specialty Store Runs', 'Bulk Shopping', 'Dietary-Specific Shopping', 'Recurring Delivery'],
  'move-carry-light': ['Furniture Moving', 'Appliance Moving', 'Box Moving', 'Heavy Item Lifting', 'Small Load Transport'],
};

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

// Mock provider profiles for public pages
export const mockProviders: Record<string, {
  id: string;
  fullName: string;
  avatarInitials: string;
  headline: string;
  bio: string;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verifiedCategories: { name: string; slug: string; skills: string[] }[];
  portfolio: { image: string; caption: string }[];
  publicProfile: boolean;
  reviews: { author: string; rating: number; text: string; date: string }[];
}> = {
  '1': {
    id: '1',
    fullName: 'Sarah Mitchell',
    avatarInitials: 'SM',
    headline: 'Licensed master plumber with 15+ years experience. Specializing in bathroom remodels and emergency repairs.',
    bio: 'I\'ve been serving the Greater Toronto Area for over 15 years as a licensed master plumber. My focus is on quality workmanship, transparent pricing, and clear communication. Whether it\'s a leaky faucet, a full bathroom renovation, or an emergency pipe burst at 2 AM, I\'m here to help. I take pride in every job I do and treat your home like my own.',
    location: 'Toronto, Canada',
    rating: 4.9,
    reviewCount: 127,
    verified: true,
    verifiedCategories: [
      { name: 'Plumbing', slug: 'plumbing', skills: ['Pipe Repair & Replacement', 'Drain Cleaning', 'Water Heater Install/Repair', 'Bathroom Remodeling'] },
      { name: 'Home Repair & Maintenance', slug: 'home-repair-maintenance', skills: ['General Handyman Tasks', 'Appliance Installation'] },
    ],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', caption: 'Master bathroom remodel with custom tile work' },
      { image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', caption: 'Tankless water heater installation' },
      { image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop', caption: 'Kitchen plumbing renovation' },
      { image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop', caption: 'Emergency pipe repair' },
    ],
    publicProfile: true,
    reviews: [
      { author: 'Jennifer', rating: 5, text: 'Sarah was amazing! Fixed our burst pipe within an hour of calling. Professional, clean, and fair pricing. Highly recommend!', date: '2 weeks ago' },
      { author: 'Michael', rating: 5, text: 'Bathroom remodel turned out beautifully. Sarah communicated every step of the way and finished on time and on budget.', date: '1 month ago' },
      { author: 'Priya', rating: 5, text: 'Best plumber I\'ve ever hired. Honest, skilled, and doesn\'t upsell unnecessary work. My go-to for all plumbing needs.', date: '2 months ago' },
      { author: 'David', rating: 4, text: 'Great work on our water heater replacement. Only reason for 4 stars is scheduling took a day longer than expected.', date: '3 months ago' },
    ],
  },
  '2': {
    id: '2',
    fullName: 'Marcus Chen',
    avatarInitials: 'MC',
    headline: 'Full-stack developer specializing in React, Node.js, and cloud architecture. Building scalable web apps for startups.',
    bio: 'Senior software engineer with 8+ years building production web applications. I help startups and businesses bring their ideas to life with clean, maintainable code. My expertise spans the full stack — from database design and API architecture to polished frontend experiences. I\'m passionate about performance, accessibility, and developer experience.',
    location: 'San Francisco, USA',
    rating: 4.8,
    reviewCount: 89,
    verified: true,
    verifiedCategories: [
      { name: 'Web Development', slug: 'web-development', skills: ['Frontend Development', 'Backend Development', 'Full-Stack Development', 'API Development'] },
      { name: 'Cloud & DevOps', slug: 'cloud-devops', skills: ['AWS Architecture', 'CI/CD Pipelines', 'Infrastructure as Code'] },
    ],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', caption: 'SaaS dashboard with real-time analytics' },
      { image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop', caption: 'E-commerce platform with payment integration' },
      { image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop', caption: 'Real-time collaboration app' },
    ],
    publicProfile: true,
    reviews: [
      { author: 'Alex', rating: 5, text: 'Marcus delivered our MVP in record time. Code quality is exceptional and he\'s a great communicator.', date: '3 weeks ago' },
      { author: 'Sarah', rating: 5, text: 'Best developer I\'ve worked with on this platform. He understood our complex requirements instantly.', date: '2 months ago' },
      { author: 'James', rating: 4, text: 'Solid work on our API redesign. Would have liked more documentation but the code speaks for itself.', date: '4 months ago' },
    ],
  },
  '3': {
    id: '3',
    fullName: 'James Rodriguez',
    avatarInitials: 'JR',
    headline: 'Family-owned electrical business since 1985. Licensed, insured, and committed to safety.',
    bio: 'Rodriguez Electric has been family-owned and operated since 1985. We\'re fully licensed, insured, and committed to the highest safety standards. From panel upgrades and EV charger installations to complete home rewiring, we do it right the first time. No shortcuts, no surprises — just honest electrical work.',
    location: 'Miami, USA',
    rating: 4.9,
    reviewCount: 203,
    verified: true,
    verifiedCategories: [
      { name: 'Electrical Work', slug: 'electrical-work', skills: ['Wiring & Rewiring', 'Panel Upgrades', 'EV Charger Installation', 'Lighting Installation', 'Electrical Safety Inspection'] },
    ],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop', caption: 'Modern panel upgrade with whole-home surge protection' },
      { image: 'https://images.unsplash.com/photo-1558002038-1055e028d3b3?w=400&h=300&fit=crop', caption: 'EV charger installation in garage' },
      { image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop', caption: 'Recessed lighting throughout home' },
    ],
    publicProfile: true,
    reviews: [
      { author: 'Maria', rating: 5, text: 'James and his team rewired our 1950s home. Professional, clean, and up to code. Peace of mind guaranteed.', date: '1 week ago' },
      { author: 'Robert', rating: 5, text: 'EV charger installed perfectly. They handled the permit and inspection. Highly recommend for any electrical work.', date: '3 weeks ago' },
      { author: 'Lisa', rating: 5, text: 'Been using Rodriguez Electric for 10+ years. Consistent quality and fair pricing. Trust them completely.', date: '2 months ago' },
      { author: 'Tom', rating: 5, text: 'Emergency service on a Sunday — they came out within 2 hours. Fixed our panel issue safely and quickly.', date: '3 months ago' },
    ],
  },
  '4': {
    id: '4',
    fullName: 'Aisha Patel',
    avatarInitials: 'AP',
    headline: 'Eco-friendly plumbing solutions. Water filtration, low-flow fixtures, and green building certified.',
    bio: 'Specializing in sustainable plumbing solutions for modern homes. I help homeowners reduce water consumption, improve water quality, and lower utility bills through smart fixture choices and efficient systems. Certified in green building practices and water conservation technologies.',
    location: 'Vancouver, Canada',
    rating: 4.7,
    reviewCount: 156,
    verified: true,
    verifiedCategories: [
      { name: 'Plumbing', slug: 'plumbing', skills: ['Water Filtration Systems', 'Fixture Installation', 'Pipe Repair & Replacement'] },
      { name: 'Appliance Repair', slug: 'appliance-repair', skills: ['HVAC Appliance Repair'] },
    ],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', caption: 'Whole-home water filtration system' },
      { image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', caption: 'Low-flow fixture upgrade' },
    ],
    publicProfile: true,
    reviews: [
      { author: 'Emma', rating: 5, text: 'Aisha transformed our home with a whole-house filtration system. Water tastes amazing and we\'re saving on bottled water.', date: '2 weeks ago' },
      { author: 'Kevin', rating: 4, text: 'Great knowledge of eco-friendly options. Installed low-flow fixtures throughout. Professional and punctual.', date: '1 month ago' },
    ],
  },
  '5': {
    id: '5',
    fullName: 'David Thompson',
    avatarInitials: 'DT',
    headline: '24/7 emergency plumber. Burst pipes, water heater failures, and sewer backups. Licensed & insured.',
    bio: 'When plumbing emergencies strike, you need someone who answers the phone. I provide 24/7 emergency service for burst pipes, water heater failures, sewer backups, and major leaks. Fully licensed, insured, and equipped to handle any crisis. Fast response, fair pricing, and quality repairs that last.',
    location: 'Chicago, USA',
    rating: 4.8,
    reviewCount: 94,
    verified: true,
    verifiedCategories: [
      { name: 'Plumbing', slug: 'plumbing', skills: ['Emergency Plumbing', 'Pipe Repair & Replacement', 'Water Heater Install/Repair', 'Sewer Line Services', 'Drain Cleaning'] },
    ],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop', caption: 'Emergency burst pipe repair' },
      { image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', caption: 'Sewer line replacement' },
    ],
    publicProfile: true,
    reviews: [
      { author: 'Amanda', rating: 5, text: 'Called at 3 AM for a burst pipe. David was there in 45 minutes. Saved our basement from major damage.', date: '1 week ago' },
      { author: 'Chris', rating: 5, text: 'Water heater died on Christmas Eve. David came out same day. Honest pricing, great work.', date: '2 months ago' },
      { author: 'Nicole', rating: 4, text: 'Fast emergency response. Sewer backup fixed properly. Would use again.', date: '3 months ago' },
    ],
  },
  '6': {
    id: '6',
    fullName: 'Lisa Nguyen',
    avatarInitials: 'LN',
    headline: 'Bathroom and kitchen remodel specialist. From concept to completion — design, permits, and installation.',
    bio: 'I specialize in transforming bathrooms and kitchens from outdated to outstanding. With a background in interior design and 12 years in plumbing, I manage the entire process — design consultation, permits, demolition, installation, and final styling. One point of contact, seamless execution.',
    location: 'Seattle, USA',
    rating: 4.9,
    reviewCount: 178,
    verified: true,
    verifiedCategories: [
      { name: 'Plumbing', slug: 'plumbing', skills: ['Bathroom Remodeling', 'Kitchen Plumbing', 'Fixture Installation', 'Pipe Repair & Replacement'] },
      { name: 'Carpentry & Furniture', slug: 'carpentry-furniture', skills: ['Cabinetry', 'Custom Furniture'] },
    ],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop', caption: 'Luxury master bath with freestanding tub' },
      { image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', caption: 'Modern kitchen with farmhouse sink' },
      { image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop', caption: 'Guest bathroom renovation' },
      { image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop', caption: 'Custom vanity build' },
    ],
    publicProfile: true,
    reviews: [
      { author: 'Rachel', rating: 5, text: 'Lisa managed our entire master bath remodel. Design eye plus technical skills — rare combination. Stunning result.', date: '2 weeks ago' },
      { author: 'Mark', rating: 5, text: 'Kitchen renovation completed in 3 weeks. Lisa coordinated everything — we just made decisions. Highly recommend.', date: '1 month ago' },
      { author: 'Sandra', rating: 5, text: 'Best remodeling experience ever. Lisa\'s design sense saved us money and the result is magazine-worthy.', date: '3 months ago' },
    ],
  },
};

// Blog data
export const blogCategories = [
  { slug: 'tips', name: 'Tips & Guides', color: 'teal' },
  { slug: 'updates', name: 'Platform Updates', color: 'primary' },
  { slug: 'spotlights', name: 'Category Spotlights', color: 'amber' },
  { slug: 'safety', name: 'Trust & Safety', color: 'red' },
  { slug: 'stories', name: 'Success Stories', color: 'purple' },
];

export const blogPosts = [
  {
    id: '1',
    slug: 'how-to-hire-a-plumber',
    title: 'How to Hire the Right Plumber: A Complete Checklist',
    excerpt: 'From verifying licenses to reading reviews — everything you need to know before booking a plumbing job.',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=450&fit=crop',
    category: 'tips',
    author: 'Sarah Mitchell',
    authorRole: 'Licensed Master Plumber',
    publishedAt: '2025-01-15',
    readTime: '8 min read',
    featured: true,
  },
  {
    id: '2',
    slug: 'new-escrow-features',
    title: 'Introducing Faster Payouts & Improved Escrow Controls',
    excerpt: 'We\'ve reduced payout times by 40% and added new dispute evidence tools. Here\'s what changed.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    category: 'updates',
    author: 'Do It Product Team',
    authorRole: 'Platform',
    publishedAt: '2025-01-10',
    readTime: '5 min read',
    featured: false,
  },
  {
    id: '3',
    slug: 'electrical-work-safety-guide',
    title: 'Electrical Work Safety: What Every Homeowner Should Know',
    excerpt: 'Spot red flags, understand permits, and know when to call a pro. A category spotlight on electrical safety.',
    coverImage: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=450&fit=crop',
    category: 'spotlights',
    author: 'James Rodriguez',
    authorRole: 'Master Electrician',
    publishedAt: '2025-01-05',
    readTime: '6 min read',
    featured: false,
  },
  {
    id: '4',
    slug: 'escrow-protection-explained',
    title: 'How Escrow Protects Both Clients and Providers',
    excerpt: 'A deep dive into our escrow system — why it exists, how it works, and what happens in a dispute.',
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop',
    category: 'safety',
    author: 'Do It Trust & Safety',
    authorRole: 'Platform',
    publishedAt: '2025-01-02',
    readTime: '7 min read',
    featured: false,
  },
  {
    id: '5',
    slug: 'freelancer-to-agency-journey',
    title: 'From Solo Freelancer to Agency: A Web Dev\'s Journey',
    excerpt: 'How Marcus Chen built a 6-figure agency on Do It. Lessons on scaling, hiring, and client relationships.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    category: 'stories',
    author: 'Marcus Chen',
    authorRole: 'Full-Stack Developer',
    publishedAt: '2024-12-28',
    readTime: '10 min read',
    featured: false,
  },
  {
    id: '6',
    slug: 'bathroom-remodel-budget',
    title: 'Bathroom Remodel Budget Breakdown: Where Your Money Goes',
    excerpt: 'Real numbers from 50+ bathroom projects. Tile, fixtures, labor — plan your renovation with confidence.',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=450&fit=crop',
    category: 'tips',
    author: 'Lisa Nguyen',
    authorRole: 'Bathroom Remodel Specialist',
    publishedAt: '2024-12-20',
    readTime: '9 min read',
    featured: false,
  },
  {
    id: '7',
    slug: 'skill-verification-update',
    title: 'New Skill Verification Options: Auto-Approve for Top Certificates',
    excerpt: 'We\'ve partnered with major certification bodies to auto-verify credentials. Get badged faster.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    category: 'updates',
    author: 'Do It Product Team',
    authorRole: 'Platform',
    publishedAt: '2024-12-15',
    readTime: '4 min read',
    featured: false,
  },
  {
    id: '8',
    slug: 'hvac-maintenance-checklist',
    title: 'Seasonal HVAC Maintenance Checklist for Homeowners',
    excerpt: 'Spring and fall tasks to keep your system efficient. Plus: when to call a pro vs. DIY.',
    coverImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=450&fit=crop',
    category: 'spotlights',
    author: 'Aisha Patel',
    authorRole: 'HVAC & Eco-Friendly Plumbing',
    publishedAt: '2024-12-10',
    readTime: '6 min read',
    featured: false,
  },
  {
    id: '9',
    slug: 'dispute-resolution-case-study',
    title: 'Anatomy of a Fair Dispute: Real Case Study (Anonymized)',
    excerpt: 'How our evidence window and admin review led to a fair outcome for both client and provider.',
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop',
    category: 'safety',
    author: 'Do It Trust & Safety',
    authorRole: 'Platform',
    publishedAt: '2024-12-05',
    readTime: '8 min read',
    featured: false,
  },
];

// FAQ data
export const faqCategories = [
  { slug: 'getting-started', name: 'Getting Started', icon: 'Sparkles' },
  { slug: 'payments-escrow', name: 'Payments & Escrow', icon: 'Wallet' },
  { slug: 'verification', name: 'Verification', icon: 'ShieldCheck' },
  { slug: 'disputes', name: 'Disputes & Safety', icon: 'Scale' },
  { slug: 'account', name: 'Account & Privacy', icon: 'UserCog' },
];

export const faqs: Array<{
  id: string;
  category: string;
  question: string;
  answer: string;
}> = [
  // Getting Started
  {
    id: 'gs-1',
    category: 'getting-started',
    question: 'How do I create an account on Do It?',
    answer: 'You can sign up using your email, phone number, or social accounts (Google, Apple). After verifying your email and phone, you\'ll choose whether you want to post jobs (Client) or offer services (Provider). Providers will then complete identity verification (KYC) and skill verification for their categories.',
  },
  {
    id: 'gs-2',
    category: 'getting-started',
    question: 'Do I need to verify my identity to use Do It?',
    answer: 'Yes. All providers must complete identity verification (government ID + selfie) before they can submit proposals. Clients only need email and phone verification to post jobs. This keeps the marketplace safe for everyone.',
  },
  {
    id: 'gs-3',
    category: 'getting-started',
    question: 'How do I post my first job?',
    answer: 'After signing up as a Client, click "Post a Job" from the homepage or dashboard. Choose a category, write a clear description, set your location (or remote), pick a budget type (fixed or hourly), set a deadline, and attach up to 5 photos or files. Then publish — verified providers will be notified automatically.',
  },
  {
    id: 'gs-4',
    category: 'getting-started',
    question: 'How do I start offering services as a Provider?',
    answer: 'Sign up as a Provider, complete KYC identity verification, choose up to 3 categories and specific skills, then verify each skill (certificates, portfolio, or tests). Once approved, build your profile with bio, experience, and portfolio. You can then submit up to 10 active proposals at a time.',
  },

  // Payments & Escrow
  {
    id: 'pe-1',
    category: 'payments-escrow',
    question: 'How does escrow protect me?',
    answer: 'When you hire a provider, the job amount (plus platform fee) is locked in escrow from your wallet. The provider only gets paid after you confirm the work is complete. If there\'s an issue, you can open a dispute — funds stay locked until resolved.',
  },
  {
    id: 'pe-2',
    category: 'payments-escrow',
    question: 'What are the platform fees?',
    answer: 'Clients pay 5–15% platform fee (varies by category) on top of the job total. Providers pay 10–20% of earnings (varies by category). Payment processing fees (~2.9% + $0.30) are passed through from our payment partner. All fees are shown upfront before you commit.',
  },
  {
    id: 'pe-3',
    category: 'payments-escrow',
    question: 'When do providers get paid?',
    answer: 'Providers are paid after the client confirms completion. Funds release to the provider\'s wallet minus the platform fee. Providers can then withdraw to their bank account, mobile wallet, or other local payout methods in their currency.',
  },
  {
    id: 'pe-4',
    category: 'payments-escrow',
    question: 'Can I get a refund if I cancel a job?',
    answer: 'Yes. If you cancel before a provider is accepted, you receive a full refund including fees. After acceptance, cancellation terms depend on the job stage — if work hasn\'t started, you may still get a partial refund. See our cancellation policy for details.',
  },

  // Verification
  {
    id: 'v-1',
    category: 'verification',
    question: 'What documents are needed for identity verification (KYC)?',
    answer: 'You\'ll need a valid government-issued photo ID (passport, driver\'s license, or national ID) and a live selfie. Our team reviews these manually — typically within 48 hours. All data is encrypted and handled per our privacy policy.',
  },
  {
    id: 'v-2',
    category: 'verification',
    question: 'How does skill verification work?',
    answer: 'For each category you choose, you\'ll verify specific skills. You can upload certificates, share portfolio links, or take practical tests. Some credentials auto-verify (e.g., from partnered cert bodies); others are reviewed by our admin team within 24–48 hours. You only appear in search for a category once both KYC and that category\'s skill verification are approved.',
  },
  {
    id: 'v-3',
    category: 'verification',
    question: 'How many categories and skills can I verify?',
    answer: 'You can verify up to 3 categories total. Within each category, you can verify multiple skills — there\'s no hard limit, but each skill requires its own evidence. Choose the skills that best represent what you actually offer.',
  },
  {
    id: 'v-4',
    category: 'verification',
    question: 'What if my skill verification is rejected?',
    answer: 'You\'ll receive specific feedback on what was missing or insufficient. You can resubmit with additional evidence (better photos, more portfolio items, updated certificates) at any time. There\'s no penalty for reapplying.',
  },

  // Disputes & Safety
  {
    id: 'd-1',
    category: 'disputes',
    question: 'How do I open a dispute?',
    answer: 'If work isn\'t completed as agreed, go to the job page and click "Open Dispute" within the evidence window (typically 7 days after provider marks complete). Both sides upload evidence (messages, photos, files). Our admin team reviews and releases funds according to the verdict.',
  },
  {
    id: 'd-2',
    category: 'disputes',
    question: 'What happens during a dispute?',
    answer: 'Funds remain locked in escrow. Both parties have a set period to submit evidence. Our trained admin team reviews all evidence impartially and makes a binding decision — full release to provider, partial release, or full refund to client. The decision is final.',
  },
  {
    id: 'd-3',
    category: 'disputes',
    question: 'How do I report a safety issue or suspicious activity?',
    answer: 'Use the "Report a Safety Issue" link in the Help Center or app. Reports are confidential. Our Trust & Safety team investigates promptly — we may suspend accounts, remove content, or involve authorities if needed. Your identity is protected throughout.',
  },
  {
    id: 'd-4',
    category: 'disputes',
    question: 'Are reviews on Do It genuine?',
    answer: 'Yes. Reviews can only be left after a job is completed and payment is released. Clients and providers can each leave one review per job. We don\'t allow fake reviews, review swapping, or incentivized ratings. Flagged reviews are investigated and removed if they violate policy.',
  },

  // Account & Privacy
  {
    id: 'a-1',
    category: 'account',
    question: 'How do I update my profile or skills?',
    answer: 'Go to your Profile settings in the app or web dashboard. You can edit your bio, experience, availability, portfolio, and verified skills. Adding new skills requires verification; removing skills is instant.',
  },
  {
    id: 'a-2',
    category: 'account',
    question: 'Can I delete my account and data?',
    answer: 'Yes. In Account Settings, choose "Delete Account." This permanently removes your personal data, job history, reviews, and verifications within 30 days (per legal requirements). Active jobs or disputes must be resolved first.',
  },
  {
    id: 'a-3',
    category: 'account',
    question: 'How do I change my notification preferences?',
    answer: 'In Settings > Notifications, you can toggle email, push, and SMS notifications for job matches, proposals, messages, payments, and marketing. Granular controls let you choose exactly what you want to hear about.',
  },
  {
    id: 'a-4',
    category: 'account',
    question: 'Is my data shared with third parties?',
    answer: 'We only share data necessary for the service to function: payment processors for transactions, verification partners for KYC/skill checks, and legal authorities when required by law. We never sell your data. See our Privacy Policy for full details.',
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