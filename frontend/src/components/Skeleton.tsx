export function Skeleton({ w = '100%', h = 16, rounded = 6 }: { w?: string | number; h?: number; rounded?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: rounded,
      background: 'linear-gradient(90deg, #EDE8E0 25%, #F5F0E8 50%, #EDE8E0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-5" style={{display:'flex',flexDirection:'column',gap:10}}>
      <Skeleton w="40%" h={10} />
      <Skeleton w="60%" h={24} />
      <Skeleton w="80%" h={10} />
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8,padding:'12px 20px',borderBottom:'0.5px solid #F0E8DC'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Skeleton w="55%" h={11} />
        <Skeleton w={40} h={18} rounded={4} />
      </div>
      <Skeleton w="35%" h={9} />
    </div>
  )
}
