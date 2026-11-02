import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { config } from "./config";
import { LOGIN_TOKEN_MINUTES } from "./auth";
import type { EventInfo } from "./db";
import { zl } from "./format";

let transporter: Transporter | undefined;

function transport(): Transporter {
  transporter ??= nodemailer.createTransport({
    service: "gmail",
    pool: true,
    auth: { user: config.gmailUser(), pass: config.gmailAppPassword().replace(/\s+/g, "") },
  });
  return transporter;
}

type Mail = { subject: string; html: string; text: string };

export async function sendMail(to: string, mail: Mail): Promise<void> {
  await transport().sendMail({
    from: { name: config.eventName(), address: config.gmailUser() },
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

// ---- Templates (match the "Maile" artboards in the design canvas) ----

const C = {
  ground: "#F4F5F2",
  ink: "#18211D",
  body: "#4A5550",
  muted: "#5E6964",
  line: "#DDE2DC",
  pine: "#1F5C45",
  pineSoft: "#DCEBE3",
  pineLabel: "#CFE3D8",
  red: "#C2412D",
};
const SANS = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const DISPLAY = "'Bricolage Grotesque', Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function button(href: string, label: string, dark = true): string {
  const bg = dark ? C.pine : "#FFFFFF";
  const fg = dark ? "#FFFFFF" : C.pine;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:${bg}">
<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:700;color:${fg};text-decoration:none;border-radius:10px">${esc(label)}</a>
</td></tr></table>`;
}

function layout(preheader: string, cards: string, footer: string): string {
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.ground}">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ground}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 0 20px;font-family:${DISPLAY};font-size:20px;font-weight:700;color:${C.ink}">
<span style="color:${C.red}">&#9670;</span>&nbsp; ${esc(config.eventName())}
</td></tr>
${cards}
<tr><td style="padding:20px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted};text-align:center">${footer}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function whiteCard(inner: string): string {
  return `<tr><td style="background:#FFFFFF;border:1px solid ${C.line};border-radius:16px;padding:36px;font-family:${SANS};color:${C.ink}">${inner}</td></tr>`;
}

function h1(text: string, color: string = C.ink): string {
  return `<h1 style="margin:0 0 16px;font-family:${DISPLAY};font-size:28px;line-height:1.2;color:${color}">${esc(text)}</h1>`;
}

function p(html: string, color: string = C.body, size = 16): string {
  return `<p style="margin:0 0 18px;font-size:${size}px;line-height:1.6;color:${color}">${html}</p>`;
}

function eventFooter(event: EventInfo): string {
  const parts = [
    event.budget != null && `Budżet: ${zl(event.budget)}`,
    event.childBudget != null && `Prezent dla dziecka: ${zl(event.childBudget)}`,
    event.exchangeDate && `Wymiana prezentów: ${esc(event.exchangeDate)}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function loginMail(url: string): Mail {
  const subject = `Twój link do ${config.eventName()}`;
  const html = layout(
    "Kliknij, aby się zalogować — bez hasła.",
    whiteCard(
      h1("Zaloguj się jednym kliknięciem") +
        p("Cześć! Ktoś (mamy nadzieję, że Ty) poprosił o link do logowania w Secret Santa. Kliknij przycisk poniżej — nie potrzebujesz żadnego hasła.") +
        button(url, "Zaloguj się") +
        `<div style="height:18px"></div>` +
        p(`Link działa przez ${LOGIN_TOKEN_MINUTES} minut. Jeśli to nie Ty prosiłeś o logowanie, po prostu zignoruj tę wiadomość.`, C.muted, 14) +
        `<div style="border-top:1px solid #E4E8E3;padding-top:16px;font-size:13px;line-height:1.6;color:${C.muted}">Przycisk nie działa? Skopiuj ten adres do przeglądarki:<br><a href="${esc(url)}" style="color:${C.pine};word-break:break-all">${esc(url)}</a></div>`,
    ),
    "Dostajesz tę wiadomość, bo jesteś na liście uczestników Secret Santa.",
  );
  const text = `Zaloguj się do ${config.eventName()}:\n${url}\n\nLink działa przez ${LOGIN_TOKEN_MINUTES} minut. Jeśli to nie Ty prosiłeś o logowanie, zignoruj tę wiadomość.`;
  return { subject, html, text };
}

export function drawMail(name: string, url: string, event: EventInfo): Mail {
  const first = name.split(" ")[0] || name;
  const subject = "Losowanie zakończone — sprawdź, komu kupujesz prezent";
  const html = layout(
    "Masz już swoją osobę. Zaloguj się, żeby ją zobaczyć.",
    `<tr><td style="background:${C.pine};border-radius:16px;padding:36px;font-family:${SANS};color:#FFFFFF">
<p style="margin:0 0 14px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:${C.pineLabel}">Losowanie zakończone</p>
${h1(`Cześć ${first}, masz już swoją osobę!`, "#FFFFFF")}
${p("Aplikacja rozlosowała pary. Imienia nie piszemy w mailu — żeby nikt przypadkiem nie podejrzał go na Twoim telefonie. Zaloguj się, aby zobaczyć, komu kupujesz prezent, i przejrzeć jego listę życzeń.", C.pineSoft)}
${button(url, "Zobacz, kogo wylosowałeś", false)}
</td></tr>
<tr><td style="height:20px"></td></tr>
<tr><td style="background:#FFFFFF;border:1px solid ${C.line};border-radius:16px;padding:24px 28px;font-family:${SANS}">
<h2 style="margin:0 0 8px;font-size:16px;color:${C.ink}">Przy okazji</h2>
<p style="margin:0;font-size:15px;line-height:1.6;color:${C.body}">Sprawdź, czy Twoja lista życzeń jest kompletna — Twój Mikołaj właśnie ją zobaczył. Zajrzyj też do list dzieci i zarezerwuj prezent, który kupujesz.</p>
</td></tr>`,
    eventFooter(event),
  );
  const text = `Cześć ${first}!\n\nLosowanie zakończone. Zaloguj się, żeby zobaczyć, komu kupujesz prezent:\n${url}\n\nSprawdź też, czy Twoja lista życzeń jest kompletna.`;
  return { subject, html, text };
}

export function reminderMail(name: string, url: string): Mail {
  const first = name.split(" ")[0] || name;
  const subject = "Twój Mikołaj czeka na listę życzeń";
  const html = layout(
    "Dopisz choć 2–3 pomysły na prezent.",
    whiteCard(
      h1("Twoja lista życzeń jest jeszcze pusta") +
        p(`Cześć ${esc(first)}! Osoba, która Cię wylosowała, zagląda do aplikacji i nie wie, czym Cię ucieszyć. Dopisz choć 2–3 pomysły — wystarczy link do sklepu albo krótki opis.`) +
        `<div style="background:${C.ground};border-radius:12px;padding:16px 18px;margin:0 0 20px;font-size:15px;line-height:1.7;color:${C.body}"><strong style="color:${C.ink}">Przykłady:</strong><br>„Ciepłe skarpety, rozm. 42–44”<br>„https://…/ksiazka-ktora-chce”</div>` +
        button(url, "Uzupełnij listę"),
    ),
    "Wysłane przez organizatora Secret Santa.",
  );
  const text = `Cześć ${first}!\n\nTwoja lista życzeń jest jeszcze pusta. Dopisz choć 2–3 pomysły:\n${url}`;
  return { subject, html, text };
}
