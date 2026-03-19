import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, Loader } from 'lucide-react';
import logo from '../assets/logo.png';
import { toast } from 'sonner';
import '../components/Login.css';

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      toast.success('¡Bienvenido de nuevo!');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container glass-card animate-fade-in-up">
        <div className="login-header">
          <div className="login-logo-container">
             <img src={logo} alt="J&A Rent Car Logo" className="login-logo-img" />
          </div>
          <h2 className="text-white font-bold text-xl mt-4">J&A Rent Car</h2>
          <p className="text-muted text-sm mt-1">Accede a tu panel de administración</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form mt-8">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className={`input-wrapper ${errors.email ? 'border-danger' : ''}`}>
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                {...register('email')}
              />
            </div>
            {errors.email && <span className="text-xs text-danger mt-1">{errors.email.message}</span>}
          </div>

          <div className="form-group mt-4">
            <label htmlFor="password">Contraseña</label>
            <div className={`input-wrapper ${errors.password ? 'border-danger' : ''}`}>
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && <span className="text-xs text-danger mt-1">{errors.password.message}</span>}
          </div>

          <button type="submit" className="login-submit w-full mt-10" disabled={isSubmitting}>
            {isSubmitting ? <Loader className="animate-spin" size={20} /> : (
              <>
                <span>Entrar</span>
                <LogIn size={20} />
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer mt-10">
          <p className="text-muted text-[10px] text-center">&copy; {new Date().getFullYear()} J&A Rent Car System v2.0<br/>Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
