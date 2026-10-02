const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const toastClose = document.getElementById('toast-close');

const ANIMATION_MS = 300;
let hideTimer = null;

function hideToast() {
  toast.classList.remove('toast--visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(setHidden, ANIMATION_MS);
}

function setHidden() {
  toast.hidden = true;
}

function makeVisible() {
  toast.classList.add('toast--visible');
}

/**
 * Показать уведомление.
 * @param {string} message текст
 * @param {'success'|'error'} type тип
 */
function showToast(message, type = 'success') {
  clearTimeout(hideTimer);
  toastText.textContent = message;
  toast.classList.toggle('toast--error', type === 'error');
  toast.classList.toggle('toast--success', type !== 'error');
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.hidden = false;
  requestAnimationFrame(makeVisible);
}

toastClose.addEventListener('click', hideToast);
const toggle = document.getElementById('theme-toggle');
const root = document.documentElement;

function updateLabel() {
  const isDark = root.classList.contains('theme-dark');
  toggle.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
  toggle.setAttribute('aria-pressed', String(isDark));
}

function handleToggle() {
  const isDark = root.classList.toggle('theme-dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateLabel();
}

function initThemeToggle() {
  updateLabel();
  toggle.addEventListener('click', handleToggle);
}

const IMAGES_URL = 'http://95.163.242.125/images';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const gallery = document.getElementById('gallery');
const refreshButton = document.getElementById('gallery-refresh');

function delay(ms) {
  return new Promise(function executor(resolve) {
    setTimeout(resolve, ms);
  });
}

async function requestImages() {
  const response = await fetch(IMAGES_URL);
  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Некорректный формат данных');
  }
  return data;
}

async function fetchWithRetry() {
  let lastError;
  // 1 основной запрос + до 3 повторных
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await requestImages();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

function showLoader() {
  gallery.setAttribute('aria-busy', 'true');
  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.setAttribute('role', 'status');
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = 'Загрузка изображений…';
  loader.append(sr);
  gallery.replaceChildren(loader);
}

function showMessage(text) {
  const p = document.createElement('p');
  p.className = 'gallery__message';
  p.textContent = text;
  gallery.replaceChildren(p);
}

function createCard(image) {
  const figure = document.createElement('figure');
  figure.className = 'card';
  const img = document.createElement('img');
  img.className = 'card__img';
  img.src = image.url;
  img.alt = image.alt || 'Изображение';
  img.loading = 'lazy';
  const caption = document.createElement('figcaption');
  caption.className = 'card__caption';
  caption.textContent = image.description || image.alt || '';
  caption.title = caption.textContent;
  figure.append(img, caption);
  return figure;
}

function render(images) {
  if (images.length === 0) {
    showMessage('Изображения не найдены');
    return;
  }
  gallery.replaceChildren(...images.map(createCard));
}

async function loadGallery() {
  refreshButton.disabled = true;
  showLoader();
  try {
    const images = await fetchWithRetry();
    render(images);
  } catch (error) {
    showMessage('Не удалось загрузить изображения');
    showToast(`Не удалось загрузить галерею. ${error.message}`, 'error');
  } finally {
    gallery.setAttribute('aria-busy', 'false');
    refreshButton.disabled = false;
  }
}

function initGallery() {
  refreshButton.addEventListener('click', loadGallery);
  loadGallery();
}

const TEMP_URL = 'http://95.163.242.125/temp';

const form = document.getElementById('temp-form');
const submitButton = document.getElementById('temp-submit');

function setLocked(locked) {
  submitButton.disabled = locked;
  submitButton.textContent = locked ? 'Отправка…' : 'Отправить';
  form.setAttribute('aria-busy', String(locked));
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submitButton.disabled) {
    return;
  }

  const formData = new FormData(form);
  const className = String(formData.get('class')).trim();
  const tempRaw = String(formData.get('temp')).trim();
  const temp = Number(tempRaw);

  if (!className || tempRaw === '' || Number.isNaN(temp)) {
    showToast('Заполните номер аудитории и температуру', 'error');
    return;
  }

  setLocked(true);
  try {
    const response = await fetch(TEMP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class: className, temp }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Ошибка сервера: ${response.status}`);
    }
    showToast(data.message, 'success');
    form.reset();
  } catch (error) {
    showToast(error.message || 'Ошибка сети', 'error');
  } finally {
    setLocked(false);
  }
}

function initTemperatureForm() {
  form.addEventListener('submit', handleSubmit);
}

initThemeToggle();
initGallery();
initTemperatureForm();
