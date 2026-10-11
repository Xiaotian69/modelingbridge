export type IconName =
  | "arrow"
  | "book"
  | "flag"
  | "grid"
  | "code"
  | "spark"
  | "menu"
  | "close"
  | "github"
  | "check";
const paths: Record<IconName, string> = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  book: "M12 5v15M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1Z",
  flag: "M5 21V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m5 5 14 14M19 5 5 19",
  github:
    "M9 19c-5 2-5-3-7-3m14 6v-4c0-1-.3-2-1-2.5 4-.5 6-2 6-6 0-1.5-.5-2.5-1.5-3.5.5-1 .5-2 0-3.5-2 0-3 1-4 1.5-2-.5-4-.5-6 0-1-.5-2-1.5-4-1.5-.5 1.5-.5 2.5 0 3.5C4.5 7 4 8 4 9.5c0 4 2 5.5 6 6-.7.5-1 1.5-1 2.5v4",
  check: "m5 12 4 4L19 6",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
