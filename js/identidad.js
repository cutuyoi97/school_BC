/**
 * Página Nuestra Identidad: aparición progresiva al hacer scroll, acordeón de
 * valores, línea de tiempo con progreso y reproductor visual del himno.
 * JavaScript nativo, sin dependencias ni llamadas de red.
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Aparición al hacer scroll ---------- */

document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.add("is-visible"));
        return;
    }

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.2 }
    );

    items.forEach((el) => revealObserver.observe(el));
});

/* ---------- Acordeón de principios y valores ---------- */

document.querySelectorAll(".value-item").forEach((item) => {
    const trigger = item.querySelector(".value-trigger");
    trigger?.addEventListener("click", () => {
        const isActive = item.classList.contains("is-active");
        item.classList.toggle("is-active");
        trigger.setAttribute("aria-expanded", String(!isActive));
    });
});

/* ---------- Línea de tiempo ---------- */

(() => {
    const wrap = document.querySelector("[data-timeline]");
    if (!wrap) return;

    wrap.classList.add("is-enhanced");
    wrap.querySelectorAll(".tl-card").forEach((card) => card.classList.add("reveal"));

    // Detalles ampliables
    wrap.querySelectorAll(".tl-more").forEach((btn) => {
        const panel = document.getElementById(btn.getAttribute("aria-controls"));
        const label = btn.querySelector("span");
        btn.addEventListener("click", () => {
            const open = btn.getAttribute("aria-expanded") !== "true";
            btn.setAttribute("aria-expanded", String(open));
            panel?.classList.toggle("is-open", open);
            if (label) label.textContent = open ? "Ocultar detalle" : "Ver más detalle";
        });
    });

    // Línea de progreso que acompaña el recorrido
    const items = Array.from(wrap.querySelectorAll(".tl-item"));
    const rail = wrap.querySelector(".tl-rail");
    let ticking = false;

    function update() {
        ticking = false;
        const mid = window.innerHeight * 0.55;
        const railRect = rail.getBoundingClientRect();
        const progress = Math.max(0, Math.min(railRect.height, mid - railRect.top));
        wrap.style.setProperty("--tl-progress", `${progress}px`);

        items.forEach((item) => {
            const marker = item.querySelector(".tl-marker").getBoundingClientRect();
            item.classList.toggle("is-reached", marker.top + marker.height / 2 <= mid);
        });
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
})();

/* ---------- Reproductor visual del himno ---------- */

(() => {
    const player = document.querySelector("[data-hymn]");
    if (!player) return;

    const stanzas = Array.from(player.querySelectorAll(".stanza"));
    const dots = Array.from(player.querySelectorAll("[data-hymn-dot]"));
    const prevBtn = player.querySelector("[data-hymn-prev]");
    const nextBtn = player.querySelector("[data-hymn-next]");
    const playBtn = player.querySelector("[data-hymn-play]");
    const fullBtn = player.querySelector("[data-hymn-full]");
    const status = player.querySelector("[data-hymn-status]");
    const stage = player.querySelector(".hymn-stage");
    const total = stanzas.length;
    const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
    const AUTO_MS = 9000;

    let index = 0;
    let timer = null;
    let leavingTimeout = null;
    let audio = null;
    let audioReady = false;

    player.classList.add("is-ready");
    player.dataset.index = "0";

    /* --- Navegación entre estrofas --- */

    function show(next, { fromAudio = false } = {}) {
        if (next < 0 || next >= total || next === index) return;

        const previous = stanzas[index];
        player.style.setProperty("--enter-x", next > index ? "28px" : "-28px");

        clearTimeout(leavingTimeout);
        stanzas.forEach((s) => s.classList.remove("is-leaving"));
        if (!reducedMotion.matches && !player.classList.contains("is-full")) {
            previous.classList.add("is-leaving");
            leavingTimeout = setTimeout(() => previous.classList.remove("is-leaving"), 300);
        }

        previous.classList.remove("is-current");
        previous.setAttribute("aria-hidden", "true");
        index = next;
        stanzas[index].classList.add("is-current");
        stanzas[index].removeAttribute("aria-hidden");
        player.dataset.index = String(index);
        render();

        if (!fromAudio && audioReady && Number.isFinite(audio.duration)) {
            audio.currentTime = stanzaStart(index);
        }
    }

    function render() {
        dots.forEach((dot, i) => {
            if (i === index) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === total - 1;
        status.textContent = `Estrofa ${ROMAN[index]} de ${ROMAN[total - 1]}`;
    }

    stanzas.forEach((s, i) => {
        if (i === 0) s.classList.add("is-current");
        else s.setAttribute("aria-hidden", "true");
    });
    render();

    prevBtn.addEventListener("click", () => { restartTimer(); show(index - 1); });
    nextBtn.addEventListener("click", () => { restartTimer(); show(index + 1); });
    dots.forEach((dot, i) => dot.addEventListener("click", () => { restartTimer(); show(i); }));

    // Teclado: flechas dentro del reproductor
    player.addEventListener("keydown", (event) => {
        if (player.classList.contains("is-full")) return;
        if (event.key === "ArrowRight") { event.preventDefault(); restartTimer(); show(index + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); restartTimer(); show(index - 1); }
    });

    // Gesto de deslizamiento en pantallas táctiles
    let touchStartX = null;
    stage.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") touchStartX = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
        if (touchStartX === null) return;
        const dx = e.clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < 50) return;
        restartTimer();
        show(dx < 0 ? index + 1 : index - 1);
    });
    stage.addEventListener("pointercancel", () => { touchStartX = null; });

    /* --- Letra completa --- */

    fullBtn.addEventListener("click", () => {
        const full = !player.classList.contains("is-full");
        player.classList.toggle("is-full", full);
        fullBtn.setAttribute("aria-pressed", String(full));
        fullBtn.querySelector("span").textContent = full ? "Ver por estrofas" : "Ver letra completa";
        fullBtn.querySelector("i").className = full ? "fa fa-columns" : "fa fa-list";
        stanzas.forEach((s) => (full ? s.removeAttribute("aria-hidden") : s.setAttribute("aria-hidden", String(!s.classList.contains("is-current")))));
        if (full) stopPlayback();
    });

    /* --- Reproducción: audio oficial si existe, si no, avance automático de letras --- */

    function setPlaying(on) {
        player.classList.toggle("is-playing", on);
        playBtn.setAttribute("aria-pressed", String(on));
        playBtn.querySelector("i").className = on ? "fa fa-pause" : "fa fa-play";
        playBtn.querySelector("span").textContent = on
            ? (audioReady ? "Pausar himno" : "Pausar letra")
            : (audioReady ? "Escuchar himno" : "Reproducir letra");
    }

    function restartTimer() {
        if (timer === null) return;
        clearInterval(timer);
        timer = setInterval(advance, AUTO_MS);
    }

    function advance() {
        if (index >= total - 1) { stopPlayback(); return; }
        show(index + 1);
    }

    function stopPlayback() {
        clearInterval(timer);
        timer = null;
        if (audioReady && !audio.paused) audio.pause();
        setPlaying(false);
    }

    playBtn.addEventListener("click", () => {
        if (player.classList.contains("is-playing")) { stopPlayback(); return; }
        if (index === total - 1) show(0);
        if (audioReady) {
            audio.play().catch(() => setPlaying(false));
        } else {
            timer = setInterval(advance, AUTO_MS);
            setPlaying(true);
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && timer !== null) stopPlayback();
    });

    /* --- Audio oficial opcional ---
       Para activarlo: copiar la grabación a assets/audio/himno-institucional.mp3 y
       cambiar data-audio-enabled="true" en .hymn-player. Opcional: data-stanza-starts
       con los segundos de inicio de cada estrofa (p. ej. "0,24,48,70,95,118"); si se
       omite, la letra avanza en partes iguales según la duración. */

    function stanzaStart(i) {
        const starts = (player.dataset.stanzaStarts || "").split(",").map(Number);
        if (starts.length === total && starts.every(Number.isFinite)) return starts[i];
        return (audio.duration / total) * i;
    }

    function stanzaAt(time) {
        const starts = (player.dataset.stanzaStarts || "").split(",").map(Number);
        if (starts.length === total && starts.every(Number.isFinite)) {
            let found = 0;
            starts.forEach((s, i) => { if (time >= s) found = i; });
            return found;
        }
        return Math.min(total - 1, Math.floor((time / audio.duration) * total));
    }

    if (player.dataset.audioEnabled === "true" && player.dataset.audioSrc) {
        audio = player.querySelector("[data-hymn-audio]");
        audio.src = player.dataset.audioSrc;

        audio.addEventListener("loadedmetadata", () => {
            audioReady = true;
            setPlaying(false);
        }, { once: true });

        // Si el archivo no carga, se vuelve en silencio al modo solo-letra.
        audio.addEventListener("error", () => {
            audioReady = false;
            audio = null;
            setPlaying(false);
        }, { once: true });

        audio.addEventListener("play", () => setPlaying(true));
        audio.addEventListener("pause", () => setPlaying(false));
        audio.addEventListener("ended", () => setPlaying(false));
        audio.addEventListener("timeupdate", () => {
            if (!audioReady || !Number.isFinite(audio.duration)) return;
            show(stanzaAt(audio.currentTime), { fromAudio: true });
        });

        audio.load();
    }
})();
