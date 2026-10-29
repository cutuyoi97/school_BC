/**
 * Personal Docente: agrupación por nivel/área y filtros por sede y área académica.
 * Los datos viven en /js/data/docentes.js (TEACHERS, TEACHER_GROUPS, TEACHER_AREAS, teacherCard).
 */

const state = { sede: "all", area: "all" };

function groupSection(groupKey, teachers) {
    const group = TEACHER_GROUPS[groupKey];
    return `
        <section class="teachers-group" aria-labelledby="group-${groupKey}">
            <div class="teachers-group-header">
                <h2 id="group-${groupKey}">${group.title}</h2>
                <p>${group.description}</p>
            </div>
            <div class="teachers-grid">${teachers.map(teacherCard).join("")}</div>
        </section>
    `;
}

function render() {
    const container = document.getElementById("teachersGroups");
    const emptyState = document.getElementById("teachersEmpty");
    if (!container) return;

    const filtered = TEACHERS.filter((t) => {
        const matchesSede = state.sede === "all" || t.sede === state.sede;
        const matchesArea = state.area === "all" || t.area === state.area;
        return matchesSede && matchesArea;
    });

    container.innerHTML = Object.keys(TEACHER_GROUPS)
        .map((key) => [key, filtered.filter((t) => t.group === key)])
        .filter(([, teachers]) => teachers.length > 0)
        .map(([key, teachers]) => groupSection(key, teachers))
        .join("");

    container.hidden = filtered.length === 0;
    if (emptyState) emptyState.hidden = filtered.length > 0;
    updateEmptyMessage(filtered.length === 0);
}

function updateEmptyMessage(isEmpty) {
    const title = document.getElementById("teachersEmptyTitle");
    const text = document.getElementById("teachersEmptyText");
    const note = document.querySelector(".teachers-note");
    if (!title || !text) return;

    const sedeHasTeachers = state.sede === "all" || TEACHERS.some((t) => t.sede === state.sede);
    // La nota general repite el mismo mensaje: se oculta mientras se muestra en el recuadro.
    if (note) note.hidden = isEmpty && !sedeHasTeachers;
    if (!isEmpty) return;

    if (sedeHasTeachers) {
        title.textContent = "Sin resultados";
        text.textContent = "No hay docentes registrados para el área seleccionada.";
    } else {
        title.textContent = `Equipo docente de la ${TEACHER_SEDES[state.sede]}`;
        text.textContent = "Próximamente estaremos compartiendo más información sobre nuestro equipo docente de las diferentes sedes.";
    }
}

document.querySelectorAll("[data-sede-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("[data-sede-filter]").forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        state.sede = btn.dataset.sedeFilter;
        render();
    });
});

const areaSelect = document.getElementById("areaFilter");
if (areaSelect) {
    areaSelect.innerHTML = `<option value="all">Todas las áreas</option>` +
        Object.entries(TEACHER_AREAS)
            .map(([key, label]) => `<option value="${key}">${label}</option>`)
            .join("");

    // Permite enlazar directamente a un área, p. ej. /docentes?area=primaria
    const initialArea = new URLSearchParams(window.location.search).get("area");
    if (initialArea && TEACHER_AREAS[initialArea]) {
        areaSelect.value = initialArea;
        state.area = initialArea;
    }

    areaSelect.addEventListener("change", () => {
        state.area = areaSelect.value;
        render();
    });
}

render();
