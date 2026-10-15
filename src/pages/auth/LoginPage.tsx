import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  Sofa,
  Box,
  FileText,
  HardHat,
  Grid,
  Lightbulb,
  Compass,
  Phone,
  MapPin,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Watcher } from '@/components/ui/Watcher';
import { LabelInput } from '@/components/ui/LabelInput';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';
import bgImg from '@/Asserts/Background_UI.jpg';

// 8 Core Services matching Shivarivel Construction Hero Banner Reference UI
const SERVICES = [
  { id: 'building-construction', title: 'Building Construction', icon: Home },
  { id: 'interior-exterior', title: 'Interior & Exterior Works', icon: Sofa },
  { id: '3d-elevation', title: '3D Elevation', icon: Box },
  { id: 'architectural-planning', title: 'Architectural Planning', icon: FileText },
  { id: 'project-management', title: 'Project Management', icon: HardHat },
  { id: 'false-ceiling', title: 'False Ceiling Works', icon: Grid },
  { id: 'profile-light', title: 'Profile Light Work', icon: Lightbulb },
  { id: 'site-surveying', title: 'Site Surveying', icon: Compass },
];

function ServicesDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
      <span className="font-inter text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.25em] text-[#C9A24A]">
        OUR SERVICES
      </span>
      <div className="h-[1px] bg-gradient-to-l from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
    </div>
  );
}

function ServicesGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
      {SERVICES.map((service) => {
        const Icon = service.icon;
        return (
          <div
            key={service.id}
            className="group bg-black/50 hover:bg-black/75 border border-[#C9A24A]/60 hover:border-[#C9A24A] backdrop-blur-md rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 shadow-xl hover:shadow-[#C9A24A]/30 cursor-default min-h-[64px] sm:min-h-[72px]"
          >
            <Icon className="w-5 h-5 text-[#C9A24A] group-hover:scale-110 transition-transform duration-200 shrink-0" />
            <span className="font-inter text-[10.5px] sm:text-[11px] font-medium text-white leading-tight">
              {service.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function VisionTagline() {
  return (
    <div className="pt-1.5">
      <p className="font-cursive text-[26px] sm:text-[32px] text-[#C9A24A] tracking-wide text-left drop-shadow-md leading-none">
        Your Vision . Our Expertise
      </p>
      <div className="w-44 h-[1.5px] bg-gradient-to-r from-[#C9A24A] via-[#C9A24A]/60 to-transparent mt-1" />
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signInWithPassword,
    isAuthenticated,
    resetPasswordForEmail,
    updatePassword,
    isPasswordRecovery,
    setIsPasswordRecovery,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Set new password (recovery) modal state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Redirect if already authenticated - unless in password recovery mode
  const targetPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const isDeepDetailLink = Boolean(targetPath && targetPath !== '/wages' && targetPath.split('/').filter(Boolean).length > 1);
  const destination = isDeepDetailLink ? (targetPath as string) : '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated && !isPasswordRecovery) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isPasswordRecovery, navigate, destination]);

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
        error.message || 'Invalid credentials. Please check your email and password.'
      );
    } else {
      navigate(destination, { replace: true });
    }
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(email);
    setForgotError(null);
    setForgotSuccess(false);
    setShowForgotModal(true);
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }

    setIsForgotLoading(true);
    const { error } = await resetPasswordForEmail(forgotEmail);
    setIsForgotLoading(false);

    if (error) {
      setForgotError(error.message || 'Unable to send reset link. Please check your email.');
    } else {
      setForgotSuccess(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);

    if (!newPassword || newPassword.length < 6) {
      setUpdateError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdateLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsUpdateLoading(false);

    if (error) {
      setUpdateError(error.message || 'Failed to update password. Please try again.');
    } else {
      setUpdateSuccess(true);
      setIsPasswordRecovery(false);
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-y-auto font-inter select-none bg-[#071510]">
      {/* 1. BRIGHT, VIVID & WARM BACKGROUND IMAGE (Background_UI.png) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        {/* Soft dark vignette for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85" />
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-[1100px] mx-auto w-full">
        <div className="w-full flex flex-col items-center space-y-6 sm:space-y-8 my-auto">
          {/* 1. HERO STATEMENT & BRAND (ABOVE LOGIN FORM) */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            {/* BRAND HEADER & LOGO */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black shadow-lg">
                <img
                  src={logoImg}
                  alt="Shivarivel Official SVC Logo"
                  className="w-full h-full object-cover scale-[1.14]"
                />
              </div>
              <div className="space-y-0.5 text-left">
                <h1 className="font-cinzel text-[19px] sm:text-[23px] font-bold tracking-[0.16em] text-white uppercase leading-tight drop-shadow-lg">
                  SHIVARIVEL
                </h1>
                <p className="font-inter text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[#C9A24A]">
                  CONSTRUCTION &amp; INTERIORS
                </p>
              </div>
            </div>

            {/* HERO STATEMENT */}
            <div className="space-y-1.5 pt-0.5">
              <p className="font-inter text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.3em] text-[#C9A24A]">
                BUILDING DREAMS
              </p>
              <h2 className="font-playfair text-[28px] sm:text-[34px] lg:text-[38px] font-normal text-white leading-[1.12] drop-shadow-md">
                Quality Construction.<br />
                Beautiful Interiors.
              </h2>
              <p className="font-inter text-[12px] sm:text-[13px] text-[#E0E6ED] font-normal leading-relaxed max-w-lg pt-0.5">
                From planning to precision, we deliver spaces that inspire, last and add value.
              </p>
            </div>

            {/* OUR SERVICES SECTION (DESKTOP: SITS IN LEFT PANEL) */}
            <div className="hidden lg:block space-y-2 pt-0.5">
              <ServicesDivider />
              <ServicesGrid />
              <VisionTagline />
            </div>
          </div>

          {/* RIGHT PANEL: FLOATING CREAM LOGIN CARD + MOBILE SERVICES UNDER CONTAINER */}
          <div className="lg:col-span-5 w-full flex flex-col items-center lg:items-end">
            <div className="w-full max-w-[420px] bg-[#F4F2EC] rounded-[24px] p-5 sm:p-6 lg:p-7 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] text-[#0A1813] border border-white/60 relative overflow-hidden transition-all">
              {/* Card Header with Centered Official Logo */}
              <div className="text-center space-y-1">
                <div
                  className="flex justify-center pt-0.5 pb-0.5"
                  style={{ '--fill-slab': '#FFFFFF', '--fill-on': '#0A1813' } as React.CSSProperties}
                >
                  <Watcher
                    follow={60}
                    bounce={30}
                    size={52}
                    shape="Cube"
                    eyes="Slant"
                  />
                </div>

                <div className="pt-0.5">
                  <h3 className="font-playfair text-[20px] sm:text-[22px] font-semibold text-[#0A1813] leading-tight">
                    Welcome Back!
                  </h3>
                  <p className="font-inter text-[11.5px] text-gray-500 mt-0.5 mb-2.5">
                    Sign in to access your administrative portal
                  </p>
                </div>
              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {errorMessage && (
                  <div className="p-2.5 text-xs bg-red-100 border border-red-300 rounded-xl text-red-800 font-medium flex items-center gap-2">
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Email field with eye-tracking LabelInput */}
                <div className="w-full">
                  <LabelInput
                    field="Email"
                    id="owner-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password field with eye-tracking LabelInput */}
                <div className="w-full">
                  <LabelInput
                    field="Password"
                    id="owner-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD */}
                <div className="flex items-center justify-between text-[12px] pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#0A1813]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#DFD9CE] text-[#0A1813] focus:ring-[#0A1813] accent-[#0A1813]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-[11.5px] font-medium text-[#4B5563] hover:text-[#0A1813] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* PRIMARY SIGN IN BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[44px] bg-[#0A1813] hover:bg-[#152B23] active:bg-[#06120E] text-white font-inter text-[14px] font-semibold rounded-[12px] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-75 tracking-wide mt-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* OUR SERVICES & TAGLINE SECTION (MOBILE: UNDER LOGIN CONTAINER) */}
            <div className="block lg:hidden w-full max-w-[420px] mt-6 space-y-2">
              <ServicesDivider />
              <ServicesGrid />
              <VisionTagline />
            </div>
          </div>

          {/* 3. OUR SERVICES SECTION (BELOW LOGIN FORM) */}
          <div className="w-full max-w-4xl mx-auto space-y-3 pt-1 text-center">
            <div className="flex items-center gap-3 my-1">
              <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
              <span className="font-inter text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.25em] text-[#C9A24A]">
                OUR SERVICES
              </span>
              <div className="h-[1px] bg-gradient-to-l from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
            </div>

            {/* 4 COLUMNS X 2 ROWS TRANSLUCENT GLASS GRID (COMPACT) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className="group bg-black/50 hover:bg-black/75 border border-[#C9A24A]/60 hover:border-[#C9A24A] backdrop-blur-md rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 shadow-xl hover:shadow-[#C9A24A]/30 cursor-default min-h-[64px] sm:min-h-[72px]"
                  >
                    <Icon className="w-5 h-5 text-[#C9A24A] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                    <span className="font-inter text-[10.5px] sm:text-[11px] font-medium text-white leading-tight">
                      {service.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CURSIVE SCRIPT TAGLINE WITH GOLD UNDERLINE FLOURISH */}
            <div className="pt-2 flex flex-col items-center">
              <p className="font-cursive text-[26px] sm:text-[32px] text-[#C9A24A] tracking-wide drop-shadow-md leading-none">
                Your Vision . Our Expertise
              </p>
              <div className="w-44 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A24A] to-transparent mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-COLUMN FOOTER BAR (COMPACT) */}
      <footer className="relative z-10 bg-[#06120E]/90 backdrop-blur-md text-gray-200 py-2 sm:py-2.5 px-4 sm:px-6 lg:px-12 border-t border-[#C9A24A]/30 font-inter text-[11px] font-medium shadow-2xl shrink-0">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row flex-wrap items-center justify-between gap-2.5 text-center md:text-left">
          {/* Website URL */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#C9A24A]" />
            <a
              href="https://www.shivarivelconstruction.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              www.shivarivelconstruction.com
            </a>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Contact Numbers */}
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-[#C9A24A]" />
            <span>+91 9443559885 &nbsp;|&nbsp; +91 7339457041</span>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Email Address */}
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-[#C9A24A]" />
            <a
              href="mailto:contact@shivarivelconstruction.com"
              className="hover:text-white transition-colors"
            >
              contact@shivarivelconstruction.com
            </a>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Office Address */}
          <div className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-3 h-3 text-[#C9A24A] shrink-0" />
            <span className="truncate max-w-xs md:max-w-none">
              22/13, Vellalar East Street, Krishnancoil, Nagercoil, Kanniyakumari - 629001.
            </span>
          </div>
        </div>
      </footer>

      {/* 1. FORGOT PASSWORD (REQUEST RESET LINK) MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#F4F2EC] border border-[#C9A24A]/50 rounded-[22px] p-6 max-w-md w-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] text-[#0A1813] space-y-4 font-inter relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-[#0A1813] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-2 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-playfair text-[#0A1813]">
                    Reset Link Dispatched!
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                    We have sent a secure password reset link to{' '}
                    <span className="font-semibold text-[#0A1813]">{forgotEmail}</span>.
                    Please check your inbox (and spam folder) and click the link to set your new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-2 py-2.5 bg-[#0A1813] hover:bg-[#152B23] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0A1813]/10 rounded-xl text-[#0A1813]">
                    <Mail className="w-5 h-5 text-[#C9A24A]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-playfair text-[#0A1813]">
                      Reset Your Password
                    </h3>
                    <p className="text-[11.5px] text-gray-500">
                      Enter your registered email to receive a password reset link
                    </p>
                  </div>
                </div>

                {forgotError && (
                  <div className="p-2.5 text-xs bg-red-100 border border-red-300 rounded-xl text-red-800 font-medium flex items-center gap-2">
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[11.5px] font-semibold text-[#0A1813] block">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. owner@shivarivel.com"
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DFD9CE] rounded-xl text-xs text-[#0A1813] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1813] focus:border-transparent transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-[10.5px] text-gray-500">
                    A secure one-time link will be sent to this email address.
                  </p>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 py-2.5 bg-[#0A1813] hover:bg-[#152B23] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-75"
                  >
                    {isForgotLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. SET NEW PASSWORD (RECOVERY) MODAL */}
      {isPasswordRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#F4F2EC] border border-[#C9A24A]/60 rounded-[22px] p-6 max-w-md w-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] text-[#0A1813] space-y-4 font-inter">
            {updateSuccess ? (
              <div className="text-center py-2 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-playfair text-[#0A1813]">
                    Password Updated Successfully!
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                    Your account password has been updated. Logging you into the administrative portal now...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0A1813]/10 rounded-xl text-[#0A1813]">
                    <Lock className="w-5 h-5 text-[#C9A24A]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-playfair text-[#0A1813]">
                      Set New Password
                    </h3>
                    <p className="text-[11.5px] text-gray-500">
                      Create a new password for your administrative portal
                    </p>
                  </div>
                </div>

                {updateError && (
                  <div className="p-2.5 text-xs bg-red-100 border border-red-300 rounded-xl text-red-800 font-medium flex items-center gap-2">
                    <span>{updateError}</span>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11.5px] font-semibold text-[#0A1813] block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-[#DFD9CE] rounded-xl text-xs text-[#0A1813] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1813] focus:border-transparent transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11.5px] font-semibold text-[#0A1813] block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-[#DFD9CE] rounded-xl text-xs text-[#0A1813] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1813] focus:border-transparent transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[10.5px] text-gray-500">
                  Password must contain at least 6 characters.
                </p>

                <button
                  type="submit"
                  disabled={isUpdateLoading}
                  className="w-full py-2.5 bg-[#0A1813] hover:bg-[#152B23] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-75"
                >
                  {isUpdateLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Save Password &amp; Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
