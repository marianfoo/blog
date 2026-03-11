(() => {
  const COLUMNS = [
    "Controls, UI Elements, Features",
    "Supported Floorplans",
    "Developer Documentation",
    "SAP Fiori Design Guidelines",
    "Available from Version"
  ];
  const SORTABLE_LABELS = new Set([
    "Controls, UI Elements, Features",
    "Developer Documentation",
    "SAP Fiori Design Guidelines",
    "Available from Version"
  ]);

  function normalizeWhitespace(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseVersion(version) {
    const match = String(version ?? "").match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return [0, 0, 0];
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  function compareVersions(a, b) {
    const va = parseVersion(a);
    const vb = parseVersion(b);
    if (va[0] !== vb[0]) return va[0] - vb[0];
    if (va[1] !== vb[1]) return va[1] - vb[1];
    return va[2] - vb[2];
  }

  function renderLinkList(group) {
    const links = group?.links ?? [];
    if (links.length > 0) {
      return links
        .map((item) => {
          const label = escapeHtml(item?.label ?? item?.url ?? "");
          const url = normalizeWhitespace(item?.url ?? "");
          if (!url) return label;
          return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + label + '</a>';
        })
        .join("<br>");
    }

    const fallback = normalizeWhitespace(group?.text ?? "");
    return fallback ? escapeHtml(fallback) : "";
  }

  function formatGeneratedAt(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "-";

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function setupFeatureMap(root) {
    if (!root || root.dataset.initialized === "true") return;
    root.dataset.initialized = "true";

    const jsonUrl = root.getAttribute("data-json-url") || "/feature-map/fe-feature-adoption.json";
    const globalSearch = root.querySelector('[data-role="global-search"]');
    const floorplanToggle = root.querySelector('[data-role="floorplan-toggle"]');
    const floorplanMenu = root.querySelector('[data-role="floorplan-menu"]');
    const floorplanOptionsContainer = root.querySelector('[data-role="floorplan-options"]');
    const floorplanSelectAll = root.querySelector('[data-role="floorplan-select-all"]');
    const floorplanClear = root.querySelector('[data-role="floorplan-clear"]');
    const clearFilters = root.querySelector('[data-role="clear-filters"]');
    const headerRow = root.querySelector('[data-role="header-row"]');
    const filterRow = root.querySelector('[data-role="filter-row"]');
    const tableBody = root.querySelector('[data-role="table-body"]');
    const resultCount = root.querySelector('[data-role="result-count"]');
    const generatedAt = root.querySelector('[data-role="generated-at"]');
    const status = root.querySelector('[data-role="status"]');

    const state = {
      rows: [],
      floorplanOptions: [],
      globalSearch: "",
      columnFilters: COLUMNS.map(() => ""),
      selectedFloorplans: [],
      sortColumn: null,
      sortDirection: "asc"
    };

    function setStatus(message) {
      if (!status) return;
      status.textContent = message || "";
    }

    function updateFloorplanLabel() {
      if (!floorplanToggle) return;
      if (state.selectedFloorplans.length === 0) {
        floorplanToggle.textContent = "Floorplans: All";
        return;
      }
      floorplanToggle.textContent = "Floorplans: " + state.selectedFloorplans.length;
    }

    function updateSortIndicators() {
      const headers = Array.from(headerRow.children);
      headers.forEach((th, index) => {
        const isSortable = SORTABLE_LABELS.has(COLUMNS[index]);
        if (!isSortable) {
          th.removeAttribute("aria-sort");
          return;
        }

        if (state.sortColumn === index) {
          th.setAttribute("aria-sort", state.sortDirection === "asc" ? "ascending" : "descending");
        } else {
          th.setAttribute("aria-sort", "none");
        }

        const indicator = th.querySelector(".fe-feature-map__sort-indicator");
        if (!indicator) return;

        if (state.sortColumn === index) {
          indicator.textContent = state.sortDirection === "asc" ? "▲" : "▼";
        } else {
          indicator.textContent = "↕";
        }
      });
    }

    function toggleSort(columnIndex) {
      if (!SORTABLE_LABELS.has(COLUMNS[columnIndex])) return;

      if (state.sortColumn === columnIndex) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortColumn = columnIndex;
        state.sortDirection = "asc";
      }

      updateSortIndicators();
      render();
    }

    function buildHeader() {
      headerRow.innerHTML = "";
      filterRow.innerHTML = "";

      COLUMNS.forEach((label, index) => {
        const th = document.createElement("th");
        th.setAttribute("scope", "col");

        if (SORTABLE_LABELS.has(label)) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "fe-feature-map__sort-button";
          button.innerHTML = '<span>' + escapeHtml(label) + '</span><span class="fe-feature-map__sort-indicator">↕</span>';
          button.addEventListener("click", () => toggleSort(index));
          th.appendChild(button);
          th.setAttribute("aria-sort", "none");
        } else {
          th.textContent = label;
        }

        headerRow.appendChild(th);

        const filterCell = document.createElement("th");
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = "Filter";
        input.setAttribute("aria-label", "Filter " + label);
        input.addEventListener("input", () => {
          state.columnFilters[index] = normalizeWhitespace(input.value).toLowerCase();
          render();
        });
        filterCell.appendChild(input);
        filterRow.appendChild(filterCell);
      });

      updateSortIndicators();
    }

    function buildFloorplanFilter() {
      if (!floorplanOptionsContainer) return;
      floorplanOptionsContainer.innerHTML = "";

      state.floorplanOptions.forEach((floorplan, index) => {
        const id = "fe-floorplan-" + root.dataset.instanceId + "-" + index;
        const label = document.createElement("label");
        label.setAttribute("for", id);

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = floorplan;
        input.id = id;

        input.addEventListener("change", () => {
          const selected = floorplanOptionsContainer.querySelectorAll("input:checked");
          state.selectedFloorplans = Array.from(selected).map((node) => node.value);
          updateFloorplanLabel();
          render();
        });

        label.appendChild(input);
        label.appendChild(document.createTextNode(floorplan));
        floorplanOptionsContainer.appendChild(label);
      });

      updateFloorplanLabel();
    }

    function rowMatches(row) {
      if (state.globalSearch && !row.searchText.includes(state.globalSearch)) {
        return false;
      }

      if (state.selectedFloorplans.length > 0) {
        const rowFloorplans = new Set((row.floorplans ?? []).map((value) => value.toLowerCase()));
        const selected = state.selectedFloorplans.map((value) => value.toLowerCase());
        const matches = selected.some((value) => rowFloorplans.has(value));
        if (!matches) return false;
      }

      for (let i = 0; i < state.columnFilters.length; i += 1) {
        const filterValue = state.columnFilters[i];
        if (!filterValue) continue;
        const cellText = row.cells[i]?.text ?? "";
        if (!cellText.includes(filterValue)) return false;
      }

      return true;
    }

    function sortRows(rows) {
      if (state.sortColumn == null) return rows;

      const direction = state.sortDirection === "asc" ? 1 : -1;
      const index = state.sortColumn;

      return [...rows].sort((leftRow, rightRow) => {
        const left = leftRow.cells[index]?.sortText ?? "";
        const right = rightRow.cells[index]?.sortText ?? "";

        let result = 0;
        if (COLUMNS[index] === "Available from Version") {
          result = compareVersions(left, right);
        } else {
          result = left.localeCompare(right, undefined, { sensitivity: "base", numeric: true });
        }

        return result * direction;
      });
    }

    function render() {
      const filtered = state.rows.filter(rowMatches);
      const sorted = sortRows(filtered);

      const html = sorted
        .map((row) => {
          const cells = row.cells
            .map(
              (cell, cellIndex) =>
                '<td data-label="' + escapeHtml(COLUMNS[cellIndex]) + '">' + cell.html + "</td>"
            )
            .join("");
          return "<tr>" + cells + "</tr>";
        })
        .join("");

      tableBody.innerHTML = html;
      resultCount.textContent = filtered.length + " / " + state.rows.length + " rows";
    }

    function clearAllFilters() {
      state.globalSearch = "";
      state.columnFilters = COLUMNS.map(() => "");
      state.selectedFloorplans = [];
      state.sortColumn = null;
      state.sortDirection = "asc";

      if (globalSearch) globalSearch.value = "";
      Array.from(filterRow.querySelectorAll("input")).forEach((input) => {
        input.value = "";
      });
      Array.from(floorplanOptionsContainer.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
        checkbox.checked = false;
      });

      updateFloorplanLabel();
      updateSortIndicators();
      render();
    }

    globalSearch?.addEventListener("input", () => {
      state.globalSearch = normalizeWhitespace(globalSearch.value).toLowerCase();
      render();
    });

    clearFilters?.addEventListener("click", clearAllFilters);

    floorplanToggle?.addEventListener("click", () => {
      const open = !floorplanMenu.hidden;
      floorplanMenu.hidden = open;
      floorplanToggle.setAttribute("aria-expanded", String(!open));
    });

    floorplanSelectAll?.addEventListener("click", () => {
      Array.from(floorplanOptionsContainer.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
        checkbox.checked = true;
      });
      state.selectedFloorplans = [...state.floorplanOptions];
      updateFloorplanLabel();
      render();
    });

    floorplanClear?.addEventListener("click", () => {
      Array.from(floorplanOptionsContainer.querySelectorAll("input[type='checkbox']")).forEach((checkbox) => {
        checkbox.checked = false;
      });
      state.selectedFloorplans = [];
      updateFloorplanLabel();
      render();
    });

    document.addEventListener("click", (event) => {
      if (!floorplanMenu || floorplanMenu.hidden) return;
      if (floorplanMenu.contains(event.target) || floorplanToggle?.contains(event.target)) return;
      floorplanMenu.hidden = true;
      floorplanToggle?.setAttribute("aria-expanded", "false");
    });

    buildHeader();
    setStatus("Loading feature map data...");

    fetch(jsonUrl, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load feature map data (" + response.status + ")");
        }
        return response.json();
      })
      .then((payload) => {
        const rows = Array.isArray(payload?.rows) ? payload.rows : [];

        state.rows = rows.map((row) => {
          const feature = normalizeWhitespace(row?.feature ?? "");
          const floorplans = Array.isArray(row?.supportedFloorplans)
            ? row.supportedFloorplans.map((item) => normalizeWhitespace(item)).filter(Boolean)
            : [];
          const docsHtml = renderLinkList(row?.developerDocumentation);
          const docsText = normalizeWhitespace(
            (row?.developerDocumentation?.links ?? []).map((item) => item?.label ?? "").join(" ") ||
              row?.developerDocumentation?.text ||
              ""
          );
          const guidelinesHtml = renderLinkList(row?.sapFioriDesignGuidelines);
          const guidelinesText = normalizeWhitespace(
            (row?.sapFioriDesignGuidelines?.links ?? []).map((item) => item?.label ?? "").join(" ") ||
              row?.sapFioriDesignGuidelines?.text ||
              ""
          );
          const version = normalizeWhitespace(row?.availableFromVersion ?? "");

          const cells = [
            {
              html: escapeHtml(feature),
              text: feature.toLowerCase(),
              sortText: feature
            },
            {
              html: floorplans.map((value) => escapeHtml(value)).join("<br>"),
              text: floorplans.join(" ").toLowerCase(),
              sortText: floorplans.join(" ")
            },
            {
              html: docsHtml,
              text: docsText.toLowerCase(),
              sortText: docsText
            },
            {
              html: guidelinesHtml,
              text: guidelinesText.toLowerCase(),
              sortText: guidelinesText
            },
            {
              html: escapeHtml(version),
              text: version.toLowerCase(),
              sortText: version
            }
          ];

          return {
            cells,
            searchText: normalizeWhitespace(cells.map((cell) => cell.text).join(" ")),
            floorplans
          };
        });

        state.floorplanOptions = [...new Set(state.rows.flatMap((row) => row.floorplans))].sort((a, b) =>
          a.localeCompare(b, "en", { sensitivity: "base" })
        );

        buildFloorplanFilter();
        render();

        if (generatedAt) {
          generatedAt.textContent = formatGeneratedAt(payload?.meta?.generatedAt);
        }

        setStatus("");
      })
      .catch((error) => {
        tableBody.innerHTML = "";
        resultCount.textContent = "0 / 0 rows";
        setStatus(error?.message || "Failed to render feature map.");
      });
  }

  function init() {
    const roots = document.querySelectorAll("[data-fe-feature-map]");
    roots.forEach((root, index) => {
      root.dataset.instanceId = String(index + 1);
      setupFeatureMap(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
