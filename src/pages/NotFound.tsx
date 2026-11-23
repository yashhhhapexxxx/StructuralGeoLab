import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-6 pt-24 text-center">
      <div>
        <p className="font-display text-[9rem] leading-none text-white/10">404</p>
        <h1 className="font-display text-4xl uppercase">Missing section</h1>
        <p className="mt-2 text-muted">This page was faulted out of the sequence.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-moss px-6 py-3 font-semibold text-night">Back to the surface</Link>
      </div>
    </div>
  );
}
