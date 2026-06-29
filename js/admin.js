document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  });

  // Cancel Edit
  document.getElementById('cancelEditBtn').addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });

  // 2. Load Projects Table
  await loadAdminProjects();

  // 3. Add/Edit Project Form Submission
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
      const slug = document.getElementById('pId').value;
      
      let imageUrls = [];
      const imageFile = document.getElementById('pImageFile').files[0];
      
      const techStackArr = document.getElementById('pTechStack').value.split(',').map(s => s.trim()).filter(s=>s);
      const featuresArr = document.getElementById('pFeatures').value.split(',').map(s => s.trim()).filter(s=>s);

      const projectData = {
        slug: slug,
        title: document.getElementById('pTitle').value,
        category: document.getElementById('pCategory').value,
        short_description: document.getElementById('pShortDesc').value,
        problem: document.getElementById('pProblem').value,
        objective: document.getElementById('pObjective').value,
        target_user: document.getElementById('pTargetUser').value,
        role: document.getElementById('pRole').value,
        tech_stack: JSON.stringify(techStackArr),
        features: JSON.stringify(featuresArr),
        status: document.getElementById('pStatus').value,
        year: document.getElementById('pYear').value,
        featured: document.getElementById('pFeatured').checked,
        is_active: document.getElementById('pIsActive').checked,
        display_order: parseInt(document.getElementById('pDisplayOrder').value) || 0,
        updated_at: new Date().toISOString()
      };

      // Handle Image
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await window.supabaseClient.storage
          .from('project-images')
          .upload(filePath, imageFile);

        if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);
        
        const { data: publicUrlData } = window.supabaseClient.storage.from('project-images').getPublicUrl(filePath);
        imageUrls.push(publicUrlData.publicUrl);
        projectData.image_url = JSON.stringify(imageUrls);
      } else if (!editMode) {
        // Only set placeholder if it's a new insert
        imageUrls.push('assets/images/projects/placeholder-project.png');
        projectData.image_url = JSON.stringify(imageUrls);
      }

      if (editMode) {
        const { error } = await window.supabaseClient.from('projects').update(projectData).eq('slug', slug);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await window.supabaseClient.from('projects').insert([projectData]);
        if (error) throw new Error(error.message);
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
    tbody.innerHTML = '';
    
    if (allAdminProjects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada proyek.</td></tr>';
      return;
    }

    allAdminProjects.forEach(p => {
      const tr = document.createElement('tr');
      // Treat null as true since schema default is true
      const isActive = p.is_active === null ? true : p.is_active;
      const activeBadge = isActive ? '<span class="badge" style="background:#10b981; color:white">Aktif</span>' : '<span class="badge" style="background:#ef4444; color:white">Nonaktif</span>';
      const featuredBadge = p.featured ? '<span class="badge badge-accent">Featured</span>' : '';
      
      tr.innerHTML = `
        <td>${p.display_order || 0}</td>
        <td><strong>${p.title}</strong> ${featuredBadge}<br><small class="text-muted">${p.slug}</small></td>
        <td>${p.category}</td>
        <td>${activeBadge}<br><small>${p.status}</small></td>
        <td style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="editProject('${p.slug}')">Edit</button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="toggleActive('${p.slug}', ${isActive})">${isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="toggleFeatured('${p.slug}', ${p.featured})">${p.featured ? 'Batal Featured' : 'Jadikan Featured'}</button>
          <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color:red; border-color:red" onclick="deleteProject('${p.slug}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${err.message}</td></tr>`;
  }
}

window.deleteProject = async function(slug) {
  if (confirm(`Yakin ingin menghapus proyek ${slug}?`)) {
    const { error } = await window.supabaseClient.from('projects').delete().eq('slug', slug);
    if (error) {
      alert("Gagal menghapus: " + error.message);
    } else {
      loadAdminProjects();
    }
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
  
  const parseJsonStr = (str) => {
    try { 
      const parsed = typeof str === 'string' ? JSON.parse(str) : str;
      return Array.isArray(parsed) ? parsed.join(', ') : (parsed || '');
    } catch (e) { return str || ''; }
  };
  
  document.getElementById('pTechStack').value = parseJsonStr(project.tech_stack);
  document.getElementById('pFeatures').value = parseJsonStr(project.features);
  
  document.getElementById('pFeatured').checked = project.featured;
  document.getElementById('pIsActive').checked = project.is_active === null ? true : project.is_active;

  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  document.getElementById('addProjectForm').reset();
  document.getElementById('editMode').value = 'false';
  document.getElementById('formTitle').textContent = 'Tambah Proyek Baru';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('pId').readOnly = false;
  document.getElementById('submitProjectBtn').textContent = 'Simpan Proyek';
}
