import React from 'react';
import { Division } from '../types';

interface DivisionManagerProps {
    divisions: Division[];
    onAdd: () => void;
    onEdit: (division: Division) => void;
    onDelete: (divisionId: number) => void;
    isAdmin: boolean;
}

const DivisionManager: React.FC<DivisionManagerProps> = ({ divisions, onAdd, onEdit, onDelete, isAdmin }) => {
    return (
        <div className="mb-8 bg-white dark:bg-acotubo-dark-surface p-6 rounded-xl shadow-lg">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label="Prédio">🏢</span>
                    <h2 className="text-xl font-bold text-acotubo-dark dark:text-acotubo-dark-text-primary">Gerenciar Divisões</h2>
                </div>
                {isAdmin && (
                    <button
                        onClick={onAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-acotubo-red dark:bg-acotubo-orange hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-acotubo-dark-surface focus:ring-acotubo-red dark:focus:ring-acotubo-orange transition-colors"
                    >
                        <span role="img" aria-label="Adicionar">➕</span>
                        Nova Divisão
                    </button>
                )}
            </div>
            <div className="flow-root">
                {divisions.length > 0 ? (
                    <ul role="list" className="-my-3 divide-y divide-gray-200 dark:divide-acotubo-dark-border">
                        {divisions.map((division) => (
                            <li key={division.id} className="py-3 sm:py-4 flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-acotubo-dark-text-primary truncate">{division.name}</p>
                                {isAdmin && (
                                    <div className="space-x-1">
                                        <button
                                            onClick={() => onEdit(division)}
                                            className="p-2 text-gray-500 hover:text-blue-600 dark:text-acotubo-dark-text-secondary dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                            aria-label={`Editar divisão ${division.name}`}
                                        >
                                            <span role="img" aria-label="Editar">✏️</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(division.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 dark:text-acotubo-dark-text-secondary dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                            aria-label={`Excluir divisão ${division.name}`}
                                        >
                                            <span role="img" aria-label="Excluir">🗑️</span>
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-acotubo-dark-text-secondary border-t border-gray-200 dark:border-acotubo-dark-border mt-4">
                        <p>Nenhuma divisão cadastrada.</p>
                        {isAdmin && <p className="text-xs">Clique em "Nova Divisão" para começar.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DivisionManager;