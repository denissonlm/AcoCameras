import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { CameraStatus, ActionType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
    stats: any;
    onStatusFilterChange: (status: CameraStatus | null) => void;
    activeStatusFilter: CameraStatus | null;
    onDivisionFilterChange: (divisionId: number | null) => void;
    activeDivisionFilter: number | null;
    onActionFilterChange: (action: ActionType | null) => void;
    activeActionFilter: ActionType | null;
}

const STATUS_COLORS = {
  [CameraStatus.Online]: '#10B981', 
  [CameraStatus.Offline]: '#EF4444', 
};

const ACTION_COLORS = {
  [ActionType.Compras]: '#3B82F6', // blue-500
  [ActionType.Obras]: '#F97316',   // orange-500
  [ActionType.RIF]: '#8B5CF6',      // violet-500
};

const DIVISION_COLORS = ['#3B82F6', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6', '#6D28D9'];

const RADIAN = Math.PI / 180;
const CustomizedPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name, value, activeStatusFilter, activeActionFilter, fill, theme }: any) => {
    if (percent === 0) return null;
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const sx = cx + (outerRadius + 8) * cos;
    const sy = cy + (outerRadius + 8) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    const isActive = activeStatusFilter !== undefined
        ? !activeStatusFilter || activeStatusFilter === name
        : activeActionFilter !== undefined
            ? !activeActionFilter || activeActionFilter === name
            : true;

    const textColor = theme === 'dark' ? '#F4F4F5' : '#333';
    const secondaryTextColor = theme === 'dark' ? '#A1A1AA' : '#666';
    const lineColor = theme === 'dark' ? '#A1A1AA' : '#999';

    // Abbreviate long action names to prevent them from being cut off
    let displayName = name;
    if (name === ActionType.Compras) displayName = 'Req. Compras';
    if (name === ActionType.Obras) displayName = 'Obras';
    if (name === ActionType.RIF) displayName = 'RIF';

    return (
        <g style={{ opacity: isActive ? 1 : 0.4, transition: 'opacity 0.3s' }}>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={lineColor} fill="none" />
            <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill={textColor} dy={-4} fontSize="13" fontWeight="600">
                {displayName}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={12} textAnchor={textAnchor} fill={secondaryTextColor} fontSize="11">
                {`${value} (${(percent * 100).toFixed(0)}%)`}
            </text>
        </g>
    );
};

