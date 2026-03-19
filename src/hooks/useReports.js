import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';

export const useVehicleProfitability = () => {
    return useQuery({
        queryKey: ['report-vehicle-profitability'],
        queryFn: () => expenseService.getVehicleProfitability(),
        staleTime: 10 * 60 * 1000, // 10 minutes cache
    });
};
