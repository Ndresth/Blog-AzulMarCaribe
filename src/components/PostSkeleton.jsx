import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="col-md-6 col-lg-4">
      <div className="post-card" aria-hidden="true">
        <div className="skeleton" style={{ aspectRatio: '16 / 10', borderRadius: 0 }}></div>
        <div className="body">
          <div className="skeleton mb-3" style={{ height: 22, width: '90%' }}></div>
          <div className="skeleton mb-2" style={{ height: 22, width: '60%' }}></div>
          <div className="skeleton mb-2 mt-2" style={{ height: 12, width: '100%' }}></div>
          <div className="skeleton mb-4" style={{ height: 12, width: '80%' }}></div>
          <div className="skeleton" style={{ height: 12, width: '45%' }}></div>
        </div>
      </div>
    </div>
  );
}
