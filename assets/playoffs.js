// Vòng Playoffs — nhánh đấu loại kép (double elimination) 8 đội, 14 trận.
// Người chơi chọn đội thắng từng trận. Đội thắng tự đi tiếp sang vòng sau,
// đội thua ở Nhánh Thắng tự rơi xuống Nhánh Thua.
(function () {
  "use strict";

  const STORAGE_KEY = "cf-pickems-playoffs-v1";

  // col = cột trong lưới 6 cột của nhánh đấu (giống bố cục Pick'Ems Valorant).
  const ROUNDS = [
    { id: "ur1", bracket: "upper", col: 1, name: "Vòng 1", points: 10 },
    { id: "ur2", bracket: "upper", col: 2, name: "Nhánh Thắng - Vòng 2", points: 15 },
    { id: "ubf", bracket: "upper", col: 3, name: "Nhánh Thắng - Chung Kết", points: 20 },
    { id: "gf", bracket: "upper", col: 6, name: "Chung Kết", points: 50 },
    { id: "lr1", bracket: "lower", col: 2, name: "Nhánh Thua - Vòng 1", points: 15 },
    { id: "lr2", bracket: "lower", col: 3, name: "Nhánh Thua - Vòng 2", points: 20 },
    { id: "lsf", bracket: "lower", col: 4, name: "Nhánh Thua - Bán Kết", points: 30 },
    { id: "lf", bracket: "lower", col: 5, name: "Nhánh Thua - Chung Kết", points: 40 },
  ];

  const team = (id) => ({ team: id });
  const winnerOf = (id) => ({ winnerOf: id });
  const loserOf = (id) => ({ loserOf: id });

  // Thứ tự mảng là thứ tự tính toán: mỗi trận chỉ phụ thuộc các trận đứng trước nó.
  const MATCHES = [
    { id: "ur1-1", round: "ur1", slots: [team(PLAYOFF_ROUND1[0][0]), team(PLAYOFF_ROUND1[0][1])] },
    { id: "ur1-2", round: "ur1", slots: [team(PLAYOFF_ROUND1[1][0]), team(PLAYOFF_ROUND1[1][1])] },
    { id: "ur1-3", round: "ur1", slots: [team(PLAYOFF_ROUND1[2][0]), team(PLAYOFF_ROUND1[2][1])] },
    { id: "ur1-4", round: "ur1", slots: [team(PLAYOFF_ROUND1[3][0]), team(PLAYOFF_ROUND1[3][1])] },
    { id: "ur2-1", round: "ur2", slots: [winnerOf("ur1-1"), winnerOf("ur1-2")] },
    { id: "ur2-2", round: "ur2", slots: [winnerOf("ur1-3"), winnerOf("ur1-4")] },
    { id: "ubf", round: "ubf", slots: [winnerOf("ur2-1"), winnerOf("ur2-2")] },
    { id: "lr1-1", round: "lr1", slots: [loserOf("ur1-1"), loserOf("ur1-2")] },
    { id: "lr1-2", round: "lr1", slots: [loserOf("ur1-3"), loserOf("ur1-4")] },
    // Ghép chéo đội thua Nhánh Thắng Vòng 2 để tránh tái đấu sớm.
    { id: "lr2-1", round: "lr2", slots: [loserOf("ur2-2"), winnerOf("lr1-1")] },
    { id: "lr2-2", round: "lr2", slots: [loserOf("ur2-1"), winnerOf("lr1-2")] },
    { id: "lsf", round: "lsf", slots: [winnerOf("lr2-1"), winnerOf("lr2-2")] },
    { id: "lf", round: "lf", slots: [loserOf("ubf"), winnerOf("lsf")] },
    { id: "gf", round: "gf", slots: [winnerOf("ubf"), winnerOf("lf")] },
  ];

  const ROUND_BY_ID = Object.fromEntries(ROUNDS.map((r) => [r.id, r]));
  const TEAM_BY_ID = Object.fromEntries(GROUPS.flatMap((g) => g.teams).map((t) => [t.id, t]));
  const MAX_POINTS = MATCHES.reduce((sum, m) => sum + ROUND_BY_ID[m.round].points, 0);

  // ---------- Storage ----------
  function loadPicks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed.picks === "object" && parsed.picks ? parsed.picks : {};
    } catch (e) {
      return {};
    }
  }

  function savePicks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ picks }));
    } catch (e) {
      /* ignore persistence errors (e.g. storage disabled) */
    }
  }

  let picks = loadPicks();

  // ---------- Bracket resolution ----------
  // Returns { [matchId]: { teams: [idA|null, idB|null], winner, loser } } and drops
  // picks that are no longer possible (e.g. the picked team lost an earlier match).
  function resolve() {
    const result = {};
    let changed = false;
    MATCHES.forEach((m) => {
      const teams = m.slots.map((src) => {
        if (src.team) return src.team;
        if (src.winnerOf) return result[src.winnerOf].winner;
        return result[src.loserOf].loser;
      });
      let winner = picks[m.id] || null;
      if (winner && (teams.includes(null) || !teams.includes(winner))) {
        delete picks[m.id];
        winner = null;
        changed = true;
      }
      const loser = winner ? teams.find((t) => t !== winner) : null;
      result[m.id] = { teams, winner, loser };
    });
    if (changed) savePicks();
    return result;
  }

  // ---------- Rendering ----------
  const bracketEl = document.getElementById("bracket");

  function teamRow(teamId, matchId, res) {
    if (!teamId) {
      return `<div class="match-team tbd"><span class="match-logo empty"></span><span class="match-name">Chờ xác định</span></div>`;
    }
    const t = TEAM_BY_ID[teamId];
    const picked = res.winner === teamId;
    const lost = res.winner && !picked;
    const cls = ["match-team", picked ? "picked" : "", lost ? "lost" : ""].join(" ").trim();
    const logoCls = t.lightBg ? "match-logo light-bg" : "match-logo";
    const ready = !res.teams.includes(null);
    return `<button type="button" class="${cls}" data-match="${matchId}" data-team="${teamId}" title="${t.name}" ${ready ? "" : "disabled"}>
      <span class="${logoCls}"><img src="${t.logo}" alt="" loading="lazy" /></span>
      <span class="match-name">${t.short}</span>
      ${picked ? '<span class="match-star">★</span>' : ""}
    </button>`;
  }

  function matchCard(m, resolved) {
    const res = resolved[m.id];
    return `<div class="match ${res.winner ? "decided" : ""}" id="match-${m.id}">
      ${teamRow(res.teams[0], m.id, res)}
      ${teamRow(res.teams[1], m.id, res)}
    </div>`;
  }

  function roundColumn(round, resolved) {
    const matches = MATCHES.filter((m) => m.round === round.id);
    return `<div class="bracket-col round-${round.id}" style="grid-column:${round.col}">
      <div class="round-head">
        <div class="round-name">${round.name}</div>
        <div class="round-points">${round.points}đ / lựa chọn</div>
      </div>
      <div class="round-matches">${matches.map((m) => matchCard(m, resolved)).join("")}</div>
    </div>`;
  }

  function section(bracket, title, resolved) {
    const cols = ROUNDS.filter((r) => r.bracket === bracket).map((r) => roundColumn(r, resolved)).join("");
    return `<div class="bracket-section ${bracket}">
      <div class="bracket-section-title">${title}</div>
      <div class="bracket-grid">${cols}</div>
    </div>`;
  }

  function render() {
    const resolved = resolve();
    const champion = resolved.gf.winner;
    bracketEl.innerHTML = `
      ${section("upper", "Nhánh Thắng", resolved)}
      ${section("lower", "Nhánh Thua", resolved)}
      <svg class="bracket-lines" aria-hidden="true"></svg>`;

    if (champion) {
      const t = TEAM_BY_ID[champion];
      bracketEl.querySelector(".round-gf .round-matches").insertAdjacentHTML(
        "beforeend",
        `<div class="champion-badge">🏆 Nhà Vô Địch: <strong>${t.name}</strong></div>`
      );
    }

    drawLines();
    updateFooter();
  }

  // Connector lines from each match to the match its winner advances to.
  function drawLines() {
    const svg = bracketEl.querySelector(".bracket-lines");
    if (!svg || !bracketEl.offsetParent) return; // hidden tab: nothing to measure
    const box = bracketEl.getBoundingClientRect();
    svg.setAttribute("width", box.width);
    svg.setAttribute("height", box.height);
    const paths = [];
    MATCHES.forEach((m) => {
      m.slots.forEach((src) => {
        if (!src.winnerOf) return;
        const from = document.getElementById(`match-${src.winnerOf}`).getBoundingClientRect();
        const to = document.getElementById(`match-${m.id}`).getBoundingClientRect();
        const x1 = from.right - box.left;
        const y1 = from.top + from.height / 2 - box.top;
        const x2 = to.left - box.left;
        const y2 = to.top + to.height / 2 - box.top;
        const midX = x1 + Math.min(24, (x2 - x1) / 2);
        const done = !!picks[src.winnerOf];
        paths.push(`<path class="${done ? "done" : ""}" d="M${x1},${y1} H${midX} V${y2} H${x2}" />`);
      });
    });
    svg.innerHTML = paths.join("");
  }

  // ---------- Footer ----------
  function updateFooter() {
    const filled = MATCHES.filter((m) => picks[m.id]).length;
    const total = MATCHES.length;
    const pct = Math.round((filled / total) * 100);
    const footer = document.getElementById("playoffs-footer");
    footer.classList.toggle("done", filled === total);
    document.getElementById("pf-progress-text").textContent =
      filled === total ? "✓ Đã hoàn thành tất cả lựa chọn!" : `${filled} / ${total} lựa chọn đã hoàn thành`;
    document.getElementById("pf-progress-fill").style.width = `${pct}%`;
    document.getElementById("pf-progress-pct").textContent = `${pct}%`;
    document.getElementById("pf-share-btn").disabled = filled !== total;
  }

  // ---------- Share card ----------
  function fillShare(container) {
    const resolved = resolve();
    container.classList.add("share-playoffs");
    const champ = TEAM_BY_ID[resolved.gf.winner];
    const rows = (m) => {
      const res = resolved[m.id];
      const w = TEAM_BY_ID[res.winner];
      const l = TEAM_BY_ID[res.loser];
      return `<div class="share-team-row advance">
        <img class="share-team-logo" src="${w.logo}" alt="" />
        <span class="share-team-name">${w.short}</span>
        <span class="share-vs">thắng ${l.short}</span>
      </div>`;
    };
    const order = ["ur1", "ur2", "ubf", "lr1", "lr2", "lsf", "lf", "gf"];
    container.innerHTML = `
      <div class="share-champion">
        <img class="share-champion-logo" src="${champ.logo}" alt="" />
        <div>
          <div class="share-champion-label">🏆 Nhà Vô Địch</div>
          <div class="share-champion-name">${champ.name}</div>
        </div>
      </div>
      ${order
        .map((rid) => {
          const r = ROUND_BY_ID[rid];
          const ms = MATCHES.filter((m) => m.round === rid);
          return `<div class="share-group"><div class="share-group-title">${r.name} <span class="share-round-pts">${r.points}đ</span></div>${ms.map(rows).join("")}</div>`;
        })
        .join("")}`;
  }

  // ---------- Events ----------
  bracketEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button.match-team");
    if (!btn || btn.disabled) return;
    if (picks[btn.dataset.match] === btn.dataset.team) return;
    picks[btn.dataset.match] = btn.dataset.team;
    savePicks();
    render(); // resolve() clears downstream picks that are no longer possible
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (document.body.dataset.tab !== "playoffs") return;
    if (!confirm("Xóa toàn bộ dự đoán Playoffs của bạn?")) return;
    picks = {};
    savePicks();
    render();
  });

  document.getElementById("pf-share-btn").addEventListener("click", () =>
    window.HoaLuan.openShareModal({
      modalTitle: "Chia Sẻ Lựa Chọn Playoffs",
      intro: "Ảnh tổng hợp đủ 14 trận Playoffs bạn đã chọn — tải về để chia sẻ.",
      cardTitle: "Lựa Chọn Playoffs",
      filename: "hoa-luan-du-doan-playoffs.png",
      fill: fillShare,
    })
  );

  document.addEventListener("hl:tabchange", (e) => {
    if (e.detail.tab === "playoffs") drawLines();
  });
  window.addEventListener("resize", drawLines);
  if (document.fonts) document.fonts.ready.then(drawLines);

  document.getElementById("playoffs-max").textContent = `${MAX_POINTS}đ`;
  render();
})();
