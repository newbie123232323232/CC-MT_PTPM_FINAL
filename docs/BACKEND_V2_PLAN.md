# Backend V2 Plan Overview

Muc tieu: giu source hien tai, them backend cho app mobile user-only, admin web giu nguyen de quan tri noi dung.

## Scope
- Keep: auth JWT, User/Movie/List CRUD, admin upload media.
- Add: profile, watch progress/history, my list, search/catalog feed, settings, notifications, download metadata.
- Later: series/season/episode, recommendation nang cao.

## Non-goals (Phase 1)
- Khong doi admin web thanh mobile.
- Khong lam recommendation ML.
- Khong lam DRM/streaming pipeline phuc tap.

## Current Reuse (already in repo)
- `POST /auth/register`, `POST /auth/login`
- `GET /movies/random`, `GET /movies/find/:id`
- `GET /lists` feed ngau nhien theo type/genre
- Admin CRUD users/movies/lists + Firebase upload URL

## Risks
- `users/find/:id` va `users/stats` hien khong verify token (security gap).
- Movie schema dang phang, chua du cho episode-level UX.
- Chua co refresh token/session management.

## Deliverables
1. Data models moi (Profile, WatchProgress, MyListItem, UserSetting, Notification, DownloadItem)
2. New routes v2 cho mobile user
3. API docs + request/response examples
4. Seed script nho de test nhanh
5. Regression checks cho endpoints cu

## Definition of Done (Phase 1)
- User mobile co the: login -> chon profile -> home feed -> search -> detail -> play -> luu progress -> xem continue -> add/remove my list -> doi settings co ban.

## Phase 1.5 (Settings completion)
- Chi tiet: `docs/PHASE_1_5_SETTINGS.md`
- Realtime channel:
  - Socket.IO rooms: `user:{userId}`, `profile:{profileId}`
  - SSE endpoint: `/notifications/stream`
