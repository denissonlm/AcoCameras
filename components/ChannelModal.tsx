import React, { useState, useEffect } from 'react';
import { Channel } from '../types';
import Modal from './Modal';

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
  channelToEdit?: Channel | null;
}

const ChannelModal: React.FC<ChannelModalProps> = ({ isOpen, onClose, onSave, channelToEdit }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!channelToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
          setName(channelToEdit.name);
        } else {
          setName('');
        }
        setIsLoading(false);
    }
  }, [isOpen, channelToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isLoading) return;
    
    setIsLoading(true);
    const success = await onSave(name);
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Canal' : 'Adicionar Novo Canal'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Nome do Canal</label>
            <input
              type="text"
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
              placeholder="Ex: Câmera Corredor Principal"
              required
              autoFocus
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white dark:bg-acotubo-dark-surface py-2 px-4 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="bg-acotubo-red dark:bg-acotubo-orange py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange disabled:opacity-50 disabled:cursor-wait">
            {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Canal')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChannelModal;