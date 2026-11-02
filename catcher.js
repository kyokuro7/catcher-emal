export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS biar bisa diakses dari VPS
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // POST /upload — menerima raw email dari Email Routing
    if (request.method === "POST") {
      const raw = await request.text();
      const to = url.searchParams.get("to") || "";
      const id = crypto.randomUUID();
      await env.MAIL_KV.put(mail:${to}:${id}, raw, { expirationTtl: 3600 });
      return new Response(JSON.stringify({ ok: true, id }), { headers: cors });
    }

    // GET /?email=user@domain — dibaca harvester
    if (request.method === "GET") {
      const email = url.searchParams.get("email");
      if (!email) return new Response(JSON.stringify({ error: "missing email" }), { status: 400, headers: cors });
      const list = await env.MAIL_KV.list({ prefix: mail:${email}: });
      for (const k of list.keys) {
        const raw = await env.MAIL_KV.get(k.name);
        await env.MAIL_KV.delete(k.name);
        return new Response(JSON.stringify({ success: true, body: raw }), { headers: cors });
      }
      return new Response(JSON.stringify({ success: false }), { headers: cors });
    }

    return new Response("ok", { headers: cors });
  },

  async email(message, env) {
    // Handler Email Routing — simpan raw email ke KV
    const to = message.to;
    const raw = await new Response(message.raw).text();
    const id = crypto.randomUUID();
    await env.MAIL_KV.put(mail:${to}:${id}, raw, { expirationTtl: 3600 });
  },
};