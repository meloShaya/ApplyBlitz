# ApplyBlitz - AI-Powered Job Application Automation

ApplyBlitz is a sophisticated web application that automates job applications using AI. The platform uses advanced machine learning to match users with relevant job opportunities and automatically fills out and submits applications on their behalf.

## Features

### Core Functionality
- **AI-Powered Job Matching**: Advanced algorithms analyze job descriptions and match them to user profiles with 95% accuracy
- **Automated Application Submission**: Background agents apply to hundreds of jobs 24/7 on behalf of users
- **Real-time Dashboard**: Track application status, view analytics, and monitor AI agent performance
- **Smart Form Filling**: AI analyzes application forms and fills them out using user profile data
- **Multi-Platform Support**: Supports major job boards including LinkedIn, Indeed, Glassdoor, and company career pages

### User Experience
- **Modern, Responsive Design**: Professional UI with dark/light theme support
- **Multi-step Profile Setup**: Comprehensive profile builder with resume upload
- **Subscription Management**: Stripe-powered billing with flexible plans
- **Real-time Notifications**: Stay updated on application status and interview requests
- **Detailed Analytics**: Comprehensive reporting on application success rates

### Technical Features
- **Secure Authentication**: Supabase Auth with email/password and Google OAuth
- **Scalable Architecture**: Built with React, Node.js, and PostgreSQL
- **AI Integration**: OpenAI GPT for job matching and form analysis
- **Web Automation**: Puppeteer for reliable form filling and submission
- **Robust Error Handling**: Comprehensive logging and CAPTCHA detection

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Supabase** for database and authentication
- **Stripe** for payment processing
- **OpenAI API** for AI-powered matching
- **Puppeteer** for web automation

### Infrastructure
- **PostgreSQL** database via Supabase
- **File Storage** via Supabase Storage
- **Real-time subscriptions** via Supabase Realtime
- **Webhook handling** for Stripe events

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Stripe account for payments
- OpenAI API key

### Environment Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd applyblitz
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Configure environment variables:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Database Setup

1. **Run the database migration:**
   - Copy the contents of `database.sql`
   - Execute in your Supabase SQL editor
   - This creates all necessary tables, RLS policies, and indexes

2. **Set up Supabase Storage:**
   - Create a bucket named `resumes` with public access
   - Configure appropriate policies for file uploads

### Development

1. **Start the development server:**
```bash
npm run dev
```

2. **Start the backend server:**
```bash
npm run start
```

The application will be available at `http://localhost:5173`

### Production Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Deploy to your preferred platform:**
   - Vercel, Netlify, or similar for frontend
   - Railway, Heroku, or similar for backend
   - Ensure environment variables are configured

## Project Structure

```
applyblitz/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/         # Header, Footer, Navigation
│   │   └── UI/             # Button, Input, Card, etc.
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── lib/                # Utilities and configurations
│   ├── pages/              # Main application pages
│   └── types/              # TypeScript type definitions
├── server/
│   ├── services/           # Background services (Job Agent)
│   └── index.js           # Express server setup
├── database.sql           # Database schema and setup
└── README.md
```

## Key Components

### Authentication System
- Supabase Auth integration with email/password and Google OAuth
- Protected routes and middleware
- User session management

### Job Application Agent
- Background cron jobs for continuous job searching
- AI-powered job matching using OpenAI GPT
- Automated form filling with Puppeteer
- Comprehensive error handling and logging

### Payment System
- Stripe Checkout integration
- Webhook handling for subscription events
- Usage tracking and limits enforcement

### Dashboard & Analytics
- Real-time application tracking
- Performance metrics and charts
- User profile management

## API Endpoints

### Authentication Required
- `GET /api/applications` - Fetch user applications
- `POST /api/upload-resume` - Upload resume file
- `POST /api/create-checkout-session` - Create Stripe checkout

### Webhooks
- `POST /api/stripe-webhook` - Handle Stripe events

## Database Schema

### Core Tables
- `user_profiles` - User information and preferences
- `applications` - Job application tracking
- `subscriptions` - Stripe subscription management
- `job_searches` - Saved search criteria
- `application_logs` - Detailed process logging

### Security
- Row Level Security (RLS) enabled on all tables
- User-specific data access policies
- Service role access for background processes

## AI Integration

### Job Matching Algorithm
1. **Content Analysis**: Extract job requirements from descriptions
2. **Profile Matching**: Compare user skills and experience
3. **Scoring System**: Generate match scores (0-100)
4. **Threshold Filtering**: Only apply to high-scoring matches

### Form Analysis
1. **Visual Analysis**: Screenshot analysis for form detection
2. **HTML Parsing**: Extract form fields and requirements
3. **Smart Filling**: Map user data to appropriate fields
4. **Validation**: Ensure data accuracy before submission

## Monitoring & Logging

### Application Logs
- Detailed logging for each application attempt
- Error tracking and debugging information
- Performance metrics and timing data

### User Analytics
- Application success rates
- Interview callback tracking
- Monthly usage statistics

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- Secure file upload handling
- API rate limiting and validation

### Authentication
- JWT token validation
- Secure session management
- OAuth integration best practices

### Privacy
- User data isolation via RLS
- Secure resume storage
- GDPR compliance considerations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@applyblitz.com or create an issue in the repository.

---

**ApplyBlitz** - Revolutionizing job search with AI automation.