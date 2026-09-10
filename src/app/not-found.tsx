import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] text-[#221C18] p-6 text-center">
      <h1 className="font-display text-5xl sm:text-6xl font-normal text-[#9B2242] mb-3">404</h1>
      <h2 className="font-display text-2xl font-normal text-[#1F1916] mb-2">Piece Not Found</h2>
      <p className="text-xs text-[#7A6D60] max-w-sm mb-6">
        The haute couture collection or page you are looking for may have been moved or updated.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-[#9B2242] hover:bg-[#831B36] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
      >
        Return to Atelier Home
      </Link>
    </div>
  );
}
