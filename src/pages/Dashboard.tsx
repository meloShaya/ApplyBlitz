import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  AlertCircle,
  Play,
  Pause,
  User,
  Crown,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LocalMemory, localMemoryStore } from '../lib/localMemory';

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  job_url: string;
  job_board: string;
  status: string;
  match_score: number;
  created_at: string;
  applied_at: string;
}

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  successfulApplications: number;
  interviews: number;
  thisMonthApplications: number;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience_years: number;
  resume_url: string;
}

interface Subscription {
  id: string;
  status: string;
  plan_name: string;
  applications_limit: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    successfulApplications: 0,
    interviews: 0,
    thisMonthApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [agentActive, setAgentActive] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      if (LocalMemory) {
        setAgentActive(localMemoryStore.isAgentRunning());
      }
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (LocalMemory) {
        // Use local memory simulation
        const profileData = await localMemoryStore.getProfile(user?.id!);
        const subscriptionData = await localMemoryStore.getSubscription(user?.id!);
        const applicationsData = await localMemoryStore.getApplications(user?.id!);

        setProfile(profileData);
        setSubscription(subscriptionData);
        setApplications(applicationsData || []);

        // Calculate stats
        const totalApplications = applicationsData?.length || 0;
        const pendingApplications = applicationsData?.filter(app => app.status === 'pending').length || 0;
        const successfulApplications = applicationsData?.filter(app => app.status === 'applied').length || 0;
        const interviews = applicationsData?.filter(app => app.status === 'interview').length || 0;
        
        const currentMonth = new Date().getMonth();
        const thisMonthApplications = applicationsData?.filter(app => 
          new Date(app.created_at).getMonth() === currentMonth
        ).length || 0;

        setStats({
          totalApplications,
          pendingApplications,
          successfulApplications,
          interviews,
          thisMonthApplications
        });
      } else {
        // Use real Supabase
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        setProfile(profileData);

        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        setSubscription(subscriptionData);

        const { data: applicationsData, error: appsError } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (appsError) throw appsError;

        setApplications(applicationsData || []);

        // Calculate stats
        const totalApplications = applicationsData?.length || 0;
        const pendingApplications = applicationsData?.filter(app => app.status === 'pending').length || 0;
        const successfulApplications = applicationsData?.filter(app => app.status === 'applied').length || 0;
        const interviews = applicationsData?.filter(app => app.status === 'interview').length || 0;
        
        const currentMonth = new Date().getMonth();
        const thisMonthApplications = applicationsData?.filter(app => 
          new Date(app.created_at).getMonth() === currentMonth
        ).length || 0;

        setStats({
          totalApplications,
          pendingApplications,
          successfulApplications,
          interviews,
          thisMonthApplications
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = () => {
    if (!profile) return false;
    
    const requiredFields = [
      'first_name',
      'last_name', 
      'email',
      'phone',
      'location',
      'summary',
      'experience_years'
    ];
    
    return requiredFields.every(field => {
      const value = profile[field as keyof UserProfile];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    }) && profile.skills && profile.skills.length > 0;
  };

  const canStartAgent = () => {
    return isProfileComplete() && (subscription?.status === 'active' || LocalMemory);
  };

  const isFreeTrialUser = () => {
    return !subscription || subscription.status !== 'active';
  };

  const freeTrialLimit = 2;
  const hasReachedFreeTrialLimit = () => {
    return isFreeTrialUser() && stats.totalApplications >= freeTrialLimit;
  };

  const toggleAgent = async () => {
    if (!canStartAgent()) return;
    
    if (LocalMemory) {
      if (agentActive) {
        await localMemoryStore.stopAgent();
        setAgentActive(false);
      } else {
        await localMemoryStore.startAgent(user?.id!);
        setAgentActive(true);
        
        // Refresh applications periodically while agent is running
        const interval = setInterval(async () => {
          if (localMemoryStore.isAgentRunning()) {
            const applicationsData = await localMemoryStore.getApplications(user?.id!);
            setApplications(applicationsData || []);
            
            // Recalculate stats
            const totalApplications = applicationsData?.length || 0;
            const pendingApplications = applicationsData?.filter(app => app.status === 'pending').length || 0;
            const successfulApplications = applicationsData?.filter(app => app.status === 'applied').length || 0;
            const interviews = applicationsData?.filter(app => app.status === 'interview').length || 0;
            
            const currentMonth = new Date().getMonth();
            const thisMonthApplications = applicationsData?.filter(app => 
              new Date(app.created_at).getMonth() === currentMonth
            ).length || 0;

            setStats({
              totalApplications,
              pendingApplications,
              successfulApplications,
              interviews,
              thisMonthApplications
            });
          } else {
            clearInterval(interval);
          }
        }, 5000);
      }
    } else {
      setAgentActive(!agentActive);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'interview':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Mock data for the chart
  const chartData = [
    { name: 'Mon', applications: 12 },
    { name: 'Tue', applications: 19 },
    { name: 'Wed', applications: 15 },
    { name: 'Thu', applications: 22 },
    { name: 'Fri', applications: 18 },
    { name: 'Sat', applications: 8 },
    { name: 'Sun', applications: 5 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
            {LocalMemory && (
              <span className="ml-3 text-sm font-normal text-blue-600 dark:text-blue-400">
                🎭 Demo Mode
              </span>
            )}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your job applications and AI agent performance
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!isProfileComplete() && (
          <Card className="mb-6 sm:mb-8 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-orange-900 dark:text-orange-100">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You must complete your professional profile before starting the AI agent.
                  </p>
                </div>
              </div>
              <Link to="/profile" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                  Complete Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Free Trial Limit Alert */}
        {isFreeTrialUser() && hasReachedFreeTrialLimit() && (
          <Card className="mb-6 sm:mb-8 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100">
                    Free Trial Limit Reached
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    You've used all {freeTrialLimit} free applications. Upgrade to continue applying to unlimited jobs!
                  </p>
                </div>
              </div>
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                  Upgrade Now
                  <Crown className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* AI Agent Status */}
        <Card className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 sm:p-3 rounded-full ${agentActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Briefcase className={`h-5 w-5 sm:h-6 sm:w-6 ${agentActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  AI Application Agent
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Status: {agentActive ? 'Active - Searching for jobs' : 'Paused'}
                </p>
                {isFreeTrialUser() && !LocalMemory && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Free Trial: {stats.totalApplications}/{freeTrialLimit} applications used
                  </p>
                )}
                {LocalMemory && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Demo Mode: Unlimited applications
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={toggleAgent}
              variant={agentActive ? 'secondary' : 'primary'}
              className="w-full sm:w-auto min-w-[120px]"
              disabled={!canStartAgent() || (hasReachedFreeTrialLimit() && !LocalMemory)}
            >
              {agentActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Agent
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Agent
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 sm:mr-4">
                <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-3 sm:mr-4">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.successfulApplications}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-3 sm:mr-4">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Interviews</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.interviews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full mr-3 sm:mr-4">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.thisMonthApplications}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Applications Chart */}
          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Applications This Week
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Applications */}
          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Applications
            </h3>
            <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto">
              {applications.length > 0 ? (
                applications.slice(0, 10).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      {getStatusIcon(app.status)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{app.job_title}</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{app.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8 text-sm sm:text-base">
                  No applications yet. Complete your profile and start your AI agent to begin applying!
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}