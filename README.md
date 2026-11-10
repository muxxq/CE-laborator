# Boabă – aplicație mobilă de e-commerce (Tema 6)

Prăjitorie de cafea de specialitate. Backend **Medusa v2** + aplicație mobilă **React Native / Expo (SDK 58)**.

## Structură

| Folder | Ce conține |
|---|---|
| `backend/` | Server Medusa (Node.js, TypeScript), API REST pe portul **9000**, panou admin la `/app` |
| `mobile/` | Aplicația Expo (expo-router), pornită din exemplul oficial Medusa `react-native-expo` |
| `docker-compose.yml` | PostgreSQL 16 (container `boaba-db`, port **5434**) |

## Pornire (de fiecare dată)

```bash
# 1. Baza de date (pornește automat și la boot, dar pentru siguranță)
docker compose up -d

# 2. Backend – într-un terminal
cd backend && npm run dev

# 3. Aplicația mobilă – în alt terminal
cd mobile && npx expo start --port 8083   # 8082 e ocupat de opencart_web
```

Pe iPhone: deschide **Camera**, scanează codul QR din terminal, apoi aplicația se deschide în **Expo Go**.
Telefonul și laptopul trebuie să fie în aceeași rețea Wi-Fi.

## Acces

- Admin: <http://localhost:9000/app> – `admin@boaba.ro` / `Boaba2026!`
- Aplicația mobilă folosește `mobile/.env`:
  - `EXPO_PUBLIC_MEDUSA_URL=http://192.168.1.148:9000` (IP-ul laptopului din rețea, schimbă-l dacă se modifică)
  - `EXPO_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY` (din Admin → Settings → Publishable API Keys)

## Modificări făcute deja

- Upgrade aplicație de la Expo SDK 54 la SDK 58 (necesar pentru Expo Go actual)
- Importurile de navigație mutate pe `expo-router` (ThemeProvider, Drawer, Tabs, PlatformPressable)
- Corecturi de tipuri TypeScript pentru React Native 0.88
