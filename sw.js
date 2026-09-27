const CACHE='cozy-cabin-shell-v68';
const BOOK_CACHE='cozy-cabin-books-v1';
const BOOKS=['./assets/books/willows.json', './assets/books/oz.json', './assets/books/garden.json', './assets/books/alice.json', './assets/books/frankenstein.json', './assets/books/little-women.json', './assets/books/dracula.json', './assets/books/time-machine.json', './assets/books/sleepy-hollow.json', './assets/books/anne.json', './assets/books/poe.json', './assets/books/holmes.json'];
const SHELL=['./','./index.html','./style.css?v=68','./app.js?v=68','./manifest.webmanifest','./assets/pwa-icon.svg','./reading.css?v=68','./telescope.js?v=68','./rhythms.js?v=68','./telescope-world.js?v=68','./clock.js?v=68','./state.js?v=68','./reading.js?v=68','./world.js?v=68','./living-details.js?v=68','./renderer.js?v=68','./stories.js?v=68','./shore-life.js?v=68','./library.js?v=68','./discoveries.js?v=68','./audio.js?v=68','./input.js?v=68'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>caches.open(BOOK_CACHE))
      .then(cache=>cache.addAll(BOOKS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('cozy-cabin-')&&key!==CACHE&&key!==BOOK_CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;

  if(BOOKS.some(path=>new URL(path,self.registration.scope).href===url.href)){
    event.respondWith(caches.open(BOOK_CACHE).then(async cache=>{
      const saved=await cache.match(event.request);if(saved)return saved;
      const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
    }));return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-cache'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-cache'})
      .then(response=>{
        if(response.ok&&response.status===200){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
