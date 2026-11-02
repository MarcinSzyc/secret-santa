import type { EventInfo } from "@/lib/db";
import { money, zl } from "@/lib/format";

/** The gift rules in plain words, adapted to the budgets the organizer set. Collapsible. */
export function HowItWorks({ event, open }: { event: EventInfo; open: boolean }) {
  const split = event.budget != null && event.budgetNoKids != null && event.budget !== event.budgetNoKids;
  const single = event.budget ?? event.budgetNoKids;

  return (
    <details className="card how" open={open}>
      <summary>
        <h2 className="h2">Jak to działa</h2>
        <svg className="chevron" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <ol className="steps">
        <li className="step">
          <span className="num">1</span>
          <div className="stack-sm">
            <h3 className="step-title">Losowanie</h3>
            {split ? (
              <>
                <p className="body">Losujesz jedną osobę i kupujesz jej prezent. Budżet zależy od tego, czy ta osoba ma dzieci:</p>
                <ul className="budget-list">
                  <li><span>ma dzieci</span><strong>{zl(event.budget!)}</strong></li>
                  <li><span>nie ma dzieci</span><strong>{zl(event.budgetNoKids!)}</strong></li>
                </ul>
                <p className="muted">Kwotę dla swojej osoby zobaczysz po losowaniu, przy jej imieniu.</p>
              </>
            ) : (
              <p className="body">
                Losujesz jedną osobę i kupujesz jej prezent{single != null && <> — <strong>{zl(single)}</strong></>}. Nikt nie wylosuje
                siebie.
              </p>
            )}
          </div>
        </li>
        <li className="step">
          <span className="num">2</span>
          <div className="stack-sm">
            <h3 className="step-title">Prezenty dla dzieci</h3>
            <p className="body">
              Dzieci nie biorą udziału w losowaniu — każde ma publiczną listę. Wybierz z niej prezent
              {event.childBudget != null && <> (<strong>{money(event.childBudget)}</strong>)</>} i kliknij „Kupuję to”, żeby nikt nie
              kupił tego samego.
            </p>
            {split && <p className="muted">Dlatego rodzice dostają tańszy prezent — ich dzieci też dostają prezenty.</p>}
          </div>
        </li>
        <li className="step">
          <span className="num">3</span>
          <div className="stack-sm">
            <h3 className="step-title">Twoja lista</h3>
            <p className="body">
              Dopisz linki albo opisy tego, co chcesz dostać. Twoją listę widzi tylko osoba, która Cię wylosowała — nikt inny, nawet
              organizator.
            </p>
          </div>
        </li>
      </ol>
    </details>
  );
}
