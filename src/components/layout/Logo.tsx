export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" fill="none" className={className}>
      {/* House Outline */}
      <path d="M32 8L6 28v24a4 4 0 0 0 4 4h44a4 4 0 0 0 4-4V28L32 8z" stroke="#10b981" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
      {/* Lightning Bolt */}
      <path d="M36 20L22 40h10v12l14-20H36V20z" fill="#059669" stroke="#059669" strokeWidth="2" strokeLinejoin="round"/>
      {/* Leaf (Bottom Right) */}
      <path d="M42 42c0 0-10 2-10 12 10 0 12-10 12-10s-2-2-2-2z" fill="#10b981"/>
      
      {/* Text "WattWise" */}
      <text x="68" y="44" fontFamily="inherit" fontSize="36" fontWeight="800" fill="currentColor" className="text-foreground">
        Watt<tspan fill="#10b981">Wise</tspan>
      </text>
    </svg>
  );
}
