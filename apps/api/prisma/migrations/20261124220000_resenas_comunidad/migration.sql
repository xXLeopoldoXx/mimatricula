-- CreateTable
CREATE TABLE "Resenas_Comunidad" (
    "id" TEXT NOT NULL,
    "id_estudiante" TEXT NOT NULL,
    "ref_docente" TEXT NOT NULL,
    "codigo_curso" TEXT NOT NULL,
    "periodo_academico" TEXT NOT NULL,
    "claridad_al_explicar" INTEGER NOT NULL,
    "exigencia" INTEGER NOT NULL,
    "puntualidad" INTEGER NOT NULL,
    "trato_al_estudiante" INTEGER NOT NULL,
    "recomienda" BOOLEAN NOT NULL,
    "comentario" TEXT NOT NULL,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resenas_Comunidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resenas_Comunidad_ref_docente_idx" ON "Resenas_Comunidad"("ref_docente");

-- CreateIndex
CREATE UNIQUE INDEX "Resenas_Comunidad_id_estudiante_ref_docente_codigo_curso_pe_key" ON "Resenas_Comunidad"("id_estudiante", "ref_docente", "codigo_curso", "periodo_academico");

-- AddForeignKey
ALTER TABLE "Resenas_Comunidad" ADD CONSTRAINT "Resenas_Comunidad_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
