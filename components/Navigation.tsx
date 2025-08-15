import React from 'react';

type View = 'dashboard' | 'layout';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavButton: React.FC<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 font-semibold text-sm transition-colors rounded-t-lg border-b-2 ${
                isActive 
                ? 'text-acotubo-red dark:text-acotubo-orange border-acotubo-red dark:border-acotubo-orange bg-gray-200 dark:bg-acotubo-dark-bg' 
                : 'text-gray-600 dark:text-acotubo-dark-text-secondary border-transparent hover:text-acotubo-dark dark:hover:text-acotubo-dark-text-primary hover:bg-gray-200/50 dark:hover:bg-white/5'
            }`}
            aria-current={isActive ? 'page' : undefined}
        >
            <span role="img" aria-label={label}>{icon}</span>
            {label}
        </button>
    )
}


const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="bg-white dark:bg-acotubo-dark-surface border-b border-gray-200 dark:border-acotubo-dark-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-2xl">
            <nav className="flex space-x-2" aria-label="Tabs">
                <NavButton
                    label="Dashboard"
                    icon="🖥️"
                    isActive={currentView === 'dashboard'}
                    onClick={() => onViewChange('dashboard')}
                />
                 <NavButton
                    label="Layout"
                    icon="🗺️"
                    isActive={currentView === 'layout'}
                    onClick={() => onViewChange('layout')}
                />
            </nav>
        </div>
    </div>
  );
};

export default Navigation;