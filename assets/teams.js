// Dữ liệu đội thi đấu — Hỏa Luận Crossfire: Legends Fall Championship 2026.
// Mỗi bảng có đúng 4 đội, top ADVANCE_COUNT đội đi tiếp vào Playoffs.

const ADVANCE_COUNT = 2;

// Kết quả chung cuộc vòng bảng (teamId theo thứ tự hạng 1 → 4).
// Khi RESULTS_LOCKED = true, trang khóa kéo thả và hiển thị bảng xếp hạng này.
const RESULTS_LOCKED = true;
const FINAL_STANDINGS = {
  A: ["A3", "A2", "A1", "A4"], // HGM, 6677, VAR, CCU
  B: ["B2", "B4", "B3", "B1"], // GES, GOD, NF, VG
  C: ["C1", "C4", "C2", "C3"], // EVO, GO, GS, JAV
  D: ["D1", "D4", "D2", "D3"], // NN, RL, LW, RLF
};

const GROUPS = [
  {
    id: "A",
    name: "Bảng A",
    teams: [
      { id: "A1", name: "Variation", short: "VAR", logo: "assets/img/teams/VAR.png" },
      { id: "A2", name: "6677", short: "6677", logo: "assets/img/teams/6677.png" },
      { id: "A3", name: "Hạt Giống Gaming", short: "HGM", logo: "assets/img/teams/HGM.png" },
      { id: "A4", name: "Circus United", short: "CCU", logo: "assets/img/teams/CCU.png" },
    ],
  },
  {
    id: "B",
    name: "Bảng B",
    teams: [
      { id: "B1", name: "VN Glory", short: "VG", logo: "assets/img/teams/VG.png" },
      { id: "B2", name: "Gà Esport", short: "GE", logo: "assets/img/teams/GE.png" },
      { id: "B3", name: "No Fear", short: "NF", logo: "assets/img/teams/NF.png" },
      { id: "B4", name: "God Empire", short: "GOD", logo: "assets/img/teams/GOD.png" },
    ],
  },
  {
    id: "C",
    name: "Bảng C",
    teams: [
      { id: "C1", name: "Evolution", short: "EVO", logo: "assets/img/teams/EVO.png" },
      { id: "C2", name: "Golden Stars", short: "GS", logo: "assets/img/teams/GS.png" },
      { id: "C3", name: "Just A Vibe", short: "JAV", logo: "assets/img/teams/JAV.png" },
      { id: "C4", name: "Gen Over", short: "GO", logo: "assets/img/teams/GO.png", lightBg: true },
    ],
  },
  {
    id: "D",
    name: "Bảng D",
    teams: [
      { id: "D1", name: "NoName", short: "NN", logo: "assets/img/teams/NN.png" },
      { id: "D2", name: "Legend Warrior", short: "LW", logo: "assets/img/teams/LW.png" },
      { id: "D3", name: "Rapid LoFi", short: "RLF", logo: "assets/img/teams/RLF.png" },
      { id: "D4", name: "Royal Legends", short: "RL", logo: "assets/img/teams/RL.png" },
    ],
  },
];
