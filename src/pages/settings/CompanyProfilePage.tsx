import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Save,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/useSettings';
import {
  companyProfileFormSchema,
  type CompanyProfileFormData,
} from '@/types/settings';
import companyProfileBannerBg from '@/Asserts/company_profile_banner.png';

export function CompanyProfilePage() {
  const navigate = useNavigate();
  const { data: company, isLoading, isError, refetch } = useCompanySettings();
  const updateCompanyMutation = useUpdateCompanySettings();

  const [formData, setFormData] = useState<CompanyProfileFormData>({
    name: '',
    owner_name: '',
    address: '',
    phone: '',
    alternate_phone: '',
    email: '',
    website: '',
    gst_number: '',
    logo_url: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form state when query data loads
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        owner_name: company.owner_name || '',
        address: company.address || '',
        phone: company.phone || '',
        alternate_phone: company.alternate_phone || '',
        email: company.email || '',
        website: company.website || '',
        gst_number: company.gst_number || '',
        logo_url: company.logo_url || null,
      });
    }
  }, [company]);

  const handleChange = (field: keyof CompanyProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const validation = companyProfileFormSchema.safeParse(formData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[String(err.path[0])] = err.message;
        }
      });
      setErrors(errMap);
      return;
    }

    try {
      await updateCompanyMutation.mutateAsync(validation.data);
      setSuccessMessage('Company profile updated successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMessage('Company profile could not be updated. Please verify all details and try again.');
    }
  };

  if (isLoading) {
    return (
      <PageContainer className="pb-24">
        <div className="h-44 rounded-2xl bg-[#E2DDD5]/40 animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-36 rounded-2xl bg-white border border-[#E8E4DC] animate-pulse" />
          <div className="h-36 rounded-2xl bg-white border border-[#E8E4DC] animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="pb-24">
        <div className="bg-[#FDEDEC] border border-[#E02424]/30 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-[#E02424] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#242424] font-heading">
            Company profile could not be loaded
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-1 mb-4">
            Could not retrieve business profile information from the backend repository.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RotateCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-24 select-none">
      {/* 1. HERO BANNER (Company Profile Background Banner with Text) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E2DDD5]/70 bg-[#12100E] h-[145px] sm:h-[165px] md:h-[185px] mb-4 sm:mb-6">
        <img
          src={companyProfileBannerBg}
          alt="Company Profile Banner"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent sm:from-black/80 sm:via-black/35 sm:to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center h-full px-4 py-3 sm:p-6">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-white/80 hover:text-white transition-colors cursor-pointer mb-1 sm:mb-2 w-fit group"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Settings / Company Profile</span>
          </button>

          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold font-playfair text-white tracking-wide leading-tight sm:leading-normal">
            Company Profile
          </h1>
          <p className="text-[11px] sm:text-sm text-white/85 font-inter mt-0.5 sm:mt-1 max-w-[210px] sm:max-w-md leading-tight sm:leading-snug line-clamp-2">
            Update official entity identity, proprietor details, and registered corporate contact information.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-[#EAF5EE] border border-[#1E6B37]/30 flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-[#1E6B37] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#1E6B37]">Profile Saved</h4>
            <p className="text-xs text-[#1E6B37]/90 mt-0.5 break-words">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-[#FDEDEC] border border-[#E02424]/30 flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-[#E02424] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#E02424]">Update Failed</h4>
            <p className="text-xs text-[#E02424]/90 mt-0.5 break-words">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Card 1: Business Identity */}
        <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center gap-3 pb-3.5 sm:pb-4 mb-4 sm:mb-5 border-b border-[#F0EAE1]">
            <div className="w-10 h-10 rounded-full bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#242424] font-heading">
                1. Business Identity
              </h2>
              <p className="text-xs text-[#6B6B6B] truncate">
                Legal entity details and proprietor authority
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Company Name"
              required
              error={errors.name}
            >
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Shivarivel Construction & Interiors"
                className="h-11 rounded-xl text-sm border-[#E8E4DC] focus:border-[#5A0F12] focus:ring-1 focus:ring-[#5A0F12]/20"
              />
            </FormField>

            <FormField
              label="Proprietor / Owner Name"
              required
              error={errors.owner_name}
            >
              <div className="relative">
                <User className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  placeholder="e.g. K. Senthil Nathan"
                  className="pl-10 h-11 rounded-xl text-sm border-[#E8E4DC] focus:border-[#5A0F12] focus:ring-1 focus:ring-[#5A0F12]/20"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Card 2: Contact Information */}
        <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center gap-3 pb-3.5 sm:pb-4 mb-4 sm:mb-5 border-b border-[#F0EAE1]">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#242424] font-heading">
                2. Contact Information
              </h2>
              <p className="text-xs text-[#6B6B6B] truncate">
                Primary contact numbers and official corporate email
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Official Email"
              required
              error={errors.email}
            >
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@shivarivel.com"
                  className="pl-10 h-11 rounded-xl text-sm font-sans tabular-nums border-[#E8E4DC] focus:border-[#5A0F12] focus:ring-1 focus:ring-[#5A0F12]/20"
                />
              </div>
            </FormField>

            <FormField
              label="Primary Phone Number"
              required
              error={errors.phone}
            >
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 94431 87654"
                  className="pl-10 h-11 rounded-xl text-sm font-sans tabular-nums border-[#E8E4DC] focus:border-[#5A0F12] focus:ring-1 focus:ring-[#5A0F12]/20"
                />
              </div>
            </FormField>

            <FormField
              label="Alternate Phone Number (Optional)"
              error={errors.alternate_phone}
              className="md:col-span-2"
            >
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="tel"
                  value={formData.alternate_phone || ''}
                  onChange={(e) => handleChange('alternate_phone', e.target.value)}
                  placeholder="+91 98421 23344"
                  className="pl-10 h-11 rounded-xl text-sm font-sans tabular-nums border-[#E8E4DC] focus:border-[#5A0F12] focus:ring-1 focus:ring-[#5A0F12]/20"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Card 3: Registered Business Address */}
        <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center gap-3 pb-3.5 sm:pb-4 mb-4 sm:mb-5 border-b border-[#F0EAE1]">
            <div className="w-10 h-10 rounded-full bg-[#E8F8EE] text-[#1E7E34] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#242424] font-heading">
                3. Registered Business Address
              </h2>
              <p className="text-xs text-[#6B6B6B] truncate">
                Physical headquarters address displayed on official estimates, contracts, and invoices
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              label="Registered Business Address"
              required
              error={errors.address}
            >
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
                placeholder="14, South Car Street, Sankarankovil, Tenkasi District, Tamil Nadu - 627756"
                className="w-full px-3.5 py-3 text-sm bg-white border border-[#E8E4DC] rounded-xl text-[#242424] placeholder:text-[#8C867E] focus:outline-none focus:border-[#5A0F12] focus:ring-1 focus:ring-[#5A0F12]/20 transition-all resize-y min-h-[96px] leading-relaxed shadow-2xs"
              />
            </FormField>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 sm:pt-6 border-t border-[#F0EAE1]">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            disabled={updateCompanyMutation.isPending}
            className="h-11 sm:h-10 px-5 rounded-xl border border-[#E8E4DC] bg-white hover:bg-[#F7F5F0] text-xs sm:text-sm font-semibold text-[#6B6B6B] hover:text-[#242424] transition-all cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={updateCompanyMutation.isPending}
            className="h-11 sm:h-10 px-6 rounded-xl bg-[#5A0F12] hover:bg-[#43090B] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {updateCompanyMutation.isPending ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-[#C9A24A]" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
