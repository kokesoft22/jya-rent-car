import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentalService } from '../services/rentalService';
import { toast } from 'sonner';

export const useRentals = () => {
  return useQuery({
    queryKey: ['rentals'],
    queryFn: rentalService.getAll,
  });
};

export const useActiveRentals = (date) => {
  return useQuery({
    queryKey: ['rentals', 'active', date],
    queryFn: () => rentalService.getAllActiveRentals(date),
    enabled: !!date,
  });
};

export const useVehicleRentals = (vehicleId) => {
  return useQuery({
    queryKey: ['rentals', 'vehicle', vehicleId],
    queryFn: () => rentalService.getByVehicle(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useAddRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rentalService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['rentals', 'vehicle', variables.vehicle_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Refresh vehicle status
      toast.success('Reserva creada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear reserva: ${error.message}`);
    },
  });
};

export const useUpdateRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => rentalService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // In case status changed
      toast.success('Reserva actualizada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar reserva: ${error.message}`);
    },
  });
};

export const useDeleteRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rentalService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Reserva eliminada');
    },
    onError: (error) => {
      toast.error(`Error al eliminar reserva: ${error.message}`);
    },
  });
};
