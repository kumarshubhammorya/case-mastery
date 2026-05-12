
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  school text,
  target_industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.tg_set_updated_at();

create table public.frameworks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  structure jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.frameworks enable row level security;
create policy "frameworks_read_all" on public.frameworks for select to authenticated using (true);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text not null,
  exhibits jsonb not null default '[]'::jsonb,
  type text not null,
  industry text,
  difficulty text not null default 'medium',
  source text not null default 'library' check (source in ('library','user','ai')),
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.cases enable row level security;
create policy "cases_read_library" on public.cases for select to authenticated using (source = 'library' or owner_id = auth.uid());
create policy "cases_insert_own" on public.cases for insert to authenticated with check (owner_id = auth.uid() and source in ('user','ai'));
create policy "cases_update_own" on public.cases for update to authenticated using (owner_id = auth.uid());
create policy "cases_delete_own" on public.cases for delete to authenticated using (owner_id = auth.uid());

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  framework_id uuid references public.frameworks(id) on delete set null,
  workspace_state jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  debrief jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
create policy "sessions_select_own" on public.sessions for select using (user_id = auth.uid());
create policy "sessions_insert_own" on public.sessions for insert with check (user_id = auth.uid());
create policy "sessions_update_own" on public.sessions for update using (user_id = auth.uid());
create policy "sessions_delete_own" on public.sessions for delete using (user_id = auth.uid());
create trigger sessions_updated_at before update on public.sessions for each row execute procedure public.tg_set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "messages_select_own_session" on public.messages for select using (
  exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "messages_insert_own_session" on public.messages for insert with check (
  exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
);

create index sessions_user_idx on public.sessions(user_id, started_at desc);
create index messages_session_idx on public.messages(session_id, created_at);
create index cases_source_idx on public.cases(source);

insert into public.frameworks (slug, name, description, structure) values
('profitability', 'Profitability Tree', 'Decompose profit into revenue and cost drivers (MECE).', '[{"id":"profit","label":"Profit","children":[{"id":"revenue","label":"Revenue","children":[{"id":"price","label":"Price per unit"},{"id":"volume","label":"Volume"},{"id":"mix","label":"Product mix"}]},{"id":"costs","label":"Costs","children":[{"id":"variable","label":"Variable costs"},{"id":"fixed","label":"Fixed costs"}]}]}]'::jsonb),
('porters', 'Porters 5 Forces', 'Industry attractiveness via 5 competitive forces.', '[{"id":"rivalry","label":"Competitive rivalry"},{"id":"new_entrants","label":"Threat of new entrants"},{"id":"substitutes","label":"Threat of substitutes"},{"id":"buyers","label":"Bargaining power of buyers"},{"id":"suppliers","label":"Bargaining power of suppliers"}]'::jsonb),
('market_entry', 'Market Entry', 'Should the client enter this new market?', '[{"id":"market","label":"Market attractiveness","children":[{"id":"size","label":"Market size & growth"},{"id":"profitability","label":"Profitability"},{"id":"competition","label":"Competition"}]},{"id":"client","label":"Client capabilities","children":[{"id":"fit","label":"Strategic fit"},{"id":"resources","label":"Resources & capabilities"}]},{"id":"entry","label":"Entry mode","children":[{"id":"build","label":"Build"},{"id":"buy","label":"Buy"},{"id":"partner","label":"Partner"}]},{"id":"risks","label":"Risks & financials"}]'::jsonb),
('four_ps', '4 Ps (Marketing Mix)', 'Product, Price, Place, Promotion.', '[{"id":"product","label":"Product"},{"id":"price","label":"Price"},{"id":"place","label":"Place"},{"id":"promotion","label":"Promotion"}]'::jsonb),
('ma', 'M&A Evaluation', 'Should the client acquire the target?', '[{"id":"target","label":"Target attractiveness","children":[{"id":"financials","label":"Financials"},{"id":"market_pos","label":"Market position"}]},{"id":"synergies","label":"Synergies","children":[{"id":"revenue_syn","label":"Revenue synergies"},{"id":"cost_syn","label":"Cost synergies"}]},{"id":"integration","label":"Integration risk"},{"id":"valuation","label":"Valuation & deal terms"}]'::jsonb);

insert into public.cases (title, prompt, type, industry, difficulty, source) values
('SkyHigh Airlines: Margin Compression','Our client SkyHigh Airlines is a mid-size US carrier whose net margin has dropped from 8% to 2% over 18 months despite a 10% increase in passenger volume. Fuel costs are stable. Identify the root cause and recommend three actions.','Profitability','Airlines','medium','library'),
('AquaStream Utilities','AquaStream, a Pacific Northwest municipal water provider, has seen a 12% revenue decline despite population growth. The CEO wants to know why and how to reverse it.','Profitability','Utilities','easy','library'),
('GreenLeaf Coffee: Europe Expansion','GreenLeaf, a US specialty coffee chain with 250 stores, is considering entering Germany. Should they enter, and if so, how?','Market Entry','F&B','medium','library'),
('NovaPharm: Generics Launch','NovaPharm holds a patent expiring in 18 months on a $1.2B blockbuster. Should they launch an authorized generic? What is the expected revenue impact?','Pricing','Pharma','hard','library'),
('FinEdge Acquisition','FinEdge, a regional US bank, is considering acquiring a fintech lender for $800M. Is this a good deal?','M&A','Financial Services','hard','library'),
('UrbanFresh Grocery Pricing','UrbanFresh, an urban grocery chain, is testing dynamic pricing on perishables. Does it make sense to roll out nationally?','Pricing','Retail','medium','library'),
('Helios Solar: Profitability','Helios installs residential solar. Revenue grew 40% YoY but operating profit fell 20%. Why?','Profitability','Energy','medium','library'),
('SchoolPad: K-12 SaaS','SchoolPad, a K-12 admin SaaS, has 60% gross margins but is burning $2M/quarter. Should they raise prices, cut costs, or pivot?','Profitability','Education','medium','library'),
('Atlas Logistics: Last Mile','Atlas wants to enter same-day urban delivery in 3 US metros. Sizing the opportunity and recommending a go/no-go.','Market Sizing','Logistics','medium','library'),
('Bloom Cosmetics: Channel Strategy','Bloom sells via Sephora (60%), DTC (30%), Amazon (10%). DTC margins are 3x retail. How should they shift channel mix?','Strategy','CPG','easy','library'),
('IronCore Steel: Cost Restructuring','IronCore faces 25% input cost inflation and cannot raise prices due to import competition. Where do they cut?','Profitability','Industrial','hard','library'),
('ChatLoom: Freemium Conversion','ChatLoom has 8M free users and 80K paid (1% conversion). Industry benchmark is 4%. Diagnose and recommend.','Profitability','SaaS','medium','library');
