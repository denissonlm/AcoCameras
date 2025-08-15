import React, { useEffect, useState } from 'react';
import { Device, Division } from '../types';
import { generateReportHtml } from '../utils/reportGenerator';
import useCameraStats from '../hooks/useCameraStats';
import Modal from './Modal';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  divisions: Division[];
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, devices, divisions }) => {
  const stats = useCameraStats(devices, divisions);
  const [conclusion, setConclusion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Quando o modal abre, preenche a caixa de texto com a conclusão padrão gerada
    if (isOpen && stats.summaryParts) {
      setConclusion(stats.summaryParts.conclusion);
    }
  }, [isOpen, stats.summaryParts]);

  const handleGenerateAndDownload = () => {
    if (!stats) return;
    setIsLoading(true);
    try {
      // Gera o HTML usando a conclusão (potencialmente personalizada) do estado
      const htmlContent = generateReportHtml(devices, stats, conclusion);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `Relatorio_Acotubo_Cameras_${date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Ocorreu um erro inesperado ao gerar o relatório.");
    } finally {
      setIsLoading(false);
      onClose(); // Fecha o modal após a conclusão
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Personalizar e Gerar Relatório">
      <div className="space-y-4">
        <div>
          <label htmlFor="conclusion" className="block text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-secondary">
            Texto da Conclusão
          </label>
          <textarea
            id="conclusion"
            rows={8}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm bg-white dark:bg-acotubo-dark-surface text-gray-900 dark:text-acotubo-dark-text-primary placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-acotubo-red dark:focus:ring-acotubo-orange focus:border-acotubo-red dark:focus:border-acotubo-orange sm:text-sm"
            placeholder="Adicione a conclusão do relatório aqui..."
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-acotubo-dark-text-secondary">
            Este texto aparecerá na seção de conclusão do relatório HTML.
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="bg-white dark:bg-acotubo-dark-surface py-2 px-4 border border-gray-300 dark:border-acotubo-dark-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-acotubo-dark-text-primary hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGenerateAndDownload}
          disabled={isLoading}
          className="bg-acotubo-red dark:bg-acotubo-orange py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange disabled:opacity-50 disabled:cursor-wait"
        >
          {isLoading ? 'Gerando...' : 'Gerar e Baixar'}
        </button>
      </div>
    </Modal>
  );
};

export default ReportModal;
