import { Device } from '../types';
import { logoSvgString } from '../components/Logo';

/**
 * Formata um texto simples com marcações (similar a Markdown) para HTML.
 * Converte negrito (**), itálico (*) e agrupa listas com hífen (-) em tags <ul>.
 * @param markdown O texto a ser formatado.
 * @returns Uma string contendo o HTML formatado.
 */
const formatSummaryAsHtml = (markdown: string): string => {
  let html = markdown
    // 1. Processa negrito, itálico e a nova sintaxe para texto vermelho
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/##(.*?)##/g, '<strong style="color: #dc3545;">$1</strong>');

  // 2. Encontra blocos de itens de lista (linhas que começam com '- ')
  //    e os envolve em tags <ul><li>.
  //    A regex `^- (.*(?:\n- .*)*)` encontra uma linha que começa com '- '
  //    e captura todas as linhas subsequentes que também começam com '- '.
  //    O 'gm' (global, multiline) é crucial para que '^' corresponda ao início de cada linha.
  html = html.replace(/^- (.*(?:\n- .*)*)/gm, (match) => {
    const itemsHtml = match
      .split('\n')
      .map(item => `<li>${item.replace(/^- /, '').trim()}</li>`)
      .join('');
    return `<ul>${itemsHtml}</ul>`;
  });

  // 3. Substitui as quebras de linha restantes por <br />, garantindo que não quebre o HTML da lista.
  html = html.replace(/\n/g, '<br />');

  return html;
};


