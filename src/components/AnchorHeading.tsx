import React from 'react';

interface AnchorHeadingProps {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AnchorHeading({ as: Component, id, children, className = '' }: AnchorHeadingProps) {
  return (
    <Component id={id} className={className}>
      <span className="heading-wrapper">
        {children}
        <a
          href={`#${id}`}
          className="anchor-link"
          aria-label={`Link to ${typeof children === 'string' ? children : id}`}
        >
          ¶
        </a>
      </span>
    </Component>
  );
} 