(function () {
  "use strict";

  const STORAGE_KEY = "cf-pickems-state-v1";
  const SLOTS = GROUPS[0].teams.length; // 4
  const TOTAL_SLOTS = GROUPS.length * SLOTS; // 16

  const sortableInstances = [];

  // ---------- Storage ----------
  // state.picks[groupId] = array of length SLOTS, each entry is a teamId or null
  function emptyState() {
    const picks = {};
    GROUPS.forEach((g) => {
      picks[g.id] = new Array(SLOTS).fill(null);
    });
    return { picks };
  }

  function loadState() {
    const base = emptyState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      GROUPS.forEach((g) => {
        const stored = parsed.picks && parsed.picks[g.id];
        if (!Array.isArray(stored)) return;
        const validIds = g.teams.map((t) => t.id);
        const used = new Set();
        for (let i = 0; i < SLOTS; i++) {
          const teamId = stored[i];
          if (teamId && validIds.includes(teamId) && !used.has(teamId)) {
            base.picks[g.id][i] = teamId;
            used.add(teamId);
          }
        }
      });
    } catch (e) {
      /* ignore malformed storage */
    }
    return base;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore persistence errors (e.g. storage disabled) */
    }
  }

  let state = loadState();

  // ---------- Helpers ----------
  function teamsOf(groupId) {
    return GROUPS.find((g) => g.id === groupId).teams;
  }

  function teamById(groupId, teamId) {
    return teamsOf(groupId).find((t) => t.id === teamId);
  }

  function poolTeamsFor(groupId) {
    const placed = state.picks[groupId];
    return teamsOf(groupId).filter((t) => placed.indexOf(t.id) === -1);
  }

  // Ranking shown in the cards: the official result once locked, otherwise the user's picks.
  function rankingFor(groupId) {
    return RESULTS_LOCKED ? FINAL_STANDINGS[groupId] : state.picks[groupId];
  }

  // ---------- Chip rendering ----------
  function makeChip(team) {
    const li = document.createElement("li");
    li.className = "team-chip";
    li.dataset.teamId = team.id;
    const logoClass = team.lightBg ? "team-logo light-bg" : "team-logo";
    li.innerHTML = `<span class="${logoClass}"><img src="${team.logo}" alt="${team.name}" loading="lazy" /></span><span class="team-name">${team.name}</span>`;
    return li;
  }

  function makeResultChip(team, rankIndex) {
    const li = makeChip(team);
    const advanced = rankIndex < ADVANCE_COUNT;
    li.classList.add("locked", advanced ? "advanced" : "out");
    // Stack the name and its result tag so long names get the full chip width.
    const info = document.createElement("span");
    info.className = "team-info";
    info.appendChild(li.querySelector(".team-name"));
    info.insertAdjacentHTML(
      "beforeend",
      `<span class="result-tag">${advanced ? "▲ Vào Playoffs" : "✕ Dừng Bước"}</span>`
    );
    li.appendChild(info);
    return li;
  }

  // ---------- Build a group card ----------
  function buildGroupCard(group) {
    const card = document.createElement("div");
    card.className = "group-card";

    const advanceRows = [];
    const eliminatedRows = [];
    for (let i = 0; i < SLOTS; i++) {
      const row = `
        <div class="slot-row" data-rank="${i + 1}">
          <span class="slot-rank"><span class="slot-rank-badge">${i + 1}</span></span>
          <ul class="slot-list" id="slot-${group.id}-${i}" data-group="${group.id}" data-index="${i}"></ul>
        </div>`;
      if (i < ADVANCE_COUNT) advanceRows.push(row);
      else eliminatedRows.push(row);
    }

    card.innerHTML = `
      <div class="group-card-header">
        <h2>${group.name}</h2>
        <span class="group-status-tag" id="tag-${group.id}"></span>
      </div>
      <div class="standings-zone">
        <div class="rank-zone advance-zone">
          <div class="zone-label"><span class="zone-dot"></span>ĐI TIẾP</div>
          ${advanceRows.join("")}
        </div>
        <div class="rank-zone eliminated-zone">
          <div class="zone-label"><span class="zone-dot"></span>BỊ LOẠI</div>
          ${eliminatedRows.join("")}
        </div>
      </div>
      ${
        RESULTS_LOCKED
          ? ""
          : `<div class="pool-section">
        <div class="section-label">CHƯA XẾP HẠNG</div>
        <ul class="pool-list" id="pool-${group.id}"></ul>
      </div>`
      }
    `;

    if (RESULTS_LOCKED) {
      card.classList.add("final");
      FINAL_STANDINGS[group.id].forEach((teamId, idx) => {
        card.querySelector(`#slot-${group.id}-${idx}`).appendChild(makeResultChip(teamById(group.id, teamId), idx));
      });
      return card;
    }

    const poolEl = card.querySelector(`#pool-${group.id}`);
    poolTeamsFor(group.id).forEach((team) => poolEl.appendChild(makeChip(team)));

    state.picks[group.id].forEach((teamId, idx) => {
      if (!teamId) return;
      const team = teamById(group.id, teamId);
      if (team) card.querySelector(`#slot-${group.id}-${idx}`).appendChild(makeChip(team));
    });

    return card;
  }

  // ---------- Sync DOM -> state ----------
  function syncGroupState(groupId) {
    const picks = new Array(SLOTS).fill(null);
    for (let i = 0; i < SLOTS; i++) {
      const slotEl = document.getElementById(`slot-${groupId}-${i}`);
      const chip = slotEl.firstElementChild;
      picks[i] = chip ? chip.dataset.teamId : null;
    }
    state.picks[groupId] = picks;
    saveState();
    updateGroupTag(groupId);
    updateFooterProgress();
  }

  function updateGroupTag(groupId) {
    const tagEl = document.getElementById(`tag-${groupId}`);
    const placed = state.picks[groupId].filter(Boolean);
    tagEl.className = "group-status-tag";
    if (RESULTS_LOCKED) {
      tagEl.textContent = "🔒 Chung Cuộc";
      tagEl.classList.add("complete");
    } else if (placed.length === SLOTS) {
      tagEl.textContent = "Đã Xếp Hạng";
      tagEl.classList.add("complete");
    } else {
      tagEl.textContent = "";
    }
  }

  function updateFooterProgress() {
    if (RESULTS_LOCKED) {
      document.querySelector(".progress-footer").classList.add("done", "locked");
      document.getElementById("progress-text").textContent = "🔒 Vòng Bảng đã kết thúc — Kết quả chung cuộc";
      document.getElementById("share-btn").disabled = false;
      return;
    }
    const filled = GROUPS.reduce((sum, g) => sum + state.picks[g.id].filter(Boolean).length, 0);
    const pct = Math.round((filled / TOTAL_SLOTS) * 100);
    const footer = document.querySelector(".progress-footer");
    footer.classList.toggle("done", filled === TOTAL_SLOTS);
    document.getElementById("progress-text").textContent =
      filled === TOTAL_SLOTS ? "✓ Đã hoàn thành tất cả lựa chọn!" : `${filled} / ${TOTAL_SLOTS} lựa chọn đã hoàn thành`;
    document.getElementById("progress-fill").style.width = `${pct}%`;
    document.getElementById("progress-pct").textContent = `${pct}%`;
    document.getElementById("share-btn").disabled = filled !== TOTAL_SLOTS;
  }

  // ---------- Sortable wiring ----------
  function destroySortables() {
    sortableInstances.forEach((s) => s.destroy());
    sortableInstances.length = 0;
  }

  function wireSortables() {
    GROUPS.forEach((group) => {
      const groupName = `grp-${group.id}`;
      const poolEl = document.getElementById(`pool-${group.id}`);

      sortableInstances.push(
        new Sortable(poolEl, {
          group: groupName,
          animation: 150,
          ghostClass: "sortable-ghost",
          dragClass: "sortable-drag",
          onEnd: () => syncGroupState(group.id),
        })
      );

      for (let i = 0; i < SLOTS; i++) {
        const slotEl = document.getElementById(`slot-${group.id}-${i}`);
        sortableInstances.push(
          new Sortable(slotEl, {
            group: groupName,
            animation: 150,
            ghostClass: "sortable-ghost",
            dragClass: "sortable-drag",
            onAdd: (evt) => {
              // A slot holds exactly one team: bump any previous occupant back to the pool.
              Array.from(slotEl.children).forEach((child) => {
                if (child !== evt.item) poolEl.appendChild(child);
              });
            },
            onEnd: () => syncGroupState(group.id),
          })
        );
      }
    });
  }

  // ---------- Full render ----------
  function renderAll() {
    destroySortables();
    const grid = document.getElementById("groups-grid");
    grid.innerHTML = "";
    GROUPS.forEach((group) => grid.appendChild(buildGroupCard(group)));
    if (!RESULTS_LOCKED) wireSortables();
    GROUPS.forEach((group) => updateGroupTag(group.id));
    updateFooterProgress();
  }

  // ---------- Reset ----------
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Xóa toàn bộ dự đoán của bạn?")) return;
    GROUPS.forEach((g) => {
      state.picks[g.id] = new Array(SLOTS).fill(null);
    });
    saveState();
    renderAll();
  });

  // ---------- Rewards modal ----------
  const rewardsBackdrop = document.getElementById("rewards-backdrop");
  const openRewards = () => rewardsBackdrop.classList.remove("hidden");
  const closeRewards = () => rewardsBackdrop.classList.add("hidden");

  document.getElementById("rewards-btn").addEventListener("click", openRewards);
  document.getElementById("rewards-close").addEventListener("click", closeRewards);
  rewardsBackdrop.addEventListener("click", (e) => {
    if (e.target === rewardsBackdrop) closeRewards();
  });

  // ---------- Share results modal ----------
  const shareBackdrop = document.getElementById("share-backdrop");
  const shareGroupsEl = document.getElementById("share-groups");

  function buildShareCard() {
    shareGroupsEl.innerHTML = "";
    GROUPS.forEach((group) => {
      const picks = rankingFor(group.id);
      const box = document.createElement("div");
      box.className = "share-group";
      const rowsHtml = picks
        .map((teamId, idx) => {
          const status = idx < ADVANCE_COUNT ? "advance" : "eliminated";
          if (!teamId) {
            return `<div class="share-team-row ${status} empty"><span class="share-rank">${idx + 1}</span><span class="share-team-name">Chưa chọn</span></div>`;
          }
          const team = teamById(group.id, teamId);
          return `<div class="share-team-row ${status}"><span class="share-rank">${idx + 1}</span><img class="share-team-logo" src="${team.logo}" alt="" /><span class="share-team-name">${team.name}</span></div>`;
        })
        .join("");
      box.innerHTML = `<div class="share-group-title">${group.name}</div>${rowsHtml}`;
      shareGroupsEl.appendChild(box);
    });
  }

  const openShare = () => {
    buildShareCard();
    shareBackdrop.classList.remove("hidden");
  };
  const closeShare = () => shareBackdrop.classList.add("hidden");

  document.getElementById("share-btn").addEventListener("click", openShare);
  document.getElementById("share-close").addEventListener("click", closeShare);
  shareBackdrop.addEventListener("click", (e) => {
    if (e.target === shareBackdrop) closeShare();
  });

  document.getElementById("download-share-btn").addEventListener("click", () => {
    const btn = document.getElementById("download-share-btn");
    const card = document.getElementById("share-card");
    btn.disabled = true;
    btn.textContent = "Đang xử lý…";
    html2canvas(card, { backgroundColor: null, scale: 2 })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = btn.dataset.filename || "hoa-luan-du-doan-vong-bang.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      })
      .catch(() => {
        alert("Có lỗi khi tạo ảnh, vui lòng thử lại.");
      })
      .finally(() => {
        btn.disabled = false;
        btn.textContent = "⬇️ Tải Ảnh Về";
      });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeRewards();
      closeShare();
    }
  });

  // ---------- Locked (final results) chrome ----------
  function applyLockedChrome() {
    document.body.classList.add("results-locked");
    document.getElementById("reset-btn").remove();
    document.querySelector(".page-title").textContent = "Kết Quả Vòng Bảng";
    document.querySelector(".mode-hint").innerHTML =
      `Vòng Bảng đã khép lại — dưới đây là <strong>bảng xếp hạng chung cuộc</strong> của 4 bảng đấu.
      Khung <span class="hint-dot advance"></span><strong>vàng (hạng 1–2)</strong> là 2 đội giành vé vào Playoffs, khung <span class="hint-dot eliminated"></span><strong>xám (hạng 3–4)</strong> là 2 đội dừng bước.`;
    document.querySelector(".share-card-title").textContent = "Kết Quả Vòng Bảng";
    document.getElementById("share-title").textContent = "Chia Sẻ Kết Quả Vòng Bảng";
    document.getElementById("share-btn").title = "Tải ảnh bảng xếp hạng chung cuộc";
    document.getElementById("download-share-btn").dataset.filename = "hoa-luan-ket-qua-vong-bang.png";
  }

  // ---------- Init ----------
  if (RESULTS_LOCKED) applyLockedChrome();
  renderAll();
})();
