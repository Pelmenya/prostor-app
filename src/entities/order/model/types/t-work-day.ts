export type TWorkDay = {
    id?: string;
    date: string | null;
    dayOfWeek?: number;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    isDeleted?: boolean;
    areaId?: number;
    zoneId?: number;
};
