export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function corTextoGrafico() {
  return document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
}

export function corGradeGrafico() {
  return document.body.classList.contains('dark-mode') ? '#1e293b' : '#e2e8f0';
}
