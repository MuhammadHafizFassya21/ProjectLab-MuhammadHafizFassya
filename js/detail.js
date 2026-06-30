document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const errorState = document.getElementById('errorState');
  const projectDetail = document.getElementById('projectDetail');

  if (!projectId) {
    showError("ID Proyek tidak diberikan.");
    return;
  }

  try {
    if (window.supabaseClient) {
      const { data, error } = await window.supabaseClient
        .from("projects")
        .select("*")
        .eq("slug", projectId)
        .eq("is_active", true)
        .single();
      
      if (error || !data) {
        throw new Error("Proyek tidak ditemukan dari Supabase");
      }
      const mapped = window.mapSupabaseProject(data);
      renderProject(mapped);
    } else {
      // Fallback
      const response = await fetch("data/projects.json");
      if(!response.ok) throw new Error("Fallback failed");
      const fallbackData = await response.json();
      const project = fallbackData.find(p => p.id === projectId);
      if(project) {
        renderProject(project);
      } else {
        throw new Error("Proyek tidak ditemukan dari JSON");
      }
    }
  } catch (err) {
    console.error(err);
    showError("Proyek yang Anda cari tidak tersedia atau sedang tidak aktif.");
  }

  function showError(msg) {
    errorState.innerHTML = `<h3>Proyek tidak ditemukan.</h3><p>${msg}</p>`;
    errorState.style.display = 'block';
    projectDetail.style.display = 'none';
  }

  function renderProject(project) {
    document.title = `${project.title} | ProjectLab Muhammad Hafiz Fassya`;

    // Extract arrays properly in case they are missing
    const techStack = project.techStack || project.tech_stack || [];
    const features = project.features || [];
    const systemFlow = project.systemFlow || project.system_flow || [];
    const challenges = project.challenges || [];
    let images = project.images || [];

    // Fallback for single image formats that might not be caught by mapping if falling back to json
    if(typeof images === 'string') images = [images];
    
    const techBadges = techStack.map(t => `<span class="badge">${t}</span>`).join('');
    const featList = features.map(f => `<li>${f}</li>`).join('');
    
    let flowHtml = '';
    systemFlow.forEach((step, idx, arr) => {
      flowHtml += `<div class="flow-item">${step}</div>`;
      if (idx < arr.length - 1) flowHtml += `<div class="flow-arrow"></div>`;
    });

    let chalHtml = '';
    challenges.forEach(c => {
      chalHtml += `
        <div class="challenge-card">
          <div class="challenge-card-title">Tantangan:</div>
          <p>${c.problem || c}</p>
          <div class="challenge-card-solution">Solusi:</div>
          <p>${c.solution || ''}</p>
        </div>
      `;
    });

    let galleryHtml = '';
    if (images.length > 0) {
      galleryHtml = `
        <div class="project-slider" id="projectSlider">
          ${images.length > 1 ? '<button class="slider-btn prev" id="prevImage">‹</button>' : ''}
          <img id="sliderImage" src="" alt="Gambar Project" class="slider-main-image">
          ${images.length > 1 ? '<button class="slider-btn next" id="nextImage">›</button>' : ''}
        </div>
        <p id="sliderCounter" class="slider-counter">1 / 1</p>
        ${images.length > 1 ? '<div id="sliderThumbnails" class="slider-thumbnails"></div>' : ''}
      `;
    } else {
      galleryHtml = `<div class="gallery-placeholder"><p>Gambar project akan ditambahkan nanti.</p></div>`;
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
            <p class="detail-summary">${project.shortDescription || project.short_description || ''}</p>
          </div>
        </div>

        <div class="container detail-content">
          <div class="detail-section">
            <h2 class="detail-section-title">Latar Belakang Masalah</h2>
            <p>${project.problem}</p>
          </div>
          
          <div class="detail-section">
            <h2 class="detail-section-title">Tujuan Proyek</h2>
            <p>${project.objective}</p>
          </div>

          <div class="detail-section grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 2rem;">
            <div>
              <h3 style="margin-bottom:0.5rem">Peran Saya</h3>
              <p class="card-desc">${project.role}</p>
            </div>
            <div>
              <h3 style="margin-bottom:0.5rem">Target Pengguna</h3>
              <p class="card-desc">${project.targetUser || project.target_user || ''}</p>
            </div>
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Teknologi yang Digunakan</h2>
            <div class="detail-badges">
              ${techBadges}
            </div>
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Fitur Utama</h2>
            <ul class="feature-list">
              ${featList}
            </ul>
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Alur Sistem</h2>
            <div class="flow-container">
              ${flowHtml}
            </div>
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Tantangan dan Solusi</h2>
            <div class="challenge-grid">
              ${chalHtml}
            </div>
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Hasil Proyek</h2>
            <p>${project.result}</p>
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Galeri Tampilan Project</h2>
            ${galleryHtml}
          </div>

          <div class="detail-section">
            <h2 class="detail-section-title">Pembelajaran</h2>
            <p>${project.lessonsLearned || project.lessons_learned || ''}</p>
          </div>
          
          <div class="detail-section">
            <h2 class="detail-section-title">Pengembangan Berikutnya</h2>
            <p>${project.futureImprovement || project.future_improvement || ''}</p>
          </div>

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
    
    if(images.length > 0) {
      initProjectSlider(images, project.title);
    }
  }

  function initProjectSlider(images, title) {
    const sliderImage = document.getElementById("sliderImage");
    const prevBtn = document.getElementById("prevImage");
    const nextBtn = document.getElementById("nextImage");
    const counter = document.getElementById("sliderCounter");
    const thumbnails = document.getElementById("sliderThumbnails");
  
    if (!sliderImage || !images || images.length === 0) return;
  
    let currentIndex = 0;
  
    function updateSlider() {
      sliderImage.src = images[currentIndex];
      sliderImage.alt = `${title} - Gambar ${currentIndex + 1}`;
      if(counter) {
        counter.textContent = `${currentIndex + 1} / ${images.length}`;
      }
  
      if(thumbnails) {
        thumbnails.innerHTML = images.map((img, index) => `
          <button class="slider-thumb ${index === currentIndex ? "active" : ""}" data-index="${index}">
            <img src="${img}" alt="Thumbnail ${index + 1}">
          </button>
        `).join("");
  
        document.querySelectorAll(".slider-thumb").forEach((thumb) => {
          thumb.addEventListener("click", () => {
            currentIndex = Number(thumb.dataset.index);
            updateSlider();
          });
        });
      }
    }
  
    if(prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        updateSlider();
      });
    }
  
    if(nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        updateSlider();
      });
    }
  
    updateSlider();
  }
});
