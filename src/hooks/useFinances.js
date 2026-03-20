import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';

export const useFinances = () => {
    return useQuery({
        queryKey: ['finances'],
        queryFn: async () => {
            const [summary, recent, monthly, categories] = await Promise.all([
                expenseService.getSummary(),
                expenseService.getAll(),
                expenseService.getMonthlyData(),
                expenseService.getCategoryBreakdown()
            ]);

            return {
                summary: {
                    income: summary.totalIncome,
                    expenses: summary.totalExpenses,
                    net: summary.netProfit,
                    pending: summary.pendingPayments
                },
                recentExpenses: recent || [],
                monthlyData: monthly || [],
                categoryData: categories || []
            };
        }
    });
};

export const useAddExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (expense) => expenseService.create(expense),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finances'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });
};
export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => expenseService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finances'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            toast.success('Gasto eliminado correctamente');
        },
        onError: (error) => {
            toast.error(`Error al eliminar gasto: ${error.message}`);
        }
    });
};
