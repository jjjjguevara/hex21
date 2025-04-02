'use client';

export interface ContentPaneProps {
  children: React.ReactNode;
  className?: string;
  width?: 'narrow' | 'wide';
  spacing?: 'none' | 'small' | 'normal';
}

export default function ContentPane({ 
  children, 
  className = '', 
  width = 'narrow',
  spacing = 'normal' 
}: ContentPaneProps) {
  const spacingClasses = {
    none: 'py-0',
    small: 'py-2',
    normal: 'py-8'
  };

  return (
    <div className={`mx-auto ${spacingClasses[spacing]} px-4 ${width === 'narrow' ? 'max-w-4xl' : 'max-w-7xl'}`}>
      <div 
        className={`
          bg-white dark:bg-gray-900 
          shadow-md dark:shadow-gray-900/30
          border border-gray-200 dark:border-gray-800 
          rounded-lg 
          p-3 md:p-4
          text-gray-900 dark:text-gray-100
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
} 