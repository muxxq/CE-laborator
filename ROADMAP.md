# Roadmap – Boabă (Tema 6: customizarea unei aplicații de e-commerce pentru mobil)

> **Stack:** Medusa v2 (backend, PostgreSQL) + React Native / Expo SDK 58 (aplicație iOS, testată în Expo Go)
> **Concept:** prăjitorie de cafea de specialitate „Boabă” – boabe de cafea, măcinare la comandă, accesorii.

## Termene

| Moment | Săptămâna | Perioadă aprox. | Pondere |
|---|---|---|---|
| Azi | 6 | 2 noiembrie 2026 | – |
| **Raportarea I** | 7/8 | ~16–20 noiembrie | 40% din nota proiectului |
| **Raportarea II** | 11/12 | ~7–18 decembrie | 60% din nota proiectului |

Întârziere = **−2 puncte / săptămână**. Neprezentare = nota 1.

## Cum acoperim cerințele temei

| Cerință (din prezentare) | Cum o îndeplinim | Faza |
|---|---|---|
| Customizare profesională (temă custom) | Identitate „Boabă”: paletă, fonturi, logo, icon, splash, texte în română, Home redesenat | 1 |
| Modificări elementare în cod / funcționalitate | Upgrade SDK 54 → 58, fix navigație, filtru pe categorii, preț în RON, atribute cafea pe pagina de produs | 0–2 |
| Înțelegerea organizării + modificarea flow-ului | Documentația tehnică (arhitectură) + checkout modificat (pas nou: măcinare, interval livrare, puncte fidelitate) | 2, 5 |
| **≥ 3 pagini noi** cu date | Cont (login/înregistrare/profil), Istoric comenzi, Wishlist, Recenzii, Ghidul cafelei – **5 ecrane** | 3–5 |
| Operații cu BD + câmpuri noi | Module Medusa noi cu tabele proprii: `coffee_details`, `wishlist_item`, `review`, `loyalty_account` + câmpuri noi pe comandă | 4–5 |

---

## Faza 0 – Instalare ✅ (gata, 2 noiembrie)

- [x] PostgreSQL în Docker (`boaba-db`, port 5434)
- [x] Backend Medusa v2.18 instalat, migrat, cu date demo și cont de admin
- [x] Aplicația Expo pornită din exemplul oficial Medusa `react-native-expo`
- [x] Upgrade la Expo SDK 58 (singurul suportat de Expo Go), importuri de navigație mutate pe `expo-router`
- [x] Fix ecran negru (redirect-ul din `(tabs)/index.tsx` nu mai funcționa în noul router)
- [x] Aplicația rulează pe iPhone 11 Pro Max

## Faza 1 – Identitate și date „Boabă” (3–9 noiembrie)

**Backend**
- [ ] Script de seed propriu `src/scripts/seed-boaba.ts`, care înlocuiește tricourile demo:
  - regiunea **România** cu moneda **RON** (păstrăm și Europa / EUR)
  - categorii: *Espresso*, *Filtru*, *Decofeinizată*, *Accesorii*
  - ~12 cafele cu variante de gramaj (**250 g / 500 g / 1 kg**), stoc, prețuri, imagini
  - opțiuni de livrare: *Curier rapid*, *Easybox*, *Ridicare din prăjitorie*

**Aplicația mobilă**
- [ ] Paletă de culori „cafea” în `constants/theme.ts` (light + dark)
- [ ] Fonturi custom (de ex. Fraunces pentru titluri, Inter pentru text) prin `expo-font`
- [ ] Nume, icon, splash screen și scheme proprii în `app.json`
- [ ] Toate textele traduse în română, prețuri formatate `ro-RO`
- [ ] **Home redesenat**: hero cu oferta zilei, chips cu categorii, secțiunea „Recomandate”

## Faza 2 – Modificări elementare + pregătirea Raportării I (10–15 noiembrie)

**Cod**
- [ ] Filtrare după categorie pe Home (date reale din API)
- [ ] Pagina de produs afișează originea, prăjirea și notele aromatice (inițial din `metadata`, mutat în Faza 4 într-un tabel propriu)
- [ ] Badge „Stoc limitat” sub un anumit prag

**Documente pentru prezentare**
- [ ] **Planul de modificări**: secțiunea „Cum acoperim cerințele” de mai sus, detaliată
- [ ] **Prezentarea tehnică**:
  - tehnologii: TypeScript, Node.js, PostgreSQL, React Native, Expo, expo-router, Medusa JS SDK
  - arhitectura: aplicație mobilă ↔ Store API (REST + cheie publică) ↔ module Medusa ↔ PostgreSQL; Admin Dashboard ↔ Admin API
  - organizarea codului: rute expo-router, contexte (coș, regiune), module, workflows și API routes în Medusa
  - fluxul de cumpărare: coș → adresă → livrare → plată → comandă
