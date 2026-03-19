import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceService } from '../services/maintenanceService';
import { toast } from 'sonner';

export const useVehicleMaintenanceLogs = (vehicleId) => {
  return useQuery({
    queryKey: ['maintenance', 'vehicle', vehicleId],
    queryFn: () => maintenanceService.getByVehicle(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useAddMaintenanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'vehicle', variables.vehicle_id] });
      toast.success('Registro de mantenimiento agregado');
    },
    onError: (error) => {
      toast.error(`Error al guardar mantenimiento: ${error.message}`);
    },
  });
};

export const useUpdateMaintenanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => maintenanceService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Registro de mantenimiento actualizado');
    },
    onError: (error) => {
      toast.error(`Error al actualizar mantenimiento: ${error.message}`);
    },
  });
};

export const useDeleteMaintenanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      toast.success('Registro eliminado');
    },
    onError: (error) => {
      toast.error(`Error al eliminar registro: ${error.message}`);
    },
  });
};
