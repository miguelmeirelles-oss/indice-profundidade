/* Aula por IA · avisos no celular
   Recebe os avisos do Firebase mesmo com o app fechado e mostra a notificação.
   Ao tocar na notificação, abre (ou traz para a frente) a página certa. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { var j = e.data ? e.data.json() : {}; d = j.data || j; } catch (x) { d = { corpo: e.data ? e.data.text() : '' }; }
  var titulo = d.titulo || 'Aula por IA';
  var opcoes = {
    body: d.corpo || '',
    icon: 'icone-192.png',
    badge: 'icone-192.png',
    data: { url: d.url || 'aulas.html' }
  };
  if (d.tag) { opcoes.tag = d.tag; opcoes.renotify = true; }
  e.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var alvo = new URL((e.notification.data && e.notification.data.url) || 'aulas.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (janelas) {
    for (var i = 0; i < janelas.length; i++) {
      if (janelas[i].url.split('#')[0].split('?')[0] === alvo.split('?')[0] && 'focus' in janelas[i]) return janelas[i].focus();
    }
    return self.clients.openWindow(alvo);
  }));
});
