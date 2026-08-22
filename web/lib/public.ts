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
  { slug: 'electrical', name: 'Electrical', icon: 'Zap', providerCount: 980 },
  { slug: 'carpentry', name: 'Carpentry', icon: 'Hammer', providerCount: 870 },
  { slug: 'web-development', name: 'Web Development', icon: 'Code', providerCount: 2100 },
  { slug: 'graphic-design', name: 'Graphic Design', icon: 'Palette', providerCount: 1650 },
  { slug: 'cleaning', name: 'Cleaning', icon: 'Sparkles', providerCount: 1100 },
  { slug: 'tutoring', name: 'Tutoring', icon: 'GraduationCap', providerCount: 950 },
  { slug: 'photography', name: 'Photography', icon: 'Camera', providerCount: 780 },
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
};