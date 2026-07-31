import { neon, neonConfig } from '@neondatabase/serverless';

// Neon HTTP driver. Build sırasında DATABASE_URL tanımsız olabilir,
// bu yüzden bağlantı ilk sorguya kadar kurulmaz.
let cached: ReturnType<typeof neon> | null = null;

// Yalnızca lokal geliştirme: NEON_LOCAL_PROXY tanımlıysa istekler
// docker'daki Neon HTTP proxy'sine gider (düz Postgres'e bağlanmak için).
// Üretimde bu değişken yoktur, davranış değişmez.
if (process.env.NEON_LOCAL_PROXY) {
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_PROXY;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

export function db() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL tanımlı değil. Vercel Marketplace üzerinden Neon bağlayın veya .env.local dosyasına ekleyin.',
      );
    }
    cached = neon(url);
  }
  return cached;
}
