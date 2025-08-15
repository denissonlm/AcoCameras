import React, { useState, useEffect } from 'react';
import { Device, DeviceType, Division } from '../types';
import Modal from './Modal';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Omit<Device, 'id' | 'created_at' | 'channels'>) => Promise<boolean>;
  deviceToEdit?: Device | null;
  divisions: Division[];
}

const DeviceModal: React.FC<DeviceModalProps> = ({ isOpen, onClose, onSave, deviceToEdit, divisions }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<DeviceType>(DeviceType.NVR);
  const [division_id, setDivisionId] = useState<string>('');
  const [channel_count, setChannelCount] = useState(16);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!deviceToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
          setName(deviceToEdit.name);
          setLocation(deviceToEdit.location);
          setType(deviceToEdit.type as DeviceType);
          setDivisionId(String(deviceToEdit.division_id));
          setChannelCount(deviceToEdit.channel_count);
        } else {
          setName('');
          setLocation('');
          setType(DeviceType.NVR);
          setDivisionId(divisions.length > 0 ? String(divisions[0].id) : '');
          setChannelCount(16);
        }
        setIsLoading(false);
    }
  }, [isOpen, deviceToEdit, isEditing, divisions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !division_id || isLoading) return;
    
    setIsLoading(true);
    const success = await onSave({ name, location, type, division_id: Number(division_id), channel_count });
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Dispositivo" : "Adicionar Novo Dispositivo"}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Nome do Dispositivo</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
              placeholder="Ex: NVR da Portaria Principal"
              required
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Localização</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
              placeholder="Ex: Prédio Administrativo, Térreo"
              required
            />
          </div>
          <div>
            <label htmlFor="channelCount" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Quantidade de Canais</label>
            <select
              id="channelCount"
              value={channel_count}
              onChange={(e) => setChannelCount(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-acotubo-dark-border bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm rounded-md"
            >
              <option value={16}>16 Canais</option>
              <option value={32}>32 Canais</option>
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Tipo</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as DeviceType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-acotubo-dark-border bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm rounded-md"
            >
              <option>{DeviceType.NVR}</option>
              <option>{DeviceType.DVR}</option>
            </select>
          </div>
          <div>
            <label htmlFor="division" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Divisão</label>
            <select
              id="division"
              value={division_id}
              onChange={(e) => setDivisionId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-acotubo-dark-border bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm rounded-md"
              required={divisions.length > 0}
            >
              <option value="" disabled>Selecione uma divisão...</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>{division.name}</option>
              ))}
            </select>
            {divisions.length === 0 && <p className="mt-2 text-xs text-gray-500 dark:text-acotubo-dark-text-secondary">Nenhuma divisão cadastrada. Por favor, adicione uma na tela principal antes de cadastrar um dispositivo.</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white dark:bg-acotubo-dark-surface py-2 px-4 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="bg-acotubo-red dark:bg-acotubo-orange py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange disabled:opacity-50 disabled:cursor-wait">
            {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DeviceModal;