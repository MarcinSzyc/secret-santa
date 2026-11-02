"use client";

import { useActionState, useState } from "react";
import { requestLoginLink, type LoginState } from "@/lib/actions";
import { MailIcon } from "@/components/icons";

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLoginLink, { status: "idle" });
  const [editing, setEditing] = useState(false);

  if (state.status === "sent" && !editing) {
    return (
      <>
        <div className="icon-tile">
          <MailIcon />
        </div>
        <div className="stack-sm" style={{ gap: 8 }}>
          <h1 className="display" style={{ fontSize: 32, lineHeight: 1.15 }}>Sprawdź skrzynkę</h1>
          <p className="lead">
            Wysłaliśmy link na <strong style={{ color: "var(--ink)" }}>{state.email}</strong>. Kliknij go, aby się
            zalogować — jest ważny 15 minut. Nie widzisz maila? Zajrzyj do spamu.
          </p>
        </div>
        <button type="button" className="link-btn" style={{ alignSelf: "flex-start", color: "var(--pine)", fontSize: 15 }} onClick={() => setEditing(true)}>
          Wpisz inny adres
        </button>
      </>
    );
  }

  const email = state.status === "idle" ? "" : state.email;
  return (
    <>
      <div className="stack-sm" style={{ gap: 8 }}>
        <h1 className="display" style={{ fontSize: 32, lineHeight: 1.15 }}>Zaloguj się</h1>
        <p className="lead">Podaj swój e-mail. Wyślemy Ci link do logowania — bez haseł.</p>
      </div>
      {linkError && state.status === "idle" && (
        <p className="error" role="alert">Ten link wygasł albo jest nieprawidłowy. Wyślij sobie nowy.</p>
      )}
      <form action={(fd) => { setEditing(false); action(fd); }} className="stack" style={{ gap: 16 }}>
        <div className="stack-sm">
          <label htmlFor="email" className="label">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="imie@example.com" defaultValue={email} className="input" style={{ fontSize: 16 }} />
        </div>
        {state.status === "error" && <p className="error" role="alert">{state.message}</p>}
        <button type="submit" className="btn block" disabled={pending} style={{ fontSize: 16 }}>
          {pending ? "Wysyłam…" : "Wyślij link logowania"}
        </button>
      </form>
      <p className="muted">Nie ma Cię na liście uczestników? Napisz do organizatora.</p>
    </>
  );
}
