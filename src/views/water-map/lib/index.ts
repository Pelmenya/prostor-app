// Public API water-map/lib (внутренние модули НЕ импортируются напрямую
// другими слайсами — только через views/water-map/* собственный код).
//
// Всё что в этом файле — для внутреннего использования внутри water-map view'а.
// Cross-slice consumer'ам этот lib не доступен (это не shared/).

export {
    fetchHeatmap,
    fetchPredict,
    fetchDepthMap,
    fetchDepthPredict,
    fetchPoints,
    postEquipmentSuggest,
    postHeatmapCellDetail,
    fetchAquiferStats,
} from './water-analysis.api';
export type {
    THeatmapQuery,
    THeatmapCellQuery,
    TPredictQuery,
    TDepthMapQuery,
    TDepthPredictQuery,
    TPointsQuery,
    TEquipmentSuggestBody,
    TAquiferStatsQuery,
} from './water-analysis.api';

export {
    waterMapKeys,
    useHeatmap,
    useHeatmapCellDetail,
    usePredict,
    useDepthMap,
    useDepthPredict,
    usePoints,
    useEquipmentSuggest,
    useAquiferStats,
} from './water-analysis.queries';

export { SlovoApiError } from './slovo-api-client';

export {
    WATER_PARAM_META,
    WATER_PARAM_CATEGORIES,
    formatParamValue,
    formatPdk,
    paramLabel,
    paramFullLabel,
    paramsByCategory,
} from './water-params';
export type { TWaterParamMeta, TWaterParamCategory } from './water-params';

export {
    AQUIFER_LAYERS,
    aquiferLayerById,
    aquiferLayerLabel,
    aquiferLayerColor,
    aquiferMatchExpression,
    isAquiferLayerId,
} from './aquifer-layers';
export type { TAquiferLayerMeta } from './aquifer-layers';

export {
    SEVERITY_VISUALS,
    CONCERNING_COLOR,
    CONCERNING_CONTENT,
    severityLabel,
    severityWeight,
} from './severity-colors';
export type { TSeverityVisual } from './severity-colors';

export {
    cellsCircleRadiusExpression,
    cellsCircleColorExpression,
    cellsCircleStrokeWidthExpression,
    cellsCircleStrokeColorExpression,
    cellsCircleOpacityExpression,
    heatmapWeightExpression,
    heatmapIntensityExpression,
    heatmapColorExpression,
    heatmapRadiusExpression,
    heatmapOpacityExpression,
    coverageHeatmapWeightExpression,
    coverageHeatmapIntensityExpression,
    coverageHeatmapColorExpression,
    coverageHeatmapRadiusExpression,
    coverageHeatmapOpacityExpression,
    pointsCircleColorExpression,
    pointsCircleRadiusExpression,
    pointsCircleOpacityExpression,
    depthMapCircleRadiusExpression,
    depthMapCircleStrokeWidthExpression,
    HEATMAP_PALETTE,
} from './color-scale';

export {
    MAP_STYLE_LIGHT,
    MAP_STYLE_DARK,
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    MO_BBOX,
    snapBbox,
} from './map-styles';

export { parseMaplibreObject } from './maplibre-quirks';
