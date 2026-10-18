export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-utp-muted">Esta sección no forma parte de la simulación de matrícula.</p>
    </div>
  );
}
