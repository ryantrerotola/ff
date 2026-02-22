import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface OfflinePattern {
  id: string;
  slug: string;
  name: string;
  category: string;
  difficulty: string;
  waterType: string;
  description: string;
  origin: string | null;
  materials: unknown[];
  variations: unknown[];
  resources: unknown[];
  savedAt: number;
}

interface SyncAction {
  id: string;
  type: "rating" | "save" | "like";
  payload: Record<string, unknown>;
  createdAt: number;
}

interface FlyPatternDBSchema extends DBSchema {
  patterns: {
    key: string;
    value: OfflinePattern;
    indexes: { "by-slug": string; "by-saved-at": number };
  };
  syncQueue: {
    key: string;
    value: SyncAction;
    indexes: { "by-created-at": number };
  };
}

let dbPromise: Promise<IDBPDatabase<FlyPatternDBSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FlyPatternDBSchema>("flypatterndb-offline", 1, {
      upgrade(db) {
        const patternStore = db.createObjectStore("patterns", {
          keyPath: "id",
        });
        patternStore.createIndex("by-slug", "slug", { unique: true });
        patternStore.createIndex("by-saved-at", "savedAt");

        const syncStore = db.createObjectStore("syncQueue", {
          keyPath: "id",
        });
        syncStore.createIndex("by-created-at", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function savePatternOffline(
  pattern: Omit<OfflinePattern, "savedAt">,
): Promise<void> {
  const db = await getDB();
  await db.put("patterns", { ...pattern, savedAt: Date.now() });
}

export async function removePatternOffline(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("patterns", id);
}

export async function getOfflinePattern(
  slug: string,
): Promise<OfflinePattern | undefined> {
  const db = await getDB();
  return db.getFromIndex("patterns", "by-slug", slug);
}

export async function getAllOfflinePatterns(): Promise<OfflinePattern[]> {
  const db = await getDB();
  return db.getAllFromIndex("patterns", "by-saved-at");
}

export async function isPatternSavedOffline(id: string): Promise<boolean> {
  const db = await getDB();
  const pattern = await db.get("patterns", id);
  return !!pattern;
}

export async function addToSyncQueue(
  action: Omit<SyncAction, "id" | "createdAt">,
): Promise<void> {
  const db = await getDB();
  await db.add("syncQueue", {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  });
}

export async function processSyncQueue(): Promise<void> {
  const db = await getDB();
  const actions = await db.getAllFromIndex(
    "syncQueue",
    "by-created-at",
  );

  for (const action of actions) {
    try {
      let url = "";
      let method = "POST";
      let body = {};

      switch (action.type) {
        case "rating":
          url = "/api/ratings";
          body = action.payload;
          break;
        case "save":
          url = "/api/saved-patterns";
          body = action.payload;
          break;
        case "like":
          url = "/api/likes";
          body = action.payload;
          break;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok || res.status === 409) {
        await db.delete("syncQueue", action.id);
      }
    } catch {
      // Network error — leave in queue for next sync
      break;
    }
  }
}

// Auto-sync when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processSyncQueue();
  });
}
