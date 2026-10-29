/**
 * Header, menú móvil y footer compartidos por todas las páginas.
 * Cada página declara su identificador en `<body data-page="...">` (sin
 * scripts inline, para permitir una CSP estricta) y coloca los contenedores
 * #site-header-mount / #mobile-nav-mount / #site-footer-mount donde corresponda. Se carga justo después de
 * #mobile-nav-mount y renderiza el encabezado de forma síncrona (antes del
 * primer pintado, sin desplazar el contenido); el pie se inserta al
 * terminar el análisis del documento.
 */

(() => {
    // Nombre oficial centralizado: cualquier cambio futuro solo se hace aquí.
    const INSTITUTION_NAME_FULL = "Institución Educativa Rural Buchadó Fernando Botero Angulo";

    const NAV_ITEMS = [
        { id: "home", href: "/", label: "Inicio", icon: "fa-home" },
        {
            id: "identidad", href: "/identidad", label: "Nuestra Identidad", icon: "fa-university",
            children: [
                { href: "/identidad#institucional", label: "Información institucional" },
                { href: "/identidad#valores", label: "Principios y valores" },
                { href: "/identidad#sedes", label: "Sedes educativas" },
            ],
        },
        { id: "docentes", href: "/docentes", label: "Personal Docente", icon: "fa-users" },
        {
            id: "eventos", href: "/eventos", label: "Eventos y Centros de Interés", icon: "fa-calendar",
            children: [
                { href: "/eventos#centros-interes", label: "Centros de interés" },
                { href: "/eventos#eventos-grid", label: "Eventos institucionales" },
                { href: "/eventos#galeria", label: "Galería" },
            ],
        },
        {
            id: "academica", href: "/academica", label: "Información Académica", icon: "fa-graduation-cap",
            children: [
                { href: "/academica#pei", label: "Proyecto Educativo Institucional" },
                { href: "/academica#basica-primaria", label: "Básica Primaria" },
                { href: "/academica#calendario", label: "Calendario institucional" },
                { href: "/academica#matricula", label: "Proceso de matrícula" },
                { href: "https://www.seduca.gov.co/", label: "SEDUCA", external: true },
            ],
        },
        {
            id: "contacto", href: "/contacto", label: "Contáctanos", icon: "fa-envelope", isContact: true,
            children: [
                { href: "/contacto#formulario", label: "Formulario de contacto" },
                { href: "/contacto#dependencias", label: "Dependencias y personal de apoyo" },
                { href: "/contacto#canales", label: "Canales de contacto" },
            ],
        },
    ];

    // Perfiles oficiales pendientes de entrega por la institución. Mientras la
    // lista esté vacía se muestra un aviso en lugar de enlaces. Formato:
    // { href: "https://www.facebook.com/<perfil>", label: "Facebook", icon: "fa-facebook" }
    const SOCIAL_LINKS = [];
    const SOCIAL_PENDING_TEXT = "Los perfiles oficiales en redes sociales estarán disponibles próximamente.";

    const current = document.body.dataset.page || "";

    function externalAttrs(item) {
        return item.external ? ' target="_blank" rel="noopener"' : "";
    }

    function desktopNavLink(item) {
        const isCurrent = item.id === current;
        const classAttr = item.isContact ? ' class="btn-contact"' : "";
        const currentAttr = isCurrent ? ' aria-current="page"' : "";
        const link = `<a href="${item.href}"${classAttr}${currentAttr}>${item.label}</a>`;

        if (!item.children) return link;

        const toggleClass = item.isContact ? "dropdown-toggle dropdown-toggle--contact" : "dropdown-toggle";
        const panelLinks = item.children
            .map((child) => `<a href="${child.href}"${externalAttrs(child)}>${child.label}</a>`)
            .join("");

        return `
            <div class="nav-item-dropdown">
                ${link}
                <button type="button" class="${toggleClass}" aria-expanded="false" aria-label="Submenú de ${item.label}">
                    <i class="fa fa-chevron-down" aria-hidden="true"></i>
                </button>
                <div class="nav-dropdown-panel">${panelLinks}</div>
            </div>
        `;
    }

    function mobileNavItem(item) {
        const isCurrent = item.id === current;
        const currentAttr = isCurrent ? ' aria-current="page"' : "";

        if (!item.children) {
            return `<li><a href="${item.href}"${currentAttr}><i class="fa ${item.icon}" aria-hidden="true"></i> ${item.label}</a></li>`;
        }

        const panelLinks = [`<a href="${item.href}">Ver página completa</a>`]
            .concat(item.children.map((child) => `<a href="${child.href}"${externalAttrs(child)}>${child.label}</a>`))
            .join("");

        return `
            <li class="mobile-menu-dropdown" data-open="false">
                <button type="button" aria-expanded="false"${currentAttr}>
                    <span class="flex" style="gap:15px;align-items:center">
                        <i class="fa ${item.icon}" aria-hidden="true"></i> ${item.label}
                    </span>
                    <i class="fa fa-chevron-down chevron" aria-hidden="true"></i>
                </button>
                <div class="mobile-menu-dropdown-panel">${panelLinks}</div>
            </li>
        `;
    }

    function renderHeader() {
        return `
            <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
            <div class="scroll-progress" aria-hidden="true"><div class="scroll-progress-bar"></div></div>
            <header class="site-header">
                <a href="/" class="logo">
                    <img src="/assets/images/logo/logo-buchado-160.webp" srcset="/assets/images/logo/logo-buchado-96.webp 96w, /assets/images/logo/logo-buchado-160.webp 160w, /assets/images/logo/logo-buchado-320.webp 320w" sizes="60px" alt="Escudo de la ${INSTITUTION_NAME_FULL}" width="60" height="60">
                    <span class="logo-text">
                        <strong>${INSTITUTION_NAME_FULL}</strong>
                        <span>Institución Educativa Oficial</span>
                    </span>
                </a>
                <nav class="nav-links" aria-label="Navegación principal">
                    ${NAV_ITEMS.map(desktopNavLink).join("")}
                </nav>
                <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="mobileMenu" aria-label="Abrir menú de navegación">
                    <i class="fa fa-bars" aria-hidden="true"></i>
                </button>
            </header>
            <div class="identity-stripe" aria-hidden="true"></div>
        `;
    }

    function renderMobileNav() {
        const socialLinks = SOCIAL_LINKS.length
            ? SOCIAL_LINKS
                .map((s) => `<a href="${s.href}" target="_blank" rel="noopener"><i class="fa ${s.icon}" aria-hidden="true"></i> ${s.label}</a>`)
                .join("")
            : `<p class="mobile-menu-note">${SOCIAL_PENDING_TEXT}</p>`;

        return `
            <nav id="mobileMenu" class="mobile-menu" aria-label="Menú móvil" aria-hidden="true" inert>
                <button type="button" class="mobile-menu-close" aria-label="Cerrar menú">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </button>
                <div class="mobile-menu-header">
                    <img src="/assets/images/logo/logo-buchado-160.webp" srcset="/assets/images/logo/logo-buchado-96.webp 96w, /assets/images/logo/logo-buchado-160.webp 160w, /assets/images/logo/logo-buchado-320.webp 320w" sizes="80px" alt="" width="80" height="80">
                    <p class="mobile-menu-title">${INSTITUTION_NAME_FULL}</p>
                    <p>Institución Educativa Oficial</p>
                </div>
                <ul>
                    ${NAV_ITEMS.map(mobileNavItem).join("")}
                    <li class="mobile-menu-dropdown" data-open="false">
                        <button type="button" aria-expanded="false">
                            <span class="flex" style="gap:15px;align-items:center">
                                <i class="fa fa-share-alt" aria-hidden="true"></i> Redes sociales
                            </span>
                            <i class="fa fa-chevron-down chevron" aria-hidden="true"></i>
                        </button>
                        <div class="mobile-menu-dropdown-panel">${socialLinks}</div>
                    </li>
                </ul>
            </nav>
            <div class="nav-overlay"></div>
        `;
    }

    function renderFooter() {
        return `
            <footer class="site-footer">
                <div class="footer-top">
                    <figure><img src="/assets/images/logo/logo-buchado-160.webp" srcset="/assets/images/logo/logo-buchado-96.webp 96w, /assets/images/logo/logo-buchado-160.webp 160w, /assets/images/logo/logo-buchado-320.webp 320w" sizes="150px" alt="" width="150" height="150" loading="lazy"></figure>
                    <div>
                        <h2>${INSTITUTION_NAME_FULL}</h2>
                        <p>Formando ciudadanos con valores, conocimiento y compromiso desde nuestra comunidad educativa.</p>
                        <div class="footer-links">
                            <a href="/eventos"><i class="fa fa-calendar" aria-hidden="true"></i> Eventos y centros de interés</a>
                            <a href="/contacto"><i class="fa fa-envelope" aria-hidden="true"></i> PQRS y contacto</a>
                        </div>
                    </div>
                </div>
                <div class="footer-body">
                    <section>
                        <div class="logo">
                            <img src="/assets/images/logo/logo-buchado-160.webp" srcset="/assets/images/logo/logo-buchado-96.webp 96w, /assets/images/logo/logo-buchado-160.webp 160w, /assets/images/logo/logo-buchado-320.webp 320w" sizes="60px" alt="" width="60" height="60" loading="lazy" style="border-radius:50%">
                            <span class="logo-text"><strong>${INSTITUTION_NAME_FULL}</strong><span>Institución Educativa Oficial</span></span>
                        </div>
                        <p><i class="fa fa-map-marker" aria-hidden="true"></i> Dirección de la institución (por definir)</p>
                        <p><i class="fa fa-phone" aria-hidden="true"></i> Teléfono institucional: disponible próximamente</p>
                        <p><i class="fa fa-envelope" aria-hidden="true"></i> Correo institucional: disponible próximamente</p>
                        <p><i class="fa fa-clock-o" aria-hidden="true"></i> Lunes a viernes · 7:00 a. m. – 4:00 p. m.</p>
                    </section>
                    <section>
                        <h3>Navegación</h3>
                        <a href="/identidad">Nuestra Identidad</a>
                        <a href="/docentes">Personal Docente</a>
                        <a href="/eventos">Eventos y Centros de Interés</a>
                        <a href="/academica">Información Académica</a>
                        <a href="/contacto">Contáctanos</a>
                    </section>
                    <section>
                        <h3>Información académica</h3>
                        <a href="/academica#pei">Proyecto Educativo Institucional</a>
                        <a href="/academica#calendario">Calendario institucional</a>
                        <a href="/academica#matricula">Proceso de matrícula</a>
                        <a href="https://www.seduca.gov.co/" target="_blank" rel="noopener">SEDUCA</a>
                        <a href="/contacto#dependencias">Dependencias y personal de apoyo</a>
                    </section>
                </div>
                <div class="footer-bottom">
                    <p>© 2026 ${INSTITUTION_NAME_FULL}. Todos los derechos reservados.</p>
                    <!-- Pendiente institucional: política de tratamiento de datos, aviso de
                         privacidad y términos de uso. Enlazarlos cuando existan. -->
                    <p class="footer-legal">Política de tratamiento de datos y términos de uso: en preparación.</p>
                    <div class="footer-social">
                        ${SOCIAL_LINKS.map((s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}"><i class="fa ${s.icon}" aria-hidden="true"></i></a>`).join("")}
                        ${SOCIAL_LINKS.length ? "" : `<span class="footer-social-note">Redes sociales oficiales: próximamente</span>`}
                        <a href="/contacto" aria-label="Contacto"><i class="fa fa-envelope" aria-hidden="true"></i></a>
                    </div>
                </div>
            </footer>
        `;
    }

    const headerMount = document.getElementById("site-header-mount");
    const mobileMount = document.getElementById("mobile-nav-mount");

    if (headerMount) headerMount.outerHTML = renderHeader();
    if (mobileMount) mobileMount.outerHTML = renderMobileNav();

    // El script se carga justo después de los contenedores del encabezado;
    // el del pie aún no existe en ese momento, así que se completa al final.
    function mountFooter() {
        const footerMount = document.getElementById("site-footer-mount");
        if (footerMount) footerMount.outerHTML = renderFooter();
    }
    if (document.getElementById("site-footer-mount")) mountFooter();
    else document.addEventListener("DOMContentLoaded", mountFooter);
})();
