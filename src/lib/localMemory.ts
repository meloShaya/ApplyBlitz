// Local Memory Simulation System
export const LocalMemory = true; // Set to false to use real Supabase

interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

interface MockProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  website_url: string;
  resume_url: string;
  summary: string;
  skills: string[];
  experience_years: number;
  education: string;
  preferred_salary_min: number;
  preferred_salary_max: number;
  preferred_locations: string[];
  preferred_job_types: string[];
  preferred_remote: boolean;
  preferred_industries: string[];
  created_at: string;
  updated_at: string;
}

interface MockSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_name: string;
  plan_price: number;
  applications_limit: number;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

interface MockApplication {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_url: string;
  job_board: string;
  salary_range: string;
  location: string;
  job_description: string;
  match_score: number;
  status: string;
  failure_reason: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MockApplicationLog {
  id: string;
  application_id: string;
  action: string;
  status: string;
  message: string;
  screenshot_url: string | null;
  error_details: any;
  created_at: string;
}

class LocalMemoryStore {
  private users: MockUser[] = [];
  private profiles: MockProfile[] = [];
  private subscriptions: MockSubscription[] = [];
  private applications: MockApplication[] = [];
  private applicationLogs: MockApplicationLog[] = [];
  private currentUser: MockUser | null = null;
  private agentRunning = false;

  constructor() {
    this.initializeMockData();
    this.loadFromStorage();
  }

