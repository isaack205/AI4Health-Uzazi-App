export function LoadingBloom({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-uzazi-cream/88 backdrop-blur-sm">
      <div className="flex max-w-xs flex-col items-center gap-5 text-center">
        <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
          {[0, 60, 120, 180, 240, 300].map((rotation, index) => (
            <g key={rotation} transform={`rotate(${rotation} 60 60)`}>
              <path
                d="M60 14C71 22 78 33 78 45C78 57 69.94 66 60 66C50.06 66 42 57 42 45C42 33 49 22 60 14Z"
                fill={index % 2 === 0 ? "#8B2252" : "#F4A7B9"}
                className="origin-center animate-[pulse_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${index * 0.12}s` }}
              />
            </g>
          ))}
          <circle cx="60" cy="60" r="10" fill="#FFF8F5" />
        </svg>
        <div>
          <p className="text-display text-2xl text-uzazi-rose">{title}</p>
          <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">{description}</p>
        </div>
      </div>
    </div>
  );
}
