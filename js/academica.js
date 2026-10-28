/**
 * Información Académica: docentes monodocentes de Básica Primaria.
 * Los datos viven en /js/data/docentes.js (fuente única).
 */

const primaryGrid = document.getElementById("primaryTeachers");
if (primaryGrid) {
    primaryGrid.innerHTML = TEACHERS.filter((t) => t.group === "primaria").map(teacherCard).join("");
}
