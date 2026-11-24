/*
  Warnings:

  - You are about to drop the `AuthSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuthSession" DROP CONSTRAINT "AuthSession_studentId_fkey";

-- DropTable
DROP TABLE "AuthSession";

-- DropTable
DROP TABLE "Student";

-- CreateTable
CREATE TABLE "Estudiantes" (
    "id" TEXT NOT NULL,
    "correo_institucional" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "codigo_estudiante" TEXT,
    "contrasena_cifrada" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesiones" (
    "id" TEXT NOT NULL,
    "hash_token" TEXT NOT NULL,
    "id_estudiante" TEXT NOT NULL,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cursos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "horas_semanales" INTEGER NOT NULL,
    "creditos" INTEGER NOT NULL,
    "ciclo" TEXT NOT NULL,

    CONSTRAINT "Cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesores" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "calificacion_general" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "porcentaje_recomendaciones" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Profesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesores_Cursos" (
    "id_profesor" TEXT NOT NULL,
    "id_curso" TEXT NOT NULL,

    CONSTRAINT "Profesores_Cursos_pkey" PRIMARY KEY ("id_profesor","id_curso")
);

-- CreateTable
CREATE TABLE "Resenas_Profesores" (
    "id" TEXT NOT NULL,
    "id_profesor" TEXT NOT NULL,
    "id_estudiante" TEXT NOT NULL,
    "claridad_al_explicar" INTEGER NOT NULL,
    "puntualidad" INTEGER NOT NULL,
    "trato_al_estudiante" INTEGER NOT NULL,
    "exigencia" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recomienda" BOOLEAN NOT NULL,
    "periodo_academico" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resenas_Profesores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudiantes_correo_institucional_key" ON "Estudiantes"("correo_institucional");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiantes_codigo_estudiante_key" ON "Estudiantes"("codigo_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "Sesiones_hash_token_key" ON "Sesiones"("hash_token");

-- CreateIndex
CREATE INDEX "Sesiones_id_estudiante_fecha_expiracion_idx" ON "Sesiones"("id_estudiante", "fecha_expiracion");

-- CreateIndex
CREATE INDEX "Resenas_Profesores_id_profesor_idx" ON "Resenas_Profesores"("id_profesor");

-- CreateIndex
CREATE INDEX "Resenas_Profesores_id_estudiante_idx" ON "Resenas_Profesores"("id_estudiante");

-- AddForeignKey
ALTER TABLE "Sesiones" ADD CONSTRAINT "Sesiones_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profesores_Cursos" ADD CONSTRAINT "Profesores_Cursos_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "Profesores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profesores_Cursos" ADD CONSTRAINT "Profesores_Cursos_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "Cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resenas_Profesores" ADD CONSTRAINT "Resenas_Profesores_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "Profesores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resenas_Profesores" ADD CONSTRAINT "Resenas_Profesores_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
