import {Resolver} from "node:dns/promises";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

function getDnsServers(): string[] {
  if (process.env.MONGODB_DNS_SERVERS === "system") {
    return [];
  }

  const custom = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  return custom?.length ? custom : ["8.8.8.8", "1.1.1.1"];
}

/**
 * mongodb+srv wymaga querySrv — na Windowsie z Docker DNS (172.17.x.x)
 * Node dostaje ECONNREFUSED. Rozwiązujemy SRV/TXT przez publiczne DNS
 * i łączymy się zwykłym mongodb://.
 */
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  const parsed = new URL(uri);
  const hostname = parsed.hostname;
  const servers = getDnsServers();
  const resolver = new Resolver();

  if (servers.length > 0) {
    resolver.setServers(servers);
  }

  const [srvRecords, txtRecords] = await Promise.all([
    resolver.resolveSrv(`_mongodb._tcp.${hostname}`),
    resolver.resolveTxt(hostname).catch(() => [] as string[][]),
  ]);

  if (!srvRecords.length) {
    throw new Error(`Brak rekordów SRV dla ${hostname}`);
  }

  const hosts = srvRecords
    .slice()
    .sort(
      (a, b) =>
        a.priority - b.priority || b.weight - a.weight || a.name.localeCompare(b.name),
    )
    .map((record) => `${record.name}:${record.port}`)
    .join(",");

  const auth =
    parsed.username || parsed.password
      ? `${encodeURIComponent(decodeURIComponent(parsed.username))}:${encodeURIComponent(decodeURIComponent(parsed.password))}@`
      : "";

  const params = new URLSearchParams(parsed.search);
  params.set("ssl", "true");
  params.set("tls", "true");

  for (const entry of txtRecords) {
    const text = entry.join("");
    for (const part of text.split("&")) {
      const [key, ...rest] = part.split("=");
      if (!key || rest.length === 0 || params.has(key)) continue;
      params.set(key, rest.join("="));
    }
  }

  const dbName = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
  return `mongodb://${auth}${hosts}${dbName}?${params.toString()}`;
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "Brak MONGODB_URI w zmiennych środowiskowych (.env.local).",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = await resolveMongoUri(MONGODB_URI);
      return mongoose.connect(uri, {
        bufferCommands: false,
        family: 4,
      });
    })().catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export function getMongoConnectionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("querySrv") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND")
  ) {
    return "Brak połączenia z MongoDB (DNS/sieć). Sprawdź MONGODB_URI i dostęp sieciowy Atlas (Network Access).";
  }

  if (message.includes("authentication failed") || message.includes("bad auth")) {
    return "Błędne dane logowania do MongoDB w MONGODB_URI.";
  }

  if (message.includes("MONGODB_URI") || message.includes("Brak rekordów SRV")) {
    return message;
  }

  return "Nie udało się połączyć z bazą danych.";
}
