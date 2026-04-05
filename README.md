# Netflix clone (MERN)

Client xem phim + admin CMS (user, movie, list). API Express + MongoDB; admin upload ảnh/video lên **Firebase Storage**.

---

## Yêu cầu

- **Node.js** + **npm**
- **MongoDB** chạy local (hoặc Atlas)
- Tài khoản **Firebase** (Storage). Nhiều project cần gói **Blaze** (thẻ thanh toán) dù dùng trong hạn mức miễn phí — xem [Firebase Pricing](https://firebase.google.com/pricing).

---

## Cài đặt

Tại thư mục gốc project:

```sh
npm install
cd client && npm install && cd ..
cd admin && npm install && cd ..
```

---

## Biến môi trường

### Gốc project — `.env`

| Biến | Mô tả |
|------|--------|
| `MONGO_URL` | Chuỗi kết nối MongoDB. Trên Windows nên dùng **`127.0.0.1`** thay vì `localhost` để tránh lỗi IPv6 (`ECONNREFUSED ::1`). Ví dụ: `mongodb://127.0.0.1:27017/netflix` |
| `SECRET_KEY` | Chuỗi bí mật cho JWT và mã hóa mật khẩu (CryptoJS). **Không đổi** sau khi đã có user trong DB, nếu không login sẽ sai. |
| `PORT` | Cổng API (mặc định `5000`). |
| `FRONTEND_URL` | Base URL web client (không dấu `/` cuối). Dùng trong link **đặt lại mật khẩu** gửi qua email. Mặc định dev: `http://localhost:3000`. Có thể dùng `CLIENT_URL` thay thế. |
| `SMTP_USER` | Gmail (hoặc SMTP khác) — user đăng nhập gửi mail. |
| `SMTP_PASS` | **App Password** (Gmail), không dùng mật khẩu đăng nhập thường. |
| `MAIL_FROM` | Địa chỉ hiển thị người gửi (thường trùng `SMTP_USER`). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Tuỳ chọn; nếu không set, backend dùng `service: 'gmail'` (Nodemailer). |

Mẫu đầy đủ (không có giá trị thật): xem **`.env.example`** ở root. **Không commit** file `.env`.

### Admin — `admin/.env`

| Biến | Mô tả |
|------|--------|
| `REACT_APP_FIREBASE_API_KEY` | Web API Key trong Firebase Console → Project settings → Your apps. |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Tuỳ chọn — phải **cùng project** với API key (snippet SDK). |
| `REACT_APP_FIREBASE_PROJECT_ID` | Tuỳ chọn. |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Dùng dạng **`projectId.appspot.com`** (trong Storage → Files thường thấy). Snippet mới có `*.firebasestorage.app` — code admin **tự đổi** sang `.appspot.com`; bạn vẫn có thể ghi thẳng `…appspot.com` trong `.env`. |
| `REACT_APP_FIREBASE_APP_ID` | Tuỳ chọn (snippet SDK). |
| `REACT_APP_FIREBASE_USE_ANON` | Chỉ đặt `true` khi Storage rules **bắt buộc** `request.auth` **và** bạn đã bật Anonymous (xem dưới). Mặc định **không** set — tránh lỗi `CONFIGURATION_NOT_FOUND` / `signupNewUser` 400 khi chưa bật Authentication. |

**Lỗi upload 0% + Console `CONFIGURATION_NOT_FOUND` / Network CORS trên `firebasestorage.googleapis.com`:**

1. **Authentication chưa kích hoạt:** Firebase Console → **Build → Authentication** → **Get started** (lần đầu). Lỗi này hay gặp khi project mới chưa mở module Auth.
2. **API key không cùng project** với bucket: copy full **SDK snippet** (Web) vào `admin/.env` — đặc biệt `REACT_APP_FIREBASE_STORAGE_BUCKET` phải đúng dạng `xxx.appspot.com` như trong Console.
3. **Hai hướng upload dev (chọn một):**
   - **Đơn giản:** Storage Rules `allow read, write: if true` (README dưới) — **không** cần `REACT_APP_FIREBASE_USE_ANON`.
   - **Có auth:** bật **Anonymous** trong Authentication → Sign-in method → thêm `REACT_APP_FIREBASE_USE_ANON=true` trong `admin/.env`.

**Không có Firebase Storage (Spark / không thẻ):** form **New movie** upload file lên API **`POST /api/upload/item`** → lưu trong thư mục **`uploads/items/`** (gitignore), URL dạng `http://localhost:5000/uploads/items/...`. Cần **API :5000** chạy cùng lúc admin.

**Firebase Storage → Rules** (khi dùng Firebase): cần cho phép `read` (client xem video/ảnh) và `write` (admin upload). Ví dụ dev (không dùng production):

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## Chạy local

Mặc định: API **5000**, client **3000**. Admin nên chạy **3001** vì CRA không thể dùng chung 3000 với client.

### Terminal 1 — API

```sh
cd /đường-dẫn/tới/netflix
npm run server
```

*(Đúng là `npm run server` = `nodemon index.js`. **Không** dùng `nodemon start`.)*

### Terminal 2 — Client (Netflix)

```sh
cd client
npm start
```

→ `http://localhost:3000`

### Terminal 3 — Admin

Trên **Node 17+**, CRA 4 của admin cần OpenSSL legacy:

**Windows (PowerShell):**

```powershell
cd admin
$env:PORT = "3001"
$env:NODE_OPTIONS = "--openssl-legacy-provider"
npm start
```

**macOS / Linux:**

```sh
cd admin
export PORT=3001
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```

→ `http://localhost:3001`

`admin/package.json` đã `proxy` tới `http://localhost:5000/` — API phải chạy trước hoặc cùng lúc.

### Gộp API + client (không gồm admin)

```sh
npm run develop
```

### Kiểm tra MongoDB — profiles (CLI)

Sau khi tạo profile trong app, xác nhận đã lưu DB:

```sh
npm run db:profiles
```

---

## Tài khoản admin

- Đăng ký user qua client (`/register`) hoặc API.
- Trong MongoDB, document user cần **`isAdmin: true`** (Compass / `mongosh`). **Không** sửa field `password` tay.
- Đăng nhập admin tại `http://localhost:3001/login` bằng **cùng email/password** đã đăng ký.

---

## Thêm phim / list

- Sidebar **Movies** = danh sách phim; **Lists** = danh sách carousel.
- **Thêm phim mới:** mở trực tiếp **`http://localhost:3001/newproduct`** (form upload + tạo movie).
- Sau khi có movie, tạo **list** và gán nội dung — client home mới có hàng và featured đầy đủ.

---



## Ke hoach phat trien backend v2

- `docs/BACKEND_V2_PLAN.md`
- `docs/PHASE_1_CHECKLIST.md`
- `docs/API_MATRIX_V2.md`
- `docs/DOMAIN_MODEL_V2.md`

## Quy trinh frontend (app user, mobile-first)

- `docs/FRONTEND_PLAN.md` — phase 0–8, slice theo Figma, mapping API (`client/`)

