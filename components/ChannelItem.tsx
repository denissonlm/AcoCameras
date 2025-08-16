import React, { useState, useRef, useEffect } from 'react';
import { Channel, CameraStatus } from '../types';
import StatusBadge from './StatusBadge';
import Tooltip from './Tooltip';

interface ChannelItemProps {
    channel: Channel;
    onActionClick: (channel: Channel) => void;
    onEdit: (channel: Channel) => void;
    onDelete: (channelId: number) => void;
    onOpenLogbook: (channel: Channel) => void;
    onStatusChange: (channelId: number, newStatus: CameraStatus) => void;
    isAdmin: boolean;
    isFirst?: boolean;
    isLast?: boolean;
}

const ChannelItem: React.FC<ChannelItemProps> = ({ channel, onActionClick, onEdit, onDelete, onOpenLogbook, onStatusChange, isAdmin, isFirst, isLast }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleMenuToggle = () => setMenuOpen(prev => !prev);

    const handleEdit = () => {
        onEdit(channel);
        setMenuOpen(false);
    }
    
    const handleDelete = () => {
        onDelete(channel.id);
        setMenuOpen(false);
    }

    const menuPositionClass = isLast
        ? 'origin-bottom-right bottom-full mb-2'
        : 'origin-top-right mt-2';
        
    const tooltipContent = (
        <div className="text-left">
            <p className="font-semibold">{channel.name}</p>
            {channel.status !== CameraStatus.Online && channel.action_taken && (
                <p className="mt-1 text-xs">Ação: {channel.action_taken}</p>
            )}
        </div>
    );

    return (
        <li className="flex items-center justify-between py-3 px-2 hover:bg-gray-50/80 dark:hover:bg-white/5 rounded-md transition-colors group">
            <div className="flex items-center min-w-0">
                <span className="text-gray-400 dark:text-acotubo-dark-text-secondary/70 mr-3 flex-shrink-0" role="img" aria-label="Câmera">🎥</span>
                 <Tooltip content={tooltipContent} className="min-w-0 flex-1" position={isFirst ? 'bottom' : 'top'}>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-acotubo-dark-text-primary truncate">{channel.name}</p>
                        {channel.status !== CameraStatus.Online && channel.action_taken && (
                            <p className="text-xs text-gray-500 dark:text-acotubo-dark-text-secondary truncate">Ação: {channel.action_taken}</p>
                        )}
                    </div>
                </Tooltip>
            </div>
            <div className="flex items-center space-x-2 ml-4">
                <StatusBadge status={channel.status as CameraStatus} />
                {isAdmin && (
                    <div className="relative" ref={menuRef}>
                        <button
                            ref={buttonRef}
                            onClick={handleMenuToggle}
                            className="p-1 rounded-full text-gray-400 dark:text-acotubo-dark-text-secondary/80 hover:text-gray-600 dark:hover:text-acotubo-dark-text-primary focus:outline-none focus:ring-2 focus:ring-acotubo-red dark:focus:ring-acotubo-orange opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            aria-haspopup="true"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="font-bold text-lg leading-none" role="img" aria-label="Menu">⋮</span>
                        </button>
                        {isMenuOpen && (
                            <div className={`${menuPositionClass} absolute right-0 w-56 rounded-md shadow-lg bg-white dark:bg-acotubo-dark-surface ring-1 ring-black dark:ring-acotubo-dark-border ring-opacity-5 focus:outline-none z-10`}>
                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                    <button
                                        onClick={() => { onOpenLogbook(channel); setMenuOpen(false); }}
                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-100 dark:hover:bg-white/5"
                                        role="menuitem"
                                    >
                                       Histórico / Apontamentos
                                    </button>
                                    
                                    {channel.status === CameraStatus.Online && (
                                        <button
                                            onClick={() => { onActionClick(channel); setMenuOpen(false); }}
                                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-100 dark:hover:bg-white/5"
                                            role="menuitem"
                                        >
                                            Alterar para Offline
                                        </button>
                                    )}
                                    
                                    {channel.status === CameraStatus.Offline && (
                                        <>
                                            <button
                                                onClick={() => { onStatusChange(channel.id, CameraStatus.Online); setMenuOpen(false); }}
                                                className="w-full text-left block px-4 py-2 text-sm text-green-700 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                                                role="menuitem"
                                            >
                                                Alterar para Online
                                            </button>
                                            <button
                                                onClick={() => { onActionClick(channel); setMenuOpen(false); }}
                                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-100 dark:hover:bg-white/5"
                                                role="menuitem"
                                            >
                                                Editar Ação Corretiva
                                            </button>
                                        </>
                                    )}

                                    <div className="border-t my-1 dark:border-acotubo-dark-border"></div>
                                    <button
                                        onClick={handleEdit}
                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-100 dark:hover:bg-white/5"
                                        role="menuitem"
                                    >
                                        Editar Canal
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left block px-4 py-2 text-sm text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        role="menuitem"
                                    >
                                       Excluir Canal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};

export default ChannelItem;