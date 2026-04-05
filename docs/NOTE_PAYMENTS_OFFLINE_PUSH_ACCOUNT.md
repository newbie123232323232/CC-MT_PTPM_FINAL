# Ghi chú: Thanh toán / VIP, Download offline, Push vs SSE, Account

Tài liệu này ghi **hướng triển khai sau** và **giải thích khái niệm** — không thay thế `docs/API_MATRIX_V2.md`.

---

## 1. Thanh toán, gói, VIP, phân quyền theo gói

**Trạng thái hiện tại:** app **không** có subscription, Stripe/PayPal, hay entitlement theo gói. User đã login thì coi như **cùng quyền** (trừ `isAdmin` cho admin panel).

**Để làm đúng “Netflix thật” cần thêm (backend + DB + luồng webhook):**

| Thành phần | Ý nghĩa |
|------------|---------|
| **Product / Plan** | Basic / Standard / Premium, chu kỳ billing. |
| **Subscription** | Gắn `userId`, `planId`, trạng thái `active / past_due / canceled`, `currentPeriodEnd`. |
| **Entitlement** | Rule: title nào xem được 4K, bao nhiêu device, download có không — map từ plan → middleware trước `playback` / `downloads`. |
| **Payment provider** | Stripe Customer + Subscription + webhook `invoice.paid` / `customer.subscription.deleted`. |

**Gợi ý tối thiểu:** bảng `Subscription` + field `plan` trên `User` + check trong route xem nội dung có `tier` hay không.

---

## 2. “Download offline thật” — ai tải, khác gì stream?

### Repo gốc + hiện tại

- **Admin upload** file lên **Firebase Storage** → URL lưu trong Mongo (`Movie.video`, v.v.).
- **Client xem:** `<video src="URL">` = **stream qua HTTP** (trình duyệt tải từng chunk để phát), **không** bằng chứng là user đã “lưu file xuống máy” để xem ngoại tuyến.

### Download trong app Netflix thật

- **Thiết bị user** (app native) **tải file** (hoặc segment DRM) xuống **bộ nhớ cục bộ**, có **giới hạn số máy**, **DRM**, **hết hạn**.
- **Backend** của mình (`DownloadItem`) hiện là **metadata + policy** (queued / done / Wi‑Fi only…): mô tả *trạng thái* download trên client, **không** chứa engine tải file.

**Tóm lại:**  
- **Stream:** phát từ URL, có mạng là xem.  
- **Offline download:** **client** phải có code (thường **native app** hoặc PWA + File System Access / Cache API hạn chế) **ghi file local**. MERN web thuần **không** làm offline DRM giống Netflix app nếu không bổ sung stack (Service Worker, storage quota, thậm chí vẫn không bằng app native).

---

## 3. Push notification (FCM/APNs) vs Socket + SSE

| Cơ chế | Khi nào đủ | Hạn chế |
|--------|------------|---------|
| **Socket.IO + SSE** (đã có hướng realtime) | User **đang mở** web/app, tab active (SSE) hoặc socket connect | Hết tab / tắt trình duyệt → không nhận được. |
| **FCM (Android/Web) / APNs (iOS)** | Thông báo khi **app đóng / background** | Cần project Firebase/APNs, token thiết bị, server gửi message. |

**Kết luận:** Với **web mobile-first trong trình duyệt**, **SSE + socket thường đủ** cho “có thông báo khi đang dùng”. **FCM/APNs** cần khi bạn muốn **giống app native** (badge khi không mở app).

---

## 4. Account — email / mật khẩu / xóa / quên mật khẩu (SMTP)

**API đã có:** `PUT /settings/account/email`, `PUT /settings/account/password`, `DELETE /settings/account`.

**Bổ sung:**  
- `POST /auth/forgot-password` { email }  
- `POST /auth/reset-password` { token, newPassword }  

**SMTP:** cấu hình qua `.env` (`SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `FRONTEND_URL`). **Không** commit mật khẩu vào git.

**Bảo mật:** không paste app password vào chat công khai; nếu đã lộ — tạo lại App Password trong Google.

---

## 5. Việc sẽ làm tiếp (theo roadmap của bạn)

1. Thanh toán + plan + entitlement (khi sẵn sàng nghiệp vụ).  
2. Offline: chỉ nếu chọn **native** hoặc chấp nhận **PWA hạn chế**.  
3. Push: thêm FCM khi có app wrapper hoặc PWA + yêu cầu background.  
4. Account + forgot password: **đã bắt đầu** (SMTP + FE).
