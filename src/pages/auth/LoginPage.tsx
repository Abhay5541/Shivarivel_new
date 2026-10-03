import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, demoSignIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(
        error.message || 'Invalid staff credentials. Please check your email and password.'
      );
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleDemoLogin = (role: 'Owner' | 'Supervisor') => {
    demoSignIn(role);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      {/* Brand Identity Header */}
      <div className="w-full max-w-md mx-auto text-center px-4 sm:px-0">
        <div className="w-16 h-16 rounded-2xl bg-[#4A0E0E] flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md border-2 border-[#C99A2E]/50 tracking-wider">
          SC
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-[#242424] font-heading tracking-tight">
          SHIVARIVEL
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#6B6B6B] font-semibold mt-0.5">
          Construction &amp; Interiors
        </p>
        <p className="text-xs text-[#6B6B6B] mt-2">
          Enterprise Construction Command Center &amp; Site ERP
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E2DDD5] rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-[#FCEEEE] border border-[#9E2A2B]/20 rounded-lg text-xs text-[#9E2A2B] font-medium leading-relaxed"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="staff-email"
                className="block text-xs font-semibold text-[#242424] mb-1 font-heading"
              >
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@shivarivel.com"
                  autoComplete="email"
                  required
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#E2DDD5] rounded-lg text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-none focus:ring-2 focus:ring-[#4A0E0E]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="staff-password"
                className="block text-xs font-semibold text-[#242424] mb-1 font-heading"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#E2DDD5] rounded-lg text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-none focus:ring-2 focus:ring-[#4A0E0E]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-heading tracking-wide"
            >
              <span>Sign In to ERP</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Development & Evaluation Access (2 Approved MVP Roles) */}
          <div className="mt-6 pt-6 border-t border-[#E2DDD5]/70">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C99A2E]" />
              <span>Instant Evaluation Sign-In</span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] mb-3 leading-snug">
              Select one of the two approved ERP roles to test access:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('Owner')}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#F9F3E5] text-[#8C6514] border border-[#C99A2E]/40 hover:bg-[#F0E6D0] active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                Owner / Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Supervisor')}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#F7F5F0] text-[#4A0E0E] border border-[#E2DDD5] hover:bg-[#EFECE6] active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                Site Supervisor
              </button>
            </div>
          </div>
        </div>

        {/* Security & Access Notice */}
        <p className="mt-4 text-center text-[11px] text-[#6B6B6B]">
          Authorized staff access only • Public registration disabled by policy
        </p>
      </div>
    </div>
  );
}
