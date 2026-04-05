# Quy trình Frontend — App user (Web mobile-first, bám Figma)

## Trạng thái triển khai (cập nhật theo tiến độ)

- **Đã có:** userflow `Đăng nhập / Đăng ký` → **`/profiles`** → **`/browse`** (`GET /home`), **bottom nav** (`/browse`, `/new`, `/search`), **`GET /catalog/new-hot`**, **`GET /catalog/search`**. Kiểm tra DB: `npm run db:profiles`.
- **Phase 8 (đã bổ sung):** `manifest.json` + `public/sw.js` (đăng ký production), **lazy route** + `PageFallback`, **HomeSkeleton** khi chờ `/home`, token `:root` + tap target tối thiểu; Figma: so từng frame vẫn là việc tay khi có file Figma.
- **Tiếp theo (tuỳ chọn):** chỉnh pixel theo Figma, thêm skeleton cho từng màn (search, detail), `loading="lazy"` ảnh toàn app.
- **Đã bổ sung:** `/content/:id` (phim + similar), `/series/:id` (tập), `/watch` gọi `playback/start`, `progress`, `complete` + resume từ `positionSec`.
- **Đã bổ sung:** Home có “Tiếp tục xem” và “Gần đây” (lấy từ `/history/continue`, `/history/recent`); thêm trang `/my-list` và gắn vào bottom nav.
- **Đã bổ sung:** trang `/downloads` (UI) dùng `GET /downloads` để hiển thị hàng download + badge trạng thái.
- **Đã bổ sung:** trang `/notifications` (UI) dùng `GET /notifications`, có nút `Đã đọc` và `Đánh dấu đã đọc`.
- **Đã bổ sung:** trang `/settings` (UI) dùng `GET /settings/sections` + các `PUT` nhóm settings.

Mục tiêu: một **client web** (CRA + React 18 + React Router 6 + MUI 5 + Sass) trải nghiệm gần **Figma prototype**, gọi API đã có (`docs/API_MATRIX_V2.md`). Làm **theo slice dọc** (màn + API + state), không tách “xong hết UI rồi mới bám Figma”.

---

## Nguyên tắc

| Nguyên tắc | Ghi chú |
|------------|---------|
| **Mobile-first** | Breakpoint chính: ~360–430px width; scale lên tablet/desktop sau. |
| **Figma song song** | Mỗi slice: mở frame tương ứng → token/spacing → component → nối API → so lại 1 lần. |
| **Design tokens trước** | Màu, typography, spacing, radius, shadow lấy từ Figma → CSS variables hoặc `theme` MUI — không hard-code rải rác. |
| **`profileId` mọi nơi** | Sau khi chọn profile, mọi request cần profile (home, catalog, my-list, playback…) gửi `profileId` đúng query/body. |
| **Auth header** | Giữ convention `token: Bearer <accessToken>` như backend. |
| **Không đụng admin** | `admin/` chỉ CMS; mọi app user nằm trong `client/`. |

---

## Cấu trúc đề xuất (trong `client/src`)

Tạo dần khi làm từng phase, không cần scaffold hết ngày đầu:

```
src/
  theme/           # MUI theme + tokens (hoặc theme.js gốc)
  styles/        # global, variables.scss
  api/           # axios instance + helpers (baseURL, token inject)
  hooks/         # useProfile, useAuthHeaders, …
  layouts/       # Shell mobile (header, bottom nav, safe area)
  pages/         # màn theo route
  components/    # shared: ContentCard, Rail, …
  contexts/      # ProfileContext (profile đang chọn) — có thể gộp AuthContext
```

---

## Phase 0 — Chuẩn bị (0.5–1 ngày)

1. **Export từ Figma:** màu chính, font/size, grid/spacing 8px (hoặc theo file), bo góc, icon (SVG hoặc bộ MUI gần nhất).
2. **Thiết lập token:** `styles/_variables.scss` + `ThemeProvider` MUI (override palette, typography, shape).
3. **API client:** một `axios` instance (`baseURL: ''`, proxy CRA → `5000`), interceptor gắn `token` từ `localStorage` / context.
4. **Quy ước route:** bảng URL → màn (xem Phase 2–3); đặt tên route giống Figma flow để dễ đối chiếu.

**Deliverable:** app chạy, login/register vẫn hoạt động; theme áp được 1–2 màn test.

---

## Phase 1 — Auth & onboarding (đã có — refactor + khớp Figma)

- **Màn:** Login, Register (và splash nếu Figma có).
- **API:** `POST /auth/login`, `POST /auth/register`.
- **Việc làm:** layout/spacing theo Figma; lỗi hiển thị rõ; sau login → **không** vào Home ngay nếu Figma yêu cầu **chọn profile** (chuyển flow sang Phase 2).

**Deliverable:** auth nhìn đúng thiết kế; redirect logic thống nhất với Phase 2.

---

## Phase 2 — Profile “Who’s watching?”

