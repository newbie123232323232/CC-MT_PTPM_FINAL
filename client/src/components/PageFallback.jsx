/** Skeleton khi lazy route đang tải chunk */
function PageFallback() {
  return (
    <div className='page-fallback' role='status' aria-label='Đang tải'>
      <div className='page-fallback__inner'>
        <div className='skeleton-block skeleton-block--logo' />
        <div className='skeleton-block skeleton-block--line' />
        <div className='skeleton-block skeleton-block--line short' />
      </div>
    </div>
  );
}

export default PageFallback;
