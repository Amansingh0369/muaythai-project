export default function AuthDivider() {
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="flex-1 h-px bg-white/15" />
      <span className="font-grotesk text-[10px] text-white/50 uppercase tracking-[0.3em]">or continue with</span>
      <span className="flex-1 h-px bg-white/15" />
    </div>
  );
}
