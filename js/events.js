import { createCountdown } from "./utils/countdown.js";
import { observeReveal } from "./utils/reveal.js";

/* ----- Contador del evento destacado ----- */

document.querySelectorAll(".featured-countdown").forEach((el) => createCountdown(el));

/* ----- Aparición progresiva ----- */

observeReveal(".event-card");
observeReveal(".news-card", { stagger: 0.08 });

/* ----- Centros de Interés: abrir la información ampliada desde cada tarjeta ----- */

function openInterestCenter(id, behavior = "smooth") {
    const detail = document.getElementById(id);
    if (!(detail instanceof HTMLDetailsElement)) return;
    detail.open = true;
    detail.scrollIntoView({ block: "start", behavior });
    detail.querySelector("summary")?.focus({ preventScroll: true });
}

document.querySelectorAll("[data-ci-open]").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        history.replaceState(null, "", `#${link.dataset.ciOpen}`);
        openInterestCenter(link.dataset.ciOpen);
    });
});

function openInterestCenterFromHash(behavior) {
    if (location.hash.startsWith("#ci-")) openInterestCenter(location.hash.slice(1), behavior);
}

// En la carga inicial se espera al evento load y se desplaza sin animación:
// un desplazamiento suave largo puede interrumpirse mientras la página carga.
const openFromHashOnLoad = () => openInterestCenterFromHash("instant");
if (document.readyState === "complete") openFromHashOnLoad();
else window.addEventListener("load", openFromHashOnLoad, { once: true });
window.addEventListener("hashchange", () => openInterestCenterFromHash());

/* ----- Filtros ----- */

const filterButtons = document.querySelectorAll(".filter-btn");
const eventCards = document.querySelectorAll(".event-card");

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");

        const filter = button.dataset.filter;

        eventCards.forEach((card) => {
            const matches = filter === "all" || card.dataset.category === filter;
            card.hidden = !matches;
        });
    });
});

/* ----- Galería con lightbox accesible ----- */

const lightbox = document.getElementById("galleryLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
let lastFocusedTrigger = null;

function openLightbox(trigger) {
    if (!lightbox || !lightboxImage) return;

    lastFocusedTrigger = trigger;
    lightboxImage.src = trigger.dataset.full || trigger.querySelector("img")?.src || "";
    lightboxImage.alt = trigger.getAttribute("aria-label") || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose?.focus();
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.style.overflow = "";
    lastFocusedTrigger?.focus();
}

document.querySelectorAll("[data-gallery-item]").forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox && !lightbox.hidden) {
        closeLightbox();
    }
});
