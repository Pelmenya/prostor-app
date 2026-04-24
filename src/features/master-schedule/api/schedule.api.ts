import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { accountServiceKeys } from '@/entities/account-service';
import type { TWorkDay } from '@/shared/model';

export const scheduleKeys = {
    workDays: () => ['schedule', 'work-days'] as const,
};

export function useGetWorkDays() {
    const api = useApi();
    return useQuery<TWorkDay[]>({
        queryKey: scheduleKeys.workDays(),
        queryFn: async () => {
            const data = await api<TWorkDay[]>('/service/work-days');
            return data ?? [];
        },
    });
}

export function useFillCalendar() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api<TWorkDay[]>('/service/fill-calendar', { method: 'POST' }),
        onSuccess: (data) => {
            queryClient.setQueryData(scheduleKeys.workDays(), data ?? []);
        },
    });
}

export function useUpdateCalendarWorkDay() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (day: Partial<TWorkDay>) =>
            api<TWorkDay[]>('/service/calendar', {
                method: 'PUT',
                body: { ...day, isDeleted: false },
            }),
        onSuccess: (data) => {
            queryClient.setQueryData(scheduleKeys.workDays(), data ?? []);
        },
    });
}

export function useDeleteCalendarWorkDay() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (day: TWorkDay) =>
            api<TWorkDay[]>('/service/calendar', { method: 'DELETE', body: day }),
        onSuccess: (data) => {
            queryClient.setQueryData(scheduleKeys.workDays(), data ?? []);
            void queryClient.invalidateQueries({ queryKey: accountServiceKeys.my() });
        },
    });
}
