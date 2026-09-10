import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: undefined | PrismaClient;
  var prismaGlobalUrl: undefined | string;
}


function getPrismaClient(): PrismaClient {
  const currentUrl = process.env.DATABASE_URL?.trim() || "";

  if (globalThis.prismaGlobal && globalThis.prismaGlobalUrl === currentUrl) {
    return globalThis.prismaGlobal;
  }

  const client = new PrismaClient(
    currentUrl
      ? {
          datasources: {
            db: {
              url: currentUrl,
            },
          },
        }
      : undefined
  );

  if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = client;
    globalThis.prismaGlobalUrl = currentUrl;
  }

  return client;
}

const prisma = getPrismaClient();

export default prisma;


