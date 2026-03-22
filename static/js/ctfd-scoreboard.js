(() => {
  const root = document.querySelector('[data-ctfd-scoreboard]');
  if (!root) {
    return;
  }

  const elements = {
    graph: document.getElementById('ctfd-scoreboard-graph'),
    graphEmpty: document.getElementById('ctfd-scoreboard-graph-empty'),
    legend: document.getElementById('ctfd-scoreboard-legend'),
    filters: document.getElementById('ctfd-scoreboard-filters'),
    tableWrap: document.getElementById('ctfd-scoreboard-table-wrap'),
    rows: document.getElementById('ctfd-scoreboard-rows'),
    empty: document.getElementById('ctfd-scoreboard-empty'),
  };

  const state = {
    activeBracket: null,
    brackets: [],
    standings: [],
    detail: {},
  };

  const modeLabel = root.dataset.modeLabel || 'Team';
  const allLabel = root.dataset.allLabel || 'All';
  const scoreboardUpdateInterval = Number(window.scoreboardUpdateInterval) || 300000;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, match => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[match];
    });
  }

  function buildUrl(path, params) {
    const urlRoot = (window.init && window.init.urlRoot) || '';
    const url = new URL(`${urlRoot}${path}`, window.location.origin);

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  async function request(path, params) {
    const response = await fetch(buildUrl(path, params), {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload.success) {
      throw new Error(`API failure for ${path}`);
    }

    return payload.data;
  }

  function colorHash(seed) {
    let hash = 0;

    for (let index = 0; index < seed.length; index += 1) {
      hash = seed.charCodeAt(index) + ((hash << 5) - hash);
      hash |= 0;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 72% 60%)`;
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }

  function setGraphEmpty(message) {
    elements.graph.innerHTML = '';
    elements.legend.innerHTML = '';
    elements.graphEmpty.textContent = message;
    elements.graphEmpty.hidden = false;
  }

  function clearGraphEmpty() {
    elements.graphEmpty.hidden = true;
  }

  function getFilteredStandings() {
    if (state.activeBracket === null) {
      return state.standings.slice();
    }

    return state.standings.filter(standing => String(standing.bracket_id) === String(state.activeBracket));
  }

  function renderFilters() {
    elements.filters.innerHTML = '';

    if (!state.brackets.length) {
      elements.filters.hidden = true;
      return;
    }

    elements.filters.hidden = false;

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = 'ctfd-scoreboard__filter';
    if (state.activeBracket === null) {
      allButton.classList.add('is-active');
    }
    allButton.textContent = allLabel;
    allButton.addEventListener('click', async () => {
      if (state.activeBracket === null) {
        return;
      }

      state.activeBracket = null;
      renderFilters();
      renderTable();
      await refreshGraph();
    });
    elements.filters.appendChild(allButton);

    state.brackets.forEach(bracket => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ctfd-scoreboard__filter';
      if (String(state.activeBracket) === String(bracket.id)) {
        button.classList.add('is-active');
      }
      button.textContent = bracket.name;
      button.addEventListener('click', async () => {
        if (String(state.activeBracket) === String(bracket.id)) {
          return;
        }

        state.activeBracket = bracket.id;
        renderFilters();
        renderTable();
        await refreshGraph();
      });
      elements.filters.appendChild(button);
    });
  }

  function renderTable() {
    const standings = getFilteredStandings();
    elements.rows.innerHTML = '';

    if (!standings.length) {
      elements.tableWrap.hidden = true;
      elements.empty.hidden = false;
      return;
    }

    elements.tableWrap.hidden = false;
    elements.empty.hidden = true;

    standings.forEach((standing, index) => {
      const row = document.createElement('tr');

      const placeCell = document.createElement('td');
      placeCell.className = 'ctfd-scoreboard__place';
      const placeValue = document.createElement('span');
      placeValue.className = 'ctfd-scoreboard__place-value';
      placeValue.textContent = String(index + 1);
      placeCell.appendChild(placeValue);

      const nameCell = document.createElement('td');
      const nameLink = document.createElement('a');
      nameLink.className = 'ctfd-scoreboard__name-link';
      nameLink.href = standing.account_url;
      nameLink.textContent = standing.name;
      nameCell.appendChild(nameLink);

      const meta = document.createElement('div');
      meta.className = 'ctfd-scoreboard__table-meta';

      if (standing.bracket_name) {
        const bracketChip = document.createElement('span');
        bracketChip.className = 'ctfd-scoreboard__table-chip';
        bracketChip.textContent = standing.bracket_name;
        meta.appendChild(bracketChip);
      }

      if (Array.isArray(standing.members) && standing.members.length) {
        const memberChip = document.createElement('span');
        memberChip.className = 'ctfd-scoreboard__table-chip ctfd-scoreboard__table-chip--accent';
        memberChip.textContent = `${standing.members.length} members`;
        meta.appendChild(memberChip);
      }

      if (meta.childNodes.length) {
        nameCell.appendChild(meta);
      }

      const scoreCell = document.createElement('td');
      scoreCell.className = 'ctfd-scoreboard__score';
      const scoreValue = document.createElement('span');
      scoreValue.className = 'ctfd-scoreboard__score-value';
      scoreValue.textContent = String(standing.score);
      scoreCell.appendChild(scoreValue);

      row.appendChild(placeCell);
      row.appendChild(nameCell);
      row.appendChild(scoreCell);
      elements.rows.appendChild(row);
    });
  }

  function normaliseSeries() {
    return Object.values(state.detail || {})
      .map((entry, index) => {
        let runningScore = 0;
        const points = Array.isArray(entry.solves)
          ? entry.solves
              .map(solve => {
                const timestamp = new Date(solve.date).getTime();
                if (!Number.isFinite(timestamp)) {
                  return null;
                }

                runningScore += Number(solve.value) || 0;
                return {
                  x: timestamp,
                  y: runningScore,
                };
              })
              .filter(Boolean)
          : [];

        return {
          id: entry.id || index,
          name: entry.name || `${modeLabel} ${index + 1}`,
          color: colorHash(`${entry.name || modeLabel}${entry.id || index}`),
          points,
          finalScore: points.length ? points[points.length - 1].y : Number(entry.score) || 0,
        };
      })
      .filter(series => series.points.length)
      .sort((left, right) => right.finalScore - left.finalScore);
  }

  function renderLegend(seriesList) {
    elements.legend.innerHTML = '';

    seriesList.forEach(series => {
      const item = document.createElement('div');
      item.className = 'ctfd-scoreboard__legend-item';

      const swatch = document.createElement('span');
      swatch.className = 'ctfd-scoreboard__legend-swatch';
      swatch.style.background = series.color;

      const name = document.createElement('span');
      name.className = 'ctfd-scoreboard__legend-name';
      name.textContent = series.name;

      const score = document.createElement('span');
      score.className = 'ctfd-scoreboard__legend-score';
      score.textContent = `${series.finalScore} pts`;

      item.appendChild(swatch);
      item.appendChild(name);
      item.appendChild(score);
      elements.legend.appendChild(item);
    });
  }

  function renderGraph() {
    const seriesList = normaliseSeries();
    if (!seriesList.length) {
      setGraphEmpty('No graph data yet.');
      return;
    }

    clearGraphEmpty();
    renderLegend(seriesList);

    const points = seriesList.flatMap(series => series.points);
    let minX = Math.min(...points.map(point => point.x));
    let maxX = Math.max(...points.map(point => point.x));

    if (minX === maxX) {
      minX -= 1800000;
      maxX += 1800000;
    }

    const minY = 0;
    let maxY = Math.max(...points.map(point => point.y), 10);
    if (maxY === minY) {
      maxY += 10;
    }

    const width = 1040;
    const height = 360;
    const padding = { top: 18, right: 132, bottom: 38, left: 56 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const scaleX = value => padding.left + ((value - minX) / (maxX - minX)) * innerWidth;
    const scaleY = value => padding.top + innerHeight - ((value - minY) / (maxY - minY)) * innerHeight;

    const svg = [];
    svg.push(`<svg class="ctfd-scoreboard__graph-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Score progression graph">`);

    const yTicks = 5;
    for (let tickIndex = 0; tickIndex <= yTicks; tickIndex += 1) {
      const value = minY + ((maxY - minY) / yTicks) * tickIndex;
      const y = scaleY(value);
      svg.push(`<line class="ctfd-scoreboard__grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`);
      svg.push(`<text class="ctfd-scoreboard__axis-label" x="${padding.left - 12}" y="${y + 4}" text-anchor="end">${escapeHtml(Math.round(value))}</text>`);
    }

    const xTicks = 4;
    for (let tickIndex = 0; tickIndex <= xTicks; tickIndex += 1) {
      const value = minX + ((maxX - minX) / xTicks) * tickIndex;
      const x = scaleX(value);
      svg.push(`<line class="ctfd-scoreboard__grid-line--vertical" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"></line>`);
      svg.push(`<text class="ctfd-scoreboard__axis-label" x="${x}" y="${height - 10}" text-anchor="middle">${escapeHtml(formatTime(value))}</text>`);
    }

    svg.push(`<line class="ctfd-scoreboard__axis-line" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>`);
    svg.push(`<line class="ctfd-scoreboard__axis-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>`);

    seriesList.forEach(series => {
      const path = series.points
        .map((point, pointIndex) => {
          const x = scaleX(point.x).toFixed(2);
          const y = scaleY(point.y).toFixed(2);
          return `${pointIndex === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

      svg.push(`<path class="ctfd-scoreboard__series-line" d="${path}" stroke="${series.color}"></path>`);

      series.points.forEach((point, pointIndex) => {
        const x = scaleX(point.x).toFixed(2);
        const y = scaleY(point.y).toFixed(2);
        const radius = pointIndex === series.points.length - 1 ? 5.25 : 4;
        svg.push(`<circle class="ctfd-scoreboard__series-point" cx="${x}" cy="${y}" r="${radius}" fill="${series.color}"></circle>`);
      });

      const lastPoint = series.points[series.points.length - 1];
      const labelX = Math.min(scaleX(lastPoint.x) + 10, width - padding.right + 70);
      const labelY = Math.max(scaleY(lastPoint.y) - 10, padding.top + 12);
      svg.push(`<text class="ctfd-scoreboard__point-label" x="${labelX}" y="${labelY}" fill="${series.color}">${escapeHtml(series.name)}</text>`);
    });

    svg.push('</svg>');
    elements.graph.innerHTML = svg.join('');
  }

  async function refreshGraph() {
    try {
      state.detail = await request('/api/v1/scoreboard/top/10', state.activeBracket === null ? {} : { bracket_id: state.activeBracket });
      renderGraph();
    } catch (error) {
      console.error('Unable to load graph data', error);
      setGraphEmpty('Unable to load graph data.');
    }
  }

  async function refreshAll() {
    try {
      const [standings, brackets] = await Promise.all([
        request('/api/v1/scoreboard'),
        request('/api/v1/brackets'),
      ]);

      state.standings = Array.isArray(standings) ? standings : [];
      state.brackets = Array.isArray(brackets) ? brackets : [];

      renderFilters();
      renderTable();
      await refreshGraph();
    } catch (error) {
      console.error('Unable to load scoreboard', error);
      state.standings = [];
      state.brackets = [];
      renderFilters();
      renderTable();
      setGraphEmpty('Unable to load graph data.');
    }
  }

  refreshAll();
  window.setInterval(refreshAll, scoreboardUpdateInterval);
})();
