/**
 * Formulario de contacto: validación en cliente con errores por campo
 * (asociados con aria-invalid / aria-describedby), estados de carga y
 * envío a /api/contact (Resend vive solo en el backend).
 */

// Misma regla que el servidor (api/contact.js).
const EMAIL_REGEX = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const MAX_LENGTH = { name: 100, email: 200, subject: 150, message: 2000 };

const SERVER_MESSAGES = {
    403: "No fue posible enviar el mensaje desde esta página. Recarga e inténtalo nuevamente.",
    429: "Has enviado varios mensajes seguidos. Espera un minuto e inténtalo nuevamente.",
    503: "El servicio de mensajes no está disponible en este momento. Inténtalo más tarde.",
};
const GENERIC_ERROR = "No fue posible enviar el mensaje. Inténtalo nuevamente.";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnSpinner = submitBtn.querySelector(".btn-spinner");
    const statusBox = document.getElementById("formStatus");
    const messageCount = document.getElementById("messageCount");

    const fields = {
        name: form.elements.name,
        email: form.elements.email,
        subject: form.elements.subject,
        message: form.elements.message,
    };

    function setFieldError(field, message) {
        const wrapper = field.closest(".form-field");
        const errorEl = wrapper?.querySelector(".field-error");
        if (message) {
            wrapper?.classList.add("has-error");
            field.setAttribute("aria-invalid", "true");
            if (errorEl) errorEl.textContent = message;
        } else {
            wrapper?.classList.remove("has-error");
            field.removeAttribute("aria-invalid");
            if (errorEl) errorEl.textContent = "";
        }
    }

    function fieldError(key) {
        const value = fields[key].value.trim();
        if (key === "email") {
            if (!value) return "Ingresa tu correo electrónico.";
            if (value.length > MAX_LENGTH.email || !EMAIL_REGEX.test(value) || value.includes("..")) {
                return "Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.";
            }
            return "";
        }
        const empty = {
            name: "Ingresa tu nombre completo.",
            subject: "Cuéntanos el motivo de tu mensaje.",
            message: "Escribe tu mensaje.",
        };
        if (!value) return empty[key];
        if (value.length > MAX_LENGTH[key]) return `Máximo ${MAX_LENGTH[key]} caracteres.`;
        return "";
    }

    function validate() {
        let firstInvalid = null;
        Object.entries(fields).forEach(([key, field]) => {
            const error = fieldError(key);
            setFieldError(field, error);
            if (error && !firstInvalid) firstInvalid = field;
        });
        firstInvalid?.focus();
        return !firstInvalid;
    }

    // Tras un primer intento fallido, el error de cada campo se actualiza al corregirlo.
    Object.entries(fields).forEach(([key, field]) => {
        field.addEventListener("input", () => {
            if (field.getAttribute("aria-invalid") === "true") setFieldError(field, fieldError(key));
        });
    });

    function updateCount() {
        if (messageCount) messageCount.textContent = String(fields.message.value.length);
    }
    fields.message.addEventListener("input", updateCount);
    updateCount();

    function setStatus(type, message) {
        statusBox.className = "form-status " + type;
        statusBox.textContent = message;
        statusBox.hidden = false;
    }

    function clearStatus() {
        statusBox.hidden = true;
        statusBox.textContent = "";
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        btnSpinner.hidden = !loading;
        btnText.textContent = loading ? "Enviando..." : "Enviar mensaje";
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus();

        if (!validate()) {
            setStatus("error", "Revisa los campos marcados para poder enviar el mensaje.");
            return;
        }

        const payload = {
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            subject: fields.subject.value.trim(),
            message: fields.message.value.trim(),
            company: form.elements.company.value.trim(), // honeypot
        };

        setLoading(true);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok && result.ok) {
                setStatus("success", "Mensaje enviado correctamente. Te responderemos pronto.");
                form.reset();
                updateCount();
            } else if (response.status === 400 && Array.isArray(result.fields)) {
                result.fields.forEach((key) => fields[key] && setFieldError(fields[key], fieldError(key) || "Revisa este campo."));
                setStatus("error", "Revisa los campos marcados para poder enviar el mensaje.");
            } else {
                setStatus("error", SERVER_MESSAGES[response.status] || GENERIC_ERROR);
            }
        } catch {
            setStatus("error", GENERIC_ERROR);
        } finally {
            setLoading(false);
        }
    });
});
