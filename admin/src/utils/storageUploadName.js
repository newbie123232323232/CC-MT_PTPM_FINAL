/** Firebase object names must be short ASCII-only; long unicode filenames break uploads. */
export function storageUploadName(label, file) {
  const raw = file?.name || '';
  const m = raw.match(/(\.[a-zA-Z0-9]{1,12})$/);
  const ext = m ? m[1].toLowerCase() : '';
  return `${Date.now()}_${String(label)}${ext}`;
}
