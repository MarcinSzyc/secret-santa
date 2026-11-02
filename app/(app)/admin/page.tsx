import { requireAdmin } from "@/lib/auth";
import { db, getEvent } from "@/lib/db";
import { plural } from "@/lib/format";
import {
  addParticipant,
  removeParticipant,
  renameParticipant,
  resetDraw,
  runDraw,
  saveSettings,
  sendInvite,
  sendReminders,
} from "@/lib/actions";
import { INVITE_TOKEN_DAYS } from "@/lib/auth";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CheckIcon, XIcon } from "@/components/icons";

// Drawing sends one e-mail per person, which can take a while over Gmail SMTP.
export const maxDuration = 60;

function statusLabel(count: number, loggedIn: boolean, invitedAt?: Date | null): { text: string; tone: string } {
  if (loggedIn) {
    return count > 0
      ? { text: `Lista: ${plural(count, "pozycja", "pozycje", "pozycji")}`, tone: "pill-green" }
      : { text: "Dołączył(a) · pusta lista", tone: "pill-red" };
  }
  if (invitedAt) {
    const day = invitedAt.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
    return { text: `Wysłane ${day} · nieprzyjęte`, tone: "pill-amber" };
  }
  return { text: "Niezaproszony(a)", tone: "pill-grey" };
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const me = await requireAdmin();
  const { msg } = await searchParams;
  const { users } = await db();
  const [people, event] = await Promise.all([
    users.find({}, { projection: { name: 1, email: 1, wishlist: 1, lastLoginAt: 1, invitedAt: 1 } }).sort({ name: 1 }).toArray(),
    getEvent(),
  ]);
  const { drawnAt } = event;
  const joined = people.filter((p) => p.lastLoginAt).length;

  return (
    <>
      <div className="stack-sm">
        <h1 className="page-title">Organizator</h1>
        <p className="lead">Dodaj uczestników po e-mailu, a gdy wszyscy będą gotowi — uruchom losowanie.</p>
      </div>

      {msg && <p className="notice" role="status">{msg}</p>}

      <div className="row">
        <section aria-labelledby="uczestnicy" className="card stack" style={{ flex: "999 1 560px", minWidth: 0, padding: 28 }}>
          <div className="spread" style={{ alignItems: "baseline" }}>
            <h2 id="uczestnicy" className="h2">Uczestnicy</h2>
            <span className="body">{plural(people.length, "osoba", "osoby", "osób")} · zalogowani: {joined}</span>
          </div>

          {!drawnAt && (
            <form action={addParticipant} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <div className="stack-sm" style={{ flex: "1 1 180px", minWidth: 0 }}>
                <label htmlFor="p-name" className="label">Imię i nazwisko</label>
                <input id="p-name" name="name" required maxLength={80} placeholder="Jan Kowalski" className="input sm" />
              </div>
              <div className="stack-sm" style={{ flex: "1 1 220px", minWidth: 0 }}>
                <label htmlFor="p-email" className="label">E-mail</label>
                <input id="p-email" name="email" type="email" required placeholder="jan@example.com" className="input sm" />
              </div>
              <button type="submit" className="btn btn-outline sm">Dodaj osobę</button>
            </form>
          )}

          <div className="table-box">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Osoba</th>
                  <th scope="col">Status</th>
                  {!drawnAt && <th scope="col"><span className="sr-only">Akcje</span></th>}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => {
                  const label = statusLabel(p.wishlist?.length ?? 0, !!p.lastLoginAt, p.invitedAt);
                  const isMe = p._id.equals(me._id);
                  return (
                    <tr key={p._id.toString()}>
                      <td>
                        <form action={renameParticipant} className="name-form">
                          <input type="hidden" name="userId" value={p._id.toString()} />
                          <label htmlFor={`name-${p._id}`} className="sr-only">Imię i nazwisko: {p.email}</label>
                          <input id={`name-${p._id}`} name="name" required maxLength={80} defaultValue={p.name} className="name-input" title="Kliknij, żeby zmienić imię" />
                          <button type="submit" className="btn sm name-save">Zapisz</button>
                        </form>
                        <div className="email">{p.email}</div>
                      </td>
                      <td><span className={`pill ${label.tone}`}>{label.text}</span></td>
                      {!drawnAt && (
                        <td className="row-actions">
                          {!isMe && !p.lastLoginAt && (
                            <form action={sendInvite}>
                              <input type="hidden" name="userId" value={p._id.toString()} />
                              <ConfirmButton className={`btn sm ${p.invitedAt ? "btn-outline" : ""}`} pendingLabel="Wysyłam…">
                                {p.invitedAt ? "Wyślij ponownie" : "Zaproś mailem"}
                              </ConfirmButton>
                            </form>
                          )}
                          {!isMe && (
                            <form action={removeParticipant}>
                              <input type="hidden" name="userId" value={p._id.toString()} />
                              <ConfirmButton className="icon-btn" confirm={`Usunąć ${p.name} z listy?`} pendingLabel="…">
                                <XIcon />
                                <span className="sr-only">Usuń {p.name}</span>
                              </ConfirmButton>
                            </form>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted">
            „Zaproś mailem” wysyła wiadomość z przyciskiem, który od razu loguje (ważnym {INVITE_TOKEN_DAYS} dni). Status zmieni się na
            zielony, gdy osoba dołączy. Ty też jesteś na liście i bierzesz udział w losowaniu. Imię zmienisz, klikając je w tabeli.
          </p>
        </section>

        <div className="stack" style={{ flex: "1 1 320px", minWidth: 0, gap: 24 }}>
          <section aria-labelledby="ustawienia" className="card stack" style={{ padding: 28, gap: 16 }}>
            <div className="stack-sm">
              <h2 id="ustawienia" className="h2">Budżet i termin</h2>
              <p className="muted">Widoczne dla wszystkich w aplikacji i w mailu po losowaniu. Możesz zmienić w każdej chwili.</p>
            </div>
            <form action={saveSettings} className="stack" style={{ gap: 14 }}>
              <div className="stack-sm">
                <label htmlFor="budget" className="label">Prezent Secret Santa (zł)</label>
                <input id="budget" name="budget" type="number" inputMode="numeric" min={0} step={1} placeholder="np. 100" defaultValue={event.budget ?? ""} className="input sm" />
              </div>
              <div className="stack-sm">
                <label htmlFor="childBudget" className="label">Prezent dla dziecka (zł)</label>
                <input id="childBudget" name="childBudget" type="number" inputMode="numeric" min={0} step={1} placeholder="np. 80" defaultValue={event.childBudget ?? ""} className="input sm" />
              </div>
              <div className="stack-sm">
                <label htmlFor="exchangeDate" className="label">Wymiana prezentów</label>
                <input id="exchangeDate" name="exchangeDate" maxLength={60} placeholder="np. 24 grudnia, Wigilia u babci" defaultValue={event.exchangeDate ?? ""} className="input sm" />
              </div>
              <button type="submit" className="btn btn-outline sm">Zapisz</button>
            </form>
          </section>

          <section aria-labelledby="losowanie" className="card-dark stack" style={{ padding: 28, gap: 16 }}>
            <h2 id="losowanie" className="h2">Losowanie</h2>
            {!drawnAt ? (
              <>
                <p className="on-dark" style={{ fontSize: 15 }}>
                  Aplikacja przypisze każdej osobie kogoś innego — nikt nie wylosuje siebie, a pary tworzą jedno zamknięte koło.
                </p>
                <form action={runDraw}>
                  <ConfirmButton
                    className="btn btn-light block"
                    confirm={`Losujemy pary dla ${people.length} osób i wysyłamy wszystkim maila. Kontynuować?`}
                    pendingLabel="Losuję i wysyłam maile…"
                  >
                    Losuj pary ({plural(people.length, "osoba", "osoby", "osób")})
                  </ConfirmButton>
                </form>
                <p className="on-dark" style={{ fontSize: 14 }}>
                  Po losowaniu lista uczestników zostaje zamknięta, a każdy dostanie e-mail z linkiem do aplikacji.
                </p>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
                  <CheckIcon />
                  <span>Losowanie zakończone {drawnAt.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}</span>
                </div>
                <p className="on-dark" style={{ fontSize: 15 }}>
                  Każdy widzi już swoją osobę po zalogowaniu. Pary są tajne — nawet organizator ich nie widzi.
                </p>
                <form action={sendReminders}>
                  <ConfirmButton
                    className="btn btn-ghost-light block"
                    confirm="Wysłać maila do osób, które mają pustą listę życzeń?"
                    pendingLabel="Wysyłam…"
                  >
                    Przypomnij o pustych listach
                  </ConfirmButton>
                </form>
                <form action={resetDraw}>
                  <ConfirmButton
                    className="link-btn on-dark"
                    confirm="Cofnąć losowanie? Wszystkie pary zostaną skasowane, a ludzie mogli już zacząć kupować prezenty."
                    pendingLabel="Cofam…"
                  >
                    Cofnij losowanie
                  </ConfirmButton>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
