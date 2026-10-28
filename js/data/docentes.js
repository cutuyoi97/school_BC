/**
 * Personal docente — fuente única de datos.
 * Origen: documento "DOCENTES INSTITUCIÓN EDUCATIVA RURAL BUCHADÓ FERNANDO BOTERO ANGULO"
 * entregado por la institución. Lo usan /js/docentes.js (Personal Docente)
 * y /js/academica.js (sección Básica Primaria).
 *
 * Forma de cada registro:
 * { name, email, group: "primaria"|"areas"|"apoyo", area: clave de TEACHER_AREAS|null, subject }
 *
 * - group "primaria": el documento indica "TODAS" en el área de desempeño, es
 *   decir, el docente orienta todas las áreas (docente monodocente de
 *   Básica Primaria). No se listan asignaturas individuales.
 * - El documento no indica la sede de cada docente, por eso no se publica
 *   ese dato. Si la institución lo confirma, agrega `sede: "principal" |
 *   "san-miguel" | "arenal"` al registro.
 * - Los nombres se pasaron de MAYÚSCULAS a mayúsculas iniciales sin cambiar
 *   su escritura. Única corrección: "ANA GARIELA" → "Ana Gabriela", según
 *   su propio correo (anagabrielapalaciospalacios@gmail.com).
 */

const TEACHER_GROUPS = {
    primaria: {
        title: "Básica Primaria — Docentes monodocentes",
        description: "Docentes que orientan todas las áreas del plan de estudios de Básica Primaria.",
    },
    areas: {
        title: "Docentes por área",
        description: "Docentes encargados de un área o asignatura específica.",
    },
    apoyo: {
        title: "Orientación escolar y programas",
        description: "Docentes con funciones de orientación o vinculados a programas institucionales.",
    },
};

const TEACHER_AREAS = {
    "primaria": "Básica Primaria (monodocentes)",
    "matematicas": "Matemáticas",
    "ciencias-naturales": "Ciencias naturales",
    "humanidades": "Humanidades y lengua castellana",
    "ingles": "Inglés",
    "ciencias-sociales": "Ciencias sociales",
    "artistica": "Educación artística",
    "educacion-fisica": "Educación física",
    "apoyo": "Orientación escolar y programas",
};

const TEACHERS = [
    { name: "Danilo Romaña Salas", group: "areas", area: "matematicas", subject: "Matemática", email: "danirosal@hotmail.com" },
    { name: "Clodomiro Romaña Salas", group: "areas", area: "educacion-fisica", subject: "Educación Física", email: "clodo0100@hotmail.com" },
    { name: "Bonifacia Romaña Salas", group: "areas", area: "artistica", subject: "Educación Artística", email: "chachyboni@hotmail.com" },
    { name: "Edgar Jose Palomeque Palacios", group: "primaria", area: "primaria", subject: null, email: "edgarjosepalomequepalacios@gmail.com" },
    { name: "Oscar Enrique Palacios Cuesta", group: "areas", area: "ciencias-naturales", subject: "Biología y Química", email: "opalacioscu@hotmail.com" },
    { name: "Martha Yenny Torres Chaverra", group: "primaria", area: "primaria", subject: null, email: "marthayenny19@hotmail.com" },
    { name: "Albarina Arroyo Córdoba", group: "areas", area: "matematicas", subject: "Matemática", email: "albalinda40@hotmail.com" },
    { name: "Rubis del Carmen Mena Renteria", group: "areas", area: "ciencias-sociales", subject: "Ciencias Sociales", email: "mayeme2009@hotmail.com" },
    { name: "Luz Soraya Muños Guevara", group: "primaria", area: "primaria", subject: null, email: "soraya14-72@hotmail.com" },
    { name: "María Fulgencia Asprilla Mosquera", group: "primaria", area: "primaria", subject: null, email: "mariaasprillamosquera709@gmail.com" },
    { name: "María Rocio Martínez Palacios", group: "primaria", area: "primaria", subject: null, email: "rochipalma@hotmail.com" },
    { name: "Elizabeth Mosquera Magaña", group: "apoyo", area: "apoyo", subject: "Docente PETAFI 3.0", email: "elizamosquera30@yahoo.es" },
    { name: "Ana Gabriela Palacios Palacios", group: "areas", area: "ingles", subject: "Inglés", email: "anagabrielapalaciospalacios@gmail.com" },
    { name: "Vilma Mosquera Mosquera", group: "primaria", area: "primaria", subject: null, email: "vilmomo@hotmail.com" },
    { name: "María Elisa Mena Moreno", group: "areas", area: "humanidades", subject: "Español y Literatura", email: "menamoreno2012@hotmail.com" },
    { name: "Wilson Eladio Leudo Guerrero", group: "primaria", area: "primaria", subject: null, email: "wilsonleudo@hotmail.com" },
    { name: "Nora Esther Moreno Moreno", group: "primaria", area: "primaria", subject: null, email: "noralex2009@hotmail.com" },
    { name: "Yiria Mena Palomeque", group: "primaria", area: "primaria", subject: null, email: "yimepa14@gmail.com" },
    { name: "Indy Tatiana Orejuela Asprilla", group: "apoyo", area: "apoyo", subject: "Docente orientadora", email: "indyorejuela@gmail.com" },
];

const TEACHER_SEDES = {
    principal: "Sede Principal",
    "san-miguel": "Sede San Miguel",
    arenal: "Sede Arenal",
};

/** Tarjeta de docente compartida por Personal Docente y Básica Primaria. */
function teacherCard(teacher) {
    const isMonodocente = teacher.group === "primaria";
    const role = isMonodocente ? "Básica Primaria" : TEACHER_AREAS[teacher.area] || "";
    const detail = isMonodocente ? "Docente monodocente · orienta todas las áreas" : teacher.subject;
    const sede = teacher.sede ? `<span class="teacher-sede"><i class="fa fa-map-marker" aria-hidden="true"></i> ${TEACHER_SEDES[teacher.sede]}</span>` : "";

    return `
        <article class="card teacher-card${isMonodocente ? " teacher-card--monodocente" : ""}">
            <span class="teacher-role">${role}</span>
            <h3>${teacher.name}</h3>
            <p class="teacher-areas">${detail}</p>
            ${sede}
            <a href="mailto:${teacher.email}" class="teacher-email">
                <i class="fa fa-envelope" aria-hidden="true"></i> <span>${teacher.email}</span>
            </a>
        </article>
    `;
}
