-- Migration 003 : "Déjà postulé" — flag sur les favoris
-- À exécuter dans Supabase > SQL Editor

alter table public.favorites
  add column if not exists applied boolean not null default false;
