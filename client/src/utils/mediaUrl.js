/**
 * Trên điện thoại (LAN), URL tuyệt đối http://localhost:5000/... trỏ nhầm vào
 * chính máy điện thoại → ảnh/video hỏng. Đổi thành path cùng origin dev server
 * (3000) để proxy sang API (5000).
 */
export function mediaUrl(u) {
  if (u == null || u === '') return u;
  const s = String(u).trim();
  if (!/^https?:\/\//i.test(s)) return s;
  try {
    const parsed = new URL(s);
    const h = parsed.hostname;
    if (
      (h === 'localhost' || h === '127.0.0.1') &&
      parsed.port === '5000'
    ) {
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return path || '/';
    }
  } catch {
    /* ignore */
  }
  return s;
}
