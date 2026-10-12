import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/availability", label: "Availability" },
  { href: "/reservations", label: "Reservations" },
  { href: "/resources", label: "Resources" },
];

export default function NavBar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-8 py-3 text-sm">
        <span className="font-bold">Resource Reservation</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-gray-600 hover:text-black">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}