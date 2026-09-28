(() => {
  const form = document.getElementById('access-form');
  const gate = document.getElementById('access-gate');
  const password = document.getElementById('access-password');
  const error = document.getElementById('access-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (password.value !== '1357') {
      error.hidden = false;
      password.value = '';
      password.focus();
      return;
    }

    password.value = '';
    gate.hidden = true;
    document.body.classList.remove('access-locked');
    document.querySelectorAll('.site-header, .main-shell, .site-footer').forEach((element) => {
      element.removeAttribute('inert');
    });
  });
})();
