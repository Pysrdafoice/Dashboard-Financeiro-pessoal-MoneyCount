// Service Worker do FuelCount — permite abrir o app offline depois da
// primeira visita.
//
// IMPORTANTE: sempre que a lista de arquivos mudar, incremente
// CACHE_VERSION. Sem isso, navegadores que já visitaram o site continuam
// servindo a versão antiga do cache, e as mudanças não aparecem.
const CACHE_VERSION = 'fuelcount-v5';
const ORIGENS_EXTERNAS_PERMITIDAS = new Set([
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
]);

const ARQUIVOS_DO_APP = [
  './',
  './index.html',
  './privacidade.html',
  './termo_condicao.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './chart.min.js',
  './service-worker.js',
  './js/services/serviceworker.js',

  './js/app.js',
  './js/estado.js',
  './js/persistencia.js',
  './js/calculos.js',
  './js/modules/meses.js',
  './js/ui/dom.js',
  './js/ui/utils.js',
  './js/config/supabase.js',
  './js/services/authservice.js',
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

  const url = new URL(requisicao.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.hostname === 'supabase.co' || url.hostname.endsWith('.supabase.co')) {
    return;
  }

  const mesmaOrigem = url.origin === self.location.origin;

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
  } else if (ORIGENS_EXTERNAS_PERMITIDAS.has(url.origin)) {
    // Apenas fontes externas conhecidas são cacheadas; CDN de módulos,
    // Supabase e outras origens seguem o fluxo normal do navegador.
    evento.respondWith(
      caches.match(requisicao).then((emCache) => {
        if (emCache) return emCache;
        return fetch(requisicao).then((resposta) => {
          if (resposta.ok || resposta.type === 'opaque') {
            const copia = resposta.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(requisicao, copia));
          }
          return resposta;
        });
      }),
    );
  }
});