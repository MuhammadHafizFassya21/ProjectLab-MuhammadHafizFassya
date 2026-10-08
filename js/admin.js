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

  // Rapikan urutan button (1..N)
  const reorderAllBtn = document.getElementById('reorderAllBtn');
  if (reorderAllBtn) {
    reorderAllBtn.addEventListener('click', reorderAllProjects);
  }

  // Auto assign order button in form
  const autoOrderBtn = document.getElementById('autoOrderBtn');
  if (autoOrderBtn) {
    autoOrderBtn.addEventListener('click', () => {
      const nextOrder = getNextDisplayOrder();
      document.getElementById('pDisplayOrder').value = nextOrder;
      showToast(`Nomor urut otomatis diset ke ${nextOrder}.`, 'info', 'Nomor Urut');
    });
  }

  // File input preview & clear listeners
  const pImageFile = document.getElementById('pImageFile');
  const clearNewFilesBtn = document.getElementById('clearNewFilesBtn');
  const previewContainer = document.getElementById('newFilesPreviewContainer');
  const previewList = document.getElementById('newFilesPreviewList');

  if (pImageFile) {
    pImageFile.addEventListener('change', () => {
      const files = Array.from(pImageFile.files || []);
      if (files.length === 0) {
        if (previewContainer) previewContainer.style.display = 'none';
        if (clearNewFilesBtn) clearNewFilesBtn.style.display = 'none';
        if (previewList) previewList.innerHTML = '';
        return;
      }
      if (clearNewFilesBtn) clearNewFilesBtn.style.display = 'inline-flex';
      if (previewContainer) previewContainer.style.display = 'block';
      if (previewList) {
        previewList.innerHTML = '';
        files.forEach((file, idx) => {
          const tag = document.createElement('div');
          tag.className = 'new-file-tag';
          const isCoverCandidate = idx === 0 && (!document.getElementById('existingImageUrls').value || JSON.parse(document.getElementById('existingImageUrls').value).length === 0);
          tag.innerHTML = `
            <span style="font-weight:600; color:var(--primary);">${isCoverCandidate ? '⭐ Gambar 1 (Cover)' : `Gambar ${idx + 1}`}</span>
            <span style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${file.name}">${file.name}</span>
            <span style="color:var(--text-muted); font-size:0.75rem;">(${(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
          `;
          previewList.appendChild(tag);
        });
      }
    });
  }

  if (clearNewFilesBtn) {
    clearNewFilesBtn.addEventListener('click', () => {
      if (pImageFile) pImageFile.value = '';
      if (previewContainer) previewContainer.style.display = 'none';
      clearNewFilesBtn.style.display = 'none';
      if (previewList) previewList.innerHTML = '';
      showToast('Pilihan upload file baru dibatalkan.', 'info');
    });
  }

  // Delete all existing images button
  const deleteAllImagesBtn = document.getElementById('deleteAllImagesBtn');
  if (deleteAllImagesBtn) {
    deleteAllImagesBtn.addEventListener('click', async () => {
      const existingStr = document.getElementById('existingImageUrls').value;
      let urls = existingStr ? JSON.parse(existingStr) : [];
      if (urls.length === 0) return;

      const slug = document.getElementById('pId').value.trim();
      if (!confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA (${urls.length}) gambar dari proyek ini?\nTindakan ini tidak dapat dibatalkan.`)) {
        return;
      }

      urls = [];
      await saveAndUpdateImages(slug, urls, "🗑️ Semua gambar proyek berhasil dihapus.");
    });
  }

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

      const techStackArr = document.getElementById('pTechStack').value.split(',').map(s => s.trim()).filter(s => s);
      const featuresArr = document.getElementById('pFeatures').value.split(',').map(s => s.trim()).filter(s => s);
      const systemFlowArr = document.getElementById('pSystemFlow').value.split(',').map(s => s.trim()).filter(s => s);

      let chalArr = [];
      const chalRaw = document.getElementById('pChallenges').value.trim();
      if (chalRaw) {
        try { chalArr = JSON.parse(chalRaw); } catch (e) { chalArr = [{ "problem": chalRaw, "solution": "" }]; }
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
        display_order: parseInt(document.getElementById('pDisplayOrder').value) || 1,
        updated_at: new Date().toISOString()
      };

      if (editMode) {
        const { error } = await window.supabaseClient.from('projects').update(projectData).eq('slug', slug);
        if (error) throw new Error(error.message);
        showToast(`Proyek "${title}" berhasil diperbarui.`, 'success', 'Proyek Diperbarui');
      } else {
        const { error } = await window.supabaseClient.from('projects').insert([projectData]);
        if (error) throw new Error(error.message);
        showToast(`🎉 Proyek "${title}" berhasil ditambahkan ke portofolio!`, 'success', 'Proyek Ditambahkan');
      }

      resetForm();
      await loadAdminProjects();
    } catch (error) {
      err.textContent = error.message;
      err.style.display = 'block';
      showToast(error.message, 'error', 'Gagal Menyimpan Proyek');
    } finally {
      btn.disabled = false;
      btn.textContent = document.getElementById('editMode').value === 'true' ? 'Update Proyek' : 'Simpan Proyek';
    }
  });
});

/* ============================================================
   TOAST NOTIFICATION SYSTEM
   ============================================================ */
function showToast(message, type = 'success', title = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const defaultTitles = {
    success: 'Berhasil',
    error: 'Terjadi Kesalahan',
    warning: 'Perhatian',
    info: 'Informasi'
  };

  const resolvedTitle = title || defaultTitles[type] || '';

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ'}</div>
    <div class="toast-content">
      ${resolvedTitle ? `<div class="toast-title">${resolvedTitle}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" type="button" aria-label="Tutup">✕</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  let timeoutId = null;

  const dismiss = () => {
    if (timeoutId) clearTimeout(timeoutId);
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  timeoutId = setTimeout(dismiss, 4000);
}

/* ============================================================
   IMAGE UPLOAD & ORDERING HELPERS
   ============================================================ */
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
    const card = document.createElement('div');
    const isFirst = index === 0;
    card.className = `admin-image-card ${isFirst ? 'is-cover' : ''}`;

    card.innerHTML = `
      <div class="image-card-thumb">
        <img src="${url}" alt="Gambar ${index + 1}" onerror="this.src='assets/images/projects/placeholder-project.png'">
        <span class="image-order-badge ${isFirst ? 'badge-cover' : ''}">
          ${isFirst ? '⭐ Cover (Gambar 1)' : `Gambar ${index + 1}`}
        </span>
      </div>
      <div class="image-card-actions">
        ${!isFirst ? `<button type="button" class="btn-img-action btn-set-cover" onclick="setCoverImage('${slug}', ${index})">⭐ Jadikan Cover Utama</button>` : ''}
        <div class="image-card-nav">
          <button type="button" class="btn-img-action" title="Geser ke kiri / urutan sebelumnya" ${index === 0 ? 'disabled' : ''} onclick="moveImageOrder('${slug}', ${index}, -1)">◀</button>
          <button type="button" class="btn-img-action" title="Geser ke kanan / urutan berikutnya" ${index === urls.length - 1 ? 'disabled' : ''} onclick="moveImageOrder('${slug}', ${index}, 1)">▶</button>
          <button type="button" class="btn-img-action btn-danger" title="Hapus gambar ini" onclick="removeExistingImage('${slug}', ${index})">🗑️ Hapus</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.setCoverImage = async function (slug, index) {
  const existingStr = document.getElementById('existingImageUrls').value;
  let urls = existingStr ? JSON.parse(existingStr) : [];
  if (index <= 0 || index >= urls.length) return;

  const [selectedImg] = urls.splice(index, 1);
  urls.unshift(selectedImg); // Put at position 0 (Cover)

  await saveAndUpdateImages(slug, urls, "⭐ Gambar berhasil dipindahkan ke awal sebagai Cover utama!");
};

window.moveImageOrder = async function (slug, index, direction) {
  const existingStr = document.getElementById('existingImageUrls').value;
  let urls = existingStr ? JSON.parse(existingStr) : [];
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= urls.length) return;

  // Swap positions
  const temp = urls[index];
  urls[index] = urls[targetIdx];
  urls[targetIdx] = temp;

  await saveAndUpdateImages(slug, urls, "Urutan gambar berhasil diperbarui.");
};

window.removeExistingImage = async function (slug, indexToRemove) {
  if (!confirm(`Hapus gambar ke-${indexToRemove + 1} dari proyek ini?`)) return;

  const existingStr = document.getElementById('existingImageUrls').value;
  let urls = existingStr ? JSON.parse(existingStr) : [];
  urls.splice(indexToRemove, 1);

  await saveAndUpdateImages(slug, urls, "Gambar berhasil dihapus dari daftar.");
};

async function saveAndUpdateImages(slug, urls, successMsg) {
  document.getElementById('existingImageUrls').value = JSON.stringify(urls);
  const editMode = document.getElementById('editMode').value === 'true';

  if (editMode && slug) {
    try {
      const { error } = await window.supabaseClient.from('projects').update({
        image_urls: JSON.stringify(urls),
        image_url: urls.length > 0 ? urls[0] : '',
        updated_at: new Date().toISOString()
      }).eq('slug', slug);

      if (error) throw error;
      showToast(successMsg, 'success');

      // Update in local array cache
      const p = allAdminProjects.find(item => item.slug === slug);
      if (p) {
        p.image_urls = JSON.stringify(urls);
        p.image_url = urls.length > 0 ? urls[0] : '';
      }
      renderAdminTableRows();
    } catch (err) {
      showToast("Gagal menyimpan perubahan gambar: " + err.message, 'error');
      return;
    }
  } else {
    showToast(successMsg, 'info');
  }

  renderExistingImagesGrid(urls, slug);
}

/* ============================================================
   PROJECT ORDERING (PENOMORAN) HELPERS
   ============================================================ */
let allAdminProjects = [];

function getNextDisplayOrder() {
  if (!allAdminProjects || allAdminProjects.length === 0) return 1;
  const maxOrder = allAdminProjects.reduce((max, p) => {
    const val = Number(p.display_order) || 0;
    return val > max ? val : max;
  }, 0);
  return maxOrder + 1;
}

window.moveProjectRow = async function (slug, direction) {
  const index = allAdminProjects.findIndex(p => p.slug === slug);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= allAdminProjects.length) return;

  const currentProject = allAdminProjects[index];
  const targetProject = allAdminProjects[targetIndex];

  let currentNewOrder = Number(targetProject.display_order) || 0;
  let targetNewOrder = Number(currentProject.display_order) || 0;

  // If their display_orders are equal, separate them
  if (currentNewOrder === targetNewOrder) {
    if (direction === -1) {
      currentNewOrder = Math.max(1, currentNewOrder - 1);
      targetNewOrder = currentNewOrder + 1;
    } else {
      currentNewOrder = currentNewOrder + 1;
      targetNewOrder = Math.max(1, currentNewOrder - 1);
    }
  }

  try {
    const [res1, res2] = await Promise.all([
      window.supabaseClient.from('projects').update({
        display_order: currentNewOrder,
        updated_at: new Date().toISOString()
      }).eq('slug', currentProject.slug),
      window.supabaseClient.from('projects').update({
        display_order: targetNewOrder,
        updated_at: new Date().toISOString()
      }).eq('slug', targetProject.slug)
    ]);

    if (res1.error) throw res1.error;
    if (res2.error) throw res2.error;

    showToast(`Urutan proyek "${currentProject.title}" berhasil dipindahkan.`, 'success', 'Urutan Diperbarui');
    await loadAdminProjects();
  } catch (err) {
    showToast("Gagal memindahkan urutan: " + err.message, 'error');
  }
};

window.quickEditOrder = async function (slug, currentOrder) {
  const project = allAdminProjects.find(p => p.slug === slug);
  const title = project ? project.title : slug;
  const input = prompt(`Ubah nomor urut tampil untuk "${title}":\n(Nomor 1 tampil paling awal di portfolio)`, currentOrder);
  if (input === null) return;

  const newOrder = parseInt(input.trim(), 10);
  if (isNaN(newOrder)) {
    showToast("Nomor urut harus berupa angka.", "warning");
    return;
  }
  if (newOrder === currentOrder) return;

  try {
    const { error } = await window.supabaseClient.from('projects').update({
      display_order: newOrder,
      updated_at: new Date().toISOString()
    }).eq('slug', slug);

    if (error) throw error;
    showToast(`Nomor urut "${title}" diubah menjadi ${newOrder}.`, 'success', 'Urutan Diperbarui');
    await loadAdminProjects();
  } catch (err) {
    showToast("Gagal mengubah nomor urut: " + err.message, 'error');
  }
};

async function reorderAllProjects() {
  if (!allAdminProjects || allAdminProjects.length === 0) {
    showToast("Belum ada proyek untuk dirapikan.", "info");
    return;
  }
  if (!confirm(`Rapikan nomor urut semua (${allAdminProjects.length}) proyek menjadi berurutan 1, 2, 3, ...?\nNomor urut akan disesuaikan otomatis dari atas ke bawah.`)) {
    return;
  }

  try {
    const updates = allAdminProjects.map((p, idx) => {
      return window.supabaseClient.from('projects').update({
        display_order: idx + 1,
        updated_at: new Date().toISOString()
      }).eq('slug', p.slug);
    });

    await Promise.all(updates);
    showToast(`Berhasil merapikan nomor urut ${allAdminProjects.length} proyek (1 sampai ${allAdminProjects.length})!`, 'success', 'Urutan Dirapikan');
    await loadAdminProjects();
  } catch (err) {
    showToast("Gagal merapikan urutan: " + err.message, 'error');
  }
}

/* ============================================================
   ADMIN PROJECTS TABLE & CRUD
   ============================================================ */
function renderAdminTableRows() {
  const tbody = document.getElementById('projectsTbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (allAdminProjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada proyek.</td></tr>';
    return;
  }

  allAdminProjects.forEach((p, index) => {
    const tr = document.createElement('tr');
    tr.dataset.slug = p.slug;
    const isActive = p.is_active !== false;
    const activeBadge = isActive ? '<span class="badge" style="background:#10b981; color:white">Aktif</span>' : '<span class="badge" style="background:#ef4444; color:white">Nonaktif</span>';
    const featuredBadge = p.featured ? '<span class="badge badge-accent" style="background:#3b82f6; color:white">Featured</span>' : '';

    let imgUrl = p.image_url;
    try {
      if (p.image_urls) {
        const arr = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : p.image_urls;
        if (Array.isArray(arr) && arr.length > 0) imgUrl = arr[0];
      }
    } catch (e) { }

    const img = imgUrl ? `<img src="${imgUrl}" style="width:60px; height:40px; object-fit:cover; border-radius:4px; vertical-align:middle; margin-right:10px;" onerror="this.src='assets/images/projects/placeholder-project.png'">` : '';

    const currentOrder = p.display_order ?? 0;
    const isFirstInList = index === 0;
    const isLastInList = index === allAdminProjects.length - 1;

    tr.innerHTML = `
      <td>
        <div class="order-control-cell">
          <span class="order-num-badge" title="Klik untuk ubah nomor urut langsung" onclick="quickEditOrder('${p.slug}', ${currentOrder})">
            ${currentOrder}
          </span>
          <div class="order-arrow-btns">
            <button type="button" class="order-arrow-btn" title="Pindahkan ke atas (tukar posisi)" ${isFirstInList ? 'disabled' : ''} onclick="moveProjectRow('${p.slug}', -1)">▲</button>
            <button type="button" class="order-arrow-btn" title="Pindahkan ke bawah (tukar posisi)" ${isLastInList ? 'disabled' : ''} onclick="moveProjectRow('${p.slug}', 1)">▼</button>
          </div>
        </div>
      </td>
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
}

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

    renderAdminTableRows();

    // Auto set next order in form if in create mode
    const editMode = document.getElementById('editMode')?.value === 'true';
    if (!editMode) {
      const pDisplayOrder = document.getElementById('pDisplayOrder');
      if (pDisplayOrder && (!pDisplayOrder.value || pDisplayOrder.value === '0')) {
        pDisplayOrder.value = getNextDisplayOrder();
      }
    }

    // Re-apply search filter after table render
    const adminSearchInput = document.getElementById('adminSearchInput');
    if (adminSearchInput && adminSearchInput.value.trim()) {
      filterAdminTable(adminSearchInput.value.trim().toLowerCase());
    } else {
      updateSearchCount(allAdminProjects.length, allAdminProjects.length);
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${err.message}</td></tr>`;
    showToast("Gagal memuat data: " + err.message, 'error');
  }
}

window.deleteProject = async function (slug) {
  const project = allAdminProjects.find(p => p.slug === slug);
  const title = project ? project.title : slug;
  if (!confirm(`Yakin ingin menghapus project "${title}"?\nData yang dihapus tidak dapat dikembalikan.`)) {
    return;
  }

  try {
    const { error } = await window.supabaseClient.from('projects').delete().eq('slug', slug);
    if (error) throw error;
    showToast(`Project "${title}" berhasil dihapus.`, 'success', 'Proyek Dihapus');
    await loadAdminProjects();
  } catch (err) {
    showToast("Gagal menghapus: " + err.message, 'error');
  }
};

window.toggleActive = async function (slug, currentStatus) {
  try {
    const { error } = await window.supabaseClient
      .from('projects')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('slug', slug);

    if (error) throw error;
    showToast(`Status proyek diubah menjadi: ${!currentStatus ? 'Aktif' : 'Nonaktif'}`, 'info', 'Status Diperbarui');
    await loadAdminProjects();
  } catch (err) {
    showToast("Gagal mengupdate status: " + err.message, 'error');
  }
};

window.toggleFeatured = async function (slug, currentStatus) {
  try {
    const { error } = await window.supabaseClient
      .from('projects')
      .update({ featured: !currentStatus, updated_at: new Date().toISOString() })
      .eq('slug', slug);

    if (error) throw error;
    showToast(`Proyek ${!currentStatus ? 'dijadikan Featured ⭐' : 'batal Featured'}`, 'info', 'Status Featured');
    await loadAdminProjects();
  } catch (err) {
    showToast("Gagal mengupdate status featured: " + err.message, 'error');
  }
};

window.editProject = function (slug) {
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
  document.getElementById('pDisplayOrder').value = project.display_order || 1;
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
  } catch (e) { document.getElementById('pChallenges').value = project.challenges || ''; }

  document.getElementById('pFeatured').checked = project.featured;
  document.getElementById('pIsActive').checked = project.is_active !== false;

  let existingUrls = [];
  try {
    if (project.image_urls) existingUrls = typeof project.image_urls === 'string' ? JSON.parse(project.image_urls) : project.image_urls;
    else if (project.image_url) existingUrls = typeof project.image_url === 'string' && project.image_url.startsWith('[') ? JSON.parse(project.image_url) : [project.image_url];
  } catch (e) { }

  document.getElementById('existingImageUrls').value = JSON.stringify(existingUrls);
  renderExistingImagesGrid(existingUrls, slug);

  // Clear new file input selections if any
  const pImageFile = document.getElementById('pImageFile');
  if (pImageFile) pImageFile.value = '';
  const previewContainer = document.getElementById('newFilesPreviewContainer');
  if (previewContainer) previewContainer.style.display = 'none';
  const clearNewFilesBtn = document.getElementById('clearNewFilesBtn');
  if (clearNewFilesBtn) clearNewFilesBtn.style.display = 'none';
  const previewList = document.getElementById('newFilesPreviewList');
  if (previewList) previewList.innerHTML = '';

  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
};

function resetForm() {
  document.getElementById('addProjectForm').reset();
  document.getElementById('editMode').value = 'false';
  document.getElementById('formTitle').textContent = 'Tambah Proyek Baru';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('pId').readOnly = false;
  document.getElementById('submitProjectBtn').textContent = 'Simpan Proyek';
  document.getElementById('existingImagesContainer').style.display = 'none';
  document.getElementById('existingImageUrls').value = '[]';

  // Clear new file uploads preview
  const pImageFile = document.getElementById('pImageFile');
  if (pImageFile) pImageFile.value = '';
  const previewContainer = document.getElementById('newFilesPreviewContainer');
  if (previewContainer) previewContainer.style.display = 'none';
  const clearNewFilesBtn = document.getElementById('clearNewFilesBtn');
  if (clearNewFilesBtn) clearNewFilesBtn.style.display = 'none';
  const previewList = document.getElementById('newFilesPreviewList');
  if (previewList) previewList.innerHTML = '';

  // Auto assign next display order
  document.getElementById('pDisplayOrder').value = getNextDisplayOrder();
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

    showToast(`${mappedProjects.length} proyek lama berhasil diimport ke Supabase!`, 'success', 'Import Berhasil');
    await loadAdminProjects();
  } catch (error) {
    console.error("Gagal import project dari JSON:", error);
    showToast("Gagal import project: " + error.message, 'error');
  }
}

function filterAdminTable(keyword) {
  const tbody = document.getElementById('projectsTbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;

  rows.forEach(row => {
    if (!row.dataset.slug) {
      return;
    }
    const project = allAdminProjects.find(p => p.slug === row.dataset.slug);
    if (!project) return;

    const techStackStr = (() => {
      try {
        const arr = typeof project.tech_stack === 'string' ? JSON.parse(project.tech_stack) : (project.tech_stack || []);
        return Array.isArray(arr) ? arr.join(' ') : '';
      } catch (e) { return project.tech_stack || ''; }
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
