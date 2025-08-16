import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Channel, ChannelLog, CameraStatus } from '../types';
import Modal from './Modal';
import { supabase } from '../services/supabaseClient';
import { useAdmin } from '../contexts/AdminContext';

interface LogbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  onSaveNote: (channelId: number, note: string) => Promise<boolean>;
  onStatusChange: (channelId: number, newStatus: CameraStatus) => void;
  onUpdateNote: (logId: number, note: string) => Promise<boolean>;
  onDeleteNote: (logId: number) => Promise<boolean>;
}

const LogEntry: React.FC<{
    log: ChannelLog;
    onUpdate: (logId: number, newText: string) => Promise<boolean>;
    onDelete: (logId: number) => Promise<boolean>;
    onActionComplete: () => void;
}> = ({ log, onUpdate, onDelete, onActionComplete }) => {
    const { isAdmin } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(log.log_entry);
    const [isProcessing, setIsProcessing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Only user-created notes (not system events) are editable/deletable.
    const isUserNote = !log.new_status && !log.action_taken;

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.focus();
        }
    }, [isEditing]);
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    const handleSave = async () => {
        if (!editedText.trim() || isProcessing) return;
        setIsProcessing(true);
        const success = await onUpdate(log.id, editedText);
        if (success) {
            setIsEditing(false);
            onActionComplete(); // Refetch logs
        }
        setIsProcessing(false);
    };

    const handleDelete = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        const success = await onDelete(log.id);
        if (success) {
            onActionComplete();
        } else {
           setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setEditedText(log.log_entry);
        setIsEditing(false);
    }

    const formattedDate = new Date(log.created_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const getIconAndStyle = () => {
        if (log.new_status === CameraStatus.Online) return { icon: '✅', style: 'text-green-600 dark:text-green-400' };
        if (log.new_status === CameraStatus.Offline) return { icon: '🔴', style: 'text-red-600 dark:text-red-500' };
        if (log.action_taken) return { icon: '🔧', style: 'text-yellow-600 dark:text-yellow-400' };
        return { icon: '📝', style: 'text-gray-500 dark:text-acotubo-dark-text-secondary' };
    };
    const { icon, style } = getIconAndStyle();

    return (
        <li className="flex items-start space-x-3 py-3 group">
            <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-acotubo-dark-surface/80 ${style}`}>
                <span className="text-lg" role="img" aria-label="Ícone do evento">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            ref={textareaRef}
                            value={editedText}
                            onChange={handleTextChange}
                            rows={1}
                            className="block w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange resize-none"
                        />
                        <div className="flex items-center justify-end space-x-2">
                            <button onClick={handleCancel} disabled={isProcessing} className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-acotubo-dark-text-secondary bg-white dark:bg-acotubo-dark-surface border border-gray-300 dark:border-acotubo-dark-border rounded-md hover:bg-gray-50 dark:hover:bg-white/5">Cancelar</button>
                            <button onClick={handleSave} disabled={isProcessing || !editedText.trim()} className="px-2.5 py-1 text-xs font-medium text-white bg-acotubo-red dark:bg-acotubo-orange border border-transparent rounded-md hover:bg-opacity-90 disabled:opacity-50">
                                {isProcessing ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-800 dark:text-acotubo-dark-text-primary whitespace-pre-wrap">{log.log_entry}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-acotubo-dark-text-secondary mt-1">{formattedDate}</p>
                            {isAdmin && isUserNote && (
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-acotubo-dark-text-secondary hover:text-blue-600 dark:hover:text-blue-400" title="Editar Apontamento"><span role="img" aria-label="Editar">✏️</span></button>
                                    <button onClick={handleDelete} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-acotubo-dark-text-secondary hover:text-red-600 dark:hover:text-red-500" title="Excluir Apontamento"><span role="img" aria-label="Excluir">🗑️</span></button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </li>
    );
};


const LogbookModal: React.FC<LogbookModalProps> = ({ isOpen, onClose, channel, onSaveNote, onStatusChange, onUpdateNote, onDeleteNote }) => {
    const [logs, setLogs] = useState<ChannelLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);

    const fetchLogs = useCallback(async (channelId: number) => {
        try {
            const { data, error } = await supabase
                .from('channel_logs')
                .select('*')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching channel logs:", error);
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && channel) {
            fetchLogs(channel.id);
        } else if (!isOpen) {
            // Fully reset state when the modal is closed to ensure it's fresh on reopen
            setLogs([]);
            setNewNote('');
            setLoadingLogs(true);
        }
    }, [isOpen, channel, fetchLogs]);

    const handleActionComplete = useCallback(() => {
        if (channel) {
            setLoadingLogs(true);
            fetchLogs(channel.id);
        }
    }, [channel, fetchLogs]);

    const handleSaveNewNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !newNote.trim() || isSavingNote) return;

        setIsSavingNote(true);
        const success = await onSaveNote(channel.id, newNote.trim());
        setIsSavingNote(false);

        if (success) {
            setNewNote('');
            setLoadingLogs(true);
            fetchLogs(channel.id);
        }
    };
    
    if (!channel) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Histórico da Câmera: ${channel.name}`}>
            <div className="space-y-6">
                
                {channel.status === CameraStatus.Offline && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
                      <div>
                          <h4 className="font-semibold text-red-800 dark:text-red-300">Status Atual: Offline</h4>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-1">A câmera pode não estar gravando. Restaure quando o problema for resolvido.</p>
                      </div>
                      <button 
                          onClick={() => onStatusChange(channel.id, CameraStatus.Online)}
                          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-green-500"
                      >
                          <span role="img" aria-label="Online">✅</span>
                          Restaurar para Online
                      </button>
                  </div>
                )}

                {/* New Note Form */}
                <form onSubmit={handleSaveNewNote}>
                    <label htmlFor="new-note" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Adicionar Apontamento</label>
                    <textarea
                        id="new-note"
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
                        placeholder="Ex: Câmera com imagem embaçada durante a noite..."
                    />
                    <div className="mt-2 flex justify-end">
                        <button type="submit" disabled={isSavingNote || !newNote.trim()} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-acotubo-red dark:bg-acotubo-orange hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange disabled:opacity-50 disabled:cursor-wait">
                            {isSavingNote ? 'Salvando...' : 'Salvar Nota'}
                        </button>
                    </div>
                </form>

                {/* Log List */}
                <div className="border-t dark:border-acotubo-dark-border pt-4">
                     <h4 className="text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary mb-2">Histórico de Eventos</h4>
                     {loadingLogs ? (
                         <div className="text-center py-8 text-gray-500 dark:text-acotubo-dark-text-secondary">Carregando histórico...</div>
                     ) : logs.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto pr-2 -mr-2">
                             <ul className="divide-y divide-gray-200 dark:divide-acotubo-dark-border">
                                {logs.map(log => <LogEntry 
                                    key={log.id} 
                                    log={log} 
                                    onUpdate={onUpdateNote}
                                    onDelete={onDeleteNote}
                                    onActionComplete={handleActionComplete}
                                />)}
                             </ul>
                        </div>
                     ) : (
                         <div className="text-center py-8 text-gray-500 dark:text-acotubo-dark-text-secondary">Nenhum evento registrado para esta câmera.</div>
                     )}
                </div>
            </div>
        </Modal>
    );
};

export default LogbookModal;
