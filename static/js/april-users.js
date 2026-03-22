(() => {
  const root = document.querySelector("[data-user-directory]");
  if (!root) {
    return;
  }

  const cards = Array.from(root.querySelectorAll("[data-user-card]"));
  const input = document.querySelector("[data-user-filter-input]");
  const reset = document.querySelector("[data-user-filter-reset]");
  const modeButtons = Array.from(document.querySelectorAll("[data-filter-field]"));
  const emptyState = document.querySelector("[data-user-empty]");
  const visibleCount = document.querySelector("[data-visible-count]");

  if (!input || !reset || modeButtons.length === 0) {
    return;
  }

  const placeholders = {
    name: "Search users",
    team: "Search teams",
  };

  let activeField = "name";

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
      const source = activeField === "team" ? card.dataset.searchTeam : card.dataset.searchName;
      const isVisible = !query || normalize(source).includes(query);
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

  const setMode = field => {
    activeField = field;
    modeButtons.forEach(button => {
      const isActive = button.dataset.filterField === field;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    input.placeholder = placeholders[field] || placeholders.name;
    applyFilter();
  };

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      setMode(button.dataset.filterField || "name");
      input.focus();
    });
  });

  input.addEventListener("input", applyFilter);
  reset.addEventListener("click", () => {
    input.value = "";
    setMode("name");
    input.focus();
  });

  setMode("name");
})();