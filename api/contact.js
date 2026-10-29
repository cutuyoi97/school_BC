// Vercel Serverless Function: recibe el formulario de contacto, valida en el
// servidor y envía el correo con la API de Resend. La RESEND_API_KEY vive
// solo aquí — nunca se expone al navegador.

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 10_000;

// Misma regla que el cliente (js/contact.js): sin espacios ni caracteres de
// cabecera (<>()[]\,;:") y con un dominio de nivel superior de 2+ letras.
const EMAIL_REGEX = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const MAX_LENGTH = { name: 100, email: 200, subject: 150, message: 2000 };

// Sin valores por defecto: si falta alguna, el formulario responde 503 en
// lugar de enviar con un remitente o destinatario inesperado.
const REQUIRED_ENV = ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"];

// Orígenes que pueden usar el formulario. Se amplían con ALLOWED_ORIGINS
// (lista separada por comas) y con la URL del despliegue de vista previa.
const PRODUCTION_ORIGINS = ["https://www.iebfba.edu.co", "https://iebfba.edu.co"];

// Límites best-effort: una instancia serverless "caliente" conserva estos
// contadores entre invocaciones, pero Vercel puede crear varias instancias en
// paralelo o reciclarlas en frío. NO sustituyen la regla de límite de tasa en
// Vercel Firewall (ver auditoria-iebfba/correcciones/pendientes-institucionales.md).
const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
// Tope por instancia para proteger la cuota de Resend ante abuso distribuido.
const sendLog = [];
const SEND_WINDOW_MS = 10 * 60_000;
const SEND_MAX_PER_WINDOW = 20;

