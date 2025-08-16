import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Division, Device, DivisionLayout, PlacedCamera } from '../types';
import LayoutCanvas from '../components/layout/LayoutCanvas';
import LayoutSidebar from '../components/layout/LayoutSidebar';

interface LayoutViewProps {
    divisions: Division[];
    devices: Device[];
    layouts: DivisionLayout[];
    onSetLayout: (divisionId: number, newLayoutData: Partial<Omit<DivisionLayout, 'division_id' | 'id' | 'created_at'>>) => void;
    isAdmin: boolean;
}

const LayoutView: React.FC<LayoutViewProps> = ({ divisions, devices, layouts, onSetLayout, isAdmin }) => {
    const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
        divisions.length > 0 ? divisions[0].id : null
    );
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Auto-select first division if the selected one is deleted
    useEffect(() => {
        if (selectedDivisionId && !divisions.some(d => d.id === selectedDivisionId)) {
            setSelectedDivisionId(divisions.length > 0 ? divisions[0].id : null);
        }
         if (!selectedDivisionId && divisions.length > 0) {
            setSelectedDivisionId(divisions[0].id);
        }
    }, [divisions, selectedDivisionId]);

    const activeLayout = useMemo(() => {
        if (!selectedDivisionId) return null;
        return layouts.find(l => l.division_id === selectedDivisionId) ?? {
            id: Date.now(), // temporary client-side id
            created_at: new Date().toISOString(),
            division_id: selectedDivisionId,
            background_image_url: null,
            background_rotation: 0,
            placed_cameras: [],
        };
    }, [layouts, selectedDivisionId]);

    const devicesInDivision = useMemo(() => {
        if (!selectedDivisionId) return [];
        return devices.filter(d => d.division_id === selectedDivisionId);
    }, [devices, selectedDivisionId]);

    const handleLayoutUpdate = useCallback((data: Partial<Omit<DivisionLayout, 'division_id' | 'id' | 'created_at'>>) => {
        if (!selectedDivisionId) return;
        onSetLayout(selectedDivisionId, data);
    }, [selectedDivisionId, onSetLayout]);
    
    const updatePlacedCameras = useCallback((newPlacedCameras: PlacedCamera[]) => {
        if (!selectedDivisionId) return;
        onSetLayout(selectedDivisionId, { placed_cameras: newPlacedCameras });
    }, [selectedDivisionId, onSetLayout]);

    const handlePlaceCamera = useCallback((droppedItem: Omit<PlacedCamera, 'rotation' | 'flipped'>) => {
        if (!activeLayout) return;
        const newCamera: PlacedCamera = {
            ...droppedItem,
            rotation: 0,
            flipped: false,
        };
        updatePlacedCameras([...activeLayout.placed_cameras, newCamera]);
    }, [activeLayout, updatePlacedCameras]);

    const handleUpdateCamera = useCallback((updatedCamera: PlacedCamera) => {
        if (!activeLayout) return;
        const newPlacedCameras = activeLayout.placed_cameras.map(pc => 
            pc.channelId === updatedCamera.channelId ? updatedCamera : pc
        );
        updatePlacedCameras(newPlacedCameras);
    }, [activeLayout, updatePlacedCameras]);

    const handleRemoveCamera = useCallback((channelId: number) => {
        if (!activeLayout) return;
        const newPlacedCameras = activeLayout.placed_cameras.filter(pc => pc.channelId !== channelId);
        updatePlacedCameras(newPlacedCameras);
    }, [activeLayout, updatePlacedCameras]);



    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center text-center bg-white dark:bg-acotubo-dark-surface rounded-xl shadow-lg p-8 h-full border border-gray-200 dark:border-acotubo-dark-border/40">
                <span className="text-6xl" role="img" aria-label="Computador">🖥️</span>
                <h3 className="mt-4 text-xl font-semibold text-acotubo-dark dark:text-acotubo-dark-text-primary">
                    Visualização Indisponível
                </h3>
                <p className="mt-2 text-gray-600 dark:text-acotubo-dark-text-secondary max-w-sm">
                    A funcionalidade de Layout foi projetada para uma melhor experiência em telas maiores. Por favor, acesse através de um computador.
                </p>
            </div>
        );
    }


    return (
        <div className="flex flex-col md:flex-row gap-8 flex-grow w-full p-4 sm:p-6 lg:p-8">
            {/* Main Content: Canvas */}
            <div className="flex-grow bg-white dark:bg-acotubo-dark-surface rounded-xl shadow-lg p-4 flex flex-col border border-gray-200 dark:border-acotubo-dark-border/40">
                <div className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-16 opacity-100 mb-4'}`}>
                    <div className="flex items-center gap-4">
                        <label htmlFor="division-select" className="text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">
                            Divisão:
                        </label>
                        <select
                            id="division-select"
                            value={selectedDivisionId ?? ''}
                            onChange={(e) => setSelectedDivisionId(Number(e.target.value))}
                            className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 dark:border-acotubo-dark-border bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm rounded-md"
                            disabled={divisions.length === 0}
                        >
                            {divisions.length > 0 ? (
                            divisions.map(division => (
                                <option key={division.id} value={division.id}>{division.name}</option>
                            ))
                            ) : (
                                <option>Nenhuma divisão cadastrada</option>
                            )}
                        </select>
                    </div>
                </div>
                {selectedDivisionId ? (
                    <div className="flex-grow w-full flex items-center justify-center min-h-0">
                        <LayoutCanvas
                            layout={activeLayout}
                            devices={devices}
                            onLayoutUpdate={handleLayoutUpdate}
                            onPlaceCamera={handlePlaceCamera}
                            onUpdateCamera={handleUpdateCamera}
                            onRemoveCamera={handleRemoveCamera}
                            isAdmin={isAdmin}
                        />
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-acotubo-dark-text-secondary p-8">
                        <div>
                            <h3 className="text-xl font-semibold">Nenhuma divisão selecionada</h3>
                            <p>Por favor, adicione e selecione uma divisão para começar a criar um layout.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className={`relative w-full flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:w-0' : 'md:w-96'}`}>
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute top-1/2 -left-4 -translate-y-1/2 z-20 h-12 w-8 bg-white dark:bg-acotubo-dark-surface rounded-lg shadow-lg flex items-center justify-center text-gray-600 dark:text-acotubo-dark-text-secondary hover:bg-gray-100 dark:hover:bg-white/10 border dark:border-acotubo-dark-border"
                    title={isSidebarCollapsed ? "Mostrar painel" : "Ocultar painel"}
                    aria-label={isSidebarCollapsed ? "Mostrar painel de dispositivos" : "Ocultar painel de dispositivos"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
                 <div className={`h-full bg-white dark:bg-acotubo-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-acotubo-dark-border/40 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="h-full">
                        <LayoutSidebar 
                            devices={devicesInDivision} 
                            placedCameraIds={activeLayout?.placed_cameras.map(pc => pc.channelId) ?? []}
                            isAdmin={isAdmin}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayoutView;