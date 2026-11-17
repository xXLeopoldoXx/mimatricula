import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "./app";
import { PrismaAuthRepository } from "./prisma-repository";

const prisma = new PrismaClient();
const app = await buildApp(new PrismaAuthRepository(prisma));
const port = Number(process.env.PORT ?? 4000);

try {
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error, "No se pudo iniciar el API");
  await prisma.$disconnect();
  process.exitCode = 1;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close().finally(() => prisma.$disconnect());
  });
}
