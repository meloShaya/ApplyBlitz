import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import cron from 'node-cron';

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active agents
const activeAgents = new Map();

export async function startJobAgent(userId) {
  // Stop existing agent if running
  if (activeAgents.has(userId)) {
    stopJobAgent(userId);
  }

  console.log(`Starting job agent for user ${userId}`);

  // Run every 4 hours
  const cronJob = cron.schedule('0 */4 * * *', async () => {
    await processJobsForUser(userId);
  }, {
    scheduled: false
  });

  cronJob.start();
  activeAgents.set(userId, cronJob);

  // Run immediately
  await processJobsForUser(userId);
}

export function stopJobAgent(userId) {
  const agent = activeAgents.get(userId);
  if (agent) {
    agent.destroy();
    activeAgents.delete(userId);
    console.log(`Stopped job agent for user ${userId}`);
  }
}

async function processJobsForUser(userId) {
  try {
    console.log(`Processing jobs for user ${userId}`);

    // Get user profile and subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      console.log(`User ${userId} does not have a complete profile`);
      return;
    }

    // Check if profile is complete
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'location', 'summary', 'experience_years'];
    const isProfileComplete = requiredFields.every(field => {
      const value = profile[field];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    }) && profile.skills && profile.skills.length > 0;

    if (!isProfileComplete) {
      console.log(`User ${userId} profile is incomplete`);
      return;
    }

    // Check application limit based on subscription status
    const { count: thisMonthCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    let applicationLimit;
    if (!subscription || subscription.status !== 'active') {
      // Free trial user - limit to 2 applications
      applicationLimit = 2;
    } else {
      applicationLimit = subscription.applications_limit;
    }

    if (thisMonthCount >= applicationLimit) {
      console.log(`User ${userId} has reached application limit (${thisMonthCount}/${applicationLimit})`);
      return;
    }

    // Search for jobs
    const jobUrls = await searchJobs(profile);
    
    // Process each job
    const remainingApplications = applicationLimit - thisMonthCount;
    for (const jobUrl of jobUrls.slice(0, Math.min(10, remainingApplications))) {
      await processJob(userId, jobUrl, profile);
      
      // Add delay between applications
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } catch (error) {
    console.error(`Error processing jobs for user ${userId}:`, error);
  }
}

async function searchJobs(profile) {
  // Mock job search - in real implementation, this would scrape job boards
  const mockJobs = [
    'https://example.com/job/software-engineer-1',
    'https://example.com/job/frontend-developer-2',
    'https://example.com/job/fullstack-developer-3',
    'https://example.com/job/react-developer-4',
    'https://example.com/job/javascript-developer-5'
  ];

  return mockJobs;
}

async function processJob(userId, jobUrl, profile) {
  let browser;
  let applicationId;

  try {
    // Create application record
    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        job_title: 'Software Engineer', // Would extract from job page
        company_name: 'Example Company', // Would extract from job page
        job_url: jobUrl,
        job_board: 'indeed',
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;
    applicationId = application.id;

    // Log start of application process
    await logApplicationAction(applicationId, 'start', 'success', 'Starting application process');

    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to job page
    await page.goto(jobUrl, { waitUntil: 'networkidle0' });
    
    // Take screenshot for analysis
    const screenshot = await page.screenshot({ fullPage: true });
    
    // Get page content
    const content = await page.content();
    
    // Analyze job match using AI
    const matchResult = await analyzeJobMatch(content, profile);
    
    if (!matchResult.is_match || matchResult.match_score < 70) {
      await supabase
        .from('applications')
        .update({
          status: 'failed',
          failure_reason: `Low match score: ${matchResult.match_score}`,
          match_score: matchResult.match_score
        })
        .eq('id', applicationId);
      
      await logApplicationAction(applicationId, 'analyze', 'failed', `Low match score: ${matchResult.match_score}`);
      return;
    }

    // Update match score
    await supabase
      .from('applications')
      .update({ match_score: matchResult.match_score })
      .eq('id', applicationId);

    // Analyze application form
    const formAnalysis = await analyzeApplicationForm(screenshot.toString('base64'), content);
    
    if (!formAnalysis.success) {
      await supabase
        .from('applications')
        .update({
          status: 'failed',
          failure_reason: 'Could not analyze application form'
        })
        .eq('id', applicationId);
      
      await logApplicationAction(applicationId, 'form_analysis', 'failed', 'Could not analyze application form');
      return;
    }

    // Fill out application form
    await fillApplicationForm(page, formAnalysis.fields, profile);
    
    // Submit application (in mock mode, we'll just mark as successful)
    await supabase
      .from('applications')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    await logApplicationAction(applicationId, 'submit', 'success', 'Application submitted successfully');
    
    console.log(`Successfully applied to job ${jobUrl} for user ${userId}`);

  } catch (error) {
    console.error(`Error processing job ${jobUrl}:`, error);
    
    if (applicationId) {
      await supabase
        .from('applications')
        .update({
          status: 'failed',
          failure_reason: error.message
        })
        .eq('id', applicationId);

      await logApplicationAction(applicationId, 'error', 'failed', error.message);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzeJobMatch(jobContent, profile) {
  try {
    const prompt = `
      Analyze the following job description and user profile to determine if this is a good match.
      
      Job Description:
      ${jobContent.substring(0, 3000)}
      
      User Profile:
      - Skills: ${profile.skills?.join(', ') || 'Not specified'}
      - Experience: ${profile.experience_years} years
      - Summary: ${profile.summary || 'Not provided'}
      - Preferred Industries: ${profile.preferred_industries?.join(', ') || 'Any'}
      
      Respond ONLY with a JSON object containing:
      {
        "is_match": boolean,
        "match_score": number (0-100),
        "reasoning": "Brief explanation"
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing job match:', error);
    return { is_match: false, match_score: 0, reasoning: 'Error in analysis' };
  }
}

async function analyzeApplicationForm(screenshot, htmlContent) {
  try {
    const prompt = `
      Analyze this job application form and identify all the form fields that need to be filled.
      
      HTML Content (truncated):
      ${htmlContent.substring(0, 2000)}
      
      Respond ONLY with a JSON object containing:
      {
        "success": boolean,
        "fields": {
          "selector": "field_type"
        }
      }
      
      Example field types: "first_name", "last_name", "email", "phone", "resume_upload", "cover_letter", "submit_button"
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing application form:', error);
    return { success: false, fields: {} };
  }
}

async function fillApplicationForm(page, fields, profile) {
  try {
    for (const [selector, fieldType] of Object.entries(fields)) {
      if (fieldType === 'submit_button') continue;
      
      let value = '';
      switch (fieldType) {
        case 'first_name':
          value = profile.first_name;
          break;
        case 'last_name':
          value = profile.last_name;
          break;
        case 'email':
          value = profile.email;
          break;
        case 'phone':
          value = profile.phone || '';
          break;
        default:
          continue;
      }
      
      if (value) {
        try {
          await page.type(selector, value);
        } catch (error) {
          console.error(`Error filling field ${selector}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error filling application form:', error);
    throw error;
  }
}

async function logApplicationAction(applicationId, action, status, message) {
  try {
    await supabase
      .from('application_logs')
      .insert({
        application_id: applicationId,
        action,
        status,
        message
      });
  } catch (error) {
    console.error('Error logging application action:', error);
  }
}