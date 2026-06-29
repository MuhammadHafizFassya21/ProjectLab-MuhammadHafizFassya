document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const errorState = document.getElementById('errorState');
  const projectDetail = document.getElementById('projectDetail');

  if (!projectId) {
    showError();
    return;
  }

  window.getProjectsData()
    .then(projects => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        renderProject(project);
      } else {
        showError();
      }
    })
    .catch(err => {
      console.error(err);
      showError();
    });

  function showError() {
    errorState.style.display = 'block';
    projectDetail.style.display = 'none';
  }

  function renderProject(project) {
    document.title = `${project.title} | ProjectLab Muhammad Hafiz Fassya`;

    // Hero
    document.getElementById('dTitle').textContent = project.title;
    document.getElementById('dMeta').innerHTML = `
      <span class="badge badge-accent">${project.category}</span>
      <span>Status: ${project.status}</span>
      <span>Year: ${project.year}</span>
    `;
    document.getElementById('dSummary').textContent = project.shortDescription;

    // Content
    document.getElementById('dProblem').textContent = project.problem || 'Not specified.';
    document.getElementById('dObjective').textContent = project.objective || 'Not specified.';
    document.getElementById('dRole').textContent = project.role || 'Not specified.';
    document.getElementById('dTargetUser').textContent = project.targetUser || 'Not specified.';

    // Tech Stack
    const techContainer = document.getElementById('dTechStack');
    if (project.techStack && project.techStack.length > 0) {
      techContainer.innerHTML = project.techStack.map(t => `<span class="badge badge-accent">${t}</span>`).join('');
    } else {
      techContainer.innerHTML = '<span class="text-muted">No tech stack listed.</span>';
    }

    // Features
    const featContainer = document.getElementById('dFeatures');
    if (project.features && project.features.length > 0) {
      featContainer.innerHTML = project.features.map(f => `<li>${f}</li>`).join('');
    } else {
      featContainer.innerHTML = '<li class="text-muted" style="list-style:none; padding-left:0;">No features listed.</li>';
    }

    // System Flow
    const flowContainer = document.getElementById('dSystemFlow');
    if (project.systemFlow && project.systemFlow.length > 0) {
      let flowHtml = '';
      project.systemFlow.forEach((step, index) => {
        flowHtml += `<div class="flow-item">${step}</div>`;
        if (index < project.systemFlow.length - 1) {
          flowHtml += `<div class="flow-arrow"></div>`;
        }
      });
      flowContainer.innerHTML = flowHtml;
    } else {
      flowContainer.innerHTML = '<div class="text-muted">No system flow defined.</div>';
    }

    projectDetail.innerHTML = `
        <div class="detail-hero">
          <div class="container">
            <a href="projects.html" class="detail-back">← Kembali ke Proyek</a>
            <h1 class="detail-title">${project.title}</h1>
            <div class="detail-meta">
              <span class="badge ${project.status === 'Selesai' ? 'badge-accent' : ''}">${project.status}</span>
              <span>${project.category}</span>
              <span>${project.year}</span>
            </div>
            <p class="detail-summary">${project.shortDescription}</p>
          </div>
        </div>

        <div class="container detail-content">
          <!-- Problem & Objective -->
          <div class="detail-section">
            <h2 class="detail-section-title">Latar Belakang Masalah</h2>
            <p>${project.problem}</p>
          </div>
          
          <div class="detail-section">
            <h2 class="detail-section-title">Tujuan Proyek</h2>
            <p>${project.objective}</p>
          </div>

          <!-- Role & Target -->
          <div class="detail-section grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 2rem;">
            <div>
              <h3 style="margin-bottom:0.5rem">Peran Saya</h3>
              <p class="card-desc">${project.role}</p>
            </div>
            <div>
              <h3 style="margin-bottom:0.5rem">Target Pengguna</h3>
              <p class="card-desc">${project.targetUser}</p>
            </div>
          </div>

          <!-- Tech Stack -->
          <div class="detail-section">
            <h2 class="detail-section-title">Teknologi yang Digunakan</h2>
            <div class="detail-badges">
              ${project.techStack.map(t => `<span class="badge">${t}</span>`).join('')}
            </div>
          </div>

          <!-- Features -->
          <div class="detail-section">
            <h2 class="detail-section-title">Fitur Utama</h2>
            <ul class="feature-list">
              ${project.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>

          <!-- System Flow -->
          <div class="detail-section">
            <h2 class="detail-section-title">Alur Sistem</h2>
            <div class="flow-container">
              ${project.systemFlow.map((step, idx, arr) => `
                <div class="flow-item">${step}</div>
                ${idx < arr.length - 1 ? '<div class="flow-arrow"></div>' : ''}
              `).join('')}
            </div>
          </div>

          <!-- Challenges & Solutions -->
          <div class="detail-section">
            <h2 class="detail-section-title">Tantangan dan Solusi</h2>
            <div class="challenge-grid">
              ${project.challenges.map(c => `
                <div class="challenge-card">
                  <div class="challenge-card-title">Tantangan:</div>
                  <p>${c.problem}</p>
                  <div class="challenge-card-solution">Solusi:</div>
                  <p>${c.solution}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Result -->
          <div class="detail-section">
            <h2 class="detail-section-title">Hasil Proyek</h2>
            <p>${project.result}</p>
          </div>

          <!-- Gallery -->
          <div class="detail-section">
            <h2 class="detail-section-title">Galeri Tampilan</h2>
            ${project.images && project.images.length > 0 ? `
              <div class="gallery-grid">
                ${project.images.map(img => `<img src="${img}" alt="Screenshot" class="gallery-img">`).join('')}
              </div>
            ` : `
              <div class="gallery-placeholder">
                <p>Belum ada gambar yang tersedia.</p>
              </div>
            `}
          </div>

          <!-- Lessons & Future -->
          <div class="detail-section">
            <h2 class="detail-section-title">Pembelajaran</h2>
            <p>${project.lessonsLearned}</p>
          </div>
          
          <div class="detail-section">
            <h2 class="detail-section-title">Pengembangan Berikutnya</h2>
            <p>${project.futureImprovement}</p>
          </div>

          <!-- Links -->
          <div class="detail-section">
            <h2 class="detail-section-title">Link Proyek</h2>
            <div style="display:flex; gap:1rem; flex-wrap:wrap;">
              ${project.github ? `<a href="${project.github}" target="_blank" class="btn btn-outline">GitHub</a>` : ''}
              ${project.demo ? `<a href="${project.demo}" target="_blank" class="btn btn-primary">Demo Langsung</a>` : ''}
              ${project.report ? `<a href="${project.report}" target="_blank" class="btn btn-ghost">Laporan</a>` : ''}
              ${(!project.github && !project.demo && !project.report) ? `<p class="card-desc">Link proyek akan ditambahkan nanti.</p>` : ''}
            </div>
          </div>
        </div>
      `;

    projectDetail.style.display = 'block';
  }
});
