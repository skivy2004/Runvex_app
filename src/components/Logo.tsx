type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`font-bold ${className}`}>
      Run<span className="text-accent">vex</span>
    </span>
  );
}
