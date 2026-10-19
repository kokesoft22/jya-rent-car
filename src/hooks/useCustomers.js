import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Cliente eliminado');
    },
    onError: (error) => {
      toast.error(`Error al eliminar cliente: ${error.message}`);
    },
  });
};

export const useCustomerRentals = (customerId) => {
  return useQuery({
    queryKey: ['customerRentals', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          vehicles (
            model,
            license_plate
          )
        `)
        .eq('customer_id', customerId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
};

export const useBlacklistedCustomers = () => {
  return useQuery({
    queryKey: ['blacklisted-customers'],
    queryFn: customerService.getBlacklisted,
  });
};

export const useBlacklistCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => customerService.blacklist(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['blacklisted-customers'] });
      toast.success('Cliente añadido a lista negra');
    },
    onError: (error) => {
      toast.error(`Error al añadir a lista negra: ${error.message}`);
    },
  });
};

export const useUnblacklistCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => customerService.unblacklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['blacklisted-customers'] });
      toast.success('Cliente removido de lista negra');
    },
    onError: (error) => {
      toast.error(`Error al remover de lista negra: ${error.message}`);
    },
  });
};
