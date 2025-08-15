import React, { useRef, useState } from 'react';
import { DivisionLayout, PlacedCamera, Device } from '../../types';
import PlacedCameraComponent from './PlacedCamera';
import { supabase } from '../../services/supabaseClient';

interface LayoutCanvasProps {
    layout: DivisionLayout | null;
    devices: Device[];
    onLayoutUpdate: (data: Partial<Omit<DivisionLayout, 'division_id' | 'id' | 'created_at'>>) => void;
    onPlaceCamera: (item: Omit<PlacedCamera, 'rotation' | 'flipped'>) => void;
    onUpdateCamera: (item: PlacedCamera) => void;
    onRemoveCamera: (channelId: number) => void;
    isAdmin: boolean;
}

const LayoutCanvas: React.FC<LayoutCanvasProps> = ({ layout, devices, onLayoutUpdate, onPlaceCamera, onUpdateCamera, onRemoveCamera, isAdmin }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('Enviando imagem...');

    const isLocked = (layout?.placed_cameras?.length ?? 0) > 0;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin || isUploading || !layout) return;
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadMessage('Iniciando upload...');

        const oldImagePath = layout.background_image_url ? new URL(layout.background_image_url).pathname.split('/layouts/')[1] : null;

        try {
            // Step 1: Upload the new image. This is the most critical part.
            setUploadMessage('Enviando nova imagem...');
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
            const newFilePath = `public/division-${layout.division_id}-layout-${Date.now()}.${fileExtension}`;

            const { error: uploadError } = await supabase.storage
                .from('layouts')
                .upload(newFilePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                // Specific check for RLS policy error on Storage
                if (uploadError.message.includes("new row violates row-level security policy") || uploadError.message.includes("permission denied")) {
                     throw new Error("RLS_INSERT_ERROR");
                }
                throw new Error(`UPLOAD_FAILED: ${uploadError.message}`);
            }

            // Step 2: Get the public URL for the newly uploaded file.
            setUploadMessage('Obtendo URL pública...');
            const { data: urlData } = supabase.storage.from('layouts').getPublicUrl(newFilePath);

            if (!urlData?.publicUrl) {
                // This is unlikely but good to handle. Try to clean up the uploaded file.
                await supabase.storage.from('layouts').remove([newFilePath]);
                throw new Error('GET_URL_FAILED: Não foi possível obter a URL pública da imagem após o upload.');
            }
            const newPublicUrl = urlData.publicUrl;

            // Step 3: Update the layout in the database.
            // We also clear placed_cameras because the background has changed.
            setUploadMessage('Atualizando layout no banco de dados...');
            onLayoutUpdate({ background_image_url: newPublicUrl, background_rotation: 0, placed_cameras: [] });

            // Step 4: [Cleanup] Try to delete the old image. This is not critical.
            // If this fails, we just log it and move on. The user has their new image.
            if (oldImagePath) {
                setUploadMessage('Removendo imagem antiga...');
                const { error: removeError } = await supabase.storage.from('layouts').remove([oldImagePath]);
                if (removeError) {
                    console.warn('Falha na limpeza: não foi possível remover a imagem de layout antiga.', { path: oldImagePath, error: removeError.message });
                     // Non-blocking, so we don't alert the user.
                }
            }

        } catch (error: any) {
            console.error("V3: Erro no upload de imagem de layout:", error);

            let userMessage = 'Ocorreu um erro inesperado.';
            let instructions = 'Verifique o console do navegador para mais detalhes técnicos.';

            if (error.message === "RLS_INSERT_ERROR") {
                userMessage = 'O upload foi bloqueado por falta de permissão no Storage.';
                instructions = '**Ação Urgente Necessária:**\nUm administrador precisa executar o script SQL de políticas de segurança (Storage Policies) no painel do Supabase para o bucket \'layouts\'. Sem isso, os uploads não funcionarão.';
            } else if (error.message.includes('UPLOAD_FAILED')) {
                userMessage = 'A comunicação com o servidor de arquivos falhou durante o upload.';
                instructions = `Verifique sua conexão com a internet. Erro original: ${error.message.replace('UPLOAD_FAILED: ', '')}`;
            } else if (error.message.includes('GET_URL_FAILED')) {
                userMessage = 'O upload foi bem-sucedido, mas não foi possível obter a URL final.';
                instructions = 'Isso pode indicar um problema temporário no Supabase. Tente novamente.';
            }

            alert(`Falha ao carregar a imagem do layout (v3):\n\n${userMessage}\n\n${instructions}`);

        } finally {
            setIsUploading(false);
            setUploadMessage('Enviando imagem...');
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isAdmin) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isAdmin) return;
        e.preventDefault();
        const deviceId = e.dataTransfer.getData("deviceId");
        const channelId = e.dataTransfer.getData("channelId");
        
        if (!deviceId || !channelId || layout?.placed_cameras.some(pc => pc.channelId === Number(channelId))) {
            return;
        }

        const canvasRect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - canvasRect.left) / canvasRect.width) * 100;
        const y = ((e.clientY - canvasRect.top) / canvasRect.height) * 100;

        onPlaceCamera({
            deviceId: Number(deviceId),
            channelId: Number(channelId),
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        });
    };
    
    const handleRotateBackground = (degrees: number) => {
        if (!layout || isLocked || !isAdmin) return;
        const currentRotation = layout.background_rotation ?? 0;
        onLayoutUpdate({ background_rotation: (currentRotation + degrees + 360) % 360 });
    }

    const handleResetRotation = () => {
        if (!layout || isLocked || !isAdmin) return;
        onLayoutUpdate({ background_rotation: 0 });
    }

    const findChannel = (channelId: number) => {
        for (const device of devices) {
            const channel = device.channels.find(c => c.id === channelId);
            if (channel) return { channel, device };
        }
        return null;
    }

    return (
        <div
            ref={canvasRef}
            className="relative w-full h-full border-2 border-dashed border-gray-300 dark:border-acotubo-dark-border rounded-lg overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" disabled={isUploading || !layout} />

            {layout?.background_image_url && (
                 <div 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                        transform: `rotate(${layout?.background_rotation ?? 0}deg)`,
                        transition: 'transform 0.3s ease-in-out'
                    }}
                >
                    <img src={layout.background_image_url} alt="Planta da divisão" className="w-full h-full object-contain rounded-lg" />
                </div>
            )}
           
            {layout?.placed_cameras.map(pc => {
                const channelInfo = findChannel(pc.channelId);
                if (!channelInfo) return null;

                return (
                    <PlacedCameraComponent
                        key={pc.channelId}
                        placedCamera={pc}
                        channel={channelInfo.channel}
                        device={channelInfo.device}
                        onUpdate={onUpdateCamera}
                        onRemove={onRemoveCamera}
                        isAdmin={isAdmin}
                        boundsRef={canvasRef}
                    />
                );
            })}

            {layout?.background_image_url && isAdmin ? (
                <div
                    className="absolute top-3 right-3 flex items-center bg-white/80 dark:bg-acotubo-dark-surface/80 rounded-md shadow-sm backdrop-blur-sm border border-gray-300 dark:border-acotubo-dark-border/50 z-10"
                >
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLocked || isUploading}
                        className={`p-2 text-gray-700 dark:text-acotubo-dark-text-secondary rounded-l-md transition-opacity ${isLocked || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-white/10'}`} 
                        title={isLocked ? "Remova todas as câmeras para trocar a imagem" : (isUploading ? "Enviando..." : "Trocar imagem de fundo")}
                    >
                        {isUploading ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : <span role="img" aria-label="Trocar Imagem">🖼️</span>}
                    </button>
                    <button 
                        onClick={() => handleRotateBackground(-90)} 
                        disabled={isLocked}
                        className={`p-2 text-gray-700 dark:text-acotubo-dark-text-secondary border-l border-gray-300 dark:border-acotubo-dark-border/50 transition-opacity ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-white/10'}`} 
                        title={isLocked ? "Remova todas as câmeras para girar" : "Girar para a esquerda"}
                    >
                        <span role="img" aria-label="Girar à esquerda">↩️</span>
                    </button>
                    <button 
                        onClick={handleResetRotation} 
                        disabled={isLocked}
                        className={`p-2 text-gray-700 dark:text-acotubo-dark-text-secondary border-l border-gray-300 dark:border-acotubo-dark-border/50 transition-opacity ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-white/10'}`} 
                        title={isLocked ? "Remova todas as câmeras para girar" : "Redefinir rotação"}
                    >
                        <span role="img" aria-label="Redefinir rotação">🔄</span>
                    </button>
                    <button 
                        onClick={() => handleRotateBackground(90)} 
                        disabled={isLocked}
                        className={`p-2 text-gray-700 dark:text-acotubo-dark-text-secondary border-l border-gray-300 dark:border-acotubo-dark-border/50 rounded-r-md transition-opacity ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-white/10'}`} 
                        title={isLocked ? "Remova todas as câmeras para girar" : "Girar para a direita"}
                    >
                        <span role="img" aria-label="Girar à direita">↪️</span>
                    </button>
                </div>
            ) : !layout?.background_image_url && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400 dark:text-acotubo-dark-text-secondary p-4 pointer-events-none">
                    <div>
                         {isUploading ? (
                             <>
                                <svg className="animate-spin h-10 w-10 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                <p className="mt-2 text-sm font-medium">{uploadMessage}</p>
                             </>
                         ) : (
                             <>
                                <span className="text-6xl" role="img" aria-label="Imagem">🖼️</span>
                                <h3 className="mt-2 text-sm font-semibold">Nenhum layout definido</h3>
                                <p className="mt-1 text-sm">{isAdmin ? 'Arraste as câmeras da barra lateral ou adicione uma imagem de fundo.' : 'Peça a um administrador para configurar um layout.'}</p>
                                {isAdmin && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!layout}
                                        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-acotubo-dark-border/50 text-xs font-medium rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!layout ? "Selecione uma divisão primeiro" : "Carregar Imagem"}
                                    >
                                        <span role="img" aria-label="Carregar Imagem">🖼️</span>
                                        Carregar Imagem
                                    </button>
                                )}
                             </>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayoutCanvas;