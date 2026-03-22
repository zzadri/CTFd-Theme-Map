(() => {
  const root = document.querySelector("[data-team-directory]");
  if (!root) {
    return;
  }

  const cards = Array.from(root.querySelectorAll("[data-team-card]"));
  const input = document.querySelector("[data-team-filter-input]");
  const reset = document.querySelector("[data-team-filter-reset]");
  const emptyState = document.querySelector("[data-team-empty]");
  const visibleCount = document.querySelector("[data-visible-count]");

  if (!input || !reset) {
    return;
  }

  const normalize = value =>
    (value || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const applyFilter = () => {
    const query = normalize(input.value);
    let visible = 0;

    cards.forEach(card => {
      const isVisible = !query || normalize(card.dataset.searchName).includes(query);
      card.hidden = !isVisible;
      if (isVisible) {
        visible += 1;
      }
    });

    if (visibleCount) {
      visibleCount.textContent = String(visible);
    }

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  };

  input.addEventListener("input", applyFilter);
  reset.addEventListener("click", () => {
    input.value = "";
    input.focus();
    applyFilter();
  });

  applyFilter();
})();
