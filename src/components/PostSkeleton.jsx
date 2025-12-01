import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm border-0" aria-hidden="true">
        <div className="skeleton skeleton-img"></div>
        <div className="card-body">
          <div className="skeleton skeleton-text" style={{width: '30%'}}></div>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text" style={{width: '70%'}}></div>
          <div className="skeleton skeleton-text" style={{width: '40%', marginTop: '15px', height: '30px', borderRadius: '20px'}}></div>
        </div>
      </div>
    </div>
  );
}