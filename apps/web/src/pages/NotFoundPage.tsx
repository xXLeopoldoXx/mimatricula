import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold">Página no encontrada</h1>
      <Link to="/" className="mt-3 inline-block text-sm text-utp-violet underline">
        Volver al inicio
      </Link>
    </div>
  );
}
