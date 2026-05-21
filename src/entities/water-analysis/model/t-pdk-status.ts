/**
 * Interval-aware статус относительно ПДК. 4 уровня severity (см. PhD interval
 * analysis в slovo/apps/api/src/modules/water-analysis/predict/dto):
 *
 * - `safe` — весь interval ниже ПДК (точно норма).
 * - `borderline` — interval crosses ПДК, median ≤ ПДК (вероятно норма, есть выбросы выше).
 * - `concerning` — interval crosses ПДК, median > ПДК (скорее всего проблема).
 * - `unsafe` — весь interval вне ПДК (100% соседей вне нормы, точно проблема).
 *
 * `null` — параметр не нормируется (temperature, electrical_conductivity).
 */
export type TPdkStatus = 'safe' | 'borderline' | 'concerning' | 'unsafe';

/**
 * Heatmap cell status (отдельно от TPdkStatus — у /heatmap другая семантика:
 * считается по median, не по interval). 3 уровня хватает для diverging colors.
 */
export type THeatmapCellStatus = 'good' | 'mid' | 'bad';
