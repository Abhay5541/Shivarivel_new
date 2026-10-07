import React from 'react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 transition-opacity duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-12 h-12 rounded-full border-2 border-[#C99A2E]/30 animate-ping absolute" />
        {/* Spinning brand spinner */}
        <div className="w-10 h-10 rounded-full border-3 border-[#E2DDD5] border-t-[#4A0E0E] border-r-[#C99A2E] animate-spin" />
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-[#6B6B6B] animate-pulse">
        Loading...
      </p>
    </div>
  );
};
