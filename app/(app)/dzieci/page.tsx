import { requireUser } from "@/lib/auth";
import { db, getEvent } from "@/lib/db";
import { initials, money } from "@/lib/format";
import { claimGift, releaseGift } from "@/lib/actions";
import { WishText } from "@/components/WishText";

export default async function KidsPage() {
  const me = await requireUser();
  const { children, users } = await db();
  const [kids, event] = await Promise.all([children.find({}).sort({ name: 1 }).toArray(), getEvent()]);
  const parents = await users
    .find({ _id: { $in: kids.map((k) => k.parentId) } }, { projection: { name: 1 } })
    .toArray();
  const parentName = new Map(parents.map((p) => [p._id.toString(), p.name]));
  const myCount = kids.flatMap((k) => k.gifts).filter((g) => g.claimedById?.equals(me._id)).length;

  return (
    <>
      <div className="spread" style={{ gap: "16px 32px" }}>
        <div className="stack-sm" style={{ flex: "1 1 480px", minWidth: 0 }}>
          <h1 className="page-title">Listy dzieci</h1>
          <p className="lead">Wybierz prezent, który kupujesz — pozostali zobaczą, że jest już zajęty, i nic się nie zdubluje.</p>
        </div>
        {event.childBudget != null && (
          <p className="pill pill-green lg">Budżet na dziecko: {money(event.childBudget)}</p>
        )}
        <p className="body">
          <strong style={{ color: "var(--ink)" }}>{myCount}</strong> zarezerwowane przez Ciebie
        </p>
      </div>

      {kids.length === 0 ? (
        <p className="empty">Nikt jeszcze nie dodał dziecka. Możesz to zrobić na stronie „Mój Secret Santa”.</p>
      ) : (
        <div className="grid-cards">
          {kids.map((k) => (
            <article key={k._id.toString()} className="card stack" style={{ padding: 24, gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="avatar lg" aria-hidden="true">{initials(k.name)}</span>
                <div className="stack-sm" style={{ gap: 2 }}>
                  <h2 className="display" style={{ fontSize: 22 }}>{k.name}</h2>
                  <span className="muted" style={{ fontSize: 13 }}>Rodzic: {parentName.get(k.parentId.toString()) ?? "—"}</span>
                </div>
              </div>
              {k.gifts.length === 0 ? (
                <p className="muted">Lista jest jeszcze pusta.</p>
              ) : (
                <ul className="list">
                  {k.gifts.map((g) => {
                    const mine = g.claimedById?.equals(me._id);
                    return (
                      <li key={g.id} className="gift">
                        <span className="item-text"><WishText text={g.text} /></span>
                        {!g.claimedById ? (
                          <form action={claimGift}>
                            <input type="hidden" name="childId" value={k._id.toString()} />
                            <input type="hidden" name="giftId" value={g.id} />
                            <button type="submit" className="claim-btn">Kupuję to</button>
                          </form>
                        ) : mine ? (
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px" }}>
                            <span className="pill pill-solid lg">Kupujesz Ty</span>
                            <form action={releaseGift}>
                              <input type="hidden" name="childId" value={k._id.toString()} />
                              <input type="hidden" name="giftId" value={g.id} />
                              <button type="submit" className="link-btn">Rezygnuję</button>
                            </form>
                          </div>
                        ) : (
                          <span className="pill pill-grey lg" style={{ alignSelf: "flex-start" }}>Kupuje: {g.claimedByName}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