export const generateReportHtml = (
    devices: Device[],
    stats: {
        problemChannels: any[];
        totals: any;
        summaryParts: any;
        actionChartData: any[];
        deviceStats: { total: number; nvr: number; dvr: number; };
    },
    customConclusion: string
): string => {
    const {
        problemChannels,
        totals,
        summaryParts,
        deviceStats,
    } = stats;

    const date = new Date();

    // Reassemble the final summary text using the parts and the custom conclusion
    const finalSummaryText = [
      summaryParts.title,
      '',
      summaryParts.greeting,
      '',
      summaryParts.intro,
      '',
      summaryParts.overviewTitle,
      ...summaryParts.overviewItems,
      '',
      summaryParts.problemIntro,
      '',
      summaryParts.incidentDetailsTitle,
      summaryParts.incidentDetails,
      '',
      // Only add the conclusion title if there is a conclusion text
      (summaryParts.conclusionTitle && customConclusion) ? summaryParts.conclusionTitle : null,
      customConclusion, // Use the potentially customized conclusion
      '',
      '',
      summaryParts.signature
    ].filter(Boolean).join('\n');


    // Styles are now light-mode only, by removing the dark mode media query.
    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            :root {
                --bg-color: #f8f9fa;
                --container-bg: #ffffff;
                --card-bg: #ffffff;
                --text-primary: #212529;
                --text-secondary: #6c757d;
                --border-color: #dee2e6;
                --accent-color: #CC0000;
                --green: #198754;
                --red: #dc3545;
                --yellow: #ffc107;
                --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
                --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
            }

            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                margin: 0; 
                padding: 20px; 
                background-color: var(--bg-color);
                color: var(--text-primary); 
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                line-height: 1.6;
            }

            .container { 
                max-width: 1140px; 
                margin: 0 auto; 
                padding: 40px; 
                background-color: var(--container-bg); 
                border-radius: 16px;
                box-shadow: var(--shadow-md);
                border: 1px solid var(--border-color);
            }

            /* Header */
            .header { 
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 24px;
                margin-bottom: 32px;
            }
            .header .title-block {
                text-align: right;
            }
            .header .title-block h1 {
                font-size: 32px;
                color: var(--text-primary);
                margin: 0;
                font-weight: 700;
            }
            .header .title-block p {
                font-size: 14px;
                color: var(--text-secondary);
                margin: 4px 0 0 0;
            }

            /* Section Titles */
            h2 { 
                font-size: 24px; 
                font-weight: 700;
                color: var(--text-primary); 
                padding-bottom: 12px;
                margin-top: 48px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            h2 .icon {
                font-size: 20px;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: 20px;
                margin-bottom: 48px; /* Increased margin */
            }
            .stat-card {
                background-color: var(--card-bg);
                padding: 20px;
                border-radius: 12px;
                border: 1px solid var(--border-color);
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: var(--shadow-sm);
            }
            .stat-card:hover {
                transform: translateY(-3px);
                box-shadow: var(--shadow-md);
            }
            .stat-card-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary);
                margin: 0 0 8px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .stat-card-value {
                font-size: 40px;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0;
                line-height: 1.1;
            }
            .stat-card-breakdown {
                font-size: 12px;
                font-weight: 500;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            .stat-card .value-green { color: var(--green); }
            .stat-card .value-red { color: var(--red); }
            .stat-card .value-yellow { color: var(--yellow); }

            /* Summary */
            .summary {
                background-color: #f8f9fc;
                border: 1px solid var(--border-color);
                border-left: 5px solid var(--accent-color);
                padding: 24px 32px;
                border-radius: 8px;
                font-size: 15px;
                line-height: 1.7;
                color: #343a40;
                box-shadow: var(--shadow-sm);
            }
            .summary ul {
                padding-left: 20px;
                margin-top: 8px;
                margin-bottom: 8px;
            }
            .summary li {
                margin-bottom: 4px;
            }
            .summary strong { color: var(--text-primary); }
            .summary code {
                background-color: rgba(0,0,0,0.05);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.9em;
            }

            /* Table */
            .table-container {
                border: 1px solid var(--border-color);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 14px;
            }
            th, td { 
                padding: 16px 20px; 
                text-align: left; 
                border-bottom: 1px solid var(--border-color); 
            }
            th { 
                background-color: var(--bg-color); 
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-secondary);
            }
            tbody tr:last-child td { border-bottom: none; }
            tbody tr:nth-child(even) { background-color: var(--bg-color); }
            tbody tr:hover { background-color: #e9ecef; }
            .status-badge {
                display: inline-flex;
                align-items: center;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 600;
                gap: 6px;
            }
            .status-Online { background-color: #d1fae5; color: #064e3b; }
            .status-Offline { background-color: #fee2e2; color: #991b1b; }
            
            /* Footer */
            .footer {
                text-align: center;
                margin-top: 48px;
                padding-top: 24px;
                border-top: 1px solid var(--border-color);
                font-size: 12px;
                color: #9ca3af;
            }

            /* Responsive */
            @media (max-width: 768px) {
                body { padding: 10px; }
                .container { padding: 20px; }
                .header { flex-direction: column; gap: 16px; align-items: flex-start; }
                .header .title-block { text-align: left; }
                .stats-grid { grid-template-columns: 1fr 1fr; }
                .stat-card-value { font-size: 32px; }
                h2 { font-size: 20px; }
            }
        </style>
    `;

    const problemChannelsHtml = problemChannels.map(channel => `
        <tr>
            <td>
                <div style="font-weight: 500; color: var(--text-primary);">${channel.name}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${devices.find(d => d.channels.some(ch => ch.id === channel.id))?.name}</div>
            </td>
            <td><span class="status-badge status-${channel.status.replace(/ /g, '')}">${channel.status}</span></td>
            <td>${channel.action_taken || 'Nenhuma'}</td>
            <td>${channel.action_notes || 'Nenhuma'}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Câmeras - Açotubo</title>
            ${styles}
        </head>
        <body>
            <div class="container">
                <header class="header">
                    ${logoSvgString}
                    <div class="title-block">
                        <h1>Relatório Gerencial de Câmeras</h1>
                        <p>Gerado em: ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}</p>
                    </div>
                </header>

                <div class="stats-grid">
                    <div class="stat-card">
                        <p class="stat-card-title"><span>🗄️</span>Dispositivos</p>
                        <p class="stat-card-value">${totals.devices}</p>
                        <p class="stat-card-breakdown">(${deviceStats.nvr} NVRs · ${deviceStats.dvr} DVRs)</p>
                    </div>
                    <div class="stat-card">
                        <p class="stat-card-title"><span>🎥</span>Total Câmeras</p>
                        <p class="stat-card-value">${totals.channels}</p>
                    </div>
                    <div class="stat-card">
                        <p class="stat-card-title"><span>➕</span>Canais Livres</p>
                        <p class="stat-card-value value-green">${totals.availableChannels}</p>
                    </div>
                    <div class="stat-card">
                        <p class="stat-card-title"><span>✅</span>Online</p>
                        <p class="stat-card-value value-green">${totals.online}</p>
                    </div>
                    <div class="stat-card">
                        <p class="stat-card-title"><span>🔴</span>Offline</p>
                        <p class="stat-card-value value-red">${totals.offline}</p>
                    </div>
                </div>

                <section>
                    <h2><span class="icon">📝</span>Sumário Executivo</h2>
                    <div class="summary">${formatSummaryAsHtml(finalSummaryText)}</div>
                </section>

                ${problemChannels.length > 0 ? `
                <section>
                    <h2><span class="icon">⚠️</span>Detalhes de Câmeras com Problemas</h2>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Câmera / Dispositivo</th>
                                    <th>Status</th>
                                    <th>Ação Tomada</th>
                                    <th>Notas da Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${problemChannelsHtml}
                            </tbody>
                        </table>
                    </div>
                </section>
                ` : ''}

                <footer class="footer">
                    Relatório gerado pelo Sistema de Monitoramento de Câmeras - Grupo Açotubo
                </footer>
            </div>
        </body>
        </html>
    `;
};
