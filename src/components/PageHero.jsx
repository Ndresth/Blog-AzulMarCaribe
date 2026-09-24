import React from 'react';

export default function PageHero({ eyebrow, title, children }) {
  return (
    <section className="page-hero">
      <div className="container" style={{ maxWidth: 900 }}>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="mb-3">{title}</h1>
        {children && <p className="mb-0">{children}</p>}
      </div>
    </section>
  );
}
