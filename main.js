const dialog = document.getElementById("register-dialog");
const form = document.getElementById("register-form");
const openButton = document.getElementById("open-dialog");
const closeButton = document.getElementById("close-dialog");
const showPasswordButton = document.getElementById("show-password");
const passwordInput = document.getElementById("password");
const cards = document.getElementById("cards");
const githubInput = document.getElementById("github");
const githubDateInput = document.getElementById("github-date");

function getPhoneDigits(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    digits = digits.slice(1);
  }
  return digits;
}

function formatPhone(value) {
  const d = getPhoneDigits(value);
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function getTodayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

function getErrorMessage(input) {
  const { validity, value } = input;
  const trimmed = value.trim();

  switch (input.id) {
    case "name":
      if (validity.valueMissing) return "Введите имя — это обязательное поле.";
      if (/\d/.test(value)) return "Имя не должно содержать цифр.";
      if (trimmed.length < 2) return "Имя должно быть длиннее одного символа.";
      return "";
    case "email":
      if (validity.valueMissing)
        return "Введите почту — это обязательное поле.";
      if (validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Введите почту в формате name@example.com.";
      }
      return "";
    case "phone":
      if (trimmed === "") return "";
      if (/[^\d\s()+-]/.test(value))
        return "Телефон может содержать только цифры, пробелы, скобки, «+» и «-».";
      if (getPhoneDigits(value).length !== 10) {
        return "Телефон должен содержать 10 цифр (без кода страны) или 11 цифр, начиная с 7 или 8.";
      }
      return "";
    case "age":
      if (validity.badInput) return "Возраст должен быть числом.";
      if (trimmed === "") return "";
      if (validity.stepMismatch) return "Возраст должен быть целым числом.";
      if (validity.rangeUnderflow)
        return "Возраст должен быть не меньше 1 года.";
      if (validity.rangeOverflow) return "Возраст не может быть больше 99 лет.";
      return "";
    case "github":
      if (validity.typeMismatch)
        return "Введите корректную ссылку, например https://github.com/username.";
      if (trimmed !== "" && githubDateInput.value === "") {
        return "Укажите также дату регистрации на GitHub.";
      }
      return "";
    case "github-date":
      if (validity.badInput) return "Введите корректную дату.";
      if (value !== "" && value > getTodayString())
        return "Дата регистрации не может быть в будущем.";
      if (value !== "" && githubInput.value.trim() === "")
        return "Укажите также ссылку на профиль GitHub.";
      return "";
    case "password":
      if (value !== "" && value.length < 6) {
        return `Пароль должен быть не короче 6 символов (сейчас ${value.length}).`;
      }
      return "";
    default:
      return input.validationMessage;
  }
}

function validateField(input) {
  const message = getErrorMessage(input);
  const errorElement = document.getElementById(
    input.getAttribute("aria-describedby"),
  );
  input.setCustomValidity(message);
  if (message) {
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
    errorElement.hidden = false;
  } else {
    input.removeAttribute("aria-invalid");
    errorElement.textContent = "";
    errorElement.hidden = true;
  }
  return message === "";
}

function handleBlur(event) {
  validateField(event.target);
  if (
    event.target === githubInput &&
    githubDateInput.hasAttribute("aria-invalid")
  ) {
    validateField(githubDateInput);
  }
  if (
    event.target === githubDateInput &&
    githubInput.hasAttribute("aria-invalid")
  ) {
    validateField(githubInput);
  }
}

function createCard(data) {
  const col = document.createElement("article");
  col.className = "col-md-6 col-lg-4";
  const card = document.createElement("div");
  card.className = "card user-card shadow-sm h-100";
  const body = document.createElement("div");
  body.className = "card-body";
  const title = document.createElement("h2");
  title.className = "card-title h5";
  title.textContent = data.get("name");
  body.append(title);

  const rows = [
    ["Почта", data.get("email")],
    ["Телефон", data.get("phone") ? formatPhone(data.get("phone")) : ""],
    ["Возраст", data.get("age")],
    ["GitHub", data.get("github")],
    [
      "Дата регистрации",
      data.get("githubDate")
        ? new Date(data.get("githubDate")).toLocaleDateString("ru-RU")
        : "",
    ],
  ];
  const list = document.createElement("dl");
  list.className = "mb-0";
  rows.forEach(([label, value]) => {
    if (!value) return;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.append(dt, dd);
  });
  body.append(list);
  card.append(body);
  col.append(card);
  cards.append(col);
}

function handleSubmit(event) {
  event.preventDefault();
  const inputs = [...form.querySelectorAll("input")];
  const invalid = inputs.filter((input) => !validateField(input));
  if (invalid.length > 0) {
    invalid[0].focus();
    return;
  }
  createCard(new FormData(form));
  form.reset();
  dialog.close();
}

function openDialog() {
  githubDateInput.max = getTodayString();
  dialog.showModal();
}

function closeDialog() {
  dialog.close();
}

function handleDialogClick(event) {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  }
}

function showPassword() {
  passwordInput.type = "text";
}

function hidePassword() {
  passwordInput.type = "password";
}

openButton.addEventListener("click", openDialog);
closeButton.addEventListener("click", closeDialog);
dialog.addEventListener("click", handleDialogClick);
form.addEventListener("submit", handleSubmit);
form
  .querySelectorAll("input")
  .forEach((input) => input.addEventListener("blur", handleBlur));
showPasswordButton.addEventListener("pointerdown", showPassword);
showPasswordButton.addEventListener("pointerup", hidePassword);
showPasswordButton.addEventListener("pointerleave", hidePassword);
