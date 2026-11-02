"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId, MongoServerError } from "mongodb";
import { appUrl, isAdminEmail, normalizeEmail } from "./config";
import { db, getDrawnAt, getEvent } from "./db";
import { createLoginToken, endSession, recentlySentLink, requireAdmin, requireUser } from "./auth";
import { drawMail, loginMail, reminderMail, sendMail } from "./mail";

const MAX_TEXT = 500;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim().slice(0, MAX_TEXT);
}

function objectId(formData: FormData, key: string): ObjectId | null {
  const raw = String(formData.get(key) ?? "");
  return ObjectId.isValid(raw) ? new ObjectId(raw) : null;
}

// ---------- Login ----------

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "To nie wygląda na poprawny adres e-mail.", email };
  }

  const { users } = await db();
  let user = await users.findOne({ email });
  if (!user && isAdminEmail(email)) {
    // The organizer can always log in, even before adding themselves to the list.
    const doc = { _id: new ObjectId(), email, name: email.split("@")[0], wishlist: [], createdAt: new Date() };
    await users.insertOne(doc);
    user = doc;
  }
  if (!user) {
    return {
      status: "error",
      message: "Nie ma tego adresu na liście uczestników. Napisz do organizatora, żeby Cię dodał.",
      email,
    };
  }

  if (!(await recentlySentLink(user._id))) {
    const token = await createLoginToken(user._id);
    const url = `${await appUrl()}/api/auth/verify?token=${token}`;
    try {
      await sendMail(user.email, loginMail(url));
    } catch (err) {
      console.error("Nie udało się wysłać maila z linkiem", err);
      return { status: "error", message: "Nie udało się wysłać maila. Spróbuj za chwilę.", email };
    }
  }
  return { status: "sent", email };
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/login");
}

// ---------- My wishlist ----------

export async function addWish(formData: FormData): Promise<void> {
  const user = await requireUser();
  const value = text(formData, "text");
  if (!value) return;
  const { users } = await db();
  await users.updateOne(
    { _id: user._id },
    { $push: { wishlist: { id: randomUUID(), text: value, createdAt: new Date() } } },
  );
  revalidatePath("/");
}

export async function removeWish(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { users } = await db();
  await users.updateOne({ _id: user._id }, { $pull: { wishlist: { id } } });
  revalidatePath("/");
}

// ---------- My children ----------

export async function addChild(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = text(formData, "name").slice(0, 60);
  if (!name) return;
  const { children } = await db();
  await children.insertOne({ _id: new ObjectId(), parentId: user._id, name, gifts: [], createdAt: new Date() });
  revalidatePath("/");
  revalidatePath("/dzieci");
}

export async function removeChild(formData: FormData): Promise<void> {
  const user = await requireUser();
  const childId = objectId(formData, "childId");
  if (!childId) return;
  const { children } = await db();
  await children.deleteOne({ _id: childId, parentId: user._id });
  revalidatePath("/");
  revalidatePath("/dzieci");
}

export async function addChildGift(formData: FormData): Promise<void> {
  const user = await requireUser();
  const childId = objectId(formData, "childId");
  const value = text(formData, "text");
  if (!childId || !value) return;
  const { children } = await db();
  await children.updateOne(
    { _id: childId, parentId: user._id },
    { $push: { gifts: { id: randomUUID(), text: value, claimedById: null, claimedByName: null, createdAt: new Date() } } },
  );
  revalidatePath("/");
  revalidatePath("/dzieci");
}

export async function removeChildGift(formData: FormData): Promise<void> {
  const user = await requireUser();
  const childId = objectId(formData, "childId");
  const giftId = String(formData.get("giftId") ?? "");
  if (!childId) return;
  const { children } = await db();
  await children.updateOne({ _id: childId, parentId: user._id }, { $pull: { gifts: { id: giftId } } });
  revalidatePath("/");
  revalidatePath("/dzieci");
}

// ---------- Claiming children's gifts ----------

export async function claimGift(formData: FormData): Promise<void> {
  const user = await requireUser();
  const childId = objectId(formData, "childId");
  const giftId = String(formData.get("giftId") ?? "");
  if (!childId) return;
  const { children } = await db();
  // Only succeeds while the gift is still free, so two people can't grab the same one.
  await children.updateOne(
    { _id: childId, gifts: { $elemMatch: { id: giftId, claimedById: null } } },
    { $set: { "gifts.$.claimedById": user._id, "gifts.$.claimedByName": user.name } },
  );
  revalidatePath("/");
  revalidatePath("/dzieci");
}

export async function releaseGift(formData: FormData): Promise<void> {
  const user = await requireUser();
  const childId = objectId(formData, "childId");
  const giftId = String(formData.get("giftId") ?? "");
  if (!childId) return;
  const { children } = await db();
  await children.updateOne(
    { _id: childId, gifts: { $elemMatch: { id: giftId, claimedById: user._id } } },
    { $set: { "gifts.$.claimedById": null, "gifts.$.claimedByName": null } },
  );
  revalidatePath("/");
  revalidatePath("/dzieci");
}

// ---------- Organizer ----------

function back(msg: string): never {
  revalidatePath("/", "layout");
  redirect(`/admin?msg=${encodeURIComponent(msg)}`);
}

function amount(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").replace(",", ".").trim();
  if (!raw) return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 0 && n <= 100_000 ? n : null;
}

export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin();
  const { meta } = await db();
  await meta.updateOne(
    { _id: "event" },
    {
      $set: {
        budget: amount(formData, "budget"),
        childBudget: amount(formData, "childBudget"),
        exchangeDate: text(formData, "exchangeDate").slice(0, 60) || null,
      },
      $setOnInsert: { drawnAt: null },
    },
    { upsert: true },
  );
  back("Zapisano ustawienia.");
}

export async function addParticipant(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = text(formData, "name").slice(0, 80);
  const email = normalizeEmail(text(formData, "email"));
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("Podaj imię i poprawny e-mail.");
  if (await getDrawnAt()) back("Losowanie już się odbyło — lista uczestników jest zamknięta.");
  const { users } = await db();
  // Adding an existing e-mail just updates the name (handy for the organizer's own entry).
  const res = await users.updateOne(
    { email },
    { $set: { name }, $setOnInsert: { email, wishlist: [], createdAt: new Date() } },
    { upsert: true },
  );
  back(res.upsertedCount ? `Dodano: ${name}.` : `Zaktualizowano: ${name}.`);
}

export async function removeParticipant(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = objectId(formData, "userId");
  if (!id) back("Nie znaleziono osoby.");
  if (id.equals(admin._id)) back("Nie możesz usunąć samego siebie.");
  if (await getDrawnAt()) back("Losowanie już się odbyło — najpierw je cofnij.");
  const { users, sessions, children } = await db();
  await users.deleteOne({ _id: id });
  await sessions.deleteMany({ userId: id });
  await children.deleteMany({ parentId: id });
  await children.updateMany(
    { "gifts.claimedById": id },
    { $set: { "gifts.$[g].claimedById": null, "gifts.$[g].claimedByName": null } },
    { arrayFilters: [{ "g.claimedById": id }] },
  );
  back("Usunięto osobę.");
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function runDraw(): Promise<void> {
  await requireAdmin();
  const { users, meta } = await db();
  const people = await users.find({}, { projection: { _id: 1, name: 1, email: 1 } }).toArray();
  if (people.length < 3) back("Do losowania potrzeba co najmniej 3 osób.");

  // Claim the draw atomically: a second click (or a second admin) hits the duplicate key.
  try {
    await meta.updateOne({ _id: "event", drawnAt: null }, { $set: { drawnAt: new Date() } }, { upsert: true });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) back("Losowanie już się odbyło.");
    throw err;
  }

  // One shuffled circle: everyone gives to the next person, so nobody draws themselves.
  const circle = shuffle(people);
  try {
    await users.bulkWrite(
      circle.map((giver, i) => ({
        updateOne: { filter: { _id: giver._id }, update: { $set: { receiverId: circle[(i + 1) % circle.length]._id } } },
      })),
    );
  } catch (err) {
    await meta.updateOne({ _id: "event" }, { $set: { drawnAt: null } });
    throw err;
  }

  const url = await appUrl();
  const event = await getEvent();
  let failed = 0;
  for (const person of people) {
    try {
      await sendMail(person.email, drawMail(person.name, url, event));
    } catch (err) {
      failed++;
      console.error(`Nie wysłano maila po losowaniu do ${person.email}`, err);
    }
  }
  back(
    failed
      ? `Losowanie zakończone. Nie udało się wysłać ${failed} maili — daj tym osobom znać ręcznie.`
      : "Losowanie zakończone. Wszyscy dostali maila.",
  );
}

export async function resetDraw(): Promise<void> {
  await requireAdmin();
  const { users, meta } = await db();
  await users.updateMany({}, { $set: { receiverId: null } });
  await meta.updateOne({ _id: "event" }, { $set: { drawnAt: null } }, { upsert: true });
  back("Losowanie cofnięte. Możesz zmienić listę i losować od nowa.");
}

export async function sendReminders(): Promise<void> {
  await requireAdmin();
  const { users } = await db();
  const empty = await users.find({ "wishlist.0": { $exists: false } }).toArray();
  if (empty.length === 0) back("Wszyscy mają coś na liście — nie ma do kogo pisać.");
  const url = await appUrl();
  let sent = 0;
  for (const person of empty) {
    try {
      await sendMail(person.email, reminderMail(person.name, url));
      sent++;
    } catch (err) {
      console.error(`Nie wysłano przypomnienia do ${person.email}`, err);
    }
  }
  back(`Wysłano przypomnienia: ${sent} z ${empty.length}.`);
}
