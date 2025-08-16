import React, { useState } from 'react';
import { Device, Channel, CameraStatus } from '../types';
import ChannelItem from './ChannelItem';

interface DeviceCardProps {
    device: Device;
    divisionName: string;
    onActionClick: (channel: Channel) => void;
    onDeleteDevice: (deviceId: number) => void;
    onEditDevice: (device: Device) => void;
    onAddChannel: (deviceId: number) => void;
    onEditChannel: (deviceId: number, channel: Channel) => void;
    onDeleteChannel: (deviceId: number, channelId: number) => void;
    onAutoCreateChannels: (deviceId: number) => void;
    onOpenLogbook: (channel: Channel) => void;
    onStatusChange: (channelId: number, newStatus: CameraStatus) => void;
    isAutoCreating?: boolean;
    isFiltered: boolean;
    isAdmin: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ 
    device, 
    divisionName,
    onActionClick, 
    onDeleteDevice, 
    onEditDevice,
    onAddChannel,
    onEditChannel,
    onDeleteChannel,
    onAutoCreateChannels,
    onOpenLogbook,
    onStatusChange,
    isAutoCreating,
    isFiltered,
    isAdmin
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Sort channels alphabetically with numeric collation to ensure a stable order (e.g., "Cam 1", "Cam 2", "Cam 10").
    const sortedChannels = React.useMemo(() => {
        return [...device.channels].sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [device.channels]);
    
    const hasOfflineCamera = sortedChannels.some(c => c.status === CameraStatus.Offline);
    const availableChannels = device.channel_count - device.channels.length;

    return (
        <div className="bg-white dark:bg-acotubo-dark-surface rounded-xl shadow-lg flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-200 dark:border-acotubo-dark-border/40">
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-5 relative bg-gradient-to-br from-gray-700 to-acotubo-dark dark:from-acotubo-dark-surface dark:to-acotubo-dark-bg text-white flex justify-between items-start cursor-pointer group rounded-t-xl"
                role="button"
                aria-expanded={isExpanded}
                aria-controls={`device-channels-${device.id}`}
            >
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white dark:text-acotubo-dark-text-primary truncate">{device.name}</h3>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-4 h-4 text-white/70 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-300 dark:text-acotubo-dark-text-secondary truncate">{device.location}</p>
                    <p className="text-xs text-gray-400 dark:text-acotubo-dark-text-secondary/80 mt-1 truncate">
                        <span className="font-medium opacity-80">{device.type} ({device.channels.length}/{device.channel_count})</span>
                        <span className="mx-1.5 text-gray-500 dark:text-gray-600">•</span>
                        <span className="font-medium opacity-80">Divisão: {divisionName}</span>
                    </p>
                </div>
                 <div className="flex items-center flex-shrink-0 ml-2">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="relative" title={hasOfflineCamera ? 'Este dispositivo possui câmeras offline' : 'Todas as câmeras estão online'}>
                            <span className={`block w-3 h-3 rounded-full ${hasOfflineCamera ? 'bg-red-500' : 'bg-green-500'}`}></span>
                             <span className={`absolute inline-flex h-full w-full rounded-full ${hasOfflineCamera ? 'bg-red-400' : 'bg-green-400'} opacity-75 animate-ping`}></span>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="relative z-10 flex items-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEditDevice(device); }}
                              className="text-gray-300 hover:text-white dark:text-acotubo-dark-text-secondary dark:hover:text-acotubo-dark-text-primary p-2 rounded-full hover:bg-white/10 transition-colors"
                              aria-label={`Editar dispositivo ${device.name}`}
                              >
                                <span role="img" aria-label="Editar">✏️</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteDevice(device.id); }}
                              className="text-gray-300 hover:text-acotubo-red dark:text-acotubo-dark-text-secondary dark:hover:text-acotubo-orange p-2 rounded-full hover:bg-white/10 transition-colors"
                              aria-label={`Excluir dispositivo ${device.name}`}
                              >
                                <span role="img" aria-label="Excluir">🗑️</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {isAdmin && availableChannels > 0 && (
                <div className="px-5 py-1.5 text-xs text-center font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-b border-t border-gray-100 dark:border-acotubo-dark-border/50">
                    {availableChannels} {availableChannels === 1 ? 'canal disponível' : 'canais disponíveis'}
                </div>
            )}

            <div
                id={`device-channels-${device.id}`}
                className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-2">
                    {sortedChannels.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-acotubo-dark-border">
                            {sortedChannels.map((channel, index) => (
                                <ChannelItem
                                    key={channel.id}
                                    channel={channel}
                                    isFirst={index === 0}
                                    isLast={index === sortedChannels.length - 1}
                                    onActionClick={onActionClick}
                                    onEdit={(ch) => onEditChannel(device.id, ch)}
                                    onDelete={(chId) => onDeleteChannel(device.id, chId)}
                                    onOpenLogbook={onOpenLogbook}
                                    onStatusChange={onStatusChange}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-8 text-gray-500 dark:text-acotubo-dark-text-secondary">
                             <span className="text-4xl" role="img" aria-label="Nenhum canal">🧐</span>
                            <p className="text-sm mt-2 font-medium">Nenhum canal cadastrado.</p>
                            {isAdmin && <p className="text-xs mt-1">Use os botões abaixo para adicionar.</p>}
                        </div>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="p-2 border-t border-gray-100 dark:border-acotubo-dark-border bg-gray-50 dark:bg-acotubo-dark-surface/50 rounded-b-xl">
                     {availableChannels > 0 ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => onAddChannel(device.id)}
                                disabled={isAutoCreating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-acotubo-dark-border/50 text-gray-600 dark:text-acotubo-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-acotubo-dark-border hover:text-gray-800 dark:hover:text-acotubo-dark-text-primary focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span role="img" aria-label="Adicionar">➕</span>
                                Adicionar Canal
                            </button>
                            <button
                                onClick={() => onAutoCreateChannels(device.id)}
                                disabled={isAutoCreating}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-acotubo-dark-border/50 text-gray-600 dark:text-acotubo-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-acotubo-dark-border hover:text-gray-800 dark:hover:text-acotubo-dark-text-primary focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isAutoCreating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <span role="img" aria-label="Automático">🤖</span>
                                        Criar Auto ({availableChannels})
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <p className="text-center text-xs text-gray-500 dark:text-acotubo-dark-text-secondary py-2">
                            Todos os canais estão em uso.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeviceCard;