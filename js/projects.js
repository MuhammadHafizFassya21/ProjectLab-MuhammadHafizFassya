document.addEventListener('DOMContentLoaded', () => {
  let allProjects = [];

  const projectsGrid = document.getElementById('projectsGrid');
  // Support both id variants used across pages
  const searchInput = document.getElementById('searchInput') || document.getElementById('searchBar');
  const filterButtonsContainer = document.getElementById('filterButtons');
  const projectCounter = document.getElementById('projectCounter');
  const emptyState = document.getElementById('projectsEmpty');

  const categories = [
    "Semua",
    "Rekayasa Data",
    "Pembelajaran Mesin",
    "Kecerdasan Buatan",
    "Pengembangan Web",
    "Pengembangan Mobile",
    "Penelitian / Akademik",
    "Dashboard"
  ];

  let currentCategory = "Semua";
  let currentSearch = "";



  function renderFilterButtons() {
    if (!filterButtonsContainer) return;
    filterButtonsContainer.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `btn btn-outline ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        currentCategory = cat;
        // Update active class
        Array.from(filterButtonsContainer.children).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAndRenderProjects();
      });
      filterButtonsContainer.appendChild(btn);
    });
  }

  function filterAndRenderProjects() {
    if (!projectsGrid) return;
    const keyword = currentSearch.toLowerCase();

    const filtered = allProjects.filter(project => {
      // Filter by category
      if (currentCategory !== "Semua" && project.category !== currentCategory) {
        return false;
      }

      // Filter by search
      if (keyword) {
        const textToSearch = `
          ${project.title} 
          ${project.shortDescription} 
          ${project.category} 
          ${project.techStack.join(' ')} 
          ${project.role} 
          ${project.status} 
          ${project.year}
        `.toLowerCase();

        if (!textToSearch.includes(keyword)) {
          return false;
        }
      }
      return true;
    });

    renderProjects(filtered);
  }

  function renderProjects(projectsToRender) {
    projectsGrid.innerHTML = '';

    // Update counter
    if (projectCounter) {
      projectCounter.textContent = `Menampilkan ${projectsToRender.length} dari ${allProjects.length} proyek`;
    }

    // Sync clear button visibility
    if (searchInput) {
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) clearBtn.style.display = currentSearch ? 'flex' : 'none';
    }

    if (projectsToRender.length === 0) {
      if (emptyState) {
        emptyState.innerHTML = `
          <div class="empty" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <h3>Proyek tidak ditemukan</h3>
            <p>Coba gunakan kata kunci atau kategori lain.</p>
          </div>
        `;
        emptyState.hidden = false;
      }
    } else {
      if (emptyState) emptyState.hidden = true;
      projectsToRender.forEach(project => {
        projectsGrid.appendChild(createProjectCard(project));
      });
    }
  }

  function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'card';

    const techBadges = project.techStack.map(tech => `<span class="badge">${tech}</span>`).join('');

    let linksHTML = `<a href="detail.html?id=${project.id}" class="btn btn-primary" style="width:100%">Lihat Studi Kasus</a>`;
    let actionLinks = [];
    if (project.github) {
      actionLinks.push(`<a href="${project.github}" target="_blank" class="btn btn-ghost" style="flex:1; padding:0.5rem">GitHub</a>`);
    }
    if (project.demo) {
      actionLinks.push(`<a href="${project.demo}" target="_blank" class="btn btn-ghost" style="flex:1; padding:0.5rem">Demo</a>`);
    }

    if (actionLinks.length > 0) {
      linksHTML += `<div class="card-actions">${actionLinks.join('')}</div>`;
    }

    const imgUrl = (project.images && project.images.length > 0) ? project.images[0] : 'https://via.placeholder.com/600x400?text=Project+Image';

    card.innerHTML = `
      <img src="${imgUrl}" alt="${project.title}" class="card-img" loading="lazy" />
      <div class="card-body">
        <div class="card-meta">
          <span class="badge badge-accent">${project.status}</span>
          <span>${project.year}</span>
        </div>
        <h3 class="card-title">${project.title}</h3>
        <p class="badge" style="display:inline-block; margin-bottom:1rem; background:var(--bg-muted)">${project.category}</p>
        <p class="card-role">Role: ${project.role}</p>
        <p class="card-desc">${project.shortDescription}</p>
        <div class="card-tech">
          ${techBadges}
        </div>
        <div class="card-footer">
          ${linksHTML}
        </div>
      </div>
    `;

    return card;
  }

  const featuredGrid = document.getElementById('featuredGrid');

  async function fetchProjects() {
    try {
      allProjects = await window.loadProjectsData();

      if (!allProjects || allProjects.length === 0) {
        if (projectsGrid) projectsGrid.innerHTML = '<p class="empty" style="text-align:center; padding:2rem;">Gagal memuat project. Silakan coba lagi nanti.</p>';
        if (featuredGrid) featuredGrid.innerHTML = '<p class="empty" style="text-align:center;">Gagal memuat project unggulan.</p>';
        return;
      }

      if (projectsGrid) {
        renderFilterButtons();
        filterAndRenderProjects();
      }
      if (featuredGrid) {
        renderFeaturedProjects();
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (projectsGrid) projectsGrid.innerHTML = '<p class="empty" style="text-align:center; padding:2rem;">Gagal memuat project. Silakan coba lagi nanti.</p>';
      if (featuredGrid) featuredGrid.innerHTML = '<p class="empty" style="text-align:center;">Gagal memuat project unggulan.</p>';
    }
  }

  function renderFeaturedProjects() {
    featuredGrid.innerHTML = '';
    const featured = allProjects.filter(p => p.featured === true || p.featured === "true");

    if (featured.length === 0) {
      featuredGrid.innerHTML = '<p class="empty">Belum ada proyek unggulan.</p>';
      return;
    }

    featured.forEach(project => {
      featuredGrid.appendChild(createProjectCard(project));
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      filterAndRenderProjects();
    });
    // Support keyboard clear (Escape)
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        currentSearch = '';
        filterAndRenderProjects();
        searchInput.blur();
      }
    });
  }

  // Wire clear button if present
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
        filterAndRenderProjects();
        searchInput.focus();
      }
    });
  }

  // Init fetch only if we're on a page that needs it
  if (projectsGrid || featuredGrid) {
    fetchProjects();
  }
});
