import { useState } from 'react';
import { Activity, Mail, Lock, User as UserIcon, Calendar, Ruler, Weight, AlertCircle, CheckCircle } from 'lucide-react';
import { User } from '../App';

// 后端 API 基础地址（与 api.ts 保持一致）
const API_BASE_URL = 'https://smart-healthcare-tracker.onrender.com/api';

interface RegisterProps {
  onRegister: (user: User) => Promise<boolean>;
  onBackToLogin: () => void;
}

export function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }
    if (countdown > 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-register-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Verification code sent to your email');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error, please try again');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!formData.age || !formData.height || !formData.weight) {
      setError('Please provide age, height and weight');
      return;
    }
    if (!formData.code) {
      setError('Please enter verification code');
      return;
    }

    const userData: User = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseInt(formData.height),
      weight: parseInt(formData.weight),
    };
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, code: formData.code })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        await onRegister(data.user);
        setSuccess(true);
        setTimeout(() => onBackToLogin(), 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-2xl mb-4">
            <Activity className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Smart Healthcare Tracker</h1>
          <p className="text-gray-600">Join us to start tracking your health</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <p className="text-sm text-green-800">Registration successful! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-700 mb-2">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-gray-800 mb-4">Health Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm text-gray-700 mb-2">Age *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="30" min="1" max="120" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm text-gray-700 mb-2">Gender *</label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm text-gray-700 mb-2">Height (cm) *</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="height" name="height" type="number" value={formData.height} onChange={handleChange} placeholder="175" min="50" max="250" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm text-gray-700 mb-2">Weight (kg) *</label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} placeholder="70" min="20" max="300" step="0.1" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Verification Code *</label>
              <div className="flex gap-2">
                <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="6-digit code" maxLength={6} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <button type="button" onClick={sendCode} disabled={countdown > 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {countdown > 0 ? `${countdown}s` : 'Send Code'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">A verification code will be sent to your email. Valid for 5 minutes.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <button type="button" onClick={onBackToLogin} className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
