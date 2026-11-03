export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ siteKey: env.TURNSTILE_SITE_KEY || '' }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
