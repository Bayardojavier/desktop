// Script de prueba para las notificaciones del sistema
// Ejecutar en la consola del navegador después de cargar la app

// Simular la función showSystemNotification (ya debería estar disponible en window)
function testNotifications() {
  console.log('Probando notificaciones del sistema...');

  // Verificar si las funciones están disponibles
  if (typeof window.showSystemNotification === 'function') {
    console.log('✅ Función showSystemNotification disponible');

    // Probar notificación de éxito
    window.showSystemNotification('Prueba de Notificación', 'Esta es una notificación de prueba que debería aparecer y desaparecer automáticamente.');

    // Probar notificación de error después de 2 segundos
    setTimeout(() => {
      window.showSystemNotification('Error de Prueba', 'Esta es una notificación de error de prueba.');
    }, 2000);

  } else {
    console.log('❌ Función showSystemNotification no disponible');
  }

  // Verificar permisos de notificación
  if ('Notification' in window) {
    console.log('✅ API de Notificaciones soportada');
    console.log('Permisos actuales:', Notification.permission);
  } else {
    console.log('❌ API de Notificaciones no soportada');
  }
}

// Ejecutar la prueba
testNotifications();