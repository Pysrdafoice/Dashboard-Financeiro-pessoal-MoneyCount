// Service Worker do FuelCount — permite abrir o app offline depois da
// primeira visita.
//
// IMPORTANTE: sempre que a lista de arquivos mudar, incremente
// CACHE_VERSION. Sem isso, navegadores que já visitaram o site continuam
// servindo a versão antiga do cache, e as mudanças não aparecem.
const CACHE_VERSION = 'fuelcount-v2';

const ARQUIVOS_DO_APP = [
  './',
  './index.html',
  './privacidade.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',

  './js/app.js',
  './js/estado.js',
  './js/persistencia.js',
  './js/calculos.js',
  './js/ui/dom.js',
  './js/ui/utils.js',
  './js/config/supabase.js',
  './js/services/authService.js',
  './js/services/backupNuvemService.js',
  './js/modules/categorias.js',
  './js/modules/gastos.js',
  './js/modules/ganhos.js',
  './js/modules/limites.js',
  './js/modules/poupanca.js',
  './js/modules/streak.js',
  './js/modules/modal.js',
  './js/modules/graficos.js',
  './js/modules/carrossel.js',
  './js/modules/menu.js',
  './js/modules/tema.js',
  './js/modules/backup.js',
  './js/modules/onboarding.js',
  './js/modules/nuvem.js',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Cacheia um a um em vez de cache.addAll(): addAll é atômico — se UM
      // arquivo da lista der 404, a instalação inteira do Service Worker
      // falha em silêncio. Foi exatamente isso que aconteceu quando a lista
      // ainda apontava para o antigo script.js, já removido do projeto.
      Promise.all(
        ARQUIVOS_DO_APP.map((arquivo) =>
          cache.add(arquivo).catch((erro) => {
            console.warn(`[SW] Não foi possível cachear ${arquivo}:`, erro);
          }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((nome) => nome !== CACHE_VERSION).map((nome) => caches.delete(nome)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== 'GET') return;

  const mesmaOrigem = new URL(requisicao.url).origin === self.location.origin;

  if (mesmaOrigem) {
    // Arquivos do app: rede primeiro (pra pegar atualizações), cache como
    // reserva quando estiver offline.
    evento.respondWith(
      fetch(requisicao)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(requisicao, copia));
          return resposta;
        })
        .catch(() => caches.match(requisicao)),
    );
  } else {
    // Recursos externos (Chart.js, Google Fonts, Supabase): cache primeiro,
    // já que raramente mudam.
    evento.respondWith(
      caches.match(requisicao).then((emCache) => {
        if (emCache) return emCache;
        return fetch(requisicao).then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(requisicao, copia));
          return resposta;
        });
      }),
    );
  }
});