- **Màn:** danh sách profile, tạo/sửa/xóa (tối đa 5), chọn profile mặc định.
- **API:** `GET/POST/PUT/DELETE /profiles`, `POST /profiles/:id/select`.
- **State:** `ProfileContext` (hoặc mở rộng Auth): lưu `currentProfileId` (localStorage) để F5 không mất.

**Deliverable:** sau login → chọn profile → vào shell app; mọi API sau có `profileId`.

---

## Phase 3 — Shell app + Home

- **Layout:** khung mobile: header (logo, avatar), **bottom navigation** (hoặc tab theo Figma: Home, New & Hot, Search, Downloads, Profile…).
- **Màn Home:** hero + rails (`GET /home?profileId=&type=&genre=`).
- **Component:** `HeroBanner`, `ContentRail`, `ContentCard` (poster, title).

**Deliverable:** home đọc đúng feed; scroll mượt; khớp spacing Figma.

---

## Phase 4 — Catalog, tìm kiếm, New & Hot

- **Search:** `GET /catalog/search?q=&profileId=&page=&limit=`.
- **New & Hot:** `GET /catalog/new-hot?profileId=&page=&limit=`.
- **Chi tiết:** `GET /catalog/content/:id?profileId=` hoặc `GET /movies/find/:id` / `GET /series/:id` (series + seasons).
- **Tương tự:** `GET /catalog/content/:id/similar?profileId=`.

**Deliverable:** luồng từ home → detail → similar; empty/error state.

---

## Phase 5 — Player & tiến độ

- **Watch:** video element (URL từ `Movie.video` / `Episode.video`); controls tối thiểu theo Figma.
- **API:** `POST /playback/start`, `POST /playback/progress`, `POST /playback/complete`; series: `GET /playback/next-episode?profileId=&currentEpisodeId=`.
- **Series:** UI chọn season/episode (`GET /seasons`, `GET /episodes`); autoplay next nếu bật trong settings (đọc `UserSetting`).

**Deliverable:** xem phim/tập; progress lưu; next episode khi có series.

---

## Phase 6 — My List & lịch sử

- **My List:** `GET/POST/DELETE /my-list` (với `profileId`).
- **Continue / Recent:** `GET /history/continue`, `GET /history/recent?profileId=` — gắn vào home hoặc tab riêng theo Figma.

**Deliverable:** thêm/xóa list; hàng “Continue watching” có data thật.

---

## Phase 7 — Settings, thông báo, Downloads (UI)

- **Settings:** `GET/PUT /settings`, `GET /settings/sections`, các `PUT` nhóm (notifications, playback, language, download), account email/password/delete (`docs/API_MATRIX_V2.md`).
- **Content preference:** `GET/PUT /settings/content-preference` (nếu Figma có audio/sub).
- **Notifications:** `GET /notifications`, `PATCH` read; tùy chọn **SSE** `GET /notifications/stream?profileId=` hoặc Socket.IO `notification:new` (client nhận realtime).
- **Downloads:** `GET/POST/PUT/DELETE /downloads` — UI hiển thị queue, trạng thái; policy (Wi‑Fi, quality) phản ánh từ settings.

**Deliverable:** màn settings đủ nhóm; notifications list; downloads list (metadata).

---

## Phase 8 — Polish & PWA

- **Figma pass:** so từng màn (typography, tap target ≥44px, loading skeleton).
- **PWA (tuỳ chọn):** `manifest.json`, icon, `service worker` cơ bản (CRA) — “Add to Home Screen”.
- **Performance:** lazy route, image `loading="lazy"`, tránh re-fetch không cần thiết.

---

## Thứ tự ưu tiên (nếu cần cắt scope)

1. Phase 0 → 2 → 3 (shell + home) — **xương sống**.  
2. Phase 4 (detail + search) — **core browse**.  
3. Phase 5 (player) — **core watch**.  
4. Phase 6 + 7 — **đầy đủ trải nghiệm Netflix-like**.  
5. Phase 8 — **chất lượng sản phẩm**.

---

## Mapping tài liệu

| Tài liệu | Dùng cho FE |
|----------|-------------|
| `docs/API_MATRIX_V2.md` | Contract endpoint, query, auth |
| `docs/DOMAIN_MODEL_V2.md` | Field hiển thị trên card/detail |
| Figma (file prototype) | Layout, copy, trạng thái UI |

---

## Kiểm tra nhanh sau mỗi phase

- [ ] Token/proxy: request có `token` và `profileId` khi cần.  
- [ ] So 1 frame Figma tương ứng (spacing, font).  
- [ ] Mobile viewport 390px không vỡ layout.  
- [ ] Backend: `npm run bootstrap:dev` vẫn pass (API không regression).

---

## Ghi chú

- **Desktop:** có thể giới hạn `max-width` + căn giữa (giống app trên máy tính).  
- **Admin:** không nằm trong plan này.  
- Figma đổi: cập nhật token/component trước khi nhân thêm màn mới.
