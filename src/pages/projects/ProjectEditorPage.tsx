import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useEnquiries } from '@/hooks/useEnquiries';
import { useEstimates } from '@/hooks/useEstimates';
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useSupervisors } from '@/hooks/useBusinessLookups';
import { Button } from '@/components/ui/Button';
import {
  PROJECT_STATUSES,
  projectFormSchema,
  type ProjectFormData,
  type ProjectStatus,
} from '@/types/projects';

export const ProjectEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  // Existing project if editing
  const { data: existingProject, isLoading: isProjectLoading } = useProject(id);

  // Lookups
  const { data: customers = [] } = useCustomers();
  const { data: allEnquiries = [] } = useEnquiries();
  const { data: allEstimates = [] } = useEstimates();
  const { data: supervisors = [] } = useSupervisors();

  // Mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  // URL prefill parameters
  const paramCustomerId = searchParams.get('customer_id') || '';
  const paramEstimateId = searchParams.get('estimate_id') || '';
  const paramEnquiryId = searchParams.get('enquiry_id') || '';

  // Form State
  const [customerId, setCustomerId] = useState<string>(paramCustomerId);
  const [enquiryId, setEnquiryId] = useState<string>(paramEnquiryId);
  const [estimateId, setEstimateId] = useState<string>(paramEstimateId);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [siteAddress, setSiteAddress] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState<string>('');
  const [contractValue, setContractValue] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // If prefilling from estimate
  useEffect(() => {
    if (paramEstimateId && allEstimates.length > 0) {
      const est = allEstimates.find((e) => e.id === paramEstimateId);
      if (est) {
        setCustomerId(est.customer_id);
        setEstimateId(est.id);
        if (est.enquiry_id) setEnquiryId(est.enquiry_id);
        if (est.title && !name) setName(est.title);
        if (est.total_amount && !contractValue) setContractValue(est.total_amount.toString());
      }
    }
  }, [paramEstimateId, allEstimates, name, contractValue]);

  // Pre-fill if editing existing project
  useEffect(() => {
    if (existingProject) {
      setCustomerId(existingProject.customer_id);
      setEnquiryId(existingProject.enquiry_id || '');
      setEstimateId(existingProject.estimate_id || '');
      setName(existingProject.name);
      setDescription(existingProject.description || '');
      setSiteAddress(existingProject.site_address || '');
      setStatus(existingProject.status);
      setStartDate(existingProject.start_date || '');
      setExpectedEndDate(existingProject.expected_end_date || '');
      setContractValue(
        existingProject.contract_value !== null && existingProject.contract_value !== undefined
          ? existingProject.contract_value.toString()
          : ''
      );
      setAssignedTo(existingProject.assigned_to || '');
      setNotes(existingProject.notes || '');
    }
  }, [existingProject]);

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  // Customer-scoped enquiries
  const customerEnquiries = useMemo(() => {
    if (!customerId) return [];
    return allEnquiries.filter((e) => e.customer_id === customerId);
  }, [allEnquiries, customerId]);

  // Customer-scoped estimates
  const customerEstimates = useMemo(() => {
    if (!customerId) return [];
    return allEstimates.filter((e) => e.customer_id === customerId);
  }, [allEstimates, customerId]);

  // Auto-fill address if empty and customer has address
  useEffect(() => {
    if (selectedCustomer && !siteAddress && selectedCustomer.address) {
      setSiteAddress(selectedCustomer.address);
    }
  }, [selectedCustomer, siteAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payloadData: ProjectFormData = {
      name: name.trim(),
      customer_id: customerId,
      enquiry_id: enquiryId || null,
      estimate_id: estimateId || null,
      assigned_to: assignedTo || null,
      site_address: siteAddress.trim() || null,
      status,
      start_date: startDate || null,
      expected_end_date: expectedEndDate || null,
      contract_value: contractValue ? Number(contractValue) : null,
      description: description.trim() || null,
      notes: notes.trim() || null,
    };

    const validation = projectFormSchema.safeParse(payloadData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Please verify form fields';
      setFormError(firstError);
      return;
    }

    try {
      if (isEditing && id) {
        await updateProjectMutation.mutateAsync({ id, payload: payloadData });
        navigate(`/projects/${id}`);
      } else {
        const created = await createProjectMutation.mutateAsync(payloadData);
        navigate(`/projects/${created.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project. Please retry.';
      setFormError(msg);
    }
  };

  const isSaving = createProjectMutation.isPending || updateProjectMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(isEditing && id ? `/projects/${id}` : '/projects')}
          className="flex items-center text-xs font-semibold text-[#6B6B6B] hover:text-[#242424] transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {isEditing ? 'Back to Command Center' : 'Back to Projects'}
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEditing && id ? `/projects/${id}` : '/projects')}
            className="min-h-[44px] text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving || isProjectLoading}
            className="bg-[#4A0E0E] text-white hover:bg-[#380B0B] min-h-[44px] px-5 text-xs font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving Project...' : isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#242424] font-heading">
          {isEditing ? `Edit Project: ${existingProject?.project_code || ''}` : 'New Construction Project'}
        </h1>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 bg-[#4A0E0E]/5 border border-[#4A0E0E]/20 rounded-xl text-xs text-[#4A0E0E] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="font-medium">{formError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Project Identity & Customer */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <Building2 className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-sm text-[#242424] uppercase tracking-wider">
              Project Identification & Client Association
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Client / Customer <span className="text-[#4A0E0E]">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setEnquiryId('');
                  setEstimateId('');
                }}
                disabled={isEditing}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px] font-medium disabled:bg-[#F7F5F0]"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(+91 ${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Execution Status <span className="text-[#4A0E0E]">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px] font-medium"
              >
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
              Project Title / Name <span className="text-[#4A0E0E]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 3BHK Villa Complete Interior & Modular Kitchen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-3 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px] font-semibold text-[#242424]"
            />
          </div>

          {/* Linked Enquiry & Estimate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Linked Enquiry (Optional)
              </label>
              <select
                value={enquiryId}
                onChange={(e) => setEnquiryId(e.target.value)}
                disabled={!customerId}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px] disabled:bg-[#F7F5F0]"
              >
                <option value="">-- General Project / No linked enquiry --</option>
                {customerEnquiries.map((enq) => (
                  <option key={enq.id} value={enq.id}>
                    {(enq.description || 'Enquiry').slice(0, 45)}... ({enq.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Linked Commercial Estimate (Optional)
              </label>
              <select
                value={estimateId}
                onChange={(e) => {
                  setEstimateId(e.target.value);
                  const selEst = customerEstimates.find((est) => est.id === e.target.value);
                  if (selEst) {
                    if (selEst.total_amount && !contractValue) {
                      setContractValue(selEst.total_amount.toString());
                    }
                    if (selEst.title && !name) {
                      setName(selEst.title);
                    }
                  }
                }}
                disabled={!customerId}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px] disabled:bg-[#F7F5F0]"
              >
                <option value="">-- No linked estimate --</option>
                {customerEstimates.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.estimate_number} — {est.title || 'Estimate'} ({est.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Site Location & Timeline */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <MapPin className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-sm text-[#242424] uppercase tracking-wider">
              Site Location & Contract Schedule
            </h2>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
              Site Work Address
            </label>
            <input
              type="text"
              placeholder="e.g. Plot 42, Green Avenue, Anna Nagar, Madurai"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-3 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Execution Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Expected Completion Date
              </label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Contract Value (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                placeholder="e.g. 650000"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px] font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Operations & Supervisor Assignment */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#E2DDD5]/70 pb-3">
            <User className="w-4 h-4 text-[#C99A2E]" />
            <h2 className="font-bold text-sm text-[#242424] uppercase tracking-wider">
              Project Scope & Operational Details
            </h2>
          </div>

          {supervisors.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
                Assigned Field Supervisor
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-2.5 focus:border-[#4A0E0E] focus:outline-hidden min-h-[44px]"
              >
                <option value="">-- Unassigned / Company Direct Supervision --</option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.full_name} {sup.phone ? `(${sup.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
              Project Description & Scope Details
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Turnkey architectural interior execution, teak wood paneling, modular kitchen, and smart lighting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-3 focus:border-[#4A0E0E] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-1.5">
              Site Access & Operational Constraints Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Access permitted 8 AM to 7 PM. All material deliveries via Service Gate 2."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-white border border-[#E2DDD5] rounded-lg p-3 focus:border-[#4A0E0E] focus:outline-hidden"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
