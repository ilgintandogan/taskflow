# TaskFlow — Kanban Proje Yönetim Tahtası

## Proje Özeti

Küçük yazılım ekipleri için Trello benzeri, sürükle-bırak destekli görev yönetim uygulaması. Next.js + Supabase ile full-stack, Vercel'da deploy edilecek.

---

## Teknoloji Yığını

| Katman | Seçim | Gerekçe |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR + API routes tek repo'da, Vercel ile native uyum |
| Auth | Supabase Auth | Hazır UI kit, email/şifre + sosyal login, Row Level Security |
| Database | Supabase (PostgreSQL) | RLS ile board-bazlı izolasyon, realtime subscription |
| Drag & Drop | **dnd-kit** | react-beautiful-dnd bakımsız, dnd-kit aktif geliştirme, tree-shakeable, mobil pointer events desteği |
| Sıralama Algoritması | **Lexicographic / Fractional Indexing** | Tüm listeyi yeniden yazmadan araya ekleme O(1) |
| Styling | Tailwind CSS + CSS custom properties | Utility-first, dark mode trivial |
| State | Zustand + React Query (TanStack Query) | Lokal UI state + server cache ayrımı |
| Deployment | Vercel | Edge functions, preview deploys |

---

## Veri Modeli

```sql
-- Kullanıcılar Supabase Auth'tan gelir (auth.users)

create table boards (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users not null,
  title       text not null,
  created_at  timestamptz default now()
);

create table columns (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid references boards on delete cascade not null,
  title       text not null,
  position    text not null,  -- fractional index: "a0", "a1", "b0" …
  created_at  timestamptz default now()
);

create table cards (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid references columns on delete cascade not null,
  title       text not null,
  description text,
  position    text not null,  -- fractional index
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Row Level Security
alter table boards enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;

create policy "board owner" on boards
  using (owner_id = auth.uid());

create policy "board member columns" on columns
  using (board_id in (select id from boards where owner_id = auth.uid()));

create policy "board member cards" on cards
  using (column_id in (
    select c.id from columns c
    join boards b on c.board_id = b.id
    where b.owner_id = auth.uid()
  ));
```

### Neden `text` tipinde `position`?

Fractional indexing kütüphanesi (`fractional-indexing` npm) alfabetik olarak sıralanabilen string'ler üretir. İki eleman arasına yeni bir eleman eklemek için sadece o bir kaydı güncellemek yeterli; tüm listeyi yeniden numaralandırmaya gerek yok. Sayısal index (1, 2, 3) ise sıralama değiştiğinde N güncelleme gerektirir.

---

## Proje Yapısı

```
taskflow/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Auth guard + sidebar
│   │   ├── page.tsx            # Board listesi
│   │   └── board/[id]/
│   │       └── page.tsx        # Kanban tahtası
│   └── api/
│       ├── boards/route.ts
│       ├── columns/route.ts
│       └── cards/
│           ├── route.ts
│           └── [id]/move/route.ts   # Sürükleme sonrası position güncelleme
├── components/
│   ├── board/
│   │   ├── BoardCanvas.tsx     # DndContext wrapper
│   │   ├── Column.tsx          # SortableContext (dikey)
│   │   └── Card.tsx            # useSortable hook
│   ├── ui/                     # Paylaşılan primitive'ler
│   └── modals/
│       └── CardDetailModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server component client
│   ├── fractional-index.ts     # Yardımcı fonksiyonlar
│   └── types.ts                # Board, Column, Card tipleri
├── stores/
│   └── boardStore.ts           # Zustand: optimistic UI state
└── hooks/
    ├── useBoard.ts
    ├── useColumns.ts
    └── useCards.ts
```

---

## Sürükle-Bırak Mimarisi (dnd-kit)

```
BoardCanvas
└── DndContext (onDragEnd → handleDragEnd)
    ├── SortableContext [column-ids] (horizontal)
    │   ├── Column "Todo"
    │   │   └── SortableContext [card-ids] (vertical)
    │   │       ├── Card "Fix bug"
    │   │       └── Card "Write tests"
    │   ├── Column "In Progress"
    │   └── Column "Done"
    └── DragOverlay (sürüklenen kartın kopyası)
```