  private initializeMockData() {
    // Create demo user
    const demoUser: MockUser = {
      id: 'demo-user-123',
      email: 'demo@applyblitz.com',
      created_at: new Date().toISOString()
    };

    // Create demo profile
    const demoProfile: MockProfile = {
      id: 'profile-123',
      user_id: demoUser.id,
      first_name: 'John',
      last_name: 'Doe',
      email: 'demo@applyblitz.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      website_url: 'https://johndoe.dev',
      resume_url: JSON.stringify([
        { name: 'Resume.pdf', url: 'https://example.com/resume.pdf', type: 'application/pdf', size: 1024000 },
        { name: 'Cover_Letter.pdf', url: 'https://example.com/cover.pdf', type: 'application/pdf', size: 512000 },
        { name: 'Certificates.pdf', url: 'https://example.com/certs.pdf', type: 'application/pdf', size: 768000 }
      ]),
      summary: 'Experienced software engineer with 5+ years in full-stack development. Passionate about building scalable web applications and leading development teams.',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'TypeScript'],
      experience_years: 5,
      education: 'Bachelor of Science in Computer Science, Stanford University',
      preferred_salary_min: 120000,
      preferred_salary_max: 180000,
      preferred_locations: ['San Francisco', 'New York', 'Remote'],
      preferred_job_types: ['full-time'],
      preferred_remote: true,
      preferred_industries: ['Technology', 'Fintech', 'Healthcare'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create demo subscription (Pro plan)
    const demoSubscription: MockSubscription = {
      id: 'sub-123',
      user_id: demoUser.id,
      stripe_customer_id: 'cus_demo123',
      stripe_subscription_id: 'sub_demo123',
      status: 'active',
      plan_name: 'Pro',
      plan_price: 19900,
      applications_limit: 200,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create demo applications
    const demoApplications: MockApplication[] = [
      {
        id: 'app-1',
        user_id: demoUser.id,
        job_title: 'Senior Frontend Developer',
        company_name: 'TechCorp Inc.',
        job_url: 'https://techcorp.com/careers/senior-frontend',
        job_board: 'linkedin',
        salary_range: '$140,000 - $180,000',
        location: 'San Francisco, CA',
        job_description: 'We are looking for a senior frontend developer to join our team...',
        match_score: 92,
        status: 'applied',
        failure_reason: null,
        applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'app-2',
        user_id: demoUser.id,
        job_title: 'Full Stack Engineer',
        company_name: 'StartupXYZ',
        job_url: 'https://startupxyz.com/jobs/fullstack',
        job_board: 'indeed',
        salary_range: '$130,000 - $160,000',
        location: 'Remote',
        job_description: 'Join our fast-growing startup as a full stack engineer...',
        match_score: 88,
        status: 'interview',
        failure_reason: null,
        applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'app-3',
        user_id: demoUser.id,
        job_title: 'React Developer',
        company_name: 'WebSolutions LLC',
        job_url: 'https://websolutions.com/careers/react-dev',
        job_board: 'glassdoor',
        salary_range: '$120,000 - $150,000',
        location: 'New York, NY',
        job_description: 'Looking for an experienced React developer...',
        match_score: 85,
        status: 'applied',
        failure_reason: null,
        applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'app-4',
        user_id: demoUser.id,
        job_title: 'Software Engineer',
        company_name: 'BigTech Corp',
        job_url: 'https://bigtech.com/jobs/software-engineer',
        job_board: 'linkedin',
        salary_range: '$160,000 - $200,000',
        location: 'Seattle, WA',
        job_description: 'Join our engineering team at BigTech...',
        match_score: 78,
        status: 'failed',
        failure_reason: 'CAPTCHA detected during application process',
        applied_at: null,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'app-5',
        user_id: demoUser.id,
        job_title: 'Frontend Engineer',
        company_name: 'InnovateLabs',
        job_url: 'https://innovatelabs.com/careers/frontend',
        job_board: 'indeed',
        salary_range: '$125,000 - $155,000',
        location: 'Austin, TX',
        job_description: 'We need a talented frontend engineer...',
        match_score: 90,
        status: 'pending',
        failure_reason: null,
        applied_at: null,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ];

    this.users = [demoUser];
    this.profiles = [demoProfile];
    this.subscriptions = [demoSubscription];
    this.applications = demoApplications;
  }

  private loadFromStorage() {
    try {
      const storedUser = localStorage.getItem('demo-current-user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        console.log('Loaded user from storage:', this.currentUser);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      if (this.currentUser) {
        localStorage.setItem('demo-current-user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('demo-current-user');
      }
      // Dispatch custom event to notify auth context
      window.dispatchEvent(new CustomEvent('demo-auth-change'));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Auth methods
  async signIn(email: string, password: string) {
    await this.delay(1000); // Simulate network delay
    
    console.log('Attempting sign in with:', email, password);
    
    if (email === 'demo@applyblitz.com' && password === 'demo123') {
      this.currentUser = this.users[0];
      this.saveToStorage();
      console.log('Sign in successful:', this.currentUser);
      return { user: this.currentUser, session: { access_token: 'mock-token' } };
    }
    
    throw new Error('Invalid credentials');
  }

  async signUp(email: string, password: string, userData: any) {
    await this.delay(1500);
    
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };

    const newProfile: MockProfile = {
      id: `profile-${Date.now()}`,
      user_id: newUser.id,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email,
      phone: '',
      location: '',
      linkedin_url: '',
      website_url: '',
      resume_url: '',
      summary: '',
      skills: [],
      experience_years: 0,
      education: '',
      preferred_salary_min: 0,
      preferred_salary_max: 0,
      preferred_locations: [],
      preferred_job_types: ['full-time'],
      preferred_remote: false,
      preferred_industries: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.users.push(newUser);
    this.profiles.push(newProfile);
    this.currentUser = newUser;
    this.saveToStorage();
    
    return { user: newUser, session: { access_token: 'mock-token' } };
  }

  async signOut() {
    await this.delay(500);
    this.currentUser = null;
    this.saveToStorage();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Profile methods
  async getProfile(userId: string) {
    await this.delay(800);
    return this.profiles.find(p => p.user_id === userId) || null;
  }

  async upsertProfile(userId: string, profileData: Partial<MockProfile>) {
    await this.delay(1000);
    
    const existingIndex = this.profiles.findIndex(p => p.user_id === userId);
    
    if (existingIndex >= 0) {
      this.profiles[existingIndex] = {
        ...this.profiles[existingIndex],
        ...profileData,
        updated_at: new Date().toISOString()
      };
    } else {
      const newProfile: MockProfile = {
        id: `profile-${Date.now()}`,
        user_id: userId,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin_url: '',
        website_url: '',
        resume_url: '',
        summary: '',
        skills: [],
        experience_years: 0,
        education: '',
        preferred_salary_min: 0,
        preferred_salary_max: 0,
        preferred_locations: [],
        preferred_job_types: ['full-time'],
        preferred_remote: false,
        preferred_industries: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...profileData
      };
      this.profiles.push(newProfile);
    }
  }

  // Subscription methods
  async getSubscription(userId: string) {
    await this.delay(600);
    return this.subscriptions.find(s => s.user_id === userId) || null;
  }

  async createSubscription(userId: string, planName: string) {
    await this.delay(2000); // Simulate Stripe processing
    
    const newSubscription: MockSubscription = {
      id: `sub-${Date.now()}`,
      user_id: userId,
      stripe_customer_id: `cus-${Date.now()}`,
      stripe_subscription_id: `sub-${Date.now()}`,
      status: 'active',
      plan_name: planName,
      plan_price: planName === 'Pro' ? 19900 : 9900,
      applications_limit: planName === 'Pro' ? 200 : 50,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Remove existing subscription
    this.subscriptions = this.subscriptions.filter(s => s.user_id !== userId);
    this.subscriptions.push(newSubscription);
    
    return newSubscription;
  }

  // Application methods
  async getApplications(userId: string) {
    await this.delay(700);
    return this.applications.filter(a => a.user_id === userId);
  }

  async createApplication(userId: string, applicationData: Partial<MockApplication>) {
    await this.delay(1200);
    
    const newApplication: MockApplication = {
      id: `app-${Date.now()}`,
      user_id: userId,
      job_title: '',
      company_name: '',
      job_url: '',
      job_board: '',
      salary_range: '',
      location: '',
      job_description: '',
      match_score: 0,
      status: 'pending',
      failure_reason: null,
      applied_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...applicationData
    };

    this.applications.push(newApplication);
    return newApplication;
  }

  // Agent simulation
  async startAgent(userId: string) {
    if (this.agentRunning) return;
    
    this.agentRunning = true;
    console.log(`[DEMO] Starting AI agent for user ${userId}`);
    
    // Simulate agent finding and applying to jobs
    setTimeout(() => this.simulateAgentActivity(userId), 3000);
  }

  async stopAgent() {
    this.agentRunning = false;
    console.log('[DEMO] AI agent stopped');
  }

  isAgentRunning() {
    return this.agentRunning;
  }

  private async simulateAgentActivity(userId: string) {
    if (!this.agentRunning) return;

    const jobTitles = [
      'Senior Software Engineer',
      'Full Stack Developer',
      'React Developer',
      'Backend Engineer',
      'DevOps Engineer',
      'Frontend Engineer',
      'Software Architect',
      'Technical Lead'
    ];

    const companies = [
      'TechFlow Inc.',
      'DataDriven Corp',
      'CloudFirst Solutions',
      'NextGen Systems',
      'InnovateTech',
      'ScaleUp Labs',
      'FutureSoft',
      'AgileWorks'
    ];

    const locations = [
      'San Francisco, CA',
      'New York, NY',
      'Seattle, WA',
      'Austin, TX',
      'Remote',
      'Boston, MA',
      'Denver, CO'
    ];

    const jobBoards = ['linkedin', 'indeed', 'glassdoor', 'angellist'];
    const statuses = ['applied', 'applied', 'applied', 'interview', 'failed'];

    // Create a new application every 10-15 seconds
    const randomDelay = Math.random() * 5000 + 10000; // 10-15 seconds
    
    setTimeout(async () => {
      if (!this.agentRunning) return;

      const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const jobBoard = jobBoards[Math.floor(Math.random() * jobBoards.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const matchScore = Math.floor(Math.random() * 30) + 70; // 70-100

      const newApplication: MockApplication = {
        id: `app-${Date.now()}`,
        user_id: userId,
        job_title: jobTitle,
        company_name: company,
        job_url: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers/${jobTitle.toLowerCase().replace(/\s+/g, '-')}`,
        job_board: jobBoard,
        salary_range: `$${Math.floor(Math.random() * 50000) + 100000} - $${Math.floor(Math.random() * 50000) + 150000}`,
        location,
        job_description: `We are looking for a talented ${jobTitle} to join our team at ${company}...`,
        match_score: matchScore,
        status,
        failure_reason: status === 'failed' ? 'CAPTCHA detected during application process' : null,
        applied_at: status === 'applied' || status === 'interview' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.applications.push(newApplication);
      console.log(`[DEMO] Applied to ${jobTitle} at ${company} - Status: ${status}`);

      // Continue the simulation
      this.simulateAgentActivity(userId);
    }, randomDelay);
  }

  // File upload simulation
  async uploadFile(file: File) {
    await this.delay(2000); // Simulate upload time
    
    return {
      name: file.name,
      url: `https://demo-storage.applyblitz.com/${Date.now()}-${file.name}`,
      type: file.type,
      size: file.size
    };
  }

  // Stripe simulation
  async createCheckoutSession(priceId: string) {
    await this.delay(1500);
    
    // Simulate Stripe checkout
    return {
      url: `https://checkout.stripe.com/demo-session-${Date.now()}`
    };
  }

  async simulatePaymentSuccess(userId: string, planName: string) {
    await this.delay(3000);
    return this.createSubscription(userId, planName);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const localMemoryStore = new LocalMemoryStore();