import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { TextArea } from '../components/UI/TextArea';
import { Select } from '../components/UI/Select';
import { User, Upload, Save, Briefcase, MapPin, DollarSign, FileText, X } from 'lucide-react';
import { LocalMemory, localMemoryStore } from '../lib/localMemory';

interface UserProfile {
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
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
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
    preferred_industries: []
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (LocalMemory) {
        // Use local memory simulation
        const data = await localMemoryStore.getProfile(user?.id!);
        
        if (data) {
          setProfile(data);
          // Parse uploaded files from resume_url if it contains multiple files
          if (data.resume_url) {
            try {
              const files = JSON.parse(data.resume_url);
              if (Array.isArray(files)) {
                setUploadedFiles(files);
              } else {
                // Legacy single file format
                setUploadedFiles([{
                  name: 'Resume',
                  url: data.resume_url,
                  type: 'application/pdf',
                  size: 0
                }]);
              }
            } catch {
              // Legacy single file format
              setUploadedFiles([{
                name: 'Resume',
                url: data.resume_url,
                type: 'application/pdf',
                size: 0
              }]);
            }
          }
        }
      } else {
        // Use real Supabase
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setProfile(data);
          // Parse uploaded files from resume_url if it contains multiple files
          if (data.resume_url) {
            try {
              const files = JSON.parse(data.resume_url);
              if (Array.isArray(files)) {
                setUploadedFiles(files);
              } else {
                // Legacy single file format
                setUploadedFiles([{
                  name: 'Resume',
                  url: data.resume_url,
                  type: 'application/pdf',
                  size: 0
                }]);
              }
            } catch {
              // Legacy single file format
              setUploadedFiles([{
                name: 'Resume',
                url: data.resume_url,
                type: 'application/pdf',
                size: 0
              }]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    const requiredFields = [
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'location', label: 'Location' },
      { field: 'summary', label: 'Professional Summary' },
      { field: 'education', label: 'Education' }
    ];

    requiredFields.forEach(({ field, label }) => {
      if (!profile[field as keyof UserProfile] || profile[field as keyof UserProfile] === '') {
        newErrors[field] = `${label} is required`;
      }
    });

    if (profile.experience_years === 0) {
      newErrors.experience_years = 'Years of experience is required';
    }

    if (!profile.skills || profile.skills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }

    if (uploadedFiles.length === 0) {
      newErrors.files = 'At least one file (resume/CV) must be uploaded';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const profileData = {
        ...profile,
        resume_url: JSON.stringify(uploadedFiles)
      };

      if (LocalMemory) {
        // Use local memory simulation
        await localMemoryStore.upsertProfile(user?.id!, profileData);
      } else {
        // Use real Supabase
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user?.id,
            ...profileData
          });

        if (error) throw error;
      }

      setMessage('Profile saved successfully!');
      setErrors({});
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          setMessage(`File ${file.name} is too large. Maximum size is 2MB.`);
          continue;
        }

        if (LocalMemory) {
          // Use local memory simulation
          const uploadedFile = await localMemoryStore.uploadFile(file);
          newFiles.push(uploadedFile);
        } else {
          // Use real Supabase
          const fileExt = file.name.split('.').pop();
          const fileName = `${user?.id}-${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);

          newFiles.push({
            name: file.name,
            url: data.publicUrl,
            type: file.type,
            size: file.size
          });
        }
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      setMessage(`${newFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' }
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
            {LocalMemory && (
              <span className="ml-3 text-sm font-normal text-blue-600 dark:text-blue-400">
                🎭 Demo Mode
              </span>
            )}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Complete your profile information to help our AI find better job matches. All fields marked with * are required.
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') || message.includes('Please fill') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message}
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          {/* Personal Information */}
          <Card>
            <div className="flex items-center mb-4 sm:mb-6">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="First Name *"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                error={errors.first_name}
              />
              <Input
                label="Last Name *"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                error={errors.last_name}
              />
              <Input
                label="Email *"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                error={errors.email}
              />
              <Input
                label="Phone *"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                error={errors.phone}
              />
              <Input
                label="Location *"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
                error={errors.location}
              />
              <Input
                label="LinkedIn URL"
                value={profile.linkedin_url}
                onChange={(e) => setProfile(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </Card>

          {/* File Upload */}
          <Card>
            <div className="flex items-center mb-4 sm:mb-6">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Documents *
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Files (Resume, CV, Certificates, ID, etc.) *
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum file size: 2MB. Supported formats: PDF, DOC, DOCX, JPG, PNG
                </p>
                {errors.files && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.files}</p>
                )}
              </div>

              {uploading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uploading files...</span>
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                          {file.size > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Professional Information */}
          <Card>
            <div className="flex items-center mb-4 sm:mb-6">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Professional Information
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <TextArea
                label="Professional Summary *"
                value={profile.summary}
                onChange={(e) => setProfile(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief summary of your professional background and goals"
                rows={4}
                error={errors.summary}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Years of Experience *"
                  type="number"
                  value={profile.experience_years}
                  onChange={(e) => setProfile(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  error={errors.experience_years}
                />
                <Input
                  label="Education *"
                  value={profile.education}
                  onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                  placeholder="Degree, University"
                  error={errors.education}
                />
              </div>

              <TextArea
                label="Key Skills *"
                value={profile.skills?.join(', ') || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, skills: e.target.value.split(', ').filter(s => s.trim()) }))}
                placeholder="JavaScript, React, Node.js, Python, etc."
                error={errors.skills}
              />
            </div>
          </Card>

          {/* Job Preferences */}
          <Card>
            <div className="flex items-center mb-4 sm:mb-6">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Job Preferences
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Minimum Salary"
                  type="number"
                  value={profile.preferred_salary_min}
                  onChange={(e) => setProfile(prev => ({ ...prev, preferred_salary_min: parseInt(e.target.value) || 0 }))}
                  placeholder="50000"
                />
                <Input
                  label="Maximum Salary"
                  type="number"
                  value={profile.preferred_salary_max}
                  onChange={(e) => setProfile(prev => ({ ...prev, preferred_salary_max: parseInt(e.target.value) || 0 }))}
                  placeholder="100000"
                />
              </div>

              <Select
                label="Job Type"
                value={profile.preferred_job_types[0] || 'full-time'}
                onChange={(e) => setProfile(prev => ({ ...prev, preferred_job_types: [e.target.value] }))}
                options={jobTypeOptions}
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remote"
                  checked={profile.preferred_remote}
                  onChange={(e) => setProfile(prev => ({ ...prev, preferred_remote: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remote" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Open to remote work
                </label>
              </div>

              <TextArea
                label="Preferred Locations"
                value={profile.preferred_locations?.join(', ') || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, preferred_locations: e.target.value.split(', ').filter(s => s.trim()) }))}
                placeholder="New York, San Francisco, Remote"
              />

              <TextArea
                label="Preferred Industries"
                value={profile.preferred_industries?.join(', ') || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, preferred_industries: e.target.value.split(', ').filter(s => s.trim()) }))}
                placeholder="Technology, Finance, Healthcare, etc."
              />
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              loading={saving}
              size="lg"
              className="w-full sm:w-auto min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}