# Domain Model Spec V2

## Existing (reuse)
- User
- Movie
- List

## New Collections

### Profile
- userId: ObjectId (index)
- name: string (required)
- avatarUrl: string
- isKid: boolean (default false)
- maturityLevel: number (default 16)
- language: string (default `vi`)
- isDefault: boolean (default false)
- createdAt/updatedAt
Indexes:
- `{ userId: 1 }`

### WatchProgress
- profileId: ObjectId (index)
- contentId: ObjectId (index)
- contentType: enum(`movie`,`episode`)
- positionSec: number
- durationSec: number
- percent: number
- completed: boolean
- lastWatchedAt: date
Indexes:
- unique `{ profileId:1, contentId:1 }`
- `{ lastWatchedAt:-1 }`

### WatchHistory
- profileId: ObjectId (index)
- contentId: ObjectId (index)
- watchedAt: date
- positionSec: number
- durationSec: number

### MyListItem
- profileId: ObjectId
- contentId: ObjectId
- addedAt: date
Indexes:
- unique `{ profileId:1, contentId:1 }`

### UserSetting
- userId: ObjectId (unique)
- profileId: ObjectId (optional)
- autoplayNext: boolean
- autoplayPreview: boolean
- displayLanguage: string
- subtitleLanguage: string
- maturityGateEnabled: boolean

### Notification
- userId: ObjectId
- profileId: ObjectId (optional)
- contentId: ObjectId
- kind: enum(`new_release`,`new_episode`,`trending`,`system`)
- title: string
- body: string
- read: boolean
- createdAt: date
Indexes:
- `{ userId:1, read:1, createdAt:-1 }`

### DownloadItem
- profileId: ObjectId
- contentId: ObjectId
- episodeId: ObjectId (optional)
- status: enum(`queued`,`downloading`,`paused`,`done`,`failed`)
- progress: number (0-100)
- quality: enum(`sd`,`hd`,`fhd`)
- localRef: string (path key on device)
- updatedAt: date

## Phase 2 models
- Series
- Season
- Episode
- PlaybackSession
- RecommendationCache
