import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/api';
import { accountServiceKeys } from '@/entities/account-service';
import type { TWorkDay } from '@/shared/model';

export function useFillCalendar() {
    const api = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api<TWorkDay[]>('/service/fill-calendar', { method: 'POST' }),
        onSuccess: (data) => {
            queryClient.setQueryData(accountServiceKeys.workDays(), data ?? []);
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
            queryClient.setQueryData(accountServiceKeys.workDays(), data ?? []);
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
            queryClient.setQueryData(accountServiceKeys.workDays(), data ?? []);
            void queryClient.invalidateQueries({ queryKey: accountServiceKeys.my() });
        },
    });
}
