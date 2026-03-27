import { create } from 'zustand';
import type { TRealEstateType, TRealEstateSourceWater, TWaterIntakePoints } from '@/shared/model';

type TWaterIntakePointKey = keyof TWaterIntakePoints;

// Координаты хранятся как простая пара чисел — не импортируем из address-search
type TWizardCoordinates = {
    latitude: number;
    longitude: number;
};

type TRealEstateWizardState = {
    address: string | null;
    coordinates: TWizardCoordinates | null;
    geoData: Record<string, unknown> | null;
    suggestion: Record<string, unknown> | null;
    activeType: TRealEstateType;
    residents: number;
    activeSource: TRealEstateSourceWater;
    depthWaterSource: number | null;
    waterIntakePoints: TWaterIntakePoints;
    progress: number;
};

type TRealEstateWizardActions = {
    setAddress: (address: string | null) => void;
    setCoordinates: (coordinates: TWizardCoordinates | null) => void;
    setGeoData: (geoData: Record<string, unknown> | null) => void;
    setSuggestion: (suggestion: Record<string, unknown> | null) => void;
    setActiveType: (type: TRealEstateType) => void;
    setResidents: (count: number) => void;
    setActiveSource: (source: TRealEstateSourceWater) => void;
    setDepthWaterSource: (depth: number | null) => void;
    incrementWaterIntakePoint: (key: TWaterIntakePointKey) => void;
    decrementWaterIntakePoint: (key: TWaterIntakePointKey) => void;
    setWaterIntakePoints: (points: TWaterIntakePoints) => void;
    setProgress: (progress: number) => void;
    reset: () => void;
};

export type { TWizardCoordinates };

const INITIAL_STATE: TRealEstateWizardState = {
    address: null,
    coordinates: null,
    geoData: null,
    suggestion: null,
    activeType: 'house',
    residents: 2,
    activeSource: 'waterSupply',
    depthWaterSource: null,
    waterIntakePoints: {
        toilet: 0,
        sink: 0,
        bath: 0,
        washingMachine: 0,
        dishWasher: 0,
        showerCabin: 0,
    },
    progress: 30,
};

export const useRealEstateWizardStore = create<TRealEstateWizardState & TRealEstateWizardActions>(
    (set) => ({
        ...INITIAL_STATE,

        setAddress: (address) => set({ address }),
        setCoordinates: (coordinates) => set({ coordinates }),
        setGeoData: (geoData) => set({ geoData }),
        setSuggestion: (suggestion) => set({ suggestion }),
        setActiveType: (activeType) => set({ activeType }),
        setResidents: (residents) => set({ residents }),
        setActiveSource: (activeSource) => set({ activeSource }),
        setDepthWaterSource: (depthWaterSource) => set({ depthWaterSource }),

        incrementWaterIntakePoint: (key) =>
            set((state) => ({
                waterIntakePoints: {
                    ...state.waterIntakePoints,
                    [key]: state.waterIntakePoints[key] + 1,
                },
            })),

        decrementWaterIntakePoint: (key) =>
            set((state) => ({
                waterIntakePoints: {
                    ...state.waterIntakePoints,
                    [key]: Math.max(0, state.waterIntakePoints[key] - 1),
                },
            })),

        setWaterIntakePoints: (waterIntakePoints) => set({ waterIntakePoints }),
        setProgress: (progress) => set({ progress }),

        reset: () => set(INITIAL_STATE),
    }),
);
