import type { SVGProps } from 'react';

type IconPath = React.ReactNode;

const paths: Record<string, IconPath> = {
  home: <><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  grid: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>,
  file: <><path d="M6 2h9l4 4v16H6zM14 2v5h5M9 13h6M9 17h6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  chat: <><path d="M4 5h16v11H8l-4 4V5z" /></>,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20a2 2 0 0 0 4 0" /></>,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  chevronRight: <><path d="m9 6 6 6-6 6" /></>,
  arrowRight: <><path d="M4 12h16M13 5l7 7-7 7" /></>,
  arrowLeft: <><path d="M20 12H4M11 5l-7 7 7 7" /></>,
  shield: <><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z" /></>,
  chip: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  bolt: <><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  unlock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.7-1.5" /></>,
  wrench: <><path d="M14.7 6.3a4 4 0 0 0-5.2 5.1L3 18l3 3 6.6-6.5a4 4 0 0 0 5.1-5.2L14.6 12l-2.6-2.6 2.7-3.1z" /></>,
  check: <><path d="M4 12.5l5 5L20 6.5" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  sparkles: <><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15zM5 14l.8 1.7L7.5 16.5l-1.7.8L5 19l-.8-1.7L2.5 16.5l1.7-.8L5 14z" /></>,
  smartphone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
  credit: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.6M6.6 6.6A16 16 0 0 0 2 12s3.5 7 10 7c1.4 0 2.8-.3 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  ticket: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2c-1.2.7-1.2 3.3 0 4 1.2.7 1.2 3.3 0 4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2c1.2-.7 1.2-3.3 0-4-1.2-.7-1.2-3.3 0-4zM3 12h2M19 12h2" /></>,
  star: <><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.9 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></>,
  languages: <><path d="M5 8h14M12 3a17 17 0 0 0 0 18M12 3a17 17 0 0 1 0 18M3 12h18" /></>,
  mapPin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 2 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5" /></>,
  alert: <><path d="M12 8v5M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M21 3v5h-5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></>,
};

export function Icon({
  name,
  className = 'h-5 w-5',
  ...props
}: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name] ?? <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}