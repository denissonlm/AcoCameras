import React from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className, position = 'top' }) => {
    const positionClass = position === 'top'
        ? 'bottom-full mb-2'
        : 'top-full mt-2';

    return (
        <div className={`relative flex items-center group ${className}`}>
            {children}
            <div className={`absolute ${positionClass} w-max max-w-xs p-2 text-xs bg-gray-800 text-gray-100 dark:bg-acotubo-dark-surface dark:text-acotubo-dark-text-primary rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 border border-transparent dark:border-acotubo-dark-border`}>
                {content}
            </div>
        </div>
    );
};

export default Tooltip;