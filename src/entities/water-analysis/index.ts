export { WATER_PARAMS, FEATURED_HEATMAP_PARAMS } from './model/t-water-param';
export type { TWaterParam } from './model/t-water-param';

export type { TPdkStatus, THeatmapCellStatus } from './model/t-pdk-status';

export type {
    TAquiferLayer,
    TAquiferLayerId,
    TAquiferLayerCount,
    TIntakeType,
} from './model/t-aquifer-layer';

export type { TBbox } from './model/t-bbox';

export type { THeatmapCellProperties, THeatmapFeature, THeatmapResponse } from './model/t-heatmap';

export type {
    TParamInterval,
    TPredictParamEstimate,
    TPredictByCategory,
    TPredictResponse,
} from './model/t-predict';

export type {
    TDepthCellProperties,
    TDepthCellFeature,
    TDepthMapResponse,
} from './model/t-depth-map';

export type {
    TDepthInterval,
    TDepthEstimate,
    TDepthPredictResponse,
} from './model/t-depth-predict';

export type { TPointProperties, TPointFeature, TPointsResponse } from './model/t-points';

export type {
    TWaterProblemSeverity,
    TWaterProblem,
    TEquipmentRecommendation,
    TEquipmentSuggestResponse,
} from './model/t-equipment';

export type { TAquiferLayerStats, TAquiferStatsResponse } from './model/t-aquifer-stats';

export type { TParamBreakdown, THeatmapCellDetail } from './model/t-cell-detail';
