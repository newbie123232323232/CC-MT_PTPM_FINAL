# API Matrix V2 (Mobile User)

Base URL: `/`
Auth header: `token: Bearer <accessToken>`

## Auth
| Method | Path | Body | Auth | Purpose |
|---|---|---|---|---|
| POST | /auth/register | {username,email,password} | Public | Tao tai khoan |
| POST | /auth/login | {email,password} | Public | Dang nhap |
| POST | /auth/refresh | {refreshToken} | Public | Cap token moi |
| POST | /auth/logout | {refreshToken} | User | Dang xuat |

## Profiles
| Method | Path | Body/Query | Auth | Purpose |
|---|---|---|---|---|
| GET | /profiles | - | User | Lay danh sach profile |
| POST | /profiles | {name,avatarUrl,isKid,maturityLevel,language} | User | Tao profile |
| PUT | /profiles/:id | {name,avatarUrl,isKid,maturityLevel,language} | Owner | Sua profile |
| DELETE | /profiles/:id | - | Owner | Xoa profile |
| POST | /profiles/:id/select | - | Owner | Chon profile active |

## Home/Catalog
| Method | Path | Body/Query | Auth | Purpose |
|---|---|---|---|---|
| GET | /home | profileId,type,genre | User | Lay hero + rails |
| GET | /catalog/search | q,type,genre,profileId,page,limit | User | Tim kiem (co maturity/kid filter theo profile) |
| GET | /catalog/content/:id | profileId | User | Chi tiet content (co maturity/kid check) |
| GET | /catalog/content/:id/similar | profileId | User | Noi dung tuong tu (co maturity/kid check) |
| GET | /catalog/new-hot | profileId,page,limit | User | Feed New & Hot |
| GET | /movies/random | type,profileId | User | Random content (co maturity/kid filter) |
| GET | /movies/find/:id | profileId | User | Chi tiet nhanh cho card/list item (co maturity/kid check) |
| GET | /series | profileId,genre,page,limit | User/Admin | Danh sach series (published cho user) |
| GET | /series/:id | profileId | User/Admin | Chi tiet series + seasons |
| POST | /series | payload series | Admin | Tao series |
| PUT | /series/:id | payload series | Admin | Sua series |
| DELETE | /series/:id | - | Admin | Xoa series + seasons/episodes |
| GET | /seasons | seriesId | User/Admin | Lay seasons |
| POST | /seasons | {seriesId,seasonNumber,...} | Admin | Tao season |
| PUT | /seasons/:id | payload season | Admin | Sua season |
| DELETE | /seasons/:id | - | Admin | Xoa season + episodes |
| GET | /episodes | seriesId,seasonId | User/Admin | Lay episodes |
| POST | /episodes | {seriesId,seasonId,episodeNumber,...} | Admin | Tao episode |
| PUT | /episodes/:id | payload episode | Admin | Sua episode |
| DELETE | /episodes/:id | - | Admin | Xoa episode |

## My List
| Method | Path | Body/Query | Auth | Purpose |
|---|---|---|---|---|
| GET | /my-list | profileId | User | Lay danh sach yeu thich |
| POST | /my-list | {profileId,contentId} | User | Them vao my list |
| DELETE | /my-list/:contentId | profileId | User | Xoa khoi my list |

## Playback/History
| Method | Path | Body/Query | Auth | Purpose |
|---|---|---|---|---|
| POST | /playback/start | {profileId,contentId,deviceInfo} | User | Bat dau xem |
| POST | /playback/progress | {profileId,contentId,contentType,positionSec,durationSec} | User | Cap nhat tien do |
| POST | /playback/complete | {profileId,contentId,contentType} | User | Danh dau xem xong |
| GET | /playback/next-episode | profileId,currentEpisodeId | User | Lay tap tiep theo |
| GET | /history/continue | profileId | User | Xem tiep |
| GET | /history/recent | profileId,page,limit | User | Lich su gan day |

## Settings/Notifications/Downloads
| Method | Path | Body/Query | Auth | Purpose |
|---|---|---|---|---|
| GET | /settings | profileId | User | Lay setting |
| GET | /settings/sections | profileId | User | Lay setting theo nhom UI |
| PUT | /settings | {profileId,...settings} | User | Cap nhat setting |
| PUT | /settings/notifications | {profileId,notificationEnabled,notifyNewRelease,notifyNewEpisode,notifyTrending} | User | Cap nhat thong bao |
| PUT | /settings/playback | {profileId,autoplayNext,autoplayPreview} | User | Cap nhat playback setting |
| PUT | /settings/language | {profileId,displayLanguage,subtitleLanguage} | User | Cap nhat ngon ngu |
| PUT | /settings/download | {profileId,downloadWifiOnly,downloadQuality} | User | Cap nhat tai xuong |
| GET | /settings/content-preference | profileId,contentId | User | Lay audio/subtitle theo content |
| PUT | /settings/content-preference | {profileId,contentId,audioLanguage,subtitleLanguage,subtitleEnabled} | User | Cap nhat audio/subtitle theo content |
| PUT | /settings/account/email | {email} | User | Doi email account |
| PUT | /settings/account/password | {currentPassword,newPassword} | User | Doi mat khau account |
| DELETE | /settings/account | {currentPassword} | User | Xoa tai khoan + du lieu lien quan |
| GET | /notifications | profileId,page,limit | User | Danh sach thong bao |
| POST | /notifications/:id/read | - | User | Danh dau da doc |
| POST | /notifications/read-all | {profileId} | User | Doc tat ca |
| GET | /notifications/stream | profileId | User | Stream thong bao realtime (SSE) |
| POST | /notifications/jobs/trending | {days,limit} | Admin | Generate thong bao trending |
| GET | /downloads | profileId | User | Danh sach da tai |
| POST | /downloads | {profileId,contentId,episodeId,quality} | User | Tao job tai |
| PUT | /downloads/:id | {status,progress,localRef,networkType,errorMessage} | User | Cap nhat trang thai (state machine + policy) |
| DELETE | /downloads/:id | - | User | Xoa muc tai |