function isRateLimited(ip) {
    const now = Date.now();
    const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    timestamps.push(now);
    requestLog.set(ip, timestamps);

    if (requestLog.size > 500) {
        for (const [key, values] of requestLog) {
            if (values.every((t) => now - t > RATE_LIMIT_WINDOW_MS)) requestLog.delete(key);
        }
    }

    return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function isSendQuotaExceeded() {
    const now = Date.now();
    while (sendLog.length && now - sendLog[0] > SEND_WINDOW_MS) sendLog.shift();
    return sendLog.length >= SEND_MAX_PER_WINDOW;
}

// Vercel sobrescribe x-forwarded-for / x-real-ip con la IP real del cliente
// (no reenvía valores enviados por el cliente), así que no son falsificables.
// x-vercel-forwarded-for se prefiere por si hubiera un proxy delante de Vercel.
function clientIp(req) {
    const header =
        req.headers["x-vercel-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "unknown";
    return String(header).split(",")[0].trim();
}

function allowedOrigins() {
    const origins = new Set(PRODUCTION_ORIGINS);
    if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
    if (process.env.VERCEL_BRANCH_URL) origins.add(`https://${process.env.VERCEL_BRANCH_URL}`);
    for (const origin of (process.env.ALLOWED_ORIGINS || "").split(",")) {
        if (origin.trim()) origins.add(origin.trim());
    }
    return origins;
}

// Una sola línea: elimina saltos de línea (CRLF), tabuladores y demás
// caracteres de control, incluidos los separadores Unicode U+2028/U+2029.
const singleLine = (value) =>
    String(value)
        .replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ")
        .replace(/ {2,}/g, " ")
        .trim();

// Texto multilínea: normaliza CRLF/CR a LF y elimina los demás caracteres de control.
const multiLine = (value) =>
    String(value)
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/g, "")
        .trim();

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

function send(res, status, body) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(status).json(body);
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return send(res, 405, { ok: false, error: "Método no permitido." });
    }

    // Solo el propio sitio puede usar el formulario. Los navegadores siempre
    // envían Origin en un POST con fetch; su ausencia indica un cliente no navegador.
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins().has(origin)) {
        return send(res, 403, { ok: false, error: "Origen no permitido." });
    }

    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (!contentType.startsWith("application/json")) {
        return send(res, 415, { ok: false, error: "Formato de solicitud no admitido." });
    }

    if (isRateLimited(clientIp(req))) {
        res.setHeader("Retry-After", String(RATE_LIMIT_WINDOW_MS / 1000));
        return send(res, 429, { ok: false, error: "Demasiadas solicitudes. Intenta más tarde." });
    }

    // En Vercel, leer req.body con un JSON mal formado lanza una excepción.
    let body;
    try {
        body = req.body;
    } catch {
        return send(res, 400, { ok: false, error: "Solicitud no válida." });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return send(res, 400, { ok: false, error: "Solicitud no válida." });
    }

    const { name, email, subject, message, company } = body;

    // Honeypot: si un bot llenó este campo oculto, respondemos "éxito" sin enviar nada.
    if (company) {
        return send(res, 200, { ok: true });
    }

    if ([name, email, subject, message].some((value) => typeof value !== "string")) {
        return send(res, 400, { ok: false, error: "Revisa los datos del formulario.", fields: ["name", "email", "subject", "message"] });
    }

    const clean = {
        name: singleLine(name),
        email: singleLine(email),
        subject: singleLine(subject),
        message: multiLine(message),
    };

    const invalid = [];
    if (!clean.name || clean.name.length > MAX_LENGTH.name) invalid.push("name");
    if (clean.email.length > MAX_LENGTH.email || !EMAIL_REGEX.test(clean.email) || clean.email.includes("..")) invalid.push("email");
    if (!clean.subject || clean.subject.length > MAX_LENGTH.subject) invalid.push("subject");
    if (!clean.message || clean.message.length > MAX_LENGTH.message) invalid.push("message");

    if (invalid.length) {
        // Solo se devuelven los nombres de los campos; nunca los valores recibidos.
        return send(res, 400, { ok: false, error: "Revisa los datos del formulario.", fields: invalid });
    }

    const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
    if (missingEnv.length) {
        // Se registran los NOMBRES de las variables, nunca sus valores.
        console.error("Formulario de contacto sin configurar. Faltan variables:", missingEnv.join(", "));
        return send(res, 503, { ok: false, error: "El servicio de mensajes no está disponible en este momento." });
    }

    if (isSendQuotaExceeded()) {
        console.error("Formulario de contacto: tope de envíos por instancia alcanzado.");
        res.setHeader("Retry-After", "600");
        return send(res, 503, { ok: false, error: "El servicio de mensajes está ocupado. Intenta más tarde." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);

    try {
        sendLog.push(Date.now());
        const response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: process.env.CONTACT_FROM_EMAIL,
                to: process.env.CONTACT_TO_EMAIL,
                reply_to: clean.email,
                subject: `[Contacto web] ${clean.subject}`,
                text: [
                    "Nuevo mensaje desde el sitio web",
                    `Nombre: ${clean.name}`,
                    `Correo: ${clean.email}`,
                    `Asunto: ${clean.subject}`,
                    "",
                    clean.message,
                ].join("\n"),
                html: `
                    <h2>Nuevo mensaje desde el sitio web</h2>
                    <p><strong>Nombre:</strong> ${escapeHtml(clean.name)}</p>
                    <p><strong>Correo:</strong> ${escapeHtml(clean.email)}</p>
                    <p><strong>Asunto:</strong> ${escapeHtml(clean.subject)}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>${escapeHtml(clean.message).replace(/\n/g, "<br>")}</p>
                `,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            // Solo el estado y el tipo de error de Resend: el cuerpo puede incluir datos del remitente.
            const details = await response.json().catch(() => ({}));
            console.error("Resend respondió con error:", response.status, details.name || "");
            if (response.status === 429) {
                return send(res, 503, { ok: false, error: "El servicio de mensajes está ocupado. Intenta más tarde." });
            }
            return send(res, 502, { ok: false, error: "No se pudo enviar el mensaje." });
        }

        return send(res, 200, { ok: true });
    } catch (err) {
        if (err.name === "AbortError") {
            console.error("Resend no respondió a tiempo.");
            return send(res, 504, { ok: false, error: "El servicio de mensajes no respondió a tiempo." });
        }
        console.error("Error al llamar a Resend:", err.name);
        return send(res, 500, { ok: false, error: "Ocurrió un error inesperado." });
    } finally {
        clearTimeout(timeout);
    }
};
