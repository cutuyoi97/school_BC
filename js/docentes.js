/**
 * Personal Docente: agrupación por nivel/área y filtro por área académica.
 * Los datos viven en /js/data/docentes.js (TEACHERS, TEACHER_GROUPS, TEACHER_AREAS, teacherCard).
 */

const state = { area: "all" };

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

    const filtered = TEACHERS.filter((t) => state.area === "all" || t.area === state.area);

    container.innerHTML = Object.keys(TEACHER_GROUPS)
        .map((key) => [key, filtered.filter((t) => t.group === key)])
        .filter(([, teachers]) => teachers.length > 0)
        .map(([key, teachers]) => groupSection(key, teachers))
        .join("");

    container.hidden = filtered.length === 0;
    if (emptyState) emptyState.hidden = filtered.length > 0;
}

const areaSelect = document.getElementById("areaFilter");
if (areaSelect) {
    areaSelect.innerHTML = `<option value="all">Todas las áreas</option>` +
        Object.entries(TEACHER_AREAS)
            .map(([key, label]) => `<option value="${key}">${label}</option>`)
            .join("");

    // Permite enlazar directamente a un área, p. ej. /pages/docentes.html?area=primaria
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
