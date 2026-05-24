import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword(token!, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-sidebar flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-white rounded-[28px] shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-gray-900">MyDesk</h1>
          <p className="text-gray-500 mt-2 font-medium">Reset your password</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold text-gray-800">Password reset successful!</p>
            <p className="text-sm text-gray-500">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-start gap-2">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <p className="text-sm text-gray-500">Enter your new password below.</p>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-brand-accent/20 focus:border-brand-accent/50 focus:outline-none transition-all"
                  placeholder="New password"
                  required
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-brand-accent/20 focus:border-brand-accent/50 focus:outline-none transition-all"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-brand-accent hover:bg-red-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-red-500/20 hover:shadow-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
            </button>

            <p className="text-center text-xs text-gray-400">
              <Link to="/login" className="text-brand-accent font-bold hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
