# Studio23 — Nuovo sito web: Design Spec

**Data:** 2026-09-07
**Cliente:** Studio23 (studio23lainate.it) — centro di fisioterapia/osteopatia e nutrizione a Lainate (MI)
**Riferimento attuale:** https://www.studio23lainate.it/#!/services

## Obiettivo

Realizzare un nuovo sito one-page per Studio23, con design moderno ed elegante, animazioni sobrie, pienamente responsive, che riprenda il branding attuale (colori, logo) migliorandone la resa visiva. Il cliente deve poter modificare autonomamente i testi principali (servizi, team, orari/contatti) senza intervento tecnico, tramite un pannello CMS semplice.

## Struttura del sito

One-page con navigazione ad ancora e scroll-spy nella navbar sticky:

1. **Home / Hero** — headline, sottotitolo, CTA (es. "Prenota una visita"), immagine hero.
2. **Servizi** — due card principali: Fisioterapia & Osteopatia, Dietetica & Nutrizione. Ogni card: titolo, descrizione breve, icona/immagine.
3. **Team** — Dr. Alessandro Lanza (fisioterapista) e Dr. Vanessa Bernardo (dietista): foto, ruolo, breve bio/specializzazioni.
4. **Contatti** — indirizzo (via Prima Strada 23/B, Lainate MI), telefono (347 339 3314 / 333 219 7073), email (info@studio23lainate.it), orari (Lun-Ven 16-20, Sab 8-12), mappa embed, form di contatto.

Fuori scope per questa versione: blog/news, pagine multiple separate, area riservata pazienti, e-commerce/prenotazione online integrata (il CTA "Prenota" punta a telefono/email/form, non a un sistema di booking).

## Stack tecnico

- **Framework:** Astro (output statico, HTML/CSS minimale, JS solo dove serve per le interazioni).
- **CMS:** Decap CMS montato su `/admin`, backend Git tramite **Netlify Identity + Git Gateway** (nessun servizio OAuth esterno da mantenere).
- **Repository:** GitHub, connesso a Netlify per build/deploy automatico ad ogni push.
- **Hosting:** Netlify (piano gratuito è sufficiente per questo traffico).
- **Collections CMS editabili dal cliente:**
  - `servizi`: titolo, descrizione, icona/immagine (per ogni servizio).
  - `team`: nome, ruolo, bio, foto (per ogni professionista).
  - `contatti`: indirizzo, telefoni, email, orari settimanali.
  - `hero`: headline, sottotitolo, testo CTA.

## Branding e design system

- Recupero palette colori e logo dal sito attuale di Studio23 come base.
- Applico la stessa palette a un layout moderno: molto spazio bianco, gerarchia tipografica chiara (font pulito e leggibile, coerente con l'ambito medico/wellness), contrasti rivisti per accessibilità (WCAG AA minimo su testo/sfondo).
- Componenti coerenti (card, bottoni, badge orari "aperto ora") riutilizzati tra le sezioni.

## Animazioni

Stile "subtle scroll-reveal + micro-interazioni", pensato per restare leggero su tutti i device:

- **Scroll-reveal:** fade + slide leggero (translateY 16-24px, opacity 0→1) su card servizi, foto/bio team, blocco contatti. Implementato con `IntersectionObserver` nativo (nessuna libreria esterna pesante).
- **Micro-interazioni:** hover/tap su bottoni e card (scale/ombra leggera), transizioni CSS fluide (200-300ms, easing standard).
- **Navbar:** effetto sticky con leggero cambio di sfondo/ombra allo scroll; scroll-spy per evidenziare la sezione attiva.
- Nessun parallax pesante o animazioni bloccanti: garantisce fluidità anche su mobile di fascia bassa e rispetta `prefers-reduced-motion` (le animazioni si disattivano se l'utente lo richiede a livello OS).

## Immagini

Placeholder eleganti a tema wellness/medico (stile pulito, coerente col settore) per hero, servizi e team, in attesa delle foto reali dello studio. Le immagini sono gestite come campi CMS, quindi sostituibili dal cliente stesso in autonomia una volta disponibili gli scatti reali.

## Responsive

Mobile-first: navbar con menu hamburger sotto breakpoint tablet, card servizi/team che passano da grid multi-colonna a singola colonna, hero con immagine che si adatta senza crop aggressivo. Test su viewport mobile (375px), tablet (768px) e desktop (1440px+).

## Deployment

1. Repo GitHub creato e collegato a Netlify.
2. Netlify Identity abilitato + Git Gateway per Decap CMS.
3. Build automatica Astro ad ogni push su `main`.
4. Dominio: in questa fase il sito viene sviluppato su un sottodominio Netlify (`*.netlify.app`); il collegamento del dominio definitivo `studio23lainate.it` è un passo successivo, da concordare con il cliente per evitare downtime del sito attualmente online.

## Testing

- Verifica responsive nei tre breakpoint su browser.
- Lighthouse (performance, accessibilità, SEO) — target 90+ su ciascuna metrica.
- Test funzionale pannello `/admin`: login Netlify Identity, modifica di un contenuto in ciascuna collection, verifica che il commit generi un nuovo deploy.
- Verifica `prefers-reduced-motion` disattivi correttamente le animazioni.
