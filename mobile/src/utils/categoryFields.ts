// Category-specific dynamic field requirements
// Maps category name -> additional fields to show beyond the common ones

export interface CategoryFieldConfig {
  // Physical-specific fields
  yearsExperience?: boolean;
  serviceRadiusKm?: boolean;
  toolsEquipment?: boolean;
  teamSize?: boolean;
  insurance?: boolean;
  hasTransport?: boolean;
  
  // Digital-specific fields
  techStack?: boolean;
  portfolioUrl?: boolean;
  githubUsername?: boolean;
  timezone?: boolean;
  englishProficiency?: boolean;
  workHistory?: boolean;
  education?: boolean;
  
  // Errand-specific fields
  transportMode?: boolean;
  sameDayExpress?: boolean;
  deliveryCapabilities?: boolean;
  maxPayloadKg?: boolean;
  maxPackageSize?: boolean;
  goodsInsurance?: boolean;
  
  // Field labels (optional overrides)
  fieldLabels?: Record<string, string>;
  // Field hints (optional overrides)
  fieldHints?: Record<string, string>;
}

export const CATEGORY_FIELD_CONFIG: Record<string, CategoryFieldConfig> = {
  // PHYSICAL CATEGORIES
  'Plumbing': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., pipe wrench, snake, torch)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Pipe wrench, drain snake, propane torch',
    },
  },
  'Electrical Work': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., multimeter, wire stripper, voltage tester)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Multimeter, wire strippers, fish tape',
    },
  },
  'AC & HVAC Services': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., manifold gauges, vacuum pump, leak detector)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Manifold gauges, vacuum pump, refrigerant scale',
    },
  },
  'Home Cleaning': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: false,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      teamSize: 'Team Size',
    },
  },
  'Painting & Decorating': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., sprayer, rollers, drop cloths)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Paint sprayer, rollers, brushes, drop cloths',
    },
  },
  'Carpentry & Furniture': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., table saw, router, sander)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Table saw, router, orbital sander, clamps',
    },
  },
  'Gardening & Landscaping': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., mower, trimmer, tiller)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Lawn mower, hedge trimmer, rototiller',
    },
  },
  'Pest Control': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Equipment (e.g., sprayer, bait stations, PPE)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Backpack sprayer, bait stations, respirator',
    },
  },
  'Home Repair & Maintenance': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., drill, level, stud finder)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Cordless drill, level, stud finder, multi-tool',
    },
  },
  'Moving & Packing': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: false,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      teamSize: 'Team Size',
    },
  },
  'Flooring & Tiling': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., tile cutter, trowel, level)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Wet saw, notched trowel, spacers, level',
    },
  },
  'Vehicle Services': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., jack, torque wrench, OBD scanner)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Floor jack, torque wrench, OBD-II scanner',
    },
  },
  'Roofing & Gutters': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., nail gun, roofing hammer, ladder)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Roofing nail gun, hammer, extension ladder, harness',
    },
  },
  'Locksmith Services': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: false,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., pick set, key cutter, programmer)',
      teamSize: 'Solo/Team',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Lock pick set, key cutting machine, transponder programmer',
    },
  },
  'Appliance Repair': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., multimeter, nut drivers, refrigerant gauges)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Multimeter, nut driver set, appliance dolly',
    },
  },
  'Concrete & Masonry': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., mixer, trowels, forms)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Cement mixer, trowels, forms, rebar cutter',
    },
  },
  'Pool Maintenance': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: false,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., test kit, vacuum, pole)',
      teamSize: 'Solo/Team',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Water test kit, pool vacuum, telescopic pole',
    },
  },
  'Waterproofing': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., sprayer, trowel, crack injector)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Sprayer, trowel, crack injection gun',
    },
  },
  'Glass & Mirror Work': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., suction cups, glass cutter, glazing tools)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., Suction cups, glass cutter, glazing points',
    },
  },
  'Welding & Metal Fabrication': {
    yearsExperience: true,
    serviceRadiusKm: true,
    toolsEquipment: true,
    teamSize: true,
    insurance: true,
    hasTransport: true,
    fieldLabels: {
      toolsEquipment: 'Required Tools (e.g., MIG/TIG welder, grinder, plasma cutter)',
      teamSize: 'Team Size',
    },
    fieldHints: {
      toolsEquipment: 'e.g., MIG/TIG welder, angle grinder, plasma cutter',
    },
  },

  // DIGITAL CATEGORIES
  'Web Development': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tech Stack (e.g., React, Node.js, PostgreSQL)',
      portfolioUrl: 'Portfolio / Live Sites',
      githubUsername: 'GitHub Profile',
    },
    fieldHints: {
      techStack: 'e.g., React, Next.js, Node.js, PostgreSQL, AWS',
      portfolioUrl: 'Link to live projects or portfolio site',
      githubUsername: 'For code review and verification',
    },
  },
  'Mobile App Development': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tech Stack (e.g., Swift, Kotlin, React Native, Flutter)',
      portfolioUrl: 'App Store / Play Store Links',
      githubUsername: 'GitHub Profile',
    },
    fieldHints: {
      techStack: 'e.g., Swift, Kotlin, React Native, Flutter, Firebase',
      portfolioUrl: 'Links to published apps or portfolio',
      githubUsername: 'For code review and verification',
    },
  },
  'Graphic Design': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tools & Software (e.g., Figma, Adobe CC, Procreate)',
      portfolioUrl: 'Portfolio / Behance / Dribbble',
    },
    fieldHints: {
      techStack: 'e.g., Figma, Adobe Photoshop/Illustrator, Procreate',
      portfolioUrl: 'Link to portfolio, Behance, or Dribbble',
    },
  },
  'Digital Marketing': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tools & Platforms (e.g., Google Ads, Meta Ads, GA4, HubSpot)',
      portfolioUrl: 'Case Studies / Campaign Results',
    },
    fieldHints: {
      techStack: 'e.g., Google Ads, Meta Business Suite, GA4, HubSpot, Mailchimp',
      portfolioUrl: 'Links to case studies or campaign dashboards',
    },
  },
  'Writing & Translation': {
    techStack: false,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      portfolioUrl: 'Writing Samples / Portfolio',
    },
    fieldHints: {
      portfolioUrl: 'Links to published articles, portfolio, or Google Drive samples',
    },
  },
  'Data Entry & Virtual Assistance': {
    techStack: true,
    portfolioUrl: false,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tools & Software (e.g., Excel, Notion, CRM, Zapier)',
    },
    fieldHints: {
      techStack: 'e.g., Excel/Google Sheets, Notion, HubSpot, Salesforce, Zapier',
    },
  },
  'Social Media Management': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Platforms & Tools (e.g., Meta Suite, Later, Canva, CapCut)',
      portfolioUrl: 'Social Media Portfolio / Case Studies',
    },
    fieldHints: {
      techStack: 'e.g., Meta Business Suite, Later, Hootsuite, Canva, CapCut',
      portfolioUrl: 'Links to managed accounts or case studies',
    },
  },
  'Video Editing & Animation': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Software (e.g., Premiere, After Effects, DaVinci, Blender)',
      portfolioUrl: 'Showreel / Portfolio / Vimeo',
    },
    fieldHints: {
      techStack: 'e.g., Premiere Pro, After Effects, DaVinci Resolve, Blender',
      portfolioUrl: 'Link to showreel, Vimeo, or YouTube channel',
    },
  },
  'Photography': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Equipment & Software (e.g., Sony A7R, Lightroom, Capture One)',
      portfolioUrl: 'Portfolio / Instagram / 500px',
    },
    fieldHints: {
      techStack: 'e.g., Camera body, lenses, Lightroom, Capture One',
      portfolioUrl: 'Link to portfolio, Instagram, or 500px',
    },
  },
  'UI/UX Design': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tools (e.g., Figma, Sketch, Framer, Principle)',
      portfolioUrl: 'Portfolio / Figma Links / Case Studies',
    },
    fieldHints: {
      techStack: 'e.g., Figma, Sketch, Framer, Principle, Maze',
      portfolioUrl: 'Link to portfolio, Figma files, or case studies',
    },
  },
  'Cloud & DevOps': {
    techStack: true,
    portfolioUrl: false,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Tech Stack (e.g., AWS/GCP/Azure, Terraform, Kubernetes, CI/CD)',
      githubUsername: 'GitHub / GitLab Profile',
    },
    fieldHints: {
      techStack: 'e.g., AWS, Terraform, Kubernetes, Docker, GitHub Actions, Datadog',
      githubUsername: 'For infrastructure code review',
    },
  },
  'Cybersecurity': {
    techStack: true,
    portfolioUrl: false,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Specializations & Tools (e.g., Burp Suite, Metasploit, Wireshark)',
      githubUsername: 'GitHub / CTF Profiles',
    },
    fieldHints: {
      techStack: 'e.g., Burp Suite, Metasploit, Wireshark, Nmap, custom scripts',
      githubUsername: 'GitHub with security tools or CTF profiles',
    },
  },
  'Database Administration': {
    techStack: true,
    portfolioUrl: false,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Databases & Tools (e.g., PostgreSQL, MongoDB, Redis, pgAdmin)',
      githubUsername: 'GitHub Profile',
    },
    fieldHints: {
      techStack: 'e.g., PostgreSQL, MongoDB, Redis, pgAdmin, DataGrip',
      githubUsername: 'For database scripts and automation',
    },
  },
  'Data Science & Machine Learning': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Stack (e.g., Python, PyTorch, TensorFlow, Pandas, Jupyter)',
      portfolioUrl: 'Projects / Kaggle / Papers',
      githubUsername: 'GitHub Profile',
    },
    fieldHints: {
      techStack: 'e.g., Python, PyTorch, TensorFlow, Pandas, Scikit-learn, Jupyter',
      portfolioUrl: 'Kaggle profile, GitHub projects, or published papers',
      githubUsername: 'For ML code and notebooks',
    },
  },
  'Game Development': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: true,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Engines & Tools (e.g., Unity, Unreal, Blender, Git)',
      portfolioUrl: 'Portfolio / itch.io / Steam / GitHub',
      githubUsername: 'GitHub Profile',
    },
    fieldHints: {
      techStack: 'e.g., Unity, Unreal Engine, C#, C++, Blender, Git',
      portfolioUrl: 'Links to games on itch.io, Steam, or GitHub repos',
      githubUsername: 'For game code and assets',
    },
  },
  'Technical Support & IT': {
    techStack: true,
    portfolioUrl: false,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Skills & Tools (e.g., Active Directory, Intune, Jira, remote tools)',
    },
    fieldHints: {
      techStack: 'e.g., Active Directory, Microsoft Intune, Jira, TeamViewer, RMM tools',
    },
  },
  'Voice Over & Audio Production': {
    techStack: true,
    portfolioUrl: true,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Equipment & Software (e.g., Neumann U87, Pro Tools, iZotope RX)',
      portfolioUrl: 'Demo Reel / SoundCloud / Portfolio',
    },
    fieldHints: {
      techStack: 'e.g., Microphone, audio interface, Pro Tools, iZotope RX',
      portfolioUrl: 'Link to demo reel, SoundCloud, or portfolio',
    },
  },
  'CRM & Marketing Automation': {
    techStack: true,
    portfolioUrl: false,
    githubUsername: false,
    timezone: true,
    englishProficiency: true,
    workHistory: true,
    education: true,
    fieldLabels: {
      techStack: 'Platforms (e.g., HubSpot, Salesforce, Marketo, Braze, Klaviyo)',
    },
    fieldHints: {
      techStack: 'e.g., HubSpot, Salesforce, Marketo, Braze, Klaviyo, Customer.io',
    },
  },

  // ERRAND CATEGORIES (using base config from errand step)
  // These will use the base errand fields (transportMode, sameDayExpress, etc.)
  // with category-specific overrides if needed
};

export const getCategoryFieldConfig = (categoryName: string): CategoryFieldConfig => {
  return CATEGORY_FIELD_CONFIG[categoryName] || {};
};

export const getAllCategoryNames = (): string[] => {
  return Object.keys(CATEGORY_FIELD_CONFIG);
};