- [ ] **Slide-uri** (8–10): concept, arhitectură, demo, ce s-a modificat deja, planul pentru Raportarea II
- [ ] Repetiție demo pe telefon (backend + Expo pornite, date curate)

### 🎯 Raportarea I (~16–20 noiembrie)
Prezinți: planul, arhitectura, aplicația rebranduită pe telefon și modificările de cod deja făcute.

---

## Faza 3 – Cont de client (23–29 noiembrie)

Folosim autentificarea de client din Medusa (`emailpass`, JWT).

- [ ] **Ecran nou 1 – Login / Înregistrare / Profil**: editare nume și telefon, adrese salvate, logout
- [ ] Contextul `auth-context.tsx`: token salvat în AsyncStorage, coșul asociat clientului la login
- [ ] **Ecran nou 2 – Istoric comenzi**: lista comenzilor (`/store/orders`) și detaliul unei comenzi (produse, total, status)
- [ ] Tab nou **„Cont”** în bara de jos

## Faza 4 – Module noi cu tabele în BD (30 noiembrie – 6 decembrie)

Fiecare modul Medusa = model de date + migrare (tabel nou) + service + API routes.

- [ ] **Modul `coffee-details`**: tabelul `coffee_details` (`origin`, `region`, `altitude`, `process`, `roast_level`, `tasting_notes`), legat de produs printr-un *module link*
  - widget în Admin, ca atributele să se poată edita din panou
  - expus în Store API și afișat pe pagina de produs
- [ ] **Modul `wishlist`**: tabelul `wishlist_item` (`customer_id`, `product_id`, `created_at`)
  - rutele `GET/POST/DELETE /store/wishlist`
  - **Ecran nou 3 – Wishlist** + inimioară pe cardul și pagina de produs
- [ ] **Modul `review`**: tabelul `review` (`product_id`, `customer_id`, `rating`, `title`, `comment`, `status`)
  - rutele `GET/POST /store/products/:id/reviews`, moderare din Admin
  - **Ecran nou 4 – Recenzii** (listă + formular), rating mediu pe cardul de produs

## Faza 5 – Flow nou de checkout + Ghidul cafelei (7–13 decembrie)

- [ ] **Pas nou în checkout „Preferințe”**:
  - tipul de măcinare pe produs: *boabe*, *espresso*, *moka*, *filtru*, *French press* (salvat pe linia din coș)
  - intervalul de livrare: *dimineața*, *după-amiaza*, *seara* (câmp nou pe comandă)
  - folosirea punctelor de fidelitate
- [ ] **Modul `loyalty`**: tabelul `loyalty_account` (`customer_id`, `points`)
  - un *subscriber* pe `order.placed` acordă 1 punct la fiecare 10 lei
  - punctele se transformă în reducere la checkout
- [ ] **Ecran nou 5 – Ghidul cafelei**: filtrare după origine, grad de prăjire și metodă de preparare, cu operatori ȘI / SAU
- [ ] Detaliul comenzii afișează măcinarea și intervalul ales

## Faza 6 – Finisare + Raportarea II (14–18 decembrie)

- [ ] Testare cap-coadă pe iPhone: cont nou → wishlist → recenzie → comandă cu puncte → istoric
- [ ] Date demo curate, imagini consistente, stări de încărcare și de eroare
- [ ] Slide-uri pentru Raportarea II: ce s-a adăugat, tabelele noi (diagramă ER), demo live
- [ ] Înregistrare video a demo-ului, ca rezervă dacă Wi-Fi-ul de la facultate nu cooperează

### 🎯 Raportarea II (săptămâna 11/12)
Prezinți cele 5 ecrane noi, cele 4 tabele noi + câmpurile pe comandă și flow-ul de checkout modificat.

---

## Idei bonus (dacă rămâne timp – „realizarea deosebită a proiectului”)

- Notificări push la schimbarea statusului comenzii (`expo-notifications`)
- Abonament lunar de cafea (livrare recurentă)
- „Recomandat pentru tine”, pe baza notelor aromatice din comenzile anterioare
- Build real de iOS printr-un cont Expo (EAS), instalat ca aplicație separată, nu în Expo Go

## Riscuri și cum le evităm

| Risc | Prevenire |
|---|---|
| Wi-Fi-ul de la facultate blochează conexiunea telefon ↔ laptop | Hotspot de pe telefon + video de rezervă cu demo-ul |
| IP-ul laptopului se schimbă | Actualizezi `EXPO_PUBLIC_MEDUSA_URL` în `mobile/.env` |
| O actualizare a Expo Go cere un SDK nou | Nu actualizezi Expo Go înainte de prezentări |
| Backend-ul nu e pornit la demo | Checklist de pornire în `README.md` |
