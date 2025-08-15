import React, { useState } from 'react';
import { Device, Channel } from '../../types';

interface LayoutSidebarProps {
    devices: Device[];
    placedCameraIds: number[];
    isAdmin: boolean;
}

const DraggableChannel: React.FC<{ channel: Channel; device: Device; isPlaced: boolean; isAdmin: boolean; }> = ({ channel, device, isPlaced, isAdmin }) => {
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (isPlaced || !isAdmin) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("deviceId", device.id.toString());
        e.dataTransfer.setData("channelId", channel.id.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const isDraggable = !isPlaced && isAdmin;

    return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            className={`flex items-center justify-between p-2 rounded-md transition-colors ${isPlaced ? 'bg-gray-200 dark:bg-acotubo-dark-border/30 opacity-60' : 'bg-gray-50 dark:bg-acotubo-dark-surface/50'} ${isDraggable ? 'hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-grab' : 'cursor-default'}`}
        >
            <div className="flex items-center min-w-0">
                <span className="text-gray-500 dark:text-acotubo-dark-text-secondary/70 mr-2 flex-shrink-0" role="img" aria-label="Câmera">🎥</span>
                <span className="text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-primary truncate">{channel.name}</span>
            </div>
            {isPlaced ? (
                <span title="Já posicionado no mapa" className="flex-shrink-0 text-xl">
                   <span role="img" aria-label="Visível no mapa">👀</span>
                </span>
            ) : (
                <span title={isAdmin ? "Não posicionado. Arraste para adicionar ao mapa." : "Não posicionado no mapa."} className="flex-shrink-0 text-xl">
                    <span role="img" aria-label="Não visível no mapa">🙈</span>
                </span>
            )}
        </div>
    );
}

const LayoutSidebar: React.FC<LayoutSidebarProps> = ({ devices, placedCameraIds, isAdmin }) => {
    const [openDevices, setOpenDevices] = useState<number[]>(devices.map(d => d.id));

    const toggleDevice = (deviceId: number) => {
        setOpenDevices(prev => 
            prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
        );
    };

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-bold text-acotubo-dark dark:text-acotubo-dark-text-primary mb-4 pb-2 border-b dark:border-acotubo-dark-border flex-shrink-0">
                Dispositivos da Divisão
            </h2>
            {devices.length > 0 ? (
                <div className="overflow-y-auto flex-grow pr-1">
                    <div className="space-y-4">
                        {devices.map(device => (
                            <div key={device.id}>
                                <button onClick={() => toggleDevice(device.id)} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                                    <div className="flex items-center gap-2 text-left">
                                        <span className="text-xl text-acotubo-red dark:text-acotubo-orange" role="img" aria-label="Dispositivo">🗄️</span>
                                        <span className="font-semibold text-acotubo-dark dark:text-acotubo-dark-text-primary">{device.name}</span>
                                    </div>
                                    <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-200 dark:bg-acotubo-dark-border rounded-full">{device.channels.length}</span>
                                </button>
                                {openDevices.includes(device.id) && (
                                    <div className="pl-4 mt-2 space-y-2">
                                        {device.channels.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(channel => (
                                            <DraggableChannel 
                                                key={channel.id} 
                                                channel={channel} 
                                                device={device}
                                                isPlaced={placedCameraIds.includes(channel.id)}
                                                isAdmin={isAdmin}
                                            />
                                        ))}
                                        {device.channels.length === 0 && <p className="text-xs text-center text-gray-400 dark:text-acotubo-dark-text-secondary py-2">Nenhum canal neste dispositivo</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-acotubo-dark-text-secondary p-8">
                    <div>
                        <h3 className="font-semibold">Nenhum dispositivo</h3>
                        <p className="text-sm">Não há dispositivos nesta divisão para adicionar ao layout.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayoutSidebar;