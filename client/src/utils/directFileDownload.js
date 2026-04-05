/** Tên file an toàn + đuôi từ URL nếu có. */
export function inferDownloadFilename(title, urlString) {
  const safe =
    String(title || 'video')
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'video';
  let ext = '.mp4';
  try {
    const u = new URL(urlString, 'http://placeholder.local');
    const m = u.pathname.match(/\.([a-z0-9]{2,5})$/i);
    if (m) ext = `.${m[1].toLowerCase()}`;
  } catch {
    /* keep .mp4 */
  }
  return `${safe}${ext}`;
}

function isXmlOrHtmlErrorSnippet(text) {
  const t = text.trimStart().slice(0, 500).toLowerCase();
  return (
    t.startsWith('<') &&
    (t.includes('<error') ||
      t.includes('accessdenied') ||
      t.includes('access denied'))
  );
}

/**
 * @returns {{ ok: true, mode: 'blob' | 'tab' } | { ok: false, message: string }}
 */
export async function downloadMediaToDevice(resolvedSrc, title) {
  const filename = inferDownloadFilename(title, resolvedSrc);
  const absolute =
    resolvedSrc.startsWith('http://') || resolvedSrc.startsWith('https://')
      ? resolvedSrc
      : `${window.location.origin}${resolvedSrc.startsWith('/') ? '' : '/'}${resolvedSrc}`;

  const deniedMsg =
    'Link video từ chối truy cập (403) hoặc đã hết hạn công khai — cập nhật field video trong admin/DB. Với seed cũ, chạy: node scripts/fixBrokenSampleVideoUrls.js';

  try {
    const res = await fetch(absolute, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        return { ok: false, message: deniedMsg };
      }
      return {
        ok: false,
        message: `Tải thất bại (HTTP ${res.status}). Kiểm tra URL hoặc quyền file.`,
      };
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/xml') || ct.includes('text/html')) {
      return { ok: false, message: deniedMsg };
    }

    const blob = await res.blob();
    if (blob.size < 8000) {
      const head = await blob.slice(0, Math.min(blob.size, 600)).text();
      if (isXmlOrHtmlErrorSnippet(head)) {
        return { ok: false, message: deniedMsg };
      }
    }

    const obj = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = obj;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(obj);
    }
    return { ok: true, mode: 'blob' };
  } catch {
    window.open(absolute, '_blank', 'noopener,noreferrer');
    return {
      ok: true,
      mode: 'tab',
      note:
        'Đã mở tab mới (thường do CORS). Nếu vẫn 403, URL không cho tải ẩn danh — đổi link video.',
    };
  }
}
