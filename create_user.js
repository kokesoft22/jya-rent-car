import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'Yoelperez1998@gmail.com',
    password: '123456',
  });

  if (error) {
    console.error('Error creando usuario:', error.message);
  } else {
    console.log('Usuario creado con éxito:', data.user.email);
    console.log('IMPORTANTE: Revisa tu correo para confirmar la cuenta si el registro por email está activado.');
  }
}

createUser();
