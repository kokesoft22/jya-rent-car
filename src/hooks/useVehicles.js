import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { toast } from 'sonner';

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: vehicleService.getAll,
  });
};

export const useAddVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vehicleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Vehículo creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear vehículo: ${error.message}`);
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => vehicleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Vehículo actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar vehículo: ${error.message}`);
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vehicleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Vehículo eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar vehículo: ${error.message}`);
    },
  });
};
