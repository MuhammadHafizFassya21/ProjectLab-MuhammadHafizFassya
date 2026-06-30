document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });

  // Admin search
  const adminSearchInput = document.getElementById('adminSearchInput');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => {
      filterAdminTable(adminSearchInput.value.trim().toLowerCase());
    });
  }

  document.getElementById('cancelEditBtn').addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });
  
  document.getElementById('importJsonBtn').addEventListener('click', importProjectsFromJson);

  await loadAdminProjects();

  document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitProjectBtn');
    const err = document.getElementById('addErrorMsg');
    const success = document.getElementById('addSuccessMsg');
    
    err.style.display = 'none';
    success.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
      const editMode = document.getElementById('editMode').value === 'true';
      let slug = document.getElementById('pId').value.trim();
      const title = document.getElementById('pTitle').value.trim();
      
      if (!slug) {
        slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (!slug) throw new Error("Slug atau Judul tidak boleh kosong.");

      // Handling Multiple Images
      const files = document.getElementById('pImageFile').files;
      const uploadedImageUrls = await uploadMultipleImages(files, slug);
      
      let finalImageUrls = [];
      if (editMode) {
        const existingStr = document.getElementById('existingImageUrls').value;
        const existingImageUrls = existingStr ? JSON.parse(existingStr) : [];
        finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      } else {
        finalImageUrls = uploadedImageUrls;
        if (finalImageUrls.length === 0) {
          finalImageUrls = ['assets/images/projects/placeholder-project.png'];
        }
      }

      const techStackArr = document.getElementById('pTechStack').value.split(',').map(s => s.trim()).filter(s=>s);
      const featuresArr = document.getElementById('pFeatures').value.split(',').map(s => s.trim()).filter(s=>s);
      const systemFlowArr = document.getElementById('pSystemFlow').value.split(',').map(s => s.trim()).filter(s=>s);
      
      let chalArr = [];
      const chalRaw = document.getElementById('pChallenges').value.trim();
      if(chalRaw) {
        try { chalArr = JSON.parse(chalRaw); } catch(e) { chalArr = [{"problem": chalRaw, "solution": ""}]; }
      }

      const projectData = {
        slug: slug,
        title: title,
        category: document.getElementById('pCategory').value,
        short_description: document.getElementById('pShortDesc').value,
        problem: document.getElementById('pProblem').value,
        objective: document.getElementById('pObjective').value,
        target_user: document.getElementById('pTargetUser').value,
        role: document.getElementById('pRole').value,
        tech_stack: JSON.stringify(techStackArr),
        features: JSON.stringify(featuresArr),
        system_flow: JSON.stringify(systemFlowArr),
        challenges: JSON.stringify(chalArr),
        result: document.getElementById('pResult').value,
        lessons_learned: document.getElementById('pLessons').value,
        future_improvement: document.getElementById('pFuture').value,
        github_url: document.getElementById('pGithub').value,
        demo_url: document.getElementById('pDemo').value,
        report_url: document.getElementById('pReport').value,
        image_urls: JSON.stringify(finalImageUrls),
        image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : "",
        status: document.getElementById('pStatus').value,
        year: parseInt(document.getElementById('pYear').value) || new Date().getFullYear(),
        featured: document.getElementById('pFeatured').checked,
        is_active: document.getElementById('pIsActive').checked,
        display_order: parseInt(document.getElementById('pDisplayOrder').value) || 0,
        updated_at: new Date().toISOString()
      };

      if (editMode) {
        const { error } = await window.supabaseClient.from('projects').update(projectData).eq('slug', slug);
        if (error) throw new Error(error.message);
        success.textContent = "Project berhasil diperbarui.";
      } else {
        const { error } = await window.supabaseClient.from('projects').insert([projectData]);
        if (error) throw new Error(error.message);
        success.textContent = "Project berhasil disimpan.";
      }

      success.style.display = 'block';
      resetForm();
      await loadAdminProjects();
    } catch (error) {
      err.textContent = error.message;
      err.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan Proyek';
    }
  });
});

