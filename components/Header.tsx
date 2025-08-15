import React from 'react';
import Logo from './Logo';
import { useTheme } from '../contexts/ThemeContext';
import { useAdmin } from '../contexts/AdminContext';
import { CameraStatus, Device, Division } from '../types';

// This new component displays contextual information based on active filters.
const StorytellingHeader: React.FC<{
    stats: any;
    activeStatusFilter: CameraStatus | null;
    activeDivisionFilter: number | null;
    divisions: Division[];
    devices: Device[];
}> = ({ stats, activeStatusFilter, activeDivisionFilter, divisions, devices }) => {
    // Gracefully handle case where stats might not be ready
    if (!stats) {
        return null;
    }
    const { statusChartData, divisionChartData, totals } = stats;
    
    let story = "Clique em um status, em uma divisão no gráfico ou nos cartões para filtrar as informações...";
    let icon = "💡";

    if (activeStatusFilter && statusChartData && totals) {
        const data = statusChartData.find(d => d.name === activeStatusFilter);
        if (data && data.value > 0) {
            const percentage = totals.channels > 0 ? (data.value / totals.channels * 100).toFixed(0) : 0;
            switch(activeStatusFilter) {
                case CameraStatus.Online:
                    icon = '✅';
                    story = `${data.value} câmeras (${percentage}%) estão operando normalmente.`;
                    break;
                case CameraStatus.Offline:
                    icon = '🔴';
                    story = `${data.value} câmeras (${percentage}%) estão offline e requerem atenção.`;
                    break;
            }
        }
    } else if (activeDivisionFilter && divisionChartData && totals && devices) {
        const data = divisionChartData.find(d => d.id === activeDivisionFilter);
        const division = divisions.find(d => d.id === activeDivisionFilter);
         if (data && data.value > 0 && division) {
            const percentage = totals.channels > 0 ? (data.value / totals.channels * 100).toFixed(0) : 0;
            
            // New calculations for detailed division stats
            const devicesInDivision = devices.filter(d => d.division_id === activeDivisionFilter);
            const deviceCount = devicesInDivision.length;
            const offlineCount = devicesInDivision.flatMap(d => d.channels).filter(c => c.status === CameraStatus.Offline).length;

            icon = '🏢';
            
            let offlineText = offlineCount > 0 
                ? `, com ${offlineCount} offline.`
                : '.';

            story = `A divisão ${division.name} possui ${deviceCount} ${deviceCount === 1 ? 'dispositivo' : 'dispositivos'} com ${data.value} câmeras (${percentage}% do total)${offlineText}`;
         }
    }

    return (
        <div className="flex-grow mx-6 hidden lg:flex">
            <div className="flex items-center gap-3 w-full bg-gray-100 dark:bg-acotubo-dark-surface rounded-lg px-4 py-2 border border-transparent dark:border-acotubo-dark-border/50">
                <span className="text-xl" role="img" aria-label="insight icon">{icon}</span>
                <p className="text-sm text-gray-700 dark:text-acotubo-dark-text-secondary truncate" title={story}>
                    {story}
                </p>
            </div>
        </div>
    );
};


interface HeaderProps {
    onAddDeviceClick: () => void;
    onReportClick: () => void;
    onAdminClick: () => void;
    onManageDivisionsClick: () => void;
    stats: any;
    activeStatusFilter: CameraStatus | null;
    activeDivisionFilter: number | null;
    divisions: Division[];
    devices: Device[];
}

const Header: React.FC<HeaderProps> = ({ 
    onAddDeviceClick, 
    onReportClick, 
    onAdminClick,
    onManageDivisionsClick,
    stats,
    activeStatusFilter,
    activeDivisionFilter,
    divisions,
    devices,
}) => {
    const { theme, toggleTheme } = useTheme();
    const { isAdmin, logout } = useAdmin();

    return (
        <header className="bg-white dark:bg-acotubo-dark-surface border-b border-gray-200 dark:border-acotubo-dark-border sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-2xl">
                <div className="flex items-center justify-between h-24">
                    <div className="flex items-center">
                        <Logo />
                    </div>

                    <StorytellingHeader 
                        stats={stats} 
                        activeStatusFilter={activeStatusFilter}
                        activeDivisionFilter={activeDivisionFilter}
                        divisions={divisions}
                        devices={devices}
                    />

                    <div className="flex items-center space-x-3">
                         <button
                            onClick={toggleTheme}
                            className="p-2 h-10 w-10 flex items-center justify-center rounded-full text-gray-500 dark:text-acotubo-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange"
                            aria-label="Toggle theme"
                        >
                            <span className="text-2xl" role="img" aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>{theme === 'light' ? '🌙' : '☀️'}</span>
                        </button>
                        <button
                            onClick={onReportClick}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-acotubo-dark-border text-sm font-semibold rounded-md shadow-sm text-gray-700 dark:text-acotubo-dark-text-primary bg-white dark:bg-acotubo-dark-surface hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-bg focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors"
                        >
                            <span className="text-xl" role="img" aria-label="Relatório">📊</span>
                            <span className="hidden md:inline">Gerar Relatório</span>
                        </button>

                        <button
                            onClick={isAdmin ? logout : onAdminClick}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-acotubo-dark-border text-sm font-semibold rounded-md shadow-sm text-gray-700 dark:text-acotubo-dark-text-primary bg-white dark:bg-acotubo-dark-surface hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-bg focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors"
                        >
                            <span className="text-xl" role="img" aria-label={isAdmin ? 'Sair do Modo Admin' : 'Entrar no Modo Admin'}>{isAdmin ? '🔓' : '🔒'}</span>
                            <span className="hidden md:inline">{isAdmin ? 'Sair' : 'Modo Admin'}</span>
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    onClick={onManageDivisionsClick}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-acotubo-dark-border text-sm font-semibold rounded-md shadow-sm text-gray-700 dark:text-acotubo-dark-text-primary bg-white dark:bg-acotubo-dark-surface hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-bg focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors"
                                >
                                    <span className="text-xl" role="img" aria-label="Gerenciar Divisões">🏢</span>
                                    <span className="hidden md:inline">Divisões</span>
                                </button>
                                <button
                                    onClick={onAddDeviceClick}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-acotubo-red dark:bg-acotubo-orange hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-bg focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors"
                                >
                                    <span className="text-lg" role="img" aria-label="Adicionar">➕</span>
                                    <span className="hidden md:inline">Dispositivo</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;