type BadgeIconProps = {
  name?: string | null;
  className?: string;
};

export default function BadgeIcon({ name, className }: BadgeIconProps) {
  const icon = (name || "star").toLowerCase();
  switch (icon) {
    case "seedling":
      return <SeedlingIcon className={className} />;
    case "fire":
      return <FlameIcon className={className} />;
    case "flame":
      return <FlameIcon className={className} />;
    case "trophy":
      return <TrophyIcon className={className} />;
    case "bolt":
      return <BoltIcon className={className} />;
    case "crown":
      return <CrownIcon className={className} />;
    case "medal":
      return <MedalIcon className={className} />;
    case "compass":
      return <CompassIcon className={className} />;
    case "shield":
      return <ShieldIcon className={className} />;
    case "gem":
      return <GemIcon className={className} />;
    case "rocket":
      return <RocketIcon className={className} />;
    default:
      return <StarIcon className={className} />;
  }
}

type IconProps = {
  className?: string;
};

function StarIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3.5z" />
    </svg>
  );
}

function FlameIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3c2.2 2.7 3.4 5.2 3.4 7.5a3.8 3.8 0 01-7.6 0c0-1.9 1-3.9 2.7-6" />
      <path d="M6.5 13.5a5.5 5.5 0 1011 0c0-2.1-1-3.9-2.5-5.6" />
    </svg>
  );
}

function BoltIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z" />
    </svg>
  );
}

function CrownIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8l4 4 5-6 5 6 4-4v9H3V8z" />
      <path d="M3 17h18" />
    </svg>
  );
}

function CompassIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-3 7-7 3 3-7 7-3z" />
    </svg>
  );
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
    </svg>
  );
}

function SeedlingIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20V10" />
      <path d="M12 10c-1.5-3-4.5-4.5-8-4 1 4.5 4 7 8 7" />
      <path d="M12 12c1.5-3 4.5-4.5 8-4-1 4.5-4 7-8 7" />
    </svg>
  );
}

function TrophyIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h12v3a6 6 0 01-12 0V4z" />
      <path d="M6 7H4a3 3 0 003 3" />
      <path d="M18 7h2a3 3 0 01-3 3" />
      <path d="M9 18h6" />
      <path d="M10 14h4v4h-4z" />
    </svg>
  );
}

function MedalIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="14" r="5" />
      <path d="M7 2l2 5h2l-2-5H7z" />
      <path d="M15 2l-2 5h2l2-5h-2z" />
    </svg>
  );
}

function GemIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 9l4-5h6l4 5-7 10L5 9z" />
      <path d="M5 9h14" />
      <path d="M9 4l3 15 3-15" />
    </svg>
  );
}

function RocketIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4l6 6-5 5-6-6 5-5z" />
      <path d="M9 9l-5 5v6h6l5-5" />
      <path d="M12 6l6 6" />
    </svg>
  );
}
