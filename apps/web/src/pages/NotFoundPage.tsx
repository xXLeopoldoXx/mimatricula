import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <div className="font-display text-utp-violet text-6xl font-extrabold">404</div>
      <h1 className="mt-2 text-xl font-bold">No encontramos esta página</h1>
      <p className="text-utp-muted mt-1 text-sm">Puede que el enlace haya cambiado o esté incompleto.</p>
      <Link to="/" className="btn btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}
