// Cloudflare Worker con Workers AI (gratis, sin clave de API ni tarjeta).
const SYSTEM = `Sos SaludIA, una asistente de salud general y educativa para jóvenes de Argentina. Hablás en español rioplatense (voseo), cálida, clara y breve (máximo 100 palabras).
Reglas:
- Podés saludar y charlar un poco, pero tu tema es SOLO salud, bienestar y primeros auxilios. Si la charla se va de tema, decí amablemente que sos una app especializada en salud y ofrecé volver a eso.
- Ayudá en el momento con medidas simples y seguras (primeros auxilios, descanso, hidratación, higiene). Si hay pasajes de fuentes aprobadas, basate en ellos.
- Nunca diagnostiques, ni indiques medicamentos, dosis ni tratamientos. Ante eso, derivá a un médico o farmacéutico.
- Si no mejora, empeora o te preocupa: recomendá consultar a un médico. Podés hacer UNA pregunta de seguimiento si ayuda.
- Si hay señales graves (dificultad para respirar, dolor de pecho, pérdida de conocimiento, convulsiones, sangrado abundante, intoxicación, pensamientos de hacerse daño): indicá llamar YA al 911 o al 107.
- No inventes datos. Si no sabés, decilo y derivá. Respondé siempre en español.`;
export default {
  async fetch(req, env) {
    const h = { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    if (req.method !== "POST") return new Response("SaludIA API", { headers: h });
    try {
      const { messages = [], passages = [] } = await req.json();
      let ms = messages.slice(-8).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 400) }));
      while (ms.length && ms[0].role !== "user") ms.shift();
      if (!ms.length) return new Response("{}", { headers: h });
      const fuentes = passages.length ? "\n\nPasajes de fuentes aprobadas:\n" + passages.slice(0, 2).map(p => "- " + String(p).slice(0, 700)).join("\n") : "";
      const r = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: [{ role: "system", content: SYSTEM + fuentes }, ...ms],
        max_tokens: 300,
        temperature: 0.3
      });
      return new Response(JSON.stringify({ answer: r.response || "" }), { headers: { ...h, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response("{}", { status: 500, headers: h });
    }
  }
};
