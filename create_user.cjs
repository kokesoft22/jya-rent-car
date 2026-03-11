const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
  const email = 'admin@jya.com';
  const password = 'Admin123Password!';
  
  console.log('Intentando crear usuario:', email);
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Error creando usuario:', error.message);
  } else {
    console.log('Usuario creado con éxito:', data.user.email);
    console.log('Credenciales sugeridas para probar:');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createUser();
