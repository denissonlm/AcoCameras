import React, { useState, useEffect } from 'react';
import { Channel, ActionType } from '../types';
import Modal from './Modal';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeAction: (channelId: number, action: ActionType, notes: string) => Promise<boolean>;
  channel: Channel | null;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onTakeAction, channel }) => {
  const [action, setAction] = useState<ActionType | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (channel) {
          setAction((channel.action_taken as ActionType) || '');
          setNotes(channel.action_notes || '');
        }
        setIsLoading(false);
    } else {
      setAction('');
      setNotes('');
    }
  }, [isOpen, channel]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel || !action || isLoading) return;
    
    setIsLoading(true);
    const success = await onTakeAction(channel.id, action, notes);
    setIsLoading(false);
    
    if (success) {
      onClose();
    }
  };
  
  if (!channel) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ação para Câmera: ${channel.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Selecione a Ação Corretiva</label>
            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value as ActionType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-acotubo-dark-border bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm rounded-md"
              required
            >
              <option value="" disabled>Selecione uma opção...</option>
              <option value={ActionType.Compras}>{ActionType.Compras}</option>
              <option value={ActionType.Obras}>{ActionType.Obras}</option>
              <option value={ActionType.RIF}>{ActionType.RIF}</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Notas / Detalhes</label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
              placeholder="Ex: Câmera não liga. Possível problema na fonte de alimentação."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white dark:bg-acotubo-dark-surface py-2 px-4 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="bg-acotubo-red dark:bg-acotubo-orange py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange disabled:opacity-50 disabled:cursor-wait">
            {isLoading ? 'Salvando...' : 'Registrar Ação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ActionModal;