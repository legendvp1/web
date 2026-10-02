(function initTheme() {
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
  } catch {
    // localStorage недоступен — остаётся светлая тема
  }
})();
