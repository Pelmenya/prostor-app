import { EDepartureBasis } from '../model/e-departure-basis';

const DEPARTURE_LABELS: Record<EDepartureBasis, string> = {
    [EDepartureBasis.OWN_ADDRESS]: 'от адреса',
    [EDepartureBasis.NEAREST_STORE]: 'от ближайшего склада',
};

export function getDepartureBasisLabel(basis: EDepartureBasis): string {
    return DEPARTURE_LABELS[basis];
}