**`handleDragEnd` mantığı:**
1. `active.data.current.type === 'card'` ise kart taşınıyor
2. Hedef sütun ve konum belirlenir
3. **Optimistic update**: Zustand store anında güncellenir (UI takılmaz)
4. `PATCH /api/cards/[id]/move` → Supabase `position` ve `column_id` güncellenir
5. Hata olursa store eski haline döner (rollback)

---

## Kritik Tasarım Kararları

### 1. Sıralama Verisi Kalıcılığı
- Her kart ve sütunun `position` field'ı fractional index string'i tutar
- Sayfa yenilemesinde `order by position asc` ile sıralama korunur
- Optimistic update ile anlık görsel; async DB write ile kalıcılık

### 2. Mobil Kullanılabilirlik
- dnd-kit `PointerSensor` kullanılır (mouse + touch birleşik)
- `TouchSensor` ile 250ms uzun basma aktivasyonu (yanlışlıkla kaydırmayı engeller)
- Sütunlar yatay scroll container içinde; kartlar dikey scroll
- Minimum dokunma hedefi 44×44px (WCAG)

### 3. 48 Saat Önceliği
**YAPILACAK (core):**
- [ ] Auth (register/login/logout)
- [ ] Board CRUD
- [ ] Sütun ekleme/silme/yeniden adlandırma
- [ ] Kart ekleme/silme
- [ ] Sürükle-bırak (kart → kart arası, kart → sütun arası)
- [ ] Kart detay modal (başlık + açıklama düzenleme)
- [ ] Sıralama kalıcılığı

**BIRAKILACAK (scope dışı):**
- Kart etiketleri, son teslim tarihi, assignee
- Board paylaşma / çoklu kullanıcı
- Aktivite geçmişi
- Sütun sıralama (drag)
- Realtime collaboration

### 4. Performans
- `DragOverlay` ile orijinal kart DOM'da kalır, klon render edilir → reflow yok
- `useMemo` ile column'a ait card listesi memoize edilir
- Supabase query'leri `select` ile sadece gerekli kolonlar

---

## Ortam Değişkenleri

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Sadece server-side API routes için
```

---

## Kurulum & Geliştirme

```bash
# Bağımlılıklar
npm install
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @supabase/supabase-js @supabase/ssr
npm install fractional-indexing
npm install zustand @tanstack/react-query

# Dev server
npm run dev

# Supabase migration
npx supabase db push
```

---

## Deployment (Vercel)

1. GitHub'a push
2. Vercel'da "New Project" → repo seç
3. Environment variables ekle (Supabase URL + keys)
4. Framework: Next.js (otomatik algılar)
5. Deploy

---

## Stil Yönergeleri

- **Renk paleti**: Koyu arka plan (#0f1117), sütunlar hafif elevated kart (#1a1d27), kartlar beyaz/çok açık gri
- **Typography**: Geist (Next.js native) — başlıklar için `font-semibold`, metadata için `text-sm text-muted`
- **Drag feedback**: Sürüklenen kart `opacity-50 scale-105` + drop zone'larda `ring-2 ring-blue-500`
- **Responsive**: Sütunlar `min-w-[280px]`, board `overflow-x-auto flex gap-4`

---

## Bilinen Kısıtlar & Notlar

- `react-beautiful-dnd` **kullanma** — bakımsız, React 18 strict mode'da sorun çıkarır
- Supabase RLS politikaları **production'da aktif olmalı** — geliştirme kolaylığı için kapatma
- `fractional-indexing` `generateKeyBetween(a, b)` fonksiyonu; `a` veya `b` null olabilir (başa/sona ekleme)
- Optimistic update rollback için card'ın önceki `column_id` ve `position` değerlerini sakla

---

## Test Kriterleri

- [ ] Kart farklı sütuna taşındığında sayfa yenilenince doğru sütunda görünüyor
- [ ] Kart aynı sütun içinde yeniden sıralandığında sıra korunuyor
- [ ] Aynı anda iki sekme açıldığında biri güncelleyince diğeri bozulmuyor (eventual consistency kabul edilebilir)
- [ ] Mobile Safari'de uzun basma → sürükleme çalışıyor
- [ ] 50+ kart ile drag akıcı (60fps hedef)