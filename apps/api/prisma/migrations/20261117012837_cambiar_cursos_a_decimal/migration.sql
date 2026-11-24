/*
  Warnings:

  - You are about to alter the column `horas_semanales` on the `Cursos` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `creditos` on the `Cursos` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "Cursos" ALTER COLUMN "horas_semanales" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "creditos" SET DATA TYPE DECIMAL(5,2);
