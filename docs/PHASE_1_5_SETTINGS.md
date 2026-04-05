# Phase 1.5 - Settings Completion

Muc tieu: bo sung cac nhom cai dat con thieu theo Figma va buoc dau ap dung maturity filter vao feed/catalog.

## Da hoan thanh

- [x] Mo rong `UserSetting`:
  - `notificationEnabled`
  - `notifyNewRelease`
  - `notifyNewEpisode`
  - `notifyTrending`
  - `downloadWifiOnly`
  - `downloadQuality`

- [x] Them endpoint settings theo nhom:
  - `GET /settings/sections?profileId=`
  - `PUT /settings/notifications`
  - `PUT /settings/playback`
  - `PUT /settings/language`
  - `PUT /settings/download`

- [x] Ap dung maturity filter theo profile:
  - `GET /home` (hero + rails)
  - `GET /catalog/search`
  - `GET /catalog/content/:id`
  - `GET /catalog/content/:id/similar`

## Chua hoan thanh (next)

- [x] Settings account nang cao:
  - doi email (`PUT /settings/account/email`)
  - doi password co verify password cu (`PUT /settings/account/password`)
  - xoa tai khoan flow an toan (`DELETE /settings/account`)

- [x] Subtitle/audio preferences theo content
  - `GET /settings/content-preference?profileId=&contentId=`
  - `PUT /settings/content-preference`
- [x] Notification generation service + realtime
  - admin tao movie se tao `new_release` notifications cho profiles
  - Socket.IO event `notification:new`
  - SSE stream `GET /notifications/stream`
  - ton trong preference: `notificationEnabled` + `notifyNewRelease`
- [x] Maturity policy day du theo profile kid mode + category gating
  - profile filter dung cho home/catalog/movies route
  - kid mode chan genre nhay cam (`Horror`, `Thriller`, `Crime`, `War`, `18+`, `Mature`)
