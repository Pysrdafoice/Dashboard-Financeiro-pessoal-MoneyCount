-- supabase/schema.sql — tabela de backup do MoneyCount.
--
-- COMO APLICAR: abra o projeto no painel do Supabase → SQL Editor → cole este
-- arquivo inteiro → Run. É idempotente: pode rodar de novo sem quebrar nada.
--
-- Cada usuário tem exatamente UMA linha (user_id é a chave primária) com o
-- estado inteiro do app em JSON. A anon key fica exposta no navegador; quem
-- garante que ninguém lê/escreve a linha dos outros são as políticas de RLS
-- abaixo (auth.uid() = user_id).

create table if not exists public.backups_usuario (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  dados      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.backups_usuario enable row level security;

drop policy if exists "backups_usuario: ler o próprio backup" on public.backups_usuario;
create policy "backups_usuario: ler o próprio backup"
  on public.backups_usuario
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "backups_usuario: criar o próprio backup" on public.backups_usuario;
create policy "backups_usuario: criar o próprio backup"
  on public.backups_usuario
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "backups_usuario: atualizar o próprio backup" on public.backups_usuario;
create policy "backups_usuario: atualizar o próprio backup"
  on public.backups_usuario
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mantém updated_at correto a cada upsert vindo do app.
create or replace function public.backups_usuario_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists backups_usuario_updated_at on public.backups_usuario;
create trigger backups_usuario_updated_at
  before update on public.backups_usuario
  for each row execute function public.backups_usuario_set_updated_at();
