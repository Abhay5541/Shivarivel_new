import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useMaterials, useCreateMaterial, useUpdateMaterial } from '@/hooks/useProcurement';
import { formatINR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  type Material,
  type MaterialFormData,
} from '@/types/procurement';

export const MaterialsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(MATERIAL_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>(MATERIAL_UNITS[0]);
  const [standardRate, setStandardRate] = useState<string>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: materials = [], isLoading, isError, error, refetch } = useMaterials(search, categoryFilter);
  const createMaterialMutation = useCreateMaterial();
  const updateMaterialMutation = useUpdateMaterial();

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setName('');
    setCategory(MATERIAL_CATEGORIES[0]);
    setUnit(MATERIAL_UNITS[0]);
    setStandardRate('');
    setDescription('');
    setStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setName(mat.name);
    setCategory(mat.category);
    setUnit(mat.unit);
    setStandardRate(mat.standard_rate !== null ? mat.standard_rate.toString() : '');
    setDescription(mat.description || '');
    setStatus(mat.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Material name is required');
      return;
    }

    const payload: MaterialFormData = {
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      standard_rate: standardRate ? parseFloat(standardRate) : null,
      description: description.trim() || null,
      status,
    };

    try {
      if (editingMaterial) {
        await updateMaterialMutation.mutateAsync({ id: editingMaterial.id, payload });
      } else {
        await createMaterialMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save material');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#242424] font-heading flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#4A0E0E]" />
            Materials Catalog
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Master reference database of construction materials, units of measure, and benchmark procurement rates
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      </div>

      {/* Scope Reminder Notice */}
      <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#6B6B6B]">
        <Layers className="w-4 h-4 text-[#C99A2E] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#242424]">Master Reference Catalog: </strong>
          Materials serve as standard items for speedy purchase entry and historical price tracking. In accordance with system boundaries, stock ledger balances and warehouse inventory valuations are excluded.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by material name, category, or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs placeholder:text-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
          />
        </div>

        {/* Category Filter Dropdown / Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[#E2DDD5] rounded-lg text-xs px-3 py-2 text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
          >
            <option value="all">All Categories ({materials.length})</option>
            {MATERIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Catalog View */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load materials"
          description={error instanceof Error ? error.message : 'Network error'}
          onRetry={() => refetch()}
        />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="No materials found"
          description="Register common site items like cement, TMT steel, M-sand, or plywood to speed up purchase entries."
          actionLabel="Add Material"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white p-4 rounded-xl border border-[#E2DDD5] shadow-xs flex flex-col justify-between hover:border-[#C99A2E]/60 transition-colors group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5] text-[#6B6B6B]">
                    {mat.category}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(mat)}
                    className="p-1 text-[#6B6B6B] hover:text-[#4A0E0E] opacity-70 group-hover:opacity-100 transition-opacity"
                    title="Edit Material"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-[#242424] leading-snug">
                  {mat.name}
                </h3>

                {mat.description && (
                  <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-[#E2DDD5]/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] uppercase block">Unit</span>
                  <span className="font-semibold text-[#242424]">{mat.unit}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#6B6B6B] uppercase block">Benchmark Rate</span>
                  <span className="font-mono font-bold text-[#242424]">
                    {mat.standard_rate ? formatINR(mat.standard_rate) : 'Variable'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightweight Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1">
              Material Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. UltraTech Super Cement 53 Grade (PPC)"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Indicative Benchmark Rate (₹)
              </label>
              <input
                type="number"
                step="any"
                value={standardRate}
                onChange={(e) => setStandardRate(e.target.value)}
                placeholder="e.g. 420"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs font-mono text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E] min-h-[44px]"
              >
                <option value="active">Active (Usable in purchases)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1">
              Specification / Grade / Quality Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High early strength Portland Pozzolana Cement conforming to IS 1489"
              className="w-full px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#4A0E0E]"
            />
          </div>

          <div className="pt-3 border-t border-[#E2DDD5] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-[#E2DDD5] rounded-lg text-xs font-semibold text-[#242424] hover:bg-[#F7F5F0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMaterialMutation.isPending || updateMaterialMutation.isPending}
              className="px-5 py-2 bg-[#4A0E0E] hover:bg-[#3D0B0B] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {editingMaterial ? 'Update Material' : 'Save Material'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default MaterialsPage;
