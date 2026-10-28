const swCode = `
const PATCH = \`
;(function(){
  const _interval = setInterval(() => {
    if (window.THREE && window.THREE.WebGLRenderer && !window.THREE.WebGLRenderer.__wsPatched) {
      const R = window.THREE.WebGLRenderer;
      R.__wsPatched = true;
      const origRender = R.prototype.render;
      R.prototype.render = function(scene, camera) {
        window.__WS_SCENE = scene;
        window.__WS_CAMERA = camera;
        window.__WS_RENDERER = this;
        return origRender.apply(this, arguments);
      };
      clearInterval(_interval);
      console.log('[WS] Camera Hijacked!');
    }
  }, 100);
})();
\`;

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.href.includes('pbmobile.app') && url.pathname.endsWith('/static/client.js')) {
    event.respondWith((async () => {
      const res = await fetch(event.request);
      const text = await res.text();
      const patched = text + PATCH; 
      return new Response(patched, {
        status: res.status,
        statusText: res.statusText,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    })());
  }
});
`;
