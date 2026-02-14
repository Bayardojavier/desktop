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
      try{ if(window.setFace) { window.setFace('error'); setTimeout(()=>{ try{ if(window.setFace) window.setFace('idle'); }catch(e){} }, 2200); } }catch(e){}
      alert('❌ Usuario o contraseña incorrectos');
      return;
    }

    // Guardar datos del usuario en localStorage
    localStorage.setItem('usuario_id', data.id);
    localStorage.setItem('usuario_nombre', data.nombre);
    localStorage.setItem('usuario_rol', data.rol);

    alert(`✅ Bienvenido, ${data.nombre} (${data.rol})`);
    location.reload(); // Recargar la página para mostrar la interfaz principal
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

// Toggle mostrar/ocultar contraseña
(function(){
  const pwd = document.getElementById('contrasena');
  const btn = document.getElementById('toggle-password');
  if(!pwd || !btn) return;
  const eyeSVG = {
    show: '<svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    hide: '<svg class="icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.22 21.22 0 0 1 5.06-6.94"></path><path d="M1 1l22 22"></path><path d="M9.88 9.88A3 3 0 1 0 14.12 14.12"></path></svg>'
  };
  let visible = false;
  btn.addEventListener('click', function(){
    visible = !visible;
    if(visible){
      pwd.type = 'text';
      btn.setAttribute('aria-label','Ocultar contraseña');
      btn.title = 'Ocultar contraseña';
      btn.innerHTML = eyeSVG.hide;
    } else {
      pwd.type = 'password';
      btn.setAttribute('aria-label','Mostrar contraseña');
      btn.title = 'Mostrar contraseña';
      btn.innerHTML = eyeSVG.show;
    }
  });
})();

// Face reactivo: usa assets/1.png,2.png,3.png
(function(){
  const face = document.getElementById('faceImg');
  const user = document.getElementById('usuario');
  const pwd = document.getElementById('contrasena');
  if(!face) return;
  function setFace(state){
    face.classList.remove('attentive','cover','bounce');
    if(state === 'attentive'){
      face.src = './assets/1.png';
      face.classList.add('attentive','bounce');
    } else if(state === 'cover'){
      face.src = './assets/2.png';
      face.classList.add('cover');
    } else if(state === 'error'){
      face.src = './assets/3.png';
      face.classList.add('bounce');
    } else {
      face.src = './assets/1.png';
    }
  }
  window.setFace = setFace;
  if(user){
    user.addEventListener('focus', ()=> setFace('attentive'));
    user.addEventListener('input', ()=> setFace(user.value ? 'attentive' : 'idle'));
    user.addEventListener('blur', ()=> setFace('idle'));
  }
  if(pwd){
    pwd.addEventListener('focus', ()=> setFace('cover'));
    pwd.addEventListener('input', ()=> setFace(pwd.value ? 'cover' : 'cover'));
    pwd.addEventListener('blur', ()=> setFace('idle'));
  }
  // inicializar
  setFace('idle');
})();