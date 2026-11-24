-- CreateTable
CREATE TABLE "Secciones" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "docente_id" TEXT,
    "codigo" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "vacantes" INTEGER NOT NULL,
    "matriculados" INTEGER NOT NULL DEFAULT 0,
    "periodo" TEXT NOT NULL,

    CONSTRAINT "Secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesiones_Clase" (
    "id" TEXT NOT NULL,
    "seccion_id" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fin" VARCHAR(5) NOT NULL,
    "aula" TEXT,

    CONSTRAINT "Sesiones_Clase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cursos_Aprobados" (
    "id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "nota" DECIMAL(4,2),
    "intento" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cursos_Aprobados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preferencias_Estudiante" (
    "id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "turnos_disponibles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dias_libres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trabaja" BOOLEAN NOT NULL DEFAULT false,
    "horarios_ocupados" JSONB NOT NULL DEFAULT '[]',
    "minutos_margen" INTEGER NOT NULL DEFAULT 30,
    "maximo_cursos" INTEGER NOT NULL DEFAULT 6,
    "presupuesto" DECIMAL(10,2),
    "precio_credito" DECIMAL(10,2),
    "peso_docente" DOUBLE PRECISION NOT NULL DEFAULT 0.6,

    CONSTRAINT "Preferencias_Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Horarios_Generados" (
    "id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "numero_opcion" INTEGER NOT NULL,
    "puntaje_total" DOUBLE PRECISION NOT NULL,
    "calidad_docentes" DOUBLE PRECISION NOT NULL,
    "comodidad_horario" DOUBLE PRECISION NOT NULL,
    "creditos_totales" INTEGER NOT NULL,
    "costo_total" DECIMAL(10,2) NOT NULL,
    "explicacion" TEXT NOT NULL,
    "fecha_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Horarios_Generados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Horario_Seccion" (
    "horario_id" TEXT NOT NULL,
    "seccion_id" TEXT NOT NULL,

    CONSTRAINT "Horario_Seccion_pkey" PRIMARY KEY ("horario_id","seccion_id")
);

-- CreateIndex
CREATE INDEX "Secciones_curso_id_idx" ON "Secciones"("curso_id");

-- CreateIndex
CREATE INDEX "Secciones_docente_id_idx" ON "Secciones"("docente_id");

-- CreateIndex
CREATE INDEX "Sesiones_Clase_seccion_id_idx" ON "Sesiones_Clase"("seccion_id");

-- CreateIndex
CREATE INDEX "Cursos_Aprobados_estudiante_id_idx" ON "Cursos_Aprobados"("estudiante_id");

-- CreateIndex
CREATE UNIQUE INDEX "Cursos_Aprobados_estudiante_id_curso_id_intento_key" ON "Cursos_Aprobados"("estudiante_id", "curso_id", "intento");

-- CreateIndex
CREATE UNIQUE INDEX "Preferencias_Estudiante_estudiante_id_key" ON "Preferencias_Estudiante"("estudiante_id");

-- CreateIndex
CREATE INDEX "Horarios_Generados_estudiante_id_idx" ON "Horarios_Generados"("estudiante_id");

-- AddForeignKey
ALTER TABLE "Secciones" ADD CONSTRAINT "Secciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "Cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secciones" ADD CONSTRAINT "Secciones_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "Profesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesiones_Clase" ADD CONSTRAINT "Sesiones_Clase_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cursos_Aprobados" ADD CONSTRAINT "Cursos_Aprobados_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "Estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cursos_Aprobados" ADD CONSTRAINT "Cursos_Aprobados_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "Cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preferencias_Estudiante" ADD CONSTRAINT "Preferencias_Estudiante_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "Estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horarios_Generados" ADD CONSTRAINT "Horarios_Generados_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "Estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario_Seccion" ADD CONSTRAINT "Horario_Seccion_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "Horarios_Generados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario_Seccion" ADD CONSTRAINT "Horario_Seccion_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "Secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
