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
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/useSettings';
import {
  companyProfileFormSchema,
  type CompanyProfileFormData,
} from '@/types/settings';

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
      <PageContainer>
        <div className="h-40 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
            <RotateCw className="w-5 h-5 animate-spin text-[#C99A2E]" />
            <span>Loading company profile...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <div className="bg-[#FDEDEC] border border-[#E02424]/30 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
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
    <PageContainer>
      <div className="mb-4">
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#4A0E0E] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings Overview</span>
        </button>
      </div>

      <PageHeader title="Company Profile" />

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#EAF5EE] border border-[#1E6B37]/30 flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#1E6B37] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#1E6B37]">Profile Saved</h4>
            <p className="text-xs text-[#1E6B37]/90 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#FDEDEC] border border-[#E02424]/30 flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-[#E02424] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#E02424]">Update Failed</h4>
            <p className="text-xs text-[#E02424]/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Business Identity */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-[#E2DDD5]">
            <Building className="w-5 h-5 text-[#4A0E0E]" />
            <div>
              <h2 className="text-sm font-bold text-[#242424] font-heading uppercase tracking-wider">
                1. Business Identity
              </h2>
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
                className="h-10 text-sm"
              />
            </FormField>

            <FormField
              label="Proprietor / Owner Name"
              required
              error={errors.owner_name}
            >
              <div className="relative">
                <User className="w-4 h-4 text-[#8C8880] absolute left-3 top-3" />
                <Input
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  placeholder="e.g. K. Senthil Nathan"
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Card 2: Contact Information */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-[#E2DDD5]">
            <Phone className="w-5 h-5 text-[#C99A2E]" />
            <div>
              <h2 className="text-sm font-bold text-[#242424] font-heading uppercase tracking-wider">
                2. Contact Information
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Official Email"
              required
              error={errors.email}
            >
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C8880] absolute left-3 top-3" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@shivarivel.com"
                  className="pl-9 h-10 text-sm font-mono"
                />
              </div>
            </FormField>

            <FormField
              label="Primary Phone Number"
              required
              error={errors.phone}
            >
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C8880] absolute left-3 top-3" />
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 94431 87654"
                  className="pl-9 h-10 text-sm font-mono"
                />
              </div>
            </FormField>

            <FormField
              label="Alternate Phone Number (Optional)"
              error={errors.alternate_phone}
              className="md:col-span-2"
            >
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C8880] absolute left-3 top-3" />
                <Input
                  value={formData.alternate_phone || ''}
                  onChange={(e) => handleChange('alternate_phone', e.target.value)}
                  placeholder="+91 98421 23344"
                  className="pl-9 h-10 text-sm font-mono"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Card 3: Registered Business Address */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-[#E2DDD5]">
            <MapPin className="w-5 h-5 text-[#1E6B37]" />
            <div>
              <h2 className="text-sm font-bold text-[#242424] font-heading uppercase tracking-wider">
                3. Registered Business Address
              </h2>
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
                className="w-full px-3 py-2 text-sm bg-white border border-[#E2DDD5] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#C99A2E] focus:border-[#C99A2E] transition-colors resize-none"
              />
            </FormField>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E2DDD5]">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/settings')}
            disabled={updateCompanyMutation.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={updateCompanyMutation.isPending}
            className="w-full sm:w-auto gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white shadow-xs px-6"
          >
            {updateCompanyMutation.isPending ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-[#C99A2E]" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
