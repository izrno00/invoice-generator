-- Dashboard demo data (cleanup)
-- ---------------------------------------------------------------------------
-- Removes what `dashboard-demo-seed.sql` added for one account: every invoice
-- whose client email is on `payable-demo.invalid` (paid ones included) and the
-- demo clients. Real data is never touched.
--
-- Paid invoices are normally locked (private.protect_invoice). This script
-- turns the two lock triggers off only inside its own transaction; if anything
-- fails, everything rolls back and the triggers stay on.
--
-- Invoice number counters go back to where they were before the seed, but
-- only when no real invoice was numbered after the demo ones. Otherwise the
-- counter is left alone and the demo numbers stay a gap (PRD §6.14 AC5).
--
-- Run as the database owner after replacing <USER_ID> with the account's auth user id.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user     uuid := '<USER_ID>';
  v_domain   constant text := 'payable-demo.invalid';
  v_year     record;
  v_invoices integer;
  v_clients  integer;
begin
  create temporary table demo_numbers on commit drop as
    select invoice_year as year, min(invoice_seq) as first_seq, max(invoice_seq) as last_seq
      from public.invoices
     where user_id = v_user and client_email like '%@' || v_domain
     group by invoice_year;

  alter table public.invoices      disable trigger invoices_protect;
  alter table public.invoice_items disable trigger invoice_items_protect;

  -- Items go with their invoice (on delete cascade).
  delete from public.invoices where user_id = v_user and client_email like '%@' || v_domain;
  get diagnostics v_invoices = row_count;

  alter table public.invoices      enable trigger invoices_protect;
  alter table public.invoice_items enable trigger invoice_items_protect;

  delete from public.clients where user_id = v_user and email like '%@' || v_domain;
  get diagnostics v_clients = row_count;

  for v_year in select * from demo_numbers loop
    -- Only rewind when the demo invoices were the last ones numbered that year.
    update private.invoice_counters c
       set last_seq = v_year.first_seq - 1
     where c.user_id = v_user and c.year = v_year.year and c.last_seq = v_year.last_seq;

    delete from private.invoice_counters c
     where c.user_id = v_user and c.year = v_year.year and c.last_seq = 0;
  end loop;

  raise notice 'Dashboard demo data removed: % invoices, % clients.', v_invoices, v_clients;
end $$;
