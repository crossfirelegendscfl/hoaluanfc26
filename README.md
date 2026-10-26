# Hỏa Luận — Crossfire: Legends Fall Championship 2026

Trang web dự đoán vòng bảng (pick'ems) cho giải Crossfire: Legends Fall Championship 2026, lấy cảm hứng giao diện từ Pick'Ems Valorant Champions, phối theo tông lửa/vàng kim của key visual giải đấu. Kéo đội từ danh sách "Chưa Xếp Hạng" lên 4 vị trí thứ hạng cố định (1–4) để dự đoán kết quả vòng bảng — vị trí 1–2 (khung vàng) là đội đi tiếp, vị trí 3–4 (khung xám tro) là đội bị loại.

Trang web **tĩnh hoàn toàn** (HTML/CSS/JS thuần, không cần build step), dữ liệu lưu trong `localStorage` của trình duyệt — không cần tài khoản hay server.

## Cấu trúc

- `index.html` — khung giao diện (hero banner + lưới bảng đấu)
- `assets/style.css` — theme lửa/vàng kim, font tùy chỉnh, toàn bộ style
- `assets/fonts/` — font "GS3 Agency FB" (Regular/Bold) dùng cho tiêu đề, nút bấm, nhãn, tên đội
- `assets/img/` — key visual (`kv.jpg`, nén còn ~400KB từ bản gốc 4K), logo giải (`logo-crossfire-legends.png`, `logo-hoa-tuyen-huyen-thoai.png`, đều nền trong suốt) hiển thị trên hero banner, và ảnh quà thưởng (`reward-jacket.png`, `reward-diamonds.png`) dùng trong popup "Xem Thưởng Giai Đoạn"
- `assets/teams.js` — dữ liệu thật 4 bảng đấu (A–D), mỗi bảng 4 đội (tên, mã ngắn, đường dẫn logo), cùng hằng số `ADVANCE_COUNT`, kết quả chung cuộc `FINAL_STANDINGS` + công tắc `RESULTS_LOCKED` (khóa tab Vòng Bảng) và cặp đấu `PLAYOFF_ROUND1`
- `assets/img/teams/` — logo 16 đội, đã tách nền trong suốt (PNG)
- `assets/app.js` — kéo thả (dùng [SortableJS](https://github.com/SortableJS/Sortable) qua CDN) vào 4 ô thứ hạng cố định, lưu trạng thái, thanh tiến độ
- `assets/playoffs.js` — tab **Playoffs**: nhánh đấu loại kép 8 đội / 14 trận (Nhánh Thắng, Nhánh Thua, Chung Kết). Nhấp chọn đội thắng từng trận; đội thua Nhánh Thắng tự rơi xuống Nhánh Thua, đổi lựa chọn vòng trước sẽ xóa các lựa chọn phía sau không còn hợp lệ. Điểm mỗi lựa chọn đúng theo vòng: Vòng 1 10đ, Nhánh Thắng Vòng 2 15đ, Nhánh Thắng Chung Kết 20đ, Nhánh Thua Vòng 1 15đ, Vòng 2 20đ, Bán Kết 30đ, Chung Kết 40đ, Chung Kết tổng 50đ (tối đa 280đ). Cặp đấu Vòng 1 nằm trong `PLAYOFF_ROUND1` ở `assets/teams.js` (đang tạm ghép chéo Nhất/Nhì bảng).
- `assets/scoring.js` — luật tính điểm (16đ đi tiếp + 2đ bonus đúng thứ hạng, tối đa 40đ/bảng). File này **chưa được gắn vào giao diện** (hiện tại trang chỉ tập trung vào việc thu thập dự đoán) — giữ lại làm tham khảo khi cần bật tính năng chấm điểm/nhập kết quả thực tế sau này.

## Thay key visual (KV) / logo của giải

Hero banner dùng `assets/img/kv.jpg` làm nền (xem rule `.hero-bg` trong [`assets/style.css`](assets/style.css)), phủ thêm gradient tối (`.hero-overlay`) để chữ luôn dễ đọc. Logo hiển thị ở góc trên hero là `.hero-logo-cfl` (logo CROSSFIRE LEGENDS) và `.hero-logo-htht` (logo "Hỏa Tuyến Huyền Thoại") — cả hai đều là PNG nền trong suốt.

Khi có KV/logo bản mới: thay trực tiếp file trong `assets/img/` (giữ nguyên tên) hoặc đổi đường dẫn trong `.hero-bg` / thẻ `<img>` tương ứng trong `index.html`. Nếu ảnh KV gốc rất nặng (file 4K thường vài chục MB), nên nén/resize xuống ~1920–2000px chiều ngang trước khi đưa vào repo để trang tải nhanh.

## Luật tính điểm (tham khảo, sẽ dùng khi bật lại tính năng chấm điểm)

Với mỗi bảng 4 đội, top 2 đi tiếp:

- Dự đoán đúng đội đi tiếp (đội đó thực sự vào top 2 **và** bạn xếp nó vào 1 trong 2 vị trí đầu): **+16 điểm**.
- Dự đoán đúng đội **không** đi tiếp: **+0 điểm** (không có điểm cho việc đoán đúng đội bị loại).
- Xếp đúng chính xác thứ hạng (vị trí 1–4) của đội: **+2 điểm bonus**, áp dụng cho mọi vị trí kể cả đội không đi tiếp.
- Tổng tối đa 1 bảng: `2 × 16 + 4 × 2 = 40 điểm`. Tổng tối đa toàn giải (4 bảng): `160 điểm`.

## Quà thưởng giai đoạn

Nút **"Xem Thưởng Giai Đoạn"** cạnh tiêu đề mở popup liệt kê quà thưởng theo 4 mức (TOP 1, TOP 2, TOP 3–5, TOP 6–10). Nội dung quà và ảnh nằm trực tiếp trong `index.html` (khối `#rewards-backdrop`) — sửa text hoặc thay ảnh trong `assets/img/` khi cần cập nhật mức thưởng.

## Cập nhật dữ liệu đội

Mở [`assets/teams.js`](assets/teams.js), mỗi đội có `name`, `short` (mã viết tắt) và `logo` (đường dẫn ảnh trong `assets/img/teams/`). Nếu số bảng / số đội mỗi bảng / số đội đi tiếp khác với 4 bảng × 4 đội × top 2, chỉnh thêm hằng số `ADVANCE_COUNT` và cấu trúc `GROUPS` tương ứng (lưu ý `assets/app.js` hiện giả định mọi bảng có cùng số đội như bảng đầu tiên).

Logo đội hiển thị dạng tròn (`.team-logo`, `object-fit: contain` trên nền tối) nên chấp nhận logo vuông/dọc bất kỳ mà không bị crop mất chi tiết. Khi thay logo mới, nếu ảnh có nền trắng/đen/xám phẳng, nên tách nền trong suốt trước khi đưa vào `assets/img/teams/` để tránh viền hình chữ nhật quanh logo.

## Chạy thử local

Không cần cài đặt gì — mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy một static server bất kỳ (vd. VS Code Live Server) ở thư mục gốc.

## Deploy GitHub Pages

Repo đã có sẵn workflow `.github/workflows/deploy.yml` dùng GitHub Actions để deploy tĩnh (không cần build):

1. Tạo repo trên GitHub, push code lên nhánh `main`.
2. Vào **Settings → Pages**, ở mục **Build and deployment → Source**, chọn **GitHub Actions**.
3. Push lên `main` (hoặc chạy workflow thủ công) — trang sẽ tự deploy lên `https://<username>.github.io/<repo>/`.