async function uploadMultipleImages(files, slug) {
  const uploadedUrls = [];
  if (!files || files.length === 0) return uploadedUrls;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`Ukuran gambar terlalu besar (${file.name}). Maksimal 5MB.`);
    }
    if (!file.type.startsWith('image/')) {
      throw new Error(`File harus berupa gambar (${file.name}).`);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${slug}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await window.supabaseClient.storage
      .from("project-images")
      .upload(filePath, file);

    if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);

    const { data: publicUrlData } = window.supabaseClient.storage
      .from("project-images")
      .getPublicUrl(filePath);

    if (publicUrlData && publicUrlData.publicUrl) {
      uploadedUrls.push(publicUrlData.publicUrl);
    }
  }
  return uploadedUrls;
}

let allAdminProjects = [];

async function loadAdminProjects() {
  const tbody = document.getElementById('projectsTbody');
  try {
    const { data, error } = await window.supabaseClient
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    allAdminProjects = data || [];
    
    document.getElementById('statTotal').textContent = allAdminProjects.length;
    document.getElementById('statActive').textContent = allAdminProjects.filter(p => p.is_active !== false).length;
    document.getElementById('statInactive').textContent = allAdminProjects.filter(p => p.is_active === false).length;
    document.getElementById('statFeatured').textContent = allAdminProjects.filter(p => p.featured === true).length;

    tbody.innerHTML = '';
    if (allAdminProjects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada proyek.</td></tr>';
      return;
    }

    allAdminProjects.forEach(p => {
      const tr = document.createElement('tr');
      tr.dataset.slug = p.slug;
      const isActive = p.is_active !== false;
      const activeBadge = isActive ? '<span class="badge" style="background:#10b981; color:white">Aktif</span>' : '<span class="badge" style="background:#ef4444; color:white">Nonaktif</span>';
      const featuredBadge = p.featured ? '<span class="badge badge-accent" style="background:#3b82f6; color:white">Featured</span>' : '';
      
      let imgUrl = p.image_url;
      try {
        if(p.image_urls) {
          const arr = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : p.image_urls;
          if (Array.isArray(arr) && arr.length > 0) imgUrl = arr[0];
        }
      } catch(e) {}
      
      const img = imgUrl ? `<img src="${imgUrl}" style="width:60px; height:40px; object-fit:cover; border-radius:4px; vertical-align:middle; margin-right:10px;">` : '';

      tr.innerHTML = `
        <td>${p.display_order || 0}</td>
        <td>
          <div style="display:flex; align-items:center;">
            ${img}
            <div>
              <strong>${p.title}</strong><br>
              <small class="text-muted">${p.slug}</small>
            </div>
          </div>
        </td>
        <td>${p.category}<br><small class="text-muted">Tahun: ${p.year}</small></td>
        <td>
          <div style="margin-bottom:0.2rem;">${activeBadge}</div>
          <div style="margin-bottom:0.2rem;">${featuredBadge}</div>
          <small class="badge">${p.status}</small>
        </td>
        <td style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="editProject('${p.slug}')">Edit</button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="toggleActive('${p.slug}', ${isActive})">${isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="toggleFeatured('${p.slug}', ${p.featured})">${p.featured ? 'Batal Featured' : 'Jadikan Featured'}</button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color:red; border-color:red" onclick="deleteProject('${p.slug}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Re-apply search filter after table render
    const adminSearchInput = document.getElementById('adminSearchInput');
    if (adminSearchInput && adminSearchInput.value.trim()) {
      filterAdminTable(adminSearchInput.value.trim().toLowerCase());
    } else {
      updateSearchCount(allAdminProjects.length, allAdminProjects.length);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${err.message}</td></tr>`;
  }
}

window.deleteProject = async function(slug) {
  if (confirm(`Yakin ingin menghapus project ini? Data yang dihapus tidak dapat dikembalikan.`)) {
    const { error } = await window.supabaseClient.from('projects').delete().eq('slug', slug);
    if (error) alert("Gagal menghapus: " + error.message);
    else { alert("Project berhasil dihapus."); loadAdminProjects(); }
  }
}

window.toggleActive = async function(slug, currentStatus) {
  const { error } = await window.supabaseClient.from('projects').update({ is_active: !currentStatus, updated_at: new Date().toISOString() }).eq('slug', slug);
  if (error) alert("Gagal mengupdate status: " + error.message);
  else loadAdminProjects();
}

window.toggleFeatured = async function(slug, currentStatus) {
  const { error } = await window.supabaseClient.from('projects').update({ featured: !currentStatus, updated_at: new Date().toISOString() }).eq('slug', slug);
  if (error) alert("Gagal mengupdate status featured: " + error.message);
  else loadAdminProjects();
}

window.editProject = function(slug) {
  const project = allAdminProjects.find(p => p.slug === slug);
  if (!project) return;

  document.getElementById('editMode').value = 'true';
  document.getElementById('formTitle').textContent = 'Edit Proyek: ' + project.title;
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  document.getElementById('pId').readOnly = true;
  document.getElementById('submitProjectBtn').textContent = 'Update Proyek';

  document.getElementById('pId').value = project.slug;
  document.getElementById('pTitle').value = project.title || '';
  document.getElementById('pCategory').value = project.category || 'Rekayasa Data';
  document.getElementById('pYear').value = project.year || '';
  document.getElementById('pStatus').value = project.status || 'Selesai';
  document.getElementById('pRole').value = project.role || '';
  document.getElementById('pDisplayOrder').value = project.display_order || 0;
  document.getElementById('pShortDesc').value = project.short_description || '';
  document.getElementById('pProblem').value = project.problem || '';
  document.getElementById('pObjective').value = project.objective || '';
  document.getElementById('pTargetUser').value = project.target_user || '';
  document.getElementById('pResult').value = project.result || '';
  document.getElementById('pLessons').value = project.lessons_learned || '';
  document.getElementById('pFuture').value = project.future_improvement || '';
  document.getElementById('pGithub').value = project.github_url || '';
  document.getElementById('pDemo').value = project.demo_url || '';
  document.getElementById('pReport').value = project.report_url || '';
  
  const parseJsonStr = (str) => {
    try { 
      const parsed = typeof str === 'string' ? JSON.parse(str) : str;
      return Array.isArray(parsed) ? parsed.join(', ') : (parsed || '');
    } catch (e) { return str || ''; }
  };
  
  document.getElementById('pTechStack').value = parseJsonStr(project.tech_stack);
  document.getElementById('pFeatures').value = parseJsonStr(project.features);
  document.getElementById('pSystemFlow').value = parseJsonStr(project.system_flow);
  
  try {
      const chal = typeof project.challenges === 'string' ? JSON.parse(project.challenges) : project.challenges;
      document.getElementById('pChallenges').value = JSON.stringify(chal, null, 2);
  } catch(e) { document.getElementById('pChallenges').value = project.challenges || ''; }
  
  document.getElementById('pFeatured').checked = project.featured;
  document.getElementById('pIsActive').checked = project.is_active !== false;

  let existingUrls = [];
  try {
    if(project.image_urls) existingUrls = typeof project.image_urls === 'string' ? JSON.parse(project.image_urls) : project.image_urls;
    else if(project.image_url) existingUrls = typeof project.image_url === 'string' && project.image_url.startsWith('[') ? JSON.parse(project.image_url) : [project.image_url];
  } catch(e){}
  
  document.getElementById('existingImageUrls').value = JSON.stringify(existingUrls);
  renderExistingImagesGrid(existingUrls, slug);

  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

function renderExistingImagesGrid(urls, slug) {
  const container = document.getElementById('existingImagesContainer');
  const grid = document.getElementById('existingImagesGrid');
  grid.innerHTML = '';
  
  if (!urls || urls.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  urls.forEach((url, index) => {
    const div = document.createElement('div');
    div.className = 'admin-image-preview';
    div.innerHTML = `
      <img src="${url}" alt="Project Image">
      <button type="button" onclick="removeExistingImage('${slug}', ${index})">Hapus</button>
    `;
    grid.appendChild(div);
  });
}

window.removeExistingImage = async function(slug, indexToRemove) {
  if(!confirm("Yakin ingin menghapus gambar ini dari daftar?")) return;
  
  const existingStr = document.getElementById('existingImageUrls').value;
  let urls = JSON.parse(existingStr);
  
  urls.splice(indexToRemove, 1);
  
  // Save directly to db to make it persistent immediately
  const { error } = await window.supabaseClient.from('projects').update({
    image_urls: JSON.stringify(urls),
    image_url: urls.length > 0 ? urls[0] : ''
  }).eq('slug', slug);
  
  if (error) {
    alert("Gagal menghapus gambar: " + error.message);
  } else {
    document.getElementById('existingImageUrls').value = JSON.stringify(urls);
    renderExistingImagesGrid(urls, slug);
    loadAdminProjects(); // update table
  }
}

function resetForm() {
  document.getElementById('addProjectForm').reset();
  document.getElementById('editMode').value = 'false';
  document.getElementById('formTitle').textContent = 'Tambah Proyek Baru';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('pId').readOnly = false;
  document.getElementById('submitProjectBtn').textContent = 'Simpan Proyek';
  document.getElementById('existingImagesContainer').style.display = 'none';
  document.getElementById('existingImageUrls').value = '[]';
}

async function importProjectsFromJson() {
  if (!confirm("Fitur ini akan membaca data/projects.json dan melakukan sinkronisasi ke Supabase. Lanjutkan?")) return;
  try {
    const response = await fetch("data/projects.json");
    const jsonProjects = await response.json();

    const mappedProjects = jsonProjects.map((project, index) => {
      const urls = project.images || [];
      return {
        slug: project.id,
        title: project.title,
        category: project.category || "Rekayasa Data",
        short_description: project.shortDescription || "",
        problem: project.problem || "",
        objective: project.objective || "",
        target_user: project.targetUser || "",
        role: project.role || "",
        tech_stack: JSON.stringify(project.techStack || []),
        features: JSON.stringify(project.features || []),
        system_flow: JSON.stringify(project.systemFlow || []),
        result: project.result || "",
        challenges: JSON.stringify(project.challenges || []),
        lessons_learned: project.lessonsLearned || "",
        future_improvement: project.futureImprovement || "",
        github_url: project.github || "",
        demo_url: project.demo || "",
        report_url: project.report || "",
        image_urls: JSON.stringify(urls),
        image_url: urls.length > 0 ? urls[0] : "",
        status: project.status || "Selesai",
        year: Number(project.year) || new Date().getFullYear(),
        featured: project.featured || false,
        is_active: true,
        display_order: index + 1
      };
    });

    const { error } = await window.supabaseClient
      .from("projects")
      .upsert(mappedProjects, { onConflict: "slug" });

    if (error) throw error;

    alert("Project lama berhasil diimport ke Supabase.");
    loadAdminProjects();
  } catch (error) {
    console.error("Gagal import project dari JSON:", error);
    alert("Gagal import project lama. Cek Console: " + error.message);
  }
}

function filterAdminTable(keyword) {
  const tbody = document.getElementById('projectsTbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;

  rows.forEach(row => {
    if (!row.dataset.slug) {
      // header or placeholder rows
      return;
    }
    const project = allAdminProjects.find(p => p.slug === row.dataset.slug);
    if (!project) return;

    const techStackStr = (() => {
      try {
        const arr = typeof project.tech_stack === 'string' ? JSON.parse(project.tech_stack) : (project.tech_stack || []);
        return Array.isArray(arr) ? arr.join(' ') : '';
      } catch(e) { return project.tech_stack || ''; }
    })();

    const searchText = [
      project.title,
      project.slug,
      project.category,
      project.year,
      project.status,
      project.role,
      techStackStr
    ].join(' ').toLowerCase();

    const match = !keyword || searchText.includes(keyword);
    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  updateSearchCount(visibleCount, allAdminProjects.length, keyword);
}

function updateSearchCount(visible, total, keyword) {
  const el = document.getElementById('adminSearchCount');
  if (!el) return;
  if (!keyword) {
    el.textContent = total > 0 ? `Menampilkan ${total} proyek` : '';
  } else {
    el.textContent = `Ditemukan ${visible} dari ${total} proyek`;
  }
}

