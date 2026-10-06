import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
} from 'lucide-react';
import { useMaterials } from '@/hooks/useProcurement';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SimpleMaterialModal } from '@/components/business/SimpleMaterialModal';

export const MaterialsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);

  React.useEffect(() => {
    if (searchParams.get('new') === '1' || searchParams.get('new') === 'true') {
      setIsAddMaterialOpen(true);
    }
  }, [searchParams]);

  const { data: materials = [], isLoading, isError, error, refetch } = useMaterials(search);

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] font-heading uppercase tracking-tight">
            Materials
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Manage reusable construction and interior materials
          </p>
        </div>

        <ActionButton
          icon={<Plus className="w-4 h-4" />}
          label="Add Material"
          onClick={() => setIsAddMaterialOpen(true)}
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search materials by name..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-[#E2DDD5] rounded-xl text-sm font-medium text-[#242424] placeholder:text-[#6B6B6B]/60 focus:outline-hidden focus:border-[#4A0E0E] focus:ring-2 focus:ring-[#4A0E0E]/10 transition-all shadow-2xs"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorState
          title="Failed to load materials"
          description={error instanceof Error ? error.message : 'Please check your connection.'}
          onRetry={refetch}
        />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8 text-[#6B6B6B]" />}
          title={search ? 'No materials match your search' : 'No materials added yet.'}
          description={
            search
              ? 'Try searching with a different term.'
              : 'Add your common construction materials like Cement, Sand, Tiles, or Paint.'
          }
          actionLabel="Add Material"
          onAction={() => setIsAddMaterialOpen(true)}
        />
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-2xl overflow-hidden shadow-xs divide-y divide-[#E2DDD5]">
          {materials.map((material) => (
            <div
              key={material.id}
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-[#F7F5F0]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#4A0E0E] shrink-0 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#242424]">
                    {material.name}
                  </h2>
                  <span className="text-xs text-[#6B6B6B]">
                    Unit: <strong className="text-[#242424] font-semibold">{material.unit}</strong>
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs font-bold text-[#4A0E0E]">
                {material.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Material Modal */}
      <SimpleMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
      />
    </div>
  );
};
