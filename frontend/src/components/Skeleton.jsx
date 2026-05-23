import React from 'react';
import './Skeleton.css';

export const SkeletonLine = ({ width = '100%', height = '20px', className = '' }) => (
  <div className={`skeleton-line ${className}`} style={{ width, height }}></div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <SkeletonLine width="60%" height="24px" className="mb-2" />
    <SkeletonLine width="40%" height="16px" className="mb-4" />
    <SkeletonLine width="100%" height="12px" className="mb-1" />
    <SkeletonLine width="90%" height="12px" className="mb-1" />
    <SkeletonLine width="95%" height="12px" />
  </div>
);

export const SkeletonDashboard = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-grid">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div style={{ marginTop: '2rem' }}>
      <SkeletonLine width="200px" height="28px" className="mb-4" />
      <SkeletonCard className="mb-2" />
      <SkeletonCard className="mb-2" />
      <SkeletonCard />
    </div>
  </div>
);
