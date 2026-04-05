# Readiness Scorecard

Trang thai hien tai de danh gia tien do backend clone Netflix theo huong mobile user app.

## Snapshot (current)

- Backend MVP/Beta readiness: **~70-75%**
- Clone 1:1 behavior readiness: **~45-55%**
- Clone 1:1 infra/scale readiness: **<30%**

## Capability Scoreboard

| Capability | Score | Status | Notes |
|---|---:|---|---|
| Auth & account | 7/10 | On track | Co doi email/pass + xoa account; thieu refresh rotation & device sessions |
| Profile system | 8/10 | Strong | Co multi-profile + kid/maturity; thieu profile PIN/parental gate |
| Catalog/Home/Search | 8/10 | Strong | Co feed/search/detail/similar + maturity filter; thieu New&Hot pipeline that |
| Playback & history | 7/10 | Medium | Co progress/continue/recent; thieu next-episode logic chuan |
| My List | 9/10 | Strong | Day du cho MVP |
| Settings | 8/10 | Strong | Co section settings + content preference; thieu device/help advanced |
| Notifications | 6.5/10 | Medium | Co realtime + new_release trigger; thieu new_episode/trending jobs |
| Downloads | 5.5/10 | Weak | Moi metadata; chua co lifecycle policy production |
| Content domain (series) | 5/10 | Weak | Chua tach season/episode model chuan |
| Ops/quality/testing | 6/10 | Medium | Co seed/smoke/unit test; thieu integration & observability |

## Gap to 85% clone behavior readiness

Can hoan thanh 5 cụm sau:

1. **Series domain standardization**
   - Add `Series`, `Season`, `Episode` models
   - Add episode-aware detail and playback endpoints

2. **New & Hot backend**
   - Add `/catalog/new-hot` with time windows and ranking signals
   - Add schedule/publish metadata in content

3. **Notification orchestration**
   - Generate `new_episode` and `trending` notifications
   - Optional cron/queue worker for batch notifications

4. **Playback depth**
   - Next-episode recommendation state
   - Better session/event data for resume and completion

5. **Download policy engine**
   - Wifi-only enforcement metadata
   - Quality caps, expiry, retry status semantics

## Milestone plan

### Milestone A (Target: 78-80%)
- [x] Implement Series/Season/Episode basic CRUD + read APIs
- [x] Add `/catalog/new-hot` endpoint

### Milestone B (Target: 82-84%)
- [x] Add notification jobs (`new_episode`, `trending`)
- [x] Add playback next-episode state

### Milestone C (Target: 85%+)
- [x] Implement download policy/state transitions
- [x] Add integration test suite for core flows

## Exit criteria for Beta

- User can complete full app flow without manual DB edits:
  - login -> choose profile -> browse/search -> detail -> watch -> continue -> my list -> settings -> notifications -> downloads metadata
- Series screen works with real episode data (not movie-only fallback)
- New & Hot and notifications are generated automatically from content events
- Smoke + unit + minimal integration tests are green

## Quick command checklist

```sh
npm run seed:phase1
npm run smoke:step9
npm test
npm run test:integration
```
