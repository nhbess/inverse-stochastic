document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .nav-container {
            position: fixed;
            z-index: 1000;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        /* Desktop styles */
        @media (min-width: 768px) {
            .nav-container {
                position: fixed;
                left: 20px;
                top: 5%;
                transform: translateY(-5%) translateX(5%);
                padding: 20px;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.5);
                opacity: 0;
                pointer-events: none;
                max-width: 350px;
                width: 350px;
                display: flex;
                flex-direction: column;
            }

            .nav-container.visible {
                opacity: 1;
                pointer-events: all;
                transition: all 1.3s ease;
            }

            .nav-container.collapsed {
                width: auto;
                min-width: 60px;
            }

            .nav-container.collapsed .nav-list {
                display: none;
            }

            .desktop-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
            }

            .nav-container.collapsed .desktop-header {
                padding: 0;
            }

            .nav-container:not(.collapsed) .desktop-header {
                padding-bottom: 15px;
            }

            .nav-container.collapsed .current-section {
                display: block;
                flex-grow: 1;
                font-size: 16px;
                font-family: 'Poppins', sans-serif;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                opacity: 0.7;
                margin: 0 5px;
            }

            .nav-container:not(.collapsed) .desktop-header .current-section {
                display: none;
            }

            .nav-collapse {
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                margin: 0;
                opacity: 0.3;
                transition: opacity 0.2s ease;
                flex-shrink: 0;
            }

            .nav-collapse:hover {
                opacity: 1;
            }

            .expand-icon {
                display: none;
            }

            .collapsed .expand-icon {
                display: block;
            }

            .collapsed .collapse-icon {
                display: none;
            }

            .nav-header {
                display: none !important;
            }

            .nav-list {
                list-style: none;
                padding: 0 10px;
                margin: 0;
                overflow-y: auto;
                max-height: 75vh;
            }

            .nav-item {
                margin: 14px 0;
                cursor: pointer;
                color: #666;
                transition: color 0.3s ease;
                font-size: 17px;
                font-weight: 400;
            }

            .nav-item.h2, .nav-item.h3 {
                padding-left: 20px;
                font-size: 15px;
                margin: 10px 0;
                opacity: 0.85;
            }

            .nav-item.h3 {
                font-size: 14px !important;
                padding-left: 30px !important;
                margin: 8px 0 !important;
                opacity: 0.75;
            }

            .nav-item:hover {
                color: #000;
            }

            .nav-item.active {
                color: #000;
                font-weight: 500;
            }
        }

        /* Mobile styles */
        @media (max-width: 767px) {
            .nav-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100%;
                background: rgba(255, 255, 255, 0.5);
                transform: translateY(-100%);
                transition: transform 0.3s ease;
                height: auto;
            }

            .nav-container.visible {
                transform: translateY(0);
            }

            .nav-container.expanded {
                height: 100vh;
                background: rgba(255, 255, 255, 0.95);
            }

            .nav-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            .current-section {
                font-size: 17px;
                font-weight: 500;
                color: #000;
                font-family: 'Poppins', sans-serif;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 40px);
            }

            .nav-close {
                display: none;
                cursor: pointer;
            }

            @media (min-width: 768px) {
                .nav-header {
                    display: none;
                }
            }

            .expanded .nav-close {
                display: block;
            }

            .nav-list {
                display: none;
                list-style: none;
                padding: 25px;
                margin: 0;
                max-height: calc(100vh - 60px);
                overflow-y: auto;
            }

            .expanded .nav-list {
                display: block;
            }

            .nav-item {
                padding: 15px 0;
                cursor: pointer;
                color: #666;
                transition: color 0.3s ease;
                font-size: 18px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            .nav-item.h2, .nav-item.h3 {
                padding-left: 25px;
                font-size: 16px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }

            .nav-item.active {
                color: #000;
                font-weight: 500;
            }

            .desktop-header {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    const nav = document.createElement('nav');
    nav.className = 'nav-container collapsed';
    nav.innerHTML = `
        <div class="nav-header">
            <span class="current-section"></span>
            <a class="nav-close"><i class="fa-solid fa-xmark"></i></a>
        </div>
        <div class="desktop-header">
            <span class="current-section"></span>
            <button class="nav-collapse">
                <a class="expand-icon"><i class="fa-solid fa-angle-down"></i></a>
                <a class="collapse-icon"><i class="fa-solid fa-arrow-left-long"></i></a>
            </button>
        </div>
        <ul class="nav-list"></ul>
    `;
    document.body.appendChild(nav);

    // Get all h1 and h2 elements within container blog main and populate the navbar
    const h1Elements = Array.from(document.querySelectorAll('.container.blog.main h1'));
    const navList = nav.querySelector('.nav-list');
    
    function resetNavbarState() {
        nav.classList.remove('expanded');
        document.body.style.overflow = '';
    }

    h1Elements.forEach((h1) => {
        // Add h1 element
        const h1Item = document.createElement('li');
        h1Item.className = 'nav-item h1';
        h1Item.textContent = h1.textContent.trim();
        h1Item.addEventListener('click', () => {
            h1.scrollIntoView({ behavior: 'smooth' });
            if (window.innerWidth < 768) {
                resetNavbarState();
            }
        });
        navList.appendChild(h1Item);

        // Find all h2 elements until the next h1
        let nextElement = h1.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H1') {
            if (nextElement.tagName === 'H2') {
                const h2Element = nextElement; // Store reference for closure
                const h2Item = document.createElement('li');
                h2Item.className = 'nav-item h2';
                h2Item.textContent = h2Element.textContent.trim();
                h2Item.addEventListener('click', () => {
                    h2Element.scrollIntoView({ behavior: 'smooth' });
                    if (window.innerWidth < 768) {
                        resetNavbarState();
                    }
                });
                navList.appendChild(h2Item);
            }
            nextElement = nextElement.nextElementSibling;
        }
    });

    // Collapse button handling for desktop
    const collapseBtn = nav.querySelector('.nav-collapse');
    collapseBtn.addEventListener('click', () => {
        if (window.innerWidth >= 768) {
            nav.classList.toggle('collapsed');
        }
    });

    // Mobile navigation toggle
    const navHeader = nav.querySelector('.nav-header');
    const closeBtn = nav.querySelector('.nav-close');

    navHeader.addEventListener('click', (e) => {
        if (window.innerWidth < 768 && e.target !== closeBtn) {
            nav.classList.toggle('expanded');
            document.body.style.overflow = nav.classList.contains('expanded') ? 'hidden' : '';
        }
    });

    // Scroll handling
    let lastScrollTop = 0;
    let ticking = false;

    function updateNavbar() {
        const headings = document.querySelectorAll('h1, h2, h3');
        const navList = document.querySelector('.nav-list');
        if (!navList) return;

        navList.innerHTML = '';
        let currentSection = '';

        headings.forEach(heading => {
            const text = heading.textContent.trim();
            const item = document.createElement('li');
            item.textContent = text;
            item.classList.add('nav-item');

            // Add appropriate class based on heading level
            if (heading.tagName === 'H2') {
                item.classList.add('h2');
            } else if (heading.tagName === 'H3') {
                item.classList.add('h3');
                item.style.paddingLeft = '30px';
                item.style.fontSize = '11px';
                item.style.margin = '4px 0';
            }

            item.addEventListener('click', () => {
                heading.scrollIntoView({ behavior: 'smooth' });
            });

            navList.appendChild(item);

            if (heading.tagName === 'H1' || heading.tagName === 'H2') {
                currentSection = text;
            }
        });

        // Update current section text
        const currentSectionElement = document.querySelector('.current-section');
        if (currentSectionElement) {
            currentSectionElement.textContent = currentSection;
        }

        // Special handling for visibility
        const firstH1 = h1Elements[0];
        const firstH1Passed = firstH1 && window.scrollY + 10 >= firstH1.offsetTop;
        
        // Handle visibility
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            if (!nav.classList.contains('expanded')) {
                if (!firstH1Passed) {
                    nav.classList.remove('visible');
                } else {
                    if (scrollTop > lastScrollTop) {
                        if (scrollTop > 50) {
                            nav.classList.remove('visible');
                        }
                    } else {
                        nav.classList.add('visible');
                    }
                }
            }
        } else {
            if (!firstH1Passed) {
                nav.classList.remove('visible');
            } else {
                nav.classList.add('visible');
            }
        }

        lastScrollTop = scrollTop;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateNavbar();
            });
            ticking = true;
        }
    });

    updateNavbar();
});