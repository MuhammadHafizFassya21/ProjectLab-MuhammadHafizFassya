document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const errorMsg = document.getElementById('errorMsg');
  const btn = document.getElementById('loginBtn');

  // Cek apakah sudah login
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'admin.html';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    btn.textContent = 'Memproses...';
    btn.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      errorMsg.textContent = "Login gagal: " + error.message;
      errorMsg.style.display = 'block';
      btn.textContent = 'Masuk';
      btn.disabled = false;
    } else {
      window.location.href = 'admin.html';
    }
  });
});
