import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { useAdmin } from '../contexts/AdminContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCapsLookOn, setCapsLookOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAdmin();

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.getModifierState) {
        setCapsLookOn(event.getModifierState('CapsLock'));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
        setError('');
        setPassword('');
        window.addEventListener('keyup', handleKeyUp);
    } else {
        window.removeEventListener('keyup', handleKeyUp);
    }

    return () => {
        window.removeEventListener('keyup', handleKeyUp);
    }
  }, [isOpen, handleKeyUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = login(password);
    
    setLoading(false);
    if (success) {
      onClose();
      window.scrollTo(0, 0); // Scroll to top after closing modal
    } else {
      setError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acesso Restrito">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-acotubo-dark-text-secondary">
            Para fazer alterações no sistema, por favor, insira a senha de administrador.
          </p>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">Senha de Administrador</label>
            <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
                  required
                  autoFocus
                />
            </div>
            {isCapsLookOn && <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">Aviso: Caps Lock está ativado.</p>}
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-500">{error}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white dark:bg-acotubo-dark-surface py-2 px-4 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="bg-acotubo-red dark:bg-acotubo-orange py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange disabled:opacity-50 disabled:cursor-wait">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminLoginModal;