const StatCard: React.FC<{ 
    title: string; 
    value: number | string;
    icon: string; 
    color: string; 
    onClick?: () => void; 
    isActive?: boolean; 
    isDimmed?: boolean;
    breakdown?: { nvr: number, dvr: number } 
}> = ({ title, value, icon, color, onClick, isActive, isDimmed, breakdown }) => (
    <div 
        onClick={onClick} 
        className={`flex items-start p-4 bg-white dark:bg-acotubo-dark-surface rounded-xl shadow-md border border-gray-200 dark:border-acotubo-dark-border/40 transition-all duration-300 ${onClick ? 'hover:shadow-xl hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'} ${isActive ? 'ring-2' : ''} ring-offset-2 dark:ring-offset-acotubo-dark-bg ${isDimmed ? 'opacity-40' : 'opacity-100'}`} 
        style={{'--tw-ring-color': color} as React.CSSProperties}
    >
        <div className="flex items-center justify-center w-12 h-12 rounded-full mr-4 shrink-0" style={{ backgroundColor: `${color}2A` }}>
            <span className="text-2xl" role="img">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 dark:text-acotubo-dark-text-secondary truncate">{title}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-2xl font-bold text-gray-900 dark:text-acotubo-dark-text-primary">{value}</p>
                 {breakdown && (
                    <p className="text-xs font-medium text-gray-500 dark:text-acotubo-dark-text-secondary/80 whitespace-nowrap">
                        ({breakdown.nvr} NVRs · {breakdown.dvr} DVRs)
                    </p>
                )}
            </div>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ stats, onStatusFilterChange, activeStatusFilter, onDivisionFilterChange, activeDivisionFilter, onActionFilterChange, activeActionFilter }) => {
    const { theme } = useTheme();

    if (!stats) {
        return null; // or a loading indicator
    }

    const { totals, statusChartData, actionChartData, divisionChartData, deviceStats } = stats;
    
    const anyFilterActive = activeStatusFilter !== null || activeDivisionFilter !== null || activeActionFilter !== null;

    const clearFilters = () => {
        onStatusFilterChange(null);
        onDivisionFilterChange(null);
        onActionFilterChange(null);
    }
    
    const labelTextColor = theme === 'dark' ? '#F4F4F5' : '#1F2937';

    const tooltipContentStyle = {
        backgroundColor: theme === 'dark' ? '#27272A' : '#FFFFFF',
        borderColor: theme === 'dark' ? '#3F3F46' : '#E5E7EB',
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    };

    const tooltipItemStyle = {
      color: labelTextColor
    };

    // Dynamic height for the division bar chart to enable scrolling
    const divisionChartHeight = Math.max(280, (divisionChartData.length || 0) * 35);


    return (
        <div className="mb-8 flex flex-col gap-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard 
                    title="Total de Câmeras" 
                    value={totals.channels} 
                    icon="🎥"
                    color="#6366F1"
                    isActive={!anyFilterActive}
                    onClick={clearFilters}
                />
                <StatCard 
                    title="Dispositivos"
                    value={deviceStats.total}
                    icon="🗄️"
                    color="#8B5CF6"
                    breakdown={{ nvr: deviceStats.nvr, dvr: deviceStats.dvr }}
                />
                 <StatCard 
                    title="Canais Disponíveis" 
                    value={totals.availableChannels} 
                    icon="➕"
                    color="#14B8A6"
                />
                <StatCard 
                    title="Online" 
                    value={totals.online} 
                    icon="✅"
                    color={STATUS_COLORS.Online}
                    isActive={activeStatusFilter === CameraStatus.Online}
                    isDimmed={anyFilterActive && activeStatusFilter !== CameraStatus.Online}
                    onClick={() => onStatusFilterChange(CameraStatus.Online)}
                />
                <StatCard 
                    title="Offline" 
                    value={totals.offline} 
                    icon="🔴"
                    color={STATUS_COLORS.Offline}
                    isActive={activeStatusFilter === CameraStatus.Offline}
                    isDimmed={anyFilterActive && activeStatusFilter !== CameraStatus.Offline}
                    onClick={() => onStatusFilterChange(CameraStatus.Offline)}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Status Pie Chart */}
                <div className="bg-white dark:bg-acotubo-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-acotubo-dark-border/40 flex flex-col items-center justify-center transition-opacity duration-300" style={{opacity: activeDivisionFilter !== null ? 0.4 : 1}}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-acotubo-dark-text-primary mb-2">Status Geral das Câmeras</h3>
                     {totals.channels > 0 ? (
                        <div className="w-full h-[300px] relative">
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold text-gray-900 dark:text-acotubo-dark-text-primary">{totals.channels}</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-acotubo-dark-text-secondary">Câmeras</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={<CustomizedPieLabel activeStatusFilter={activeStatusFilter} theme={theme} />}
                                        innerRadius={60}
                                        outerRadius={85}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        onClick={(data: any) => onStatusFilterChange(data.name)}
                                    >
                                        {statusChartData.map((entry) => (
                                            <Cell 
                                                key={`cell-${entry.name}`} 
                                                fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} 
                                                stroke={theme === 'dark' ? '#27272A' : '#fff'}
                                                strokeWidth={3}
                                                className="cursor-pointer outline-none"
                                                style={{ transition: 'opacity 0.3s ease', opacity: (!activeStatusFilter || activeStatusFilter === entry.name) ? 1 : 0.3 }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} Câmeras`, name]} contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-acotubo-dark-text-secondary">Sem dados para exibir</div>
                    )}
                </div>
                
                {/* Division Bar Chart */}
                <div className="bg-white dark:bg-acotubo-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-acotubo-dark-border/40 flex flex-col transition-opacity duration-300" style={{opacity: activeStatusFilter !== null ? 0.4 : 1}}>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-acotubo-dark-text-primary mb-6 text-center">Câmeras por Divisão</h3>
                     {divisionChartData.length > 0 ? (
                        <div className="w-full h-[300px] overflow-y-auto pr-2">
                            <ResponsiveContainer width="100%" height={divisionChartHeight}>
                                <BarChart data={divisionChartData} layout="vertical" margin={{ top: 5, right: 40, left: 30, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#3F3F46' : '#E5E7EB'} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        tickLine={false} 
                                        axisLine={false} 
                                        width={150}
                                        tick={{ fill: labelTextColor, fontSize: '12px' }}
                                    />
                                    <Tooltip cursor={{fill: 'rgba(206, 206, 206, 0.2)'}} contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle}/>
                                    <Bar dataKey="value" name="Câmeras" barSize={20} radius={[0, 8, 8, 0]} onClick={(data: any) => onDivisionFilterChange(data.id)}>
                                        <LabelList dataKey="value" position="right" offset={8} style={{ fill: labelTextColor, fontSize: '12px', fontWeight: '500' }} />
                                        {divisionChartData.map((entry, index) => (
                                          <Cell 
                                            key={`cell-${entry.id}`} 
                                            cursor="pointer" 
                                            fill={DIVISION_COLORS[index % DIVISION_COLORS.length]}
                                            style={{ transition: 'opacity 0.3s ease', opacity: (!activeDivisionFilter || activeDivisionFilter === entry.id) ? 1 : 0.3 }}
                                          />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-acotubo-dark-text-secondary">Sem dados de divisão para exibir</div>
                     )}
                </div>

                {/* Action Pie Chart */}
                <div className="bg-white dark:bg-acotubo-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-acotubo-dark-border/40 flex flex-col items-center justify-center transition-opacity duration-300" style={{opacity: activeStatusFilter === CameraStatus.Online || activeDivisionFilter !== null ? 0.4 : 1}}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-acotubo-dark-text-primary mb-2">Ações Corretivas (Offline)</h3>
                     {totals.problems > 0 && actionChartData.length > 0 ? (
                        <div className="w-full h-[300px] relative">
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold text-gray-900 dark:text-acotubo-dark-text-primary">{totals.problems}</span>
                                <span className="text-sm font-medium text-gray-500 dark:text-acotubo-dark-text-secondary">Problemas</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                                    <Pie
                                        data={actionChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={<CustomizedPieLabel activeActionFilter={activeActionFilter} theme={theme} />}
                                        innerRadius={60}
                                        outerRadius={85}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                        onClick={(data: any) => onActionFilterChange(data.name)}
                                    >
                                        {actionChartData.map((entry) => (
                                            <Cell 
                                                key={`cell-action-${entry.name}`} 
                                                fill={ACTION_COLORS[entry.name as keyof typeof ACTION_COLORS] || '#6b7280'} 
                                                stroke={theme === 'dark' ? '#27272A' : '#fff'}
                                                strokeWidth={3}
                                                className="cursor-pointer outline-none"
                                                style={{ transition: 'opacity 0.3s ease', opacity: (!activeActionFilter || activeActionFilter === entry.name) ? 1 : 0.3 }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} Câmeras`, name]} contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-acotubo-dark-text-secondary">Nenhuma ação corretiva registrada.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;