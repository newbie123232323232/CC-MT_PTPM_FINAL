# Phase 1 Execution Checklist

## Step 0 - Baseline hardening
- [x] Add verify middleware to `GET /users/find/:id`
- [x] Add verify middleware to `GET /users/stats` (admin-only)
- [x] Add unified error format `{code,message,details}`

## Step 1 - Profile system
- [x] Create model `Profile`:
  - `userId`, `name`, `avatarUrl`, `isKid`, `maturityLevel`, `language`, `isDefault`
- [x] Routes:
  - `GET /profiles`
  - `POST /profiles`
  - `PUT /profiles/:id`
  - `DELETE /profiles/:id`
  - `POST /profiles/:id/select`
- [x] Rule: max profiles/account (config)

## Step 2 - Home feed aggregation
- [x] Add endpoint `GET /home?profileId=&type=&genre=`
- [x] Response:
  - `hero`
  - `rails[]` (`slug`, `title`, `items[]`)
- [x] Reuse `Movie` + `List` collections
- [x] Fallback khi khong co data: tra ve rails rong

## Step 3 - Search + catalog
- [x] Add index fields: title, genre, cast/tags (neu co)
- [x] Endpoint `GET /catalog/search?q=&type=&genre=&page=&limit=`
- [x] Endpoint `GET /catalog/content/:id`
- [x] Endpoint `GET /catalog/content/:id/similar`

## Step 4 - My List
- [x] Model `MyListItem` (`profileId`,`contentId`,`addedAt`)
- [x] Endpoints:
  - `GET /my-list?profileId=`
  - `POST /my-list`
  - `DELETE /my-list/:contentId?profileId=`
- [x] Unique index `(profileId, contentId)`

## Step 5 - Playback progress/history
- [x] Model `WatchProgress`
- [x] Optional model `WatchHistory`
- [x] Endpoints:
  - `POST /playback/start`
  - `POST /playback/progress`
  - `POST /playback/complete`
  - `GET /history/continue?profileId=`
  - `GET /history/recent?profileId=&page=`

## Step 6 - Settings
- [x] Model `UserSetting`
- [x] Endpoints:
  - `GET /settings?profileId=`
  - `PUT /settings`

## Step 7 - Notifications (basic)
- [x] Model `Notification`
- [x] Endpoints:
  - `GET /notifications?profileId=&page=`
  - `POST /notifications/:id/read`
  - `POST /notifications/read-all`

## Step 8 - Download metadata
- [x] Model `DownloadItem`
- [x] Endpoints:
  - `GET /downloads?profileId=`
  - `POST /downloads`
  - `PUT /downloads/:id`
  - `DELETE /downloads/:id`

## Step 9 - QA gate
- [x] Smoke test old web client still works
- [x] Postman collection for all new endpoints
- [x] Seed script with 20+ movies and 5+ lists
- [x] Minimal unit tests for auth guards and ownership checks
