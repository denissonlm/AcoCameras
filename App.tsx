import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Device, Channel, CameraStatus, DeviceType, ActionType, Division, DivisionLayout, PlacedCamera } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DeviceModal from './components/DeviceModal';
import ChannelModal from './components/ChannelModal';
import ActionModal from './components/ActionModal';
import ReportModal from './components/ReportModal';
import DeviceCard from './components/DeviceCard';
import ManageDivisionsModal from './components/ManageDivisionsModal';
import DivisionModal from './components/DivisionModal';
import Navigation from './components/Navigation';
import LayoutView from './views/LayoutView';
import { useAdmin } from './contexts/AdminContext';
import AdminLoginModal from './components/AdminLoginModal';
import { supabase } from './services/supabaseClient';
import { Json } from './types/supabase';
import LogbookModal from './components/LogbookModal';
import useCameraStats from './hooks/useCameraStats';

type View = 'dashboard' | 'layout';

const App: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [layouts, setLayouts] = useState<DivisionLayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAutoCreating, setIsAutoCreating] = useState<number | null>(null);

    // Admin State
    const { isAdmin, isLoginAttempted } = useAdmin();
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

    // View state
    const [view, setView] = useState<View>('dashboard');

    // Modal states
    const [isDeviceModalOpen, setDeviceModalOpen] = useState(false);
    const [isChannelModalOpen, setChannelModalOpen] = useState(false);
    const [isActionModalOpen, setActionModalOpen] = useState(false);
    const [isGeneratingReport, setGeneratingReport] = useState(false);
    const [isDivisionModalOpen, setDivisionModalOpen] = useState(false);
    const [isManageDivisionsModalOpen, setManageDivisionsModalOpen] = useState(false);
    const [isLogbookModalOpen, setLogbookModalOpen] = useState(false);
    
    // Data for modals
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [editingChannelInfo, setEditingChannelInfo] = useState<{ deviceId: number; channel?: Channel } | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [editingDivision, setEditingDivision] = useState<Division | null>(null);
    const [selectedChannelForLogs, setSelectedChannelForLogs] = useState<Channel | null>(null);

    // Dashboard filter states
    const [activeStatusFilter, setActiveStatusFilter] = useState<CameraStatus | null>(null);
    const [activeDivisionFilter, setActiveDivisionFilter] = useState<number | null>(null);
    const [activeActionFilter, setActiveActionFilter] = useState<ActionType | null>(null);

    // Centralized data fetching function
    const fetchAllData = useCallback(async () => {
        try {
            const { data: divisionsData, error: divisionsError } = await supabase.from('divisions').select('*').order('name');
            if (divisionsError) throw divisionsError;
            setDivisions(divisionsData || []);

            const { data: devicesData, error: devicesError } = await supabase.from('devices').select('*').order('name');
            if (devicesError) throw devicesError;
            
            const { data: channelsData, error: channelsError } = await supabase.from('channels').select('*');
            if (channelsError) throw channelsError;

            const mergedDevices = (devicesData || []).map(device => ({
                ...device,
                channels: (channelsData || []).filter(c => c.device_id === device.id)
            }));
            setDevices(mergedDevices);
            
            const { data: layoutsData, error: layoutsError } = await supabase.from('layouts').select('*');
            if (layoutsError) throw layoutsError;
            
            // Ensure placed_cameras is always an array for type safety within the app
            const appLayouts = (layoutsData || []).map(l => ({
                ...l,
                placed_cameras: (Array.isArray(l.placed_cameras) ? l.placed_cameras : []) as PlacedCamera[]
            }));
            setLayouts(appLayouts);

        } catch (error) {
            console.error("Error fetching data:", error);
            // Optional: set an error state to show a message to the user
        }
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        setLoading(true);
        fetchAllData().finally(() => setLoading(false));
    }, [fetchAllData]);

    // Supabase Realtime Subscriptions
    useEffect(() => {
        const handleDbChange = (payload: any) => {
            console.log(`[Realtime] Change received on table "${payload.table}":`, payload);
            fetchAllData();
        };

        const tables = ['divisions', 'devices', 'channels', 'layouts', 'channel_logs'];
        
        // Use a single channel for all table subscriptions for efficiency.
        const channel = supabase.channel('acotubo-db-changes');

        tables.forEach(table => {
            channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                handleDbChange
            );
        });
        
        channel.subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('[Realtime] Successfully subscribed to database changes.');
            }
            if (status === 'CHANNEL_ERROR') {
                 const errDetails = err ? (err instanceof Error ? err.message : JSON.stringify(err)) : null;
                const errorMessage = errDetails 
                    ? `Connection failed: ${errDetails}` 
                    : 'An unknown error occurred. This is likely a Supabase configuration issue.';
                
                console.error(`[Realtime] Subscription Error: ${errorMessage} See the detailed warning below for resolution steps.`);
                console.warn(
                    `[Realtime] ACTION REQUIRED: The real-time connection failed. This is almost always due to a missing configuration in your Supabase project.\n\n` +
                    `1. Go to your Supabase Dashboard.\n` +
                    `2. Navigate to Database -> Replication.\n` +
                    `3. Ensure that replication is enabled for ALL of the following tables: \n` +
                    `   -> ${tables.join(', ')}\n\n` +
                    `The app will function without real-time updates, but you will need to refresh the page to see changes.`
                );
            }
        });

        // Cleanup: remove the channel subscription on component unmount.
        return () => {
            supabase.removeChannel(channel).catch(error => console.error('[Realtime] Failed to remove channel:', error));
        };
    }, [fetchAllData]);
    
    // Centralized stats calculation
    const stats = useCameraStats(devices, divisions);

    const freshChannelForLogs = useMemo(() => {
        if (!selectedChannelForLogs) return null;
        const device = devices.find(d => d.id === selectedChannelForLogs.device_id);
        // Fallback to the stale channel if the fresh one is not found (e.g., deleted)
        // This prevents the modal from crashing if data changes while it's open.
        return device?.channels.find(c => c.id === selectedChannelForLogs.id) ?? selectedChannelForLogs;
    }, [devices, selectedChannelForLogs]);


    const requireAdmin = useCallback((action: () => void) => {
        if (isAdmin) {
            action();
        } else {
            setLoginModalOpen(true);
        }
    }, [isAdmin]);

    // --- Filter Handlers ---
    const handleStatusFilterChange = useCallback((status: CameraStatus | null) => {
        const newStatus = status === activeStatusFilter ? null : status;
        setActiveStatusFilter(newStatus);
        if (newStatus !== null) {
            setActiveDivisionFilter(null);
            setActiveActionFilter(null);
        }
    }, [activeStatusFilter]);

    const handleDivisionFilterChange = useCallback((divisionId: number | null) => {
        const newDivisionId = divisionId === activeDivisionFilter ? null : divisionId;
        setActiveDivisionFilter(newDivisionId);
        if (newDivisionId !== null) {
            setActiveStatusFilter(null);
            setActiveActionFilter(null);
        }
    }, [activeDivisionFilter]);

    const handleActionFilterChange = useCallback((action: ActionType | null) => {
        const newAction = action === activeActionFilter ? null : action;
        setActiveActionFilter(newAction);
        if (newAction !== null) {
            setActiveStatusFilter(CameraStatus.Offline);
            setActiveDivisionFilter(null);
        }
    }, [activeActionFilter]);


    const clearAllFilters = useCallback(() => {
        setActiveStatusFilter(null);
        setActiveDivisionFilter(null);
        setActiveActionFilter(null);
    }, []);

    // --- Division Handlers ---
    const handleOpenDivisionModal = useCallback((division: Division | null = null) => {
        requireAdmin(() => {
            setEditingDivision(division);
            setDivisionModalOpen(true);
        });
    }, [requireAdmin]);
    
    const handleAddDivisionRequest = useCallback(() => {
        setManageDivisionsModalOpen(false);
        // Use timeout to prevent modal transition jank
        setTimeout(() => handleOpenDivisionModal(null), 150);
    }, [handleOpenDivisionModal]);

    const handleEditDivisionRequest = useCallback((division: Division) => {
        setManageDivisionsModalOpen(false);
        setTimeout(() => handleOpenDivisionModal(division), 150);
    }, [handleOpenDivisionModal]);

    const handleSaveDivision = useCallback(async (divisionData: Omit<Division, 'id' | 'created_at'>): Promise<boolean> => {
        try {
            if (editingDivision) { // Editing
                const { error } = await supabase.from('divisions').update(divisionData).eq('id', editingDivision.id);
                if (error) throw error;
            } else { // Adding
                const { error } = await supabase.from('divisions').insert([divisionData]);
                if (error) throw error;
            }
            await fetchAllData(); // Force refetch
            setEditingDivision(null);
            return true;
        } catch (error: any) {
            console.error("Error saving division:", error);
            let userMessage = `Erro ao salvar a divisão "${divisionData.name}".`;
            if (error.code === '23505') {
                 userMessage = `Erro: A divisão '${divisionData.name}' já existe.`;
            } else if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                 userMessage = `A operação foi bloqueada por uma política de segurança. Verifique as permissões de INSERT/UPDATE (RLS) na tabela "divisions".`;
            } else {
                userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
            }
            alert(userMessage);
            return false;
        }
    }, [editingDivision, fetchAllData]);

    const handleDeleteDivision = useCallback(async (divisionId: number) => {
        requireAdmin(async () => {
            const division = divisions.find(d => d.id === divisionId);
            if (!division) return;

            const isDivisionInUse = devices.some(device => device.division_id === divisionId);
            if (isDivisionInUse) {
                alert(`A divisão "${division.name}" não pode ser excluída pois está sendo utilizada por um ou mais dispositivos.`);
                return;
            }
            if (window.confirm(`Tem certeza de que deseja excluir a divisão "${division.name}"? O layout associado (se existir) também será excluído. Esta ação não pode ser desfeita.`)) {
                try {
                    // The database should have ON DELETE CASCADE for layouts.division_id -> divisions.id
                    const { error } = await supabase.from('divisions').delete().eq('id', divisionId);
                    if (error) throw error;
                    await fetchAllData(); // Force refetch
                } catch (error: any) {
                     console.error("Error deleting division:", error);
                     let userMessage = `Erro ao excluir a divisão "${division.name}".`;
                     if (error.code === '23503') {
                         userMessage = `Não é possível excluir a divisão "${division.name}" pois ela ainda está sendo referenciada por outros dados (como um layout).\n\nVerifique se a configuração de exclusão em cascata (ON DELETE CASCADE) está ativa no banco de dados para resolver isso automaticamente.`;
                     } else if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                         userMessage = `A exclusão da divisão foi bloqueada por uma política de segurança. Verifique as permissões (RLS) no painel do Supabase.`;
                     } else {
                        userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
                     }
                     alert(userMessage);
                }
            }
        });
    }, [requireAdmin, devices, fetchAllData, divisions]);


    // --- Device Handlers ---
    const handleOpenDeviceModal = useCallback((device: Device | null = null) => {
        requireAdmin(() => {
            setEditingDevice(device);
            setDeviceModalOpen(true);
        });
    }, [requireAdmin]);

    const handleSaveDevice = useCallback(async (deviceData: Omit<Device, 'id' | 'created_at' | 'channels'>): Promise<boolean> => {
        try {
            if (editingDevice) { // Editing
                const { error } = await supabase.from('devices').update(deviceData).eq('id', editingDevice.id);
                if (error) throw error;
            } else { // Adding
                const { error } = await supabase.from('devices').insert([deviceData]);
                if (error) throw error;
            }
            await fetchAllData(); // Force refetch
            setEditingDevice(null);
            return true;
        } catch (error: any) {
            console.error(`Error ${editingDevice ? 'updating' : 'adding'} device:`, error);
            let userMessage = `Erro ao ${editingDevice ? 'atualizar' : 'adicionar'} o dispositivo.`;
            if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                 userMessage = `A operação foi bloqueada por uma política de segurança. Verifique se as permissões de INSERT e UPDATE (RLS) estão configuradas corretamente para a tabela "devices" no painel do Supabase.`;
            } else if (error.code === '23503') { // Foreign key violation
                userMessage = `Erro: A divisão selecionada não é válida. Por favor, recarregue a página e tente novamente.`;
            } else {
               userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
            }
            alert(userMessage);
            return false;
        }
    }, [editingDevice, fetchAllData]);

    const handleDeleteDevice = useCallback(async (deviceId: number) => {
        requireAdmin(async () => {
            const device = devices.find(d => d.id === deviceId);
            if (!device) return;

            if (window.confirm(`Tem certeza de que deseja excluir o dispositivo "${device.name}"? Isto também removerá TODAS as suas câmeras, seus históricos e posições no layout. Esta ação não pode ser desfeita.`)) {
                try {
                    // Simplified: The database's ON DELETE CASCADE for devices -> channels,
                    // and the `handle_deleted_channel` trigger will handle all cleanup automatically.
                    const { error } = await supabase.from('devices').delete().eq('id', deviceId);
                    if (error) throw error;
                    
                    // The realtime subscription will trigger a refetch, but we can do it manually for faster feedback.
                    await fetchAllData();
                } catch(error: any) {
                     console.error("Error deleting device:", error);
                     let userMessage = `Erro ao excluir o dispositivo "${device.name}".`;
                     if (error.code === '23503') { // Foreign key violation
                         userMessage = `Não é possível excluir o dispositivo "${device.name}".\n\nCausa: A regra "ON DELETE CASCADE" pode não estar configurada corretamente entre 'devices' e 'channels' no banco de dados.`;
                     } else if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                         userMessage = `A exclusão do dispositivo foi bloqueada por uma política de segurança. Verifique as permissões (RLS) no painel do Supabase.`;
                     } else {
                        userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
                     }
                     alert(userMessage);
                }
            }
        });
    }, [requireAdmin, fetchAllData, devices]);
    
    // --- Channel Handlers ---
    const handleOpenChannelModal = useCallback((deviceId: number, channel: Channel | null = null) => {
        requireAdmin(() => {
            const device = devices.find(d => d.id === deviceId);
            if (device && device.channels.length >= device.channel_count && !channel) {
                alert(`Este dispositivo já atingiu o limite de ${device.channel_count} canais e não pode adicionar mais.`);
                return;
            }
            setEditingChannelInfo({ deviceId, channel: channel || undefined });
            setChannelModalOpen(true);
        });
    }, [requireAdmin, devices]);

    const handleSaveChannel = useCallback(async (name: string): Promise<boolean> => {
        if (!editingChannelInfo) return false;
        const { deviceId, channel } = editingChannelInfo;
        try {
            if (channel) { // Editing channel
                const { error } = await supabase.from('channels').update({ name }).eq('id', channel.id);
                if (error) throw error;
            } else { // Adding new channel
                const { error } = await supabase.from('channels').insert([{ device_id: deviceId, name, status: CameraStatus.Online }]);
                if (error) throw error;
            }
            await fetchAllData(); // Force refetch
            setEditingChannelInfo(null);
            return true;
        } catch (error: any) {
             console.error("Error saving channel:", error);
             let userMessage = `Erro ao salvar o canal "${name}".`;
             if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                 userMessage = `A operação foi bloqueada por uma política de segurança (RLS) na tabela "channels".`;
             } else {
                userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
             }
             alert(userMessage);
             return false;
        }
    }, [editingChannelInfo, fetchAllData]);

    const handleAutoCreateChannels = useCallback(async (deviceId: number) => {
        requireAdmin(async () => {
            const device = devices.find(d => d.id === deviceId);
            if (!device) {
                alert("Dispositivo não encontrado.");
                return;
            }

            const existingChannels = device.channels;
            const channelsToCreateCount = device.channel_count - existingChannels.length;

            if (channelsToCreateCount <= 0) {
                alert("Não há canais disponíveis neste dispositivo.");
                return;
            }

            let startNumber = 1;
            const existingCamNumbers = existingChannels
                .map(c => {
                    const match = c.name.match(/^Cam\s*(\d+)$/i);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(n => n > 0);
            
            if (existingCamNumbers.length > 0) {
                startNumber = Math.max(...existingCamNumbers) + 1;
            }

            const newChannels = Array.from({ length: channelsToCreateCount }, (_, i) => ({
                device_id: deviceId,
                name: `Cam ${startNumber + i}`,
                status: CameraStatus.Online,
            }));
            
            if (window.confirm(`Tem certeza que deseja criar ${channelsToCreateCount} câmeras automaticamente para o dispositivo "${device.name}"?`)) {
                setIsAutoCreating(deviceId);
                try {
                    const { error } = await supabase.from('channels').insert(newChannels);
                    if (error) throw error;
                    await fetchAllData();
                } catch (error: any) {
                    console.error("Error auto-creating channels:", error);
                    let userMessage = "Ocorreu um erro ao criar as câmeras automaticamente.";
                    if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                        userMessage = `A criação de canais foi bloqueada por uma política de segurança (RLS) na tabela "channels".`;
                    } else {
                       userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
                    }
                    alert(userMessage);
                } finally {
                    setIsAutoCreating(null);
                }
            }
        });
    }, [requireAdmin, devices, fetchAllData]);

    const handleDeleteChannel = useCallback(async (deviceId: number, channelId: number) => {
        requireAdmin(async () => {
            const device = devices.find(d => d.id === deviceId);
            const channel = device?.channels.find(c => c.id === channelId);
            if (!channel) return;

            if (window.confirm(`Tem certeza de que deseja excluir o canal "${channel.name}"? Isto também removerá seu histórico de eventos e sua posição no mapa de layout. Esta ação não pode ser desfeita.`)) {
                try {
                    // Simplified: The database trigger `handle_deleted_channel` now handles all layout cleanup.
                    // The ON DELETE CASCADE on channels -> channel_logs handles log cleanup.
                    // We just need to delete the channel itself.
                    const { error } = await supabase.from('channels').delete().eq('id', channelId);
                    if (error) throw error;

                    await fetchAllData(); // Force refetch
                } catch(error: any) {
                     console.error("Error deleting channel:", error);
                     let userMessage = `Erro ao excluir o canal "${channel.name}".`;
                     if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                         userMessage = `A exclusão do canal foi bloqueada por uma política de segurança (RLS).`;
                     } else {
                        userMessage += `\n\nCausa provável: ${error.message || 'Um gatilho (trigger) no banco de dados pode ter falhado.'}`;
                     }
                     alert(userMessage);
                }
            }
        });
    }, [requireAdmin, fetchAllData, devices]);

    // --- Action/Status/Logbook Handlers ---
    const handleTakeAction = useCallback(async (channelId: number, action: ActionType, notes: string): Promise<boolean> => {
        try {
            const { error: channelUpdateError } = await supabase.from('channels').update({
                action_taken: action,
                action_notes: notes,
                status: CameraStatus.Offline
            }).eq('id', channelId);
            if (channelUpdateError) throw channelUpdateError;
            
            const { error: logInsertError } = await supabase.from('channel_logs').insert([{
                channel_id: channelId,
                log_entry: notes || 'Ação registrada sem notas.',
                new_status: CameraStatus.Offline,
                action_taken: action,
            }]);
            if (logInsertError) console.error("Failed to create log entry for action:", logInsertError);

            await fetchAllData(); // Force refetch
            return true;
        } catch (error: any) {
             console.error("Error taking action:", error);
             let userMessage = "Erro ao registrar a ação.";
             if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                 userMessage = `A operação foi bloqueada por uma política de segurança. Verifique as permissões de UPDATE na tabela "channels" ou INSERT na "channel_logs".`;
             } else {
                userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
             }
             alert(userMessage);
             return false;
        }
    }, [fetchAllData]);

    const handleChannelStatusChange = useCallback(async (channelId: number, status: CameraStatus) => {
        requireAdmin(async () => {
            try {
                const updateData: Partial<Channel> = { status };
                 if (status === CameraStatus.Online) {
                    updateData.action_taken = null;
                    updateData.action_notes = null;
                    
                    const { error: logInsertError } = await supabase.from('channel_logs').insert([{
                        channel_id: channelId,
                        log_entry: 'Câmera foi restaurada para o status Online.',
                        new_status: CameraStatus.Online,
                    }]);
                    if (logInsertError) console.error("Failed to create log entry for status change:", logInsertError);
                 }
                const { error } = await supabase.from('channels').update(updateData).eq('id', channelId);
                if (error) throw error;
                await fetchAllData(); // Force refetch
            } catch(error: any) {
                console.error("Error changing status:", error);
                let userMessage = "Erro ao alterar o status da câmera.";
                if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                    userMessage = `A operação foi bloqueada por uma política de segurança (RLS) na tabela "channels".`;
                } else {
                   userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
                }
                alert(userMessage);
            }
        });
    }, [requireAdmin, fetchAllData]);

    const openActionModal = (channel: Channel) => {
        requireAdmin(() => {
            setSelectedChannel(channel);
            setActionModalOpen(true);
        });
    };

    const openLogbookModal = useCallback((channel: Channel) => {
        requireAdmin(() => {
            setSelectedChannelForLogs(channel);
            setLogbookModalOpen(true);
        });
    }, [requireAdmin]);

    const handleSaveNote = useCallback(async (channelId: number, note: string): Promise<boolean> => {
        if (!note.trim()) {
            alert("A nota (apontamento) não pode estar vazia.");
            return false;
        }
        try {
            const { error } = await supabase.from('channel_logs').insert([{ channel_id: channelId, log_entry: note }]);
            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error("Error saving note:", error);
            let userMessage = "Erro ao salvar o apontamento.";
             if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                 userMessage = `A operação foi bloqueada por uma política de segurança (RLS) na tabela "channel_logs".`;
             } else {
                userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
             }
            alert(userMessage);
            return false;
        }
    }, []);

    const handleUpdateNote = useCallback(async (logId: number, note: string): Promise<boolean> => {
        if (!note.trim()) {
            alert("A nota (apontamento) não pode estar vazia.");
            return false;
        }
        try {
            const { error } = await supabase.from('channel_logs').update({ log_entry: note.trim() }).eq('id', logId);
            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error("Error updating note:", error);
            let userMessage = "Erro ao atualizar o apontamento.";
            if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                userMessage = `A operação foi bloqueada por uma política de segurança (RLS) na tabela "channel_logs".`;
            } else {
                userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
            }
            alert(userMessage);
            return false;
        }
    }, []);

    const handleDeleteNote = useCallback(async (logId: number): Promise<boolean> => {
        if (!window.confirm("Tem certeza que deseja excluir este apontamento? Esta ação não pode ser desfeita.")) {
            return false;
        }
        try {
            const { error } = await supabase.from('channel_logs').delete().eq('id', logId);
            if (error) throw error;
            return true;
        } catch (error: any) {
            console.error("Error deleting note:", error);
            let userMessage = "Erro ao excluir o apontamento.";
            if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                userMessage = `A operação foi bloqueada por uma política de segurança (RLS) na tabela "channel_logs".`;
            } else {
                userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
            }
            alert(userMessage);
            return false;
        }
    }, []);


    // --- Layout Handlers ---
    const handleSetLayout = useCallback(async (divisionId: number, newLayoutData: Partial<Omit<DivisionLayout, 'division_id' | 'id' | 'created_at'>>) => {
        requireAdmin(async () => {
            try {
                 const { error } = await supabase.from('layouts').upsert({
                    division_id: divisionId,
                    ...newLayoutData
                 }, { onConflict: 'division_id'});

                if (error) throw error;
                await fetchAllData(); // Force refetch
            } catch(error: any) {
                 console.error("Error saving layout:", error);
                 let userMessage = "Erro ao salvar o layout.";
                 if (error.message?.includes('security policy') || error.message?.includes('permission denied')) {
                     userMessage = `A operação foi bloqueada por uma política de segurança (RLS) na tabela "layouts".`;
                 } else {
                    userMessage += `\n\nCausa provável: ${error.message || 'Erro desconhecido.'}`;
                 }
                 alert(userMessage);
            }
        });
    }, [requireAdmin, fetchAllData]);


    const filteredDevices = useMemo(() => {
        let devicesToFilter = devices;

        if (activeDivisionFilter) {
            devicesToFilter = devicesToFilter.filter(d => d.division_id === activeDivisionFilter);
        }

        const hasChannelFilter = activeStatusFilter || activeActionFilter;

        // If there are no channel-specific filters, return the devices filtered only by division.
        // This ensures that newly created devices (with 0 channels) are visible.
        if (!hasChannelFilter) {
            return devicesToFilter;
        }

        // If channel filters are active, map over the devices and filter their channels.
        // Then, only return devices that still have channels after filtering.
        return devicesToFilter
            .map(device => {
                const filteredChannels = device.channels.filter(channel => {
                    const statusMatch = !activeStatusFilter || channel.status === activeStatusFilter;
                    const actionMatch = !activeActionFilter || channel.action_taken === activeActionFilter;
                    return statusMatch && actionMatch;
                });
                return { ...device, channels: filteredChannels };
            })
            .filter(device => device.channels.length > 0);
    }, [devices, activeStatusFilter, activeDivisionFilter, activeActionFilter]);

    const activeFilterName = useMemo(() => {
        if (activeDivisionFilter) {
            return divisions.find(d => d.id === activeDivisionFilter)?.name || null;
        }
        if (activeActionFilter) {
            return `Ação: ${activeActionFilter}`;
        }
        if (activeStatusFilter) {
            return activeStatusFilter;
        }
        return null;
    }, [activeStatusFilter, activeDivisionFilter, activeActionFilter, divisions]);

    if (loading || !isLoginAttempted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-200 dark:bg-acotubo-dark-bg">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-acotubo-red dark:text-acotubo-orange mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-acotubo-dark-text-secondary">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-200 dark:bg-acotubo-dark-bg font-sans flex flex-col">
            <Header 
              onAddDeviceClick={() => handleOpenDeviceModal()} 
              onReportClick={() => setGeneratingReport(true)}
              onAdminClick={() => setLoginModalOpen(true)}
              onManageDivisionsClick={() => setManageDivisionsModalOpen(true)}
              stats={stats}
              activeStatusFilter={activeStatusFilter}
              activeDivisionFilter={activeDivisionFilter}
              divisions={divisions}
              devices={devices}
            />
            <Navigation currentView={view} onViewChange={setView} />
            
            <main className="container mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8 flex-grow flex flex-col min-h-0">
                {view === 'dashboard' && (
                  <div className="h-full overflow-y-auto">
                    <Dashboard 
                        stats={stats}
                        onStatusFilterChange={handleStatusFilterChange} 
                        activeStatusFilter={activeStatusFilter}
                        onDivisionFilterChange={handleDivisionFilterChange}
                        activeDivisionFilter={activeDivisionFilter}
                        onActionFilterChange={handleActionFilterChange}
                        activeActionFilter={activeActionFilter}
                    />
                    
                    {activeFilterName && (
                        <div className="my-8 p-4 bg-white dark:bg-acotubo-dark-surface border-l-4 border-acotubo-orange rounded-r-lg flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-xl text-acotubo-orange" role="img" aria-label="Filtro">🔍</span>
                                <p className="text-sm font-semibold text-gray-700 dark:text-acotubo-dark-text-primary">
                                    Filtrando por: <span className="bg-acotubo-orange/10 text-acotubo-orange px-2 py-1 rounded-md">{activeFilterName}</span>
                                </p>
                            </div>
                            <button onClick={clearAllFilters} className="text-sm font-semibold text-gray-500 dark:text-acotubo-dark-text-secondary hover:text-acotubo-red dark:hover:text-acotubo-orange transition-colors">
                                Limpar Filtro
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                        {filteredDevices.map(device => {
                            const division = divisions.find(d => d.id === device.division_id);
                            return (
                                <DeviceCard
                                    key={device.id}
                                    device={device}
                                    divisionName={division?.name || 'N/A'}
                                    onActionClick={openActionModal}
                                    onDeleteDevice={handleDeleteDevice}
                                    onEditDevice={handleOpenDeviceModal}
                                    onAddChannel={handleOpenChannelModal}
                                    onEditChannel={handleOpenChannelModal}
                                    onDeleteChannel={handleDeleteChannel}
                                    onAutoCreateChannels={handleAutoCreateChannels}
                                    onOpenLogbook={openLogbookModal}
                                    onStatusChange={handleChannelStatusChange}
                                    isAutoCreating={isAutoCreating === device.id}
                                    isFiltered={!!(activeStatusFilter || activeDivisionFilter)}
                                    isAdmin={isAdmin}
                                />
                            );
                        })}
                    </div>
                  </div>
                )}

                {view === 'layout' && (
                    <LayoutView 
                        divisions={divisions}
                        devices={devices}
                        layouts={layouts}
                        onSetLayout={handleSetLayout}
                        isAdmin={isAdmin}
                    />
                )}
            </main>
            
            {/* --- MODALS --- */}
            {isAdmin && (
                <>
                    <DeviceModal
                        isOpen={isDeviceModalOpen}
                        onClose={() => { setDeviceModalOpen(false); setEditingDevice(null); }}
                        onSave={handleSaveDevice}
                        deviceToEdit={editingDevice}
                        divisions={divisions}
                    />
                    <ChannelModal
                        isOpen={isChannelModalOpen}
                        onClose={() => { setChannelModalOpen(false); setEditingChannelInfo(null); }}
                        onSave={handleSaveChannel}
                        channelToEdit={editingChannelInfo?.channel}
                    />
                    <ActionModal
                        isOpen={isActionModalOpen}
                        onClose={() => { setActionModalOpen(false); setSelectedChannel(null); }}
                        onTakeAction={handleTakeAction}
                        channel={selectedChannel}
                    />
                    <DivisionModal
                        isOpen={isDivisionModalOpen}
                        onClose={() => { setDivisionModalOpen(false); setEditingDivision(null); }}
                        onSave={handleSaveDivision}
                        divisionToEdit={editingDivision}
                    />
                     <ManageDivisionsModal
                        isOpen={isManageDivisionsModalOpen}
                        onClose={() => setManageDivisionsModalOpen(false)}
                        divisions={divisions}
                        onAdd={handleAddDivisionRequest}
                        onEdit={handleEditDivisionRequest}
                        onDelete={handleDeleteDivision}
                    />
                    <LogbookModal
                        isOpen={isLogbookModalOpen}
                        onClose={() => { setLogbookModalOpen(false); setSelectedChannelForLogs(null); }}
                        channel={freshChannelForLogs}
                        onSaveNote={handleSaveNote}
                        onStatusChange={handleChannelStatusChange}
                        onUpdateNote={handleUpdateNote}
                        onDeleteNote={handleDeleteNote}
                    />
                </>
            )}

            <ReportModal
                isOpen={isGeneratingReport}
                onClose={() => setGeneratingReport(false)}
                devices={devices}
                divisions={divisions}
            />

            <AdminLoginModal
                isOpen={isLoginModalOpen && !isAdmin}
                onClose={() => setLoginModalOpen(false)}
            />
        </div>
    );
};

export default App;