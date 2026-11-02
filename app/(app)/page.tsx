import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { db, getEvent } from "@/lib/db";
import { firstName, initials, plural, zl } from "@/lib/format";
import { addChild, addChildGift, addWish, removeChild, removeChildGift, removeWish } from "@/lib/actions";
import { WishText } from "@/components/WishText";
import { XIcon } from "@/components/icons";

export default async function PanelPage() {
  const me = await requireUser();
  const { users, children } = await db();
  const [event, receiver, myChildren, participantCount] = await Promise.all([
    getEvent(),
    me.receiverId ? users.findOne({ _id: me.receiverId }, { projection: { name: 1, wishlist: 1 } }) : null,
    children.find({ parentId: me._id }).sort({ createdAt: 1 }).toArray(),
    users.countDocuments(),
  ]);
  const meta = [
    config.eventName(),
    plural(participantCount, "uczestnik", "uczestników", "uczestników"),
    event.budget != null && `budżet ${zl(event.budget)}`,
    event.exchangeDate && `wymiana: ${event.exchangeDate}`,
  ].filter(Boolean);
  const drawnAt = event.drawnAt;

  return (
    <>
      <div className="stack-sm">
        <h1 className="page-title">Cześć, {firstName(me.name)}</h1>
        <p className="lead">{meta.join(" · ")}</p>
      </div>

      <div className="row">
        <section aria-labelledby="los" className="card-dark col stack">
          <p id="los" className="eyebrow">Twój los</p>
          {drawnAt && receiver ? (
            <>
              <div className="stack-sm" style={{ gap: 4 }}>
                <p className="on-dark">Kupujesz prezent dla</p>
                <h2 className="big-name">{receiver.name}</h2>
              </div>
              <div className="inner-white stack" style={{ gap: 12 }}>
                <h3 style={{ fontSize: 16 }}>Lista życzeń: {firstName(receiver.name)}</h3>
                {receiver.wishlist.length ? (
                  <ol className="list" style={{ gap: 10 }}>
                    {receiver.wishlist.map((w, i) => (
                      <li key={w.id} className="item plain">
                        <span className="num">{i + 1}</span>
                        <span className="item-text"><WishText text={w.text} /></span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted">{firstName(receiver.name)} nie dodał(a) jeszcze nic do listy. Zajrzyj później.</p>
                )}
              </div>
              <p className="on-dark" style={{ fontSize: 14 }}>
                To przypisanie widzisz tylko Ty. {firstName(receiver.name)} nie wie, że to Ty.
              </p>
            </>
          ) : (
            <>
              <h2 className="display" style={{ fontSize: 36, lineHeight: 1.1 }}>Losowanie jeszcze przed nami</h2>
              <p className="on-dark">
                Organizator uruchomi je, gdy wszyscy dołączą. Dostaniesz maila, a tutaj pojawi się imię osoby, której kupujesz prezent.
              </p>
              <p style={{ fontWeight: 600 }}>W międzyczasie uzupełnij swoją listę życzeń.</p>
            </>
          )}
        </section>

        <section aria-labelledby="moja-lista" className="card col stack">
          <div className="stack-sm">
            <h2 id="moja-lista" className="h2">Moja lista życzeń</h2>
            <p className="body">Wklej link albo opisz prezent — jedna rzecz na raz. Listę zobaczy tylko osoba, która Cię wylosowała.</p>
          </div>
          <form action={addWish} className="stack-sm">
            <label htmlFor="new-item" className="label">Co chcesz dostać?</label>
            <div className="inline-form">
              <input id="new-item" name="text" required maxLength={500} autoComplete="off" placeholder="np. https://… albo „ciepłe skarpety, rozm. 42”" className="input" />
              <button type="submit" className="btn">Dodaj</button>
            </div>
          </form>
          {me.wishlist.length ? (
            <ol className="list">
              {me.wishlist.map((w, i) => (
                <li key={w.id} className="item">
                  <span className="num">{i + 1}</span>
                  <span className="item-text"><WishText text={w.text} /></span>
                  <form action={removeWish}>
                    <input type="hidden" name="id" value={w.id} />
                    <button type="submit" className="icon-btn" aria-label={`Usuń: ${w.text}`}><XIcon /></button>
                  </form>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">Twoja lista jest jeszcze pusta.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="dzieci" className="card stack" style={{ gap: 24 }}>
        <div className="spread">
          <div className="stack-sm" style={{ flex: "1 1 420px", minWidth: 0 }}>
            <h2 id="dzieci" className="h2">Moje dzieci</h2>
            <p className="body">Listy dzieci widzą wszyscy uczestnicy — każdy może zarezerwować prezent, który kupi.</p>
            {event.childBudget != null && (
              <p className="body">
                Budżet na prezent dla dziecka: <strong style={{ color: "var(--ink)" }}>{zl(event.childBudget)}</strong> — dopisuj rzeczy w tej cenie.
              </p>
            )}
          </div>
          <Link href="/dzieci" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 15, fontWeight: 600 }}>
            Zobacz wszystkie listy dzieci →
          </Link>
        </div>

        <div className="grid-cards">
          {myChildren.map((child) => (
            <article key={child._id.toString()} className="card-sub stack" style={{ gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="avatar lg" aria-hidden="true">{initials(child.name)}</span>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <h3 style={{ fontSize: 18 }}>{child.name}</h3>
                  <span className="muted">{plural(child.gifts.length, "prezent", "prezenty", "prezentów")}</span>
                </div>
                <form action={removeChild}>
                  <input type="hidden" name="childId" value={child._id.toString()} />
                  <button type="submit" className="icon-btn" aria-label={`Usuń dziecko: ${child.name}`}><XIcon /></button>
                </form>
              </div>
              {child.gifts.length > 0 && (
                <ul className="list">
                  {child.gifts.map((g) => (
                    <li key={g.id} className="gift-row">
                      <span className="item-text"><WishText text={g.text} /></span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {g.claimedByName ? (
                          <span className="pill pill-green">Kupuje: {g.claimedByName}</span>
                        ) : (
                          <span className="muted" style={{ fontSize: 13 }}>wolne</span>
                        )}
                        <form action={removeChildGift}>
                          <input type="hidden" name="childId" value={child._id.toString()} />
                          <input type="hidden" name="giftId" value={g.id} />
                          <button type="submit" className="icon-btn" aria-label={`Usuń: ${g.text}`}><XIcon size={16} /></button>
                        </form>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <form action={addChildGift} className="inline-form">
                <input type="hidden" name="childId" value={child._id.toString()} />
                <label htmlFor={`gift-${child._id}`} className="sr-only">Prezent dla: {child.name}</label>
                <input id={`gift-${child._id}`} name="text" required maxLength={500} autoComplete="off" placeholder="Dodaj prezent dla dziecka" className="input sm" />
                <button type="submit" className="btn btn-outline sm">Dodaj</button>
              </form>
            </article>
          ))}

          <form action={addChild} className="card-dashed stack" style={{ gap: 12 }}>
            <h3 style={{ fontSize: 18 }}>Dodaj dziecko</h3>
            <p className="muted">Dziecko nie bierze udziału w losowaniu — dostaje własną, publiczną listę prezentów.</p>
            <label htmlFor="child-name" className="label">Imię dziecka</label>
            <input id="child-name" name="name" required maxLength={60} autoComplete="off" placeholder="np. Staś" className="input sm" />
            <button type="submit" className="btn sm">Dodaj dziecko</button>
          </form>
        </div>
      </section>
    </>
  );
}
