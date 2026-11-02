import "server-only";
import { MongoClient, type Db, type ObjectId } from "mongodb";
import { config } from "./config";

export type WishItem = {
  id: string;
  text: string;
  createdAt: Date;
};

export type User = {
  _id: ObjectId;
  email: string;
  name: string;
  wishlist: WishItem[];
  /** Who this person buys a gift for. Set by the draw, never shown to anyone else. */
  receiverId?: ObjectId | null;
  lastLoginAt?: Date | null;
  invitedAt?: Date | null;
  createdAt: Date;
};

export type ChildGift = {
  id: string;
  text: string;
  claimedById?: ObjectId | null;
  claimedByName?: string | null;
  createdAt: Date;
};

export type Child = {
  _id: ObjectId;
  parentId: ObjectId;
  name: string;
  gifts: ChildGift[];
  createdAt: Date;
};

export type LoginToken = {
  tokenHash: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
};

export type Session = {
  tokenHash: string;
  userId: ObjectId;
  expiresAt: Date;
};

export type EventMeta = {
  _id: "event";
  drawnAt: Date | null;
  /** Gift budget in PLN for adults (the Secret Santa gift) and for each child's gift. */
  budget?: number | null;
  childBudget?: number | null;
  /** Free text, e.g. "24 grudnia". */
  exchangeDate?: string | null;
};

export type EventInfo = {
  drawnAt: Date | null;
  budget: number | null;
  childBudget: number | null;
  exchangeDate: string | null;
};

declare global {
  // Reused across hot reloads in dev and across invocations of a warm serverless function.
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIndexesReady: Promise<void> | undefined;
}

function client(): Promise<MongoClient> {
  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = new MongoClient(config.mongoUri()).connect();
  }
  return globalThis._mongoClientPromise;
}

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("children").createIndex({ parentId: 1 }),
    db.collection("loginTokens").createIndex({ tokenHash: 1 }),
    db.collection("loginTokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

export async function db() {
  const database = (await client()).db(config.mongoDb());
  if (!globalThis._mongoIndexesReady) {
    globalThis._mongoIndexesReady = ensureIndexes(database).catch((err) => {
      globalThis._mongoIndexesReady = undefined;
      throw err;
    });
  }
  await globalThis._mongoIndexesReady;
  return {
    users: database.collection<User>("users"),
    children: database.collection<Child>("children"),
    loginTokens: database.collection<LoginToken>("loginTokens"),
    sessions: database.collection<Session>("sessions"),
    meta: database.collection<EventMeta>("meta"),
  };
}

export async function getEvent(): Promise<EventInfo> {
  const { meta } = await db();
  const doc = await meta.findOne({ _id: "event" });
  return {
    drawnAt: doc?.drawnAt ?? null,
    budget: doc?.budget ?? null,
    childBudget: doc?.childBudget ?? null,
    exchangeDate: doc?.exchangeDate ?? null,
  };
}

export async function getDrawnAt(): Promise<Date | null> {
  return (await getEvent()).drawnAt;
}
