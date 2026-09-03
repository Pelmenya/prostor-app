import type { TIntakeType } from './t-aquifer-layer';

export type TAquiferLayerStats = {
    id: string;
    label: string;
    minDepth: number;
    /** null для последнего слоя artesian (200m+ в backend → Infinity → JSON null). */
    maxDepth: number | null;
    count: number;
    pct: number;
    /** Median глубина бурения в этом горизонте в bbox. undefined если count=0. */
    medianDepth?: number;
    pctWell?: number;
    /** paramCode → median value. Параметры без данных в bucket — отсутствуют. */
    medianChemistry: Record<string, number>;
};

export type TAquiferStatsResponse = {
    layers: TAquiferLayerStats[];
    intakeType: TIntakeType;
    totalWells: number;
    samplesUsed: number;
    dominantLayerId: string | null;
    timeTakenMs: number;
    cached: boolean;
};
