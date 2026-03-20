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
  identifier: z.string().min(1, "El usuario o correo es requerido"),
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
      // Mapeo de usuario a correo para facilitar el login
      let loginEmail = data.identifier;
      if (loginEmail.toLowerCase() === 'yoelperez') {
        loginEmail = 'yoelperez1998@gmail.com';
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
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
            <label htmlFor="identifier">Usuario o Correo</label>
            <div className={`input-wrapper ${errors.identifier ? 'border-danger' : ''}`}>
              <Mail className="input-icon" size={20} />
              <input
                id="identifier"
                type="text"
                placeholder="yoelperez o correo@ejemplo.com"
                {...register('identifier')}
              />
            </div>
            {errors.identifier && <span className="text-xs text-danger mt-1">{errors.identifier.message}</span>}
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
