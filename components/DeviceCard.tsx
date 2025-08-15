import React from 'react';
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
    // Sort channels alphabetically with numeric collation to ensure a stable order (e.g., "Cam 1", "Cam 2", "Cam 10").
    // This prevents the list from reordering when a channel's status changes.
    const sortedChannels = React.useMemo(() => {
        return [...device.channels].sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [device.channels]);

    const availableChannels = device.channel_count - device.channels.length;

    return (
        <div className="bg-white dark:bg-acotubo-dark-surface rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-200 dark:border-acotubo-dark-border/40">
            <div className="p-5 bg-acotubo-dark dark:bg-acotubo-dark-bg text-white flex justify-between items-start">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white dark:text-acotubo-dark-text-primary truncate">{device.name}</h3>
                    <p className="text-sm text-gray-300 dark:text-acotubo-dark-text-secondary truncate">{device.location}</p>
                    <p className="text-xs text-gray-400 dark:text-acotubo-dark-text-secondary/80 mt-1 truncate">
                        <span className="font-medium opacity-80">{device.type} ({device.channels.length}/{device.channel_count})</span>
                        <span className="mx-1.5 text-gray-500 dark:text-gray-600">•</span>
                        <span className="font-medium opacity-80">Divisão: {divisionName}</span>
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex items-center flex-shrink-0 ml-2">
                        <button 
                          onClick={() => onEditDevice(device)}
                          className="text-gray-300 hover:text-white dark:text-acotubo-dark-text-secondary dark:hover:text-acotubo-dark-text-primary p-2 rounded-full hover:bg-white/10 transition-colors"
                          aria-label={`Editar dispositivo ${device.name}`}
                          >
                            <span role="img" aria-label="Editar">✏️</span>
                        </button>
                        <button 
                          onClick={() => onDeleteDevice(device.id)}
                          className="text-gray-300 hover:text-acotubo-red dark:text-acotubo-dark-text-secondary dark:hover:text-acotubo-orange p-2 rounded-full hover:bg-white/10 transition-colors"
                          aria-label={`Excluir dispositivo ${device.name}`}
                          >
                            <span role="img" aria-label="Excluir">🗑️</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-grow p-2">
                {sortedChannels.length > 0 ? (
                    <ul className="divide-y divide-gray-100 dark:divide-acotubo-dark-border">
                        {sortedChannels.map(channel => (
                            <ChannelItem
                                key={channel.id}
                                channel={channel}
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
                        <p className="text-sm">Nenhum canal cadastrado.</p>
                        {isAdmin && <p className="text-xs">Use os botões abaixo para adicionar.</p>}
                    </div>
                )}
            </div>
            {isAdmin && (
                <div className="p-2 border-t border-gray-100 dark:border-acotubo-dark-border bg-gray-50 dark:bg-acotubo-dark-surface/50">
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