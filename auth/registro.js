document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const usuario = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;
  const rol = document.getElementById('rol').value;

  if (!nombre || !usuario || !contrasena || !rol) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .insert([
        { nombre, usuario, contrasena, rol }
      ])
      .select();

    if (error) throw error;

    alert('✅ Usuario registrado con éxito');
    window.location.href = 'login.html'; // redirige al login
  } catch (err) {
    console.error('Error al registrar:', err);
    alert('❌ Error: ' + (err.message || 'No se pudo registrar'));
  }
});

// En registro.js
document.getElementById('link-login')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = './login.html';
});