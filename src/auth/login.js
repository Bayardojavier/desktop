document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;

  try {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('id, nombre, usuario, rol')
      .eq('usuario', usuario)
      .eq('contrasena', contrasena)
      .maybeSingle(); // evita 406 si hay más de un match

    if (error || !data) {
      console.warn('Login fallido:', error);
      alert('❌ Usuario o contraseña incorrectos');
      return;
    }

    // Guardar datos del usuario en localStorage
    localStorage.setItem('usuario_id', data.id);
    localStorage.setItem('usuario_nombre', data.nombre);
    localStorage.setItem('usuario_rol', data.rol);

    alert(`✅ Bienvenido, ${data.nombre} (${data.rol})`);
    window.location.href = 'dashboard.html'; // o tu página principal
  } catch (err) {
    console.error('Error en login:', err);
    alert('❌ Error al iniciar sesión');
  }
});

// En login.js
document.getElementById('link-registro')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = './registro.html';
});