import React, { useState, useRef, useCallback } from 'react';
import { PlacedCamera, Channel, Device, CameraStatus } from '../../types';

interface PlacedCameraProps {
    placedCamera: PlacedCamera;
    channel: Channel;
    device: Device;
    onUpdate: (item: PlacedCamera) => void;
    onRemove: (channelId: number) => void;
    isAdmin: boolean;
    boundsRef: React.RefObject<HTMLDivElement>;
}

const statusColors = {
    [CameraStatus.Online]: 'bg-green-500',
    [CameraStatus.Offline]: 'bg-red-500',
};

const PlacedCameraComponent: React.FC<PlacedCameraProps> = ({ placedCamera, channel, device, onUpdate, onRemove, isAdmin, boundsRef }) => {
    const { x, y, rotation, flipped } = placedCamera;
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ ...placedCamera, rotation: (rotation + 45) % 360 });
    };

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ ...placedCamera, flipped: !flipped });
    };
    
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(channel.id);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isAdmin || (e.target as HTMLElement).closest('button')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!boundsRef.current) return;
            
            const boundsRect = boundsRef.current.getBoundingClientRect();

            // Calculate position relative to the bounds container
            let newX = ((moveEvent.clientX - boundsRect.left) / boundsRect.width) * 100;
            let newY = ((moveEvent.clientY - boundsRect.top) / boundsRect.height) * 100;

            // Clamp values between 0 and 100
            newX = Math.max(0, Math.min(100, newX));
            newY = Math.max(0, Math.min(100, newY));

            onUpdate({ ...placedCamera, x: newX, y: newY });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

    }, [isAdmin, onUpdate, placedCamera, boundsRef]);


    const tooltipContent = (
        <div className="text-left">
            <p className="font-bold">{channel.name}</p>
            <p>Dispositivo: {device.name}</p>
            <p>Status: {channel.status}</p>
        </div>
    );

    return (
        <div
            ref={nodeRef}
            className={`absolute z-20 group transition-shadow duration-100 ${isAdmin ? (isDragging ? 'cursor-grabbing z-30 shadow-2xl' : 'cursor-grab') : 'cursor-default'}`}
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%)`,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Tooltip text is NOT a child of the rotated element */}
            <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900/90 dark:bg-black/90 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                {tooltipContent}
            </div>
            
            {/* Rotated Icon Container */}
            <div
                style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
                    transition: 'transform 0.2s ease-in-out',
                }}
            >
                <div className="relative p-1 rounded-full bg-white/70 dark:bg-acotubo-dark-surface/70 backdrop-blur-sm shadow-lg border border-white/30 dark:border-white/20 transition-transform duration-200 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-acotubo-dark dark:text-acotubo-dark-text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
                    </svg>
                    <span className={`absolute top-0.5 right-0.5 block h-2 w-2 rounded-full ${statusColors[channel.status as keyof typeof statusColors]} ring-1 ring-white/80 dark:ring-acotubo-dark-surface/80`} />
                </div>
            </div>

            {/* Static Controls Container */}
            {isAdmin && (
                <div 
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white/80 dark:bg-acotubo-dark-surface/80 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-30"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with controls
                >
                    <button onClick={handleRotate} className="p-1 text-xs text-gray-600 dark:text-acotubo-dark-text-secondary hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-white/10" title="Girar 45°">
                        <span role="img" aria-label="Girar">🔄</span>
                    </button>
                    <button onClick={handleFlip} className="p-1 text-xs text-gray-600 dark:text-acotubo-dark-text-secondary hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-white/10" title="Inverter">
                        <span role="img" aria-label="Inverter">↔️</span>
                    </button>
                     <button onClick={handleRemove} className="p-1 text-xs text-gray-600 dark:text-acotubo-dark-text-secondary hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-white/10" title="Remover do mapa">
                        <span role="img" aria-label="Remover">🗑️</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlacedCameraComponent;