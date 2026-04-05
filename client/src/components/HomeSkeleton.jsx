/** Placeholder Home khi GET /home chưa trả — Figma-style rails */
function HomeSkeleton() {
  return (
    <div className='home-skeleton' aria-hidden>
      <div className='home-skeleton__hero skeleton-block' />
      <div className='home-skeleton__rail'>
        <div className='skeleton-block skeleton-block--title' />
        <div className='home-skeleton__cards'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='skeleton-block home-skeleton__card' />
          ))}
        </div>
      </div>
      <div className='home-skeleton__rail'>
        <div className='skeleton-block skeleton-block--title' />
        <div className='home-skeleton__cards'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='skeleton-block home-skeleton__card' />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeSkeleton;
