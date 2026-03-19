import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { toast } from 'sonner';

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente registrado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al registrar cliente: ${error.message}`);
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar cliente: ${error.message}`);
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente eliminado');
    },
    onError: (error) => {
      toast.error(`Error al eliminar cliente: ${error.message}`);
    },
  });
};
