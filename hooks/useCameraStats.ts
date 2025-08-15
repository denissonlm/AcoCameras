import { useMemo } from 'react';
import { Device, CameraStatus, ActionType, Division, DeviceType } from '../types';

const useCameraStats = (devices: Device[], divisions: Division[]) => {
    const stats = useMemo(() => {
        const allChannels = devices.flatMap(d => d.channels);
        const problemChannels = allChannels.filter(c => c.status !== CameraStatus.Online);

        const statusCounts = allChannels.reduce((acc, channel) => {
            const status = channel.status as CameraStatus; // Cast to new, simpler enum
            if (status === CameraStatus.Online || status === CameraStatus.Offline) {
              acc[status] = (acc[status] || 0) + 1;
            }
            return acc;
        }, {} as Record<CameraStatus, number>);

        const actionCounts = problemChannels.reduce((acc, channel) => {
            if (channel.action_taken) {
                acc[channel.action_taken] = (acc[channel.action_taken] || 0) + 1;
            }
            return acc;
        }, {} as Record<ActionType, number>);

        const statusChartData = Object.entries(statusCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const actionChartData = Object.entries(actionCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const divisionChartData = divisions.map(division => {
            const count = devices
                .filter(device => device.division_id === division.id)
                .reduce((sum, device) => sum + device.channels.length, 0);
            return {
                id: division.id,
                name: division.name,
                value: count,
            };
        }).filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);
            
        const availableChannels = devices.reduce((acc, device) => {
            const usedChannels = device.channels.length;
            const capacity = device.channel_count || 0;
            return acc + (capacity - usedChannels);
        }, 0);

        const deviceStats = {
            total: devices.length,
            nvr: devices.filter(d => d.type === DeviceType.NVR).length,
            dvr: devices.filter(d => d.type === DeviceType.DVR).length,
        };

        const totals = {
            devices: devices.length,
            channels: allChannels.length,
            online: statusCounts[CameraStatus.Online] || 0,
            offline: statusCounts[CameraStatus.Offline] || 0,
            problems: problemChannels.length,
            availableChannels,
        };

        const getSummaryParts = () => {
            const baseParts = {
                title: '📝 **Relatório Executivo de Status das Câmeras**',
                greeting: 'Prezados Gestores,',
                intro: 'Este relatório sumariza a condição atual do nosso sistema de vigilância:',
                overviewTitle: '**Visão Geral:**',
                signature: 'Atenciosamente,\nSESMT do Grupo Açotubo',
                problemIntro: null,
                incidentDetailsTitle: null,
                incidentDetails: null,
                conclusionTitle: null,
            };

            // "All Good" Scenario
            if (totals.problems === 0) {
                 const overviewItems = [
                    `- Nosso sistema de vigilância atualmente monitora **${divisions.length} Divisões/Áreas**, com um total de **${totals.devices} Gravadores NVR/DVR** e **${totals.channels} câmeras** instaladas.`,
                    `- Todos os **${totals.channels} canais** estão **operando normalmente (Online)**.`,
                ];
                if (totals.availableChannels > 0) {
                    overviewItems.push(`- Existem **${totals.availableChannels} canais disponíveis** em nossos dispositivos para futuras expansões.`);
                }
                
                return {
                    ...baseParts,
                    overviewItems,
                    problemIntro: 'Nenhuma falha foi detectada, garantindo 100% de cobertura e segurança em nossas instalações.',
                    conclusion: '', // No separate conclusion for "all good" case by default
                };
            }

            // "Problems Found" Scenario
            const overviewItems = [
                `- Nosso sistema de vigilância atualmente monitora **${divisions.length} Divisões/Áreas**, com um total de **${totals.devices} Gravadores NVR/DVR** e **${totals.channels} câmeras** instaladas.`,
                `- Do total de câmeras, **${totals.online}** estão **operando normalmente (Online)**.`,
            ];

            if (totals.offline > 0) {
                overviewItems.push(`- Foram identificadas ##${totals.offline} câmeras Offline##, que requerem atenção imediata.`);
            }

            if (totals.availableChannels > 0) {
                overviewItems.push(`- Existem **${totals.availableChannels} canais disponíveis** em nossos dispositivos para futuras expansões.`);
            }
            
            const problemDetails = problemChannels.map(c => `- **Dispositivo ${devices.find(d => d.channels.some(ch => ch.id === c.id))?.name} (Canal: ${c.name})**: Status ${c.status}. Ação registrada: *${c.action_taken || 'Pendente de análise'}*.`).join('\n');

            return {
                ...baseParts,
                overviewItems,
                problemIntro: `Identificamos um total de ${totals.problems} canais que requerem atenção. As equipes responsáveis já foram acionadas conforme as necessidades específicas de cada incidente.`,
                incidentDetailsTitle: '**Detalhes dos Incidentes:**',
                incidentDetails: problemDetails,
                conclusionTitle: '**Conclusão:**',
                conclusion: 'As ações para restabelecer 100% da cobertura de vigilância estão em andamento. Acompanharemos de perto a resolução de cada chamado para garantir a normalização dos serviços o mais breve possível.',
            };
        };
        
        const summaryParts = getSummaryParts();

        return {
            allChannels,
            problemChannels,
            statusCounts,
            actionCounts,
            statusChartData,
            actionChartData,
            divisionChartData,
            deviceStats,
            totals,
            summaryParts,
        };

    }, [devices, divisions]);

    return stats;
};

export default useCameraStats;
