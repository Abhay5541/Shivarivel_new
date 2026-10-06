import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
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
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';
import bgImg from '@/Asserts/Background_UI.png';

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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, demoSignIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Redirect if already authenticated
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
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden font-inter select-none bg-[#071510]">
      {/* 1. BRIGHT, VIVID & WARM BACKGROUND IMAGE (Background_UI.png) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        {/* Soft left-side dark vignette for text readability, keeping the golden sunset & glowing villa bright & clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 flex flex-col justify-between px-4 sm:px-8 lg:px-12 py-6 lg:py-8 max-w-[1360px] mx-auto w-full">
        
        {/* DESKTOP SPLIT LAYOUT: LEFT BRANDING & SERVICES + RIGHT LOGIN CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-2">
          
          {/* LEFT PANEL: BRAND HEADER, HERO STATEMENT & SERVICES GRID */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-7 text-left">
            
            {/* BRAND HEADER & LOGO (Cropped scale-[1.14] to eliminate the outer white ring) */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black shadow-lg">
                <img
                  src={logoImg}
                  alt="Shivarivel Official SVC Logo"
                  className="w-full h-full object-cover scale-[1.14]"
                />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-cinzel text-[26px] sm:text-[32px] font-bold tracking-[0.18em] text-white uppercase leading-tight drop-shadow-lg">
                  SHIVARIVEL
                </h1>
                <p className="font-inter text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.35em] text-[#C9A24A]">
                  CONSTRUCTION &amp; INTERIORS
                </p>
                <p className="font-inter text-[11px] sm:text-[12px] text-gray-200 font-normal tracking-wide">
                  Enterprise Construction Command Center &amp; Site ERP
                </p>
              </div>
            </div>

            {/* HERO STATEMENT */}
            <div className="space-y-2 pt-1">
              <p className="font-inter text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.35em] text-[#C9A24A]">
                BUILDING DREAMS
              </p>
              <h2 className="font-playfair text-[38px] sm:text-[48px] lg:text-[52px] font-normal text-white leading-[1.12] drop-shadow-md">
                Quality Construction.<br />
                Beautiful Interiors.
              </h2>
              <p className="font-inter text-[14px] sm:text-[15px] text-[#E0E6ED] font-normal leading-relaxed max-w-lg pt-2">
                From planning to precision, we deliver spaces that inspire, last and add value.
              </p>
            </div>

            {/* OUR SERVICES SECTION */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-4 my-2">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
                <span className="font-inter text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.3em] text-[#C9A24A]">
                  OUR SERVICES
                </span>
                <div className="h-[1px] bg-gradient-to-l from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
              </div>

              {/* 4 COLUMNS X 2 ROWS TRANSLUCENT GLASS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SERVICES.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={service.id}
                      className="group bg-black/50 hover:bg-black/75 border border-[#C9A24A]/60 hover:border-[#C9A24A] backdrop-blur-md rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 shadow-xl hover:shadow-[#C9A24A]/30 cursor-default min-h-[100px]"
                    >
                      <Icon className="w-7 h-7 text-[#C9A24A] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                      <span className="font-inter text-[12px] font-medium text-white leading-tight">
                        {service.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CURSIVE SCRIPT TAGLINE WITH GOLD UNDERLINE FLOURISH */}
              <div className="pt-3">
                <p className="font-cursive text-[34px] sm:text-[44px] text-[#C9A24A] tracking-wide text-left drop-shadow-md leading-none">
                  Your Vision . Our Expertise
                </p>
                <div className="w-52 h-[1.5px] bg-gradient-to-r from-[#C9A24A] via-[#C9A24A]/60 to-transparent mt-1.5" />
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: FLOATING CREAM LOGIN CARD */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-[450px] bg-[#F4F2EC] rounded-[28px] p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] text-[#0A1813] border border-white/60 relative overflow-hidden transition-all">
              
              {/* Card Header with Centered Official Logo (Cropped scale-[1.14] to eliminate outer white ring) */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] mx-auto rounded-full overflow-hidden flex items-center justify-center bg-black shadow-md">
                  <img
                    src={logoImg}
                    alt="Shivarivel Official Logo"
                    className="w-full h-full object-cover scale-[1.14]"
                  />
                </div>
                
                <h2 className="font-cinzel text-[22px] sm:text-[24px] font-bold tracking-[0.18em] text-[#0A1813] uppercase mt-2">
                  SHIVARIVEL
                </h2>
                <p className="font-inter text-[11px] font-extrabold tracking-[0.3em] text-[#0A1813] uppercase">
                  CONSTRUCTION &amp; INTERIORS
                </p>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="h-[1px] w-6 bg-[#C9A24A]/40" />
                  <span className="font-inter text-[10px] text-gray-500 font-medium">Enterprise Construction Command Center &amp; Site ERP</span>
                  <span className="h-[1px] w-6 bg-[#C9A24A]/40" />
                </div>

                <div className="pt-3">
                  <h3 className="font-playfair text-[30px] sm:text-[34px] font-semibold text-[#0A1813]">
                    Welcome Back!
                  </h3>
                  <p className="font-inter text-[13px] text-gray-500 mt-1 mb-5">
                    Sign in to continue to your account
                  </p>
                </div>
              </div>

              {/* LOGIN FORM */}
              <form className="space-y-3.5" onSubmit={handleSubmit}>
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 bg-[#FCEEEE] border border-[#9E2A2B]/30 rounded-xl text-xs text-[#9E2A2B] font-semibold leading-relaxed flex items-start gap-2"
                  >
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#9E2A2B]" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* EMAIL FIELD WITH INNER LABEL */}
                <div className="bg-[#EBE7DE] border border-[#DFD9CE] rounded-[14px] px-4 py-2.5 flex items-center gap-3 focus-within:border-[#0A1813] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#0A1813]/20 transition-all">
                  <Mail className="w-[18px] h-[18px] text-[#525B62] shrink-0" />
                  <div className="flex-1">
                    <label
                      htmlFor="staff-email"
                      className="block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider leading-none"
                    >
                      Email Address
                    </label>
                    <input
                      id="staff-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@company.com"
                      autoComplete="email"
                      required
                      className="w-full bg-transparent text-[13px] font-medium text-[#0A1813] placeholder:text-gray-400 focus:outline-none pt-0.5"
                    />
                  </div>
                </div>

                {/* PASSWORD FIELD WITH INNER LABEL & EYE TOGGLE */}
                <div className="bg-[#EBE7DE] border border-[#DFD9CE] rounded-[14px] px-4 py-2.5 flex items-center gap-3 focus-within:border-[#0A1813] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#0A1813]/20 transition-all">
                  <Lock className="w-[18px] h-[18px] text-[#525B62] shrink-0" />
                  <div className="flex-1">
                    <label
                      htmlFor="staff-password"
                      className="block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider leading-none"
                    >
                      Password
                    </label>
                    <input
                      id="staff-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full bg-transparent text-[13px] font-medium text-[#0A1813] placeholder:text-gray-400 focus:outline-none pt-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#525B62] hover:text-[#0A1813] p-1 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD */}
                <div className="flex items-center justify-between text-[13px] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#0A1813]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#DFD9CE] text-[#0A1813] focus:ring-[#0A1813] accent-[#0A1813]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[12px] font-medium text-[#4B5563] hover:text-[#0A1813] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* PRIMARY SIGN IN BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[48px] bg-[#0A1813] hover:bg-[#152B23] active:bg-[#06120E] text-white font-inter text-[15px] font-semibold rounded-[14px] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-75 tracking-wide mt-3"
                >
                  {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR DIVIDER */}
              <div className="flex items-center gap-3 my-4 text-[11px] font-bold text-gray-400 uppercase">
                <div className="h-[1px] bg-[#DFD9CE] flex-1" />
                <span>OR</span>
                <div className="h-[1px] bg-[#DFD9CE] flex-1" />
              </div>

              {/* INSTANT EVALUATION SIGN-IN (Role Selection Buttons) */}
              <div className="space-y-2">
                <p className="text-[11px] text-gray-500 text-center font-medium">
                  Instant Evaluation Access:
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('Owner')}
                    className="h-[44px] bg-[#EBE7DE] hover:bg-[#E0DAD0] border border-[#C9A24A]/60 text-[#0A1813] font-inter text-[13px] font-bold rounded-[14px] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C9A24A]" />
                    <span>Owner / Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('Supervisor')}
                    className="h-[44px] bg-[#EBE7DE] hover:bg-[#E0DAD0] border border-[#DFD9CE] text-[#0A1813] font-inter text-[13px] font-bold rounded-[14px] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HardHat className="w-4 h-4 text-[#0A1813]" />
                    <span>Site Supervisor</span>
                  </button>
                </div>
              </div>

              {/* SECURITY NOTICE */}
              <div className="mt-5 text-center pt-3 border-t border-[#DFD9CE]">
                <p className="text-[10px] text-gray-400 font-medium">
                  Authorized staff access only • Public registration disabled by policy
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* 3. 4-COLUMN FOOTER BAR MATCHING HERO BANNER UI */}
      <footer className="relative z-10 bg-[#06120E]/90 backdrop-blur-md text-gray-200 py-3.5 px-6 sm:px-12 border-t border-[#C9A24A]/30 font-inter text-[12px] font-medium shadow-2xl">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-center md:text-left">
          
          {/* Website URL */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#C9A24A]" />
            <a href="https://www.shivarivelconstruction.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              www.shivarivelconstruction.com
            </a>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Contact Numbers */}
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span>+91 9443559885 &nbsp;|&nbsp; +91 7339457041</span>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Email Address */}
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-[#C9A24A]" />
            <a href="mailto:contact@shivarivelconstruction.com" className="hover:text-white transition-colors">
              contact@shivarivelconstruction.com
            </a>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Office Address */}
          <div className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-[#C9A24A] shrink-0" />
            <span>22/13, Vellalar East Street, Krishnancoil, Nagercoil, Kanniyakumari - 629001.</span>
          </div>

        </div>
      </footer>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#F4F2EC] border border-[#C9A24A]/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-[#0A1813] space-y-4 font-inter">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0A1813]/10 rounded-xl text-[#0A1813]">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-playfair text-[#0A1813]">
                Forgot Password Notice
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Public self-service password reset is disabled for security policies. Please contact your company ERP administrator or project engineer:
            </p>
            <div className="p-3 bg-white rounded-xl border border-[#DFD9CE] text-xs space-y-1.5 text-[#0A1813]">
              <p className="font-bold">Er. M. Velmurugan B.E. — 9443559885</p>
              <p className="font-bold">Er. V.A. Manian B.Tech. — 7339457041</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-[#0A1813] text-white text-xs font-semibold rounded-xl hover:bg-[#152B23] transition-colors cursor-pointer"
            >
              Understand &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
