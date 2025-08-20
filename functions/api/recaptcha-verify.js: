export async function onRequestPost({ request, env }) {
  try {
    const { token, action } = await request.json();
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "missing token" }), { status: 400 });
    }

    const ip = request.headers.get("CF-Connecting-IP");
    const params = new URLSearchParams({
      secret: env.RECAPTCHA_SECRET,
      response: token,
    });
    if (ip) params.append("remoteip", ip);

    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params
    });
    const data = await resp.json(); // { success, score, action, ... }

    const min = Number(env.RECAPTCHA_MIN_SCORE ?? 0.5);
    const ok =
      data.success === true &&
      (data.action ? data.action === action : true) &&
      (typeof data.score === "number" ? data.score >= min : true);

    return new Response(JSON.stringify({
      ok, score: data.score, action: data.action, errors: data["error-codes"] || []
    }), {
      status: ok ? 200 : 403,
      headers: { "content-type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad request" }), { status: 400 });
  }
}
