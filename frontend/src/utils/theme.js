// Modo oscuro: se guarda en localStorage (no hay preferencia de usuario en
// el backend) y se aplica como data-theme en <body>, para que el CSS lo
// pueda usar como selector sin que React tenga que tocar el DOM de cada
// pantalla. Solo afecta a `.main` (ver App.css); sidebar y topbar quedan
// iguales en los dos modos.
const STORAGE_KEY = "xinversor_theme";

export const getTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const applyTheme = (theme) => {
  document.body.dataset.theme = theme;
};

export const setTheme = (theme) => {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // No es crítico: el tema se aplica igual, solo no persiste.
  }
};

// Se aplica apenas se importa este módulo (ver main.jsx), antes del primer
// render, para no arrancar en claro y "parpadear" a oscuro después.
applyTheme(getTheme());
