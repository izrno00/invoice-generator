-- Dashboard demo data (seed)
-- ---------------------------------------------------------------------------
-- Gives one account a year of realistic activity so the dashboard has
-- something to show: 4 demo clients, ~12 months of paid invoices in EUR (plus
-- some USD), overdue and due-soon invoices and a draft. All dates are relative
-- to the day it runs.
--
-- Every demo row is tagged with a client email on the reserved, undeliverable
-- domain `payable-demo.invalid`; `dashboard-demo-cleanup.sql` removes exactly
-- those rows (paid ones included) and restores the invoice number counters.
--
-- Demo invoices have no PDF, so "Download PDF" doesn't work on them.
--
-- Run as the database owner (Supabase SQL editor or MCP `execute_sql`) after
-- replacing <USER_ID> with the account's auth user id. Refuses to run twice.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user    uuid := '<USER_ID>';
  v_domain  constant text := 'payable-demo.invalid';
  v_month   date := date_trunc('month', current_date)::date;
  v_profile public.profiles%rowtype;
  v_client  public.clients%rowtype;
  v_spec    record;
  v_item    jsonb;
  v_invoice uuid;
  v_pos     integer;
  v_vat     numeric;
  v_net     bigint;
  v_tax     bigint;
  v_sub     bigint;
  v_taxsum  bigint;
  v_count   integer := 0;
begin
  if exists (select 1 from public.clients where user_id = v_user and email like '%@' || v_domain) then
    raise exception 'Demo data already exists for this user. Run dashboard-demo-cleanup.sql first.';
  end if;

  select * into strict v_profile from public.profiles where id = v_user;

  -- Clients ------------------------------------------------------------------
  insert into public.clients (user_id, full_name, company_name, email, address, vat_id) values
    (v_user, 'Ana Kovač',      'Northwind Studio',       'ana@'      || v_domain, E'Ilica 42\n10000 Zagreb\nCroatia',          'HR12345678901'),
    (v_user, 'Marko Horvat',   'Lumen Analytics d.o.o.', 'billing@'  || v_domain, E'Riva 8\n21000 Split\nCroatia',             'HR98765432109'),
    (v_user, 'Lea Novak',      'Harbor & Pine',          'lea@'      || v_domain, E'Korzo 15\n51000 Rijeka\nCroatia',          null),
    (v_user, 'Jordan Mills',   'Atlas Robotics Inc.',    'ap@'       || v_domain, E'500 Market St\nSan Francisco, CA 94105\nUSA', null);

  -- Invoices -----------------------------------------------------------------
  -- kind: paid | unpaid | draft
  -- paid:   paid on day `day` of the month `month_offset` months back; issued 14 days earlier.
  -- unpaid: due `due_offset` days from today; issued 14 days before that (never later than 2 days ago).
  -- draft:  issued yesterday, due in 13 days.
  -- items:  [description, unit (hours|flat), quantity, unit price in cents]
  for v_spec in
    with specs(kind, client, month_offset, day, due_offset, items) as (
      values
        ('paid',   'Northwind Studio',       11, 12, null, '[["Product design, sprint 1","hours",24,18000]]'::jsonb),
        ('paid',   'Lumen Analytics d.o.o.', 11, 22, null, '[["Dashboard UX audit","flat",1,360000]]'),
        ('paid',   'Harbor & Pine',          10, 16, null, '[["Brand workshop and moodboards","hours",30,18000]]'),
        ('paid',   'Northwind Studio',        9,  9, null, '[["Product design, sprint 2","hours",40,18000]]'),
        ('paid',   'Lumen Analytics d.o.o.',  9, 24, null, '[["Usability testing, 5 sessions","flat",1,270000]]'),
        ('paid',   'Lumen Analytics d.o.o.',  8, 18, null, '[["Analytics dashboard design","hours",45,18000]]'),
        ('paid',   'Northwind Studio',        7,  7, null, '[["Design system foundations","hours",36,18000]]'),
        ('paid',   'Harbor & Pine',           7, 21, null, '[["Website art direction","flat",1,540000]]'),
        ('paid',   'Lumen Analytics d.o.o.',  6, 14, null, '[["Reporting module design","hours",50,18000]]'),
        ('paid',   'Northwind Studio',        5,  6, null, '[["Product design, sprint 3","hours",48,19500]]'),
        ('paid',   'Harbor & Pine',           5, 19, null, '[["Landing page design","hours",20,19500]]'),
        ('paid',   'Atlas Robotics Inc.',     4, 22, null, '[["Robot fleet UI concepts","hours",20,8000]]'),
        ('paid',   'Lumen Analytics d.o.o.',  4, 11, null, '[["Data visualisation library","hours",40,19500],["Accessibility review","flat",1,450000]]'),
        ('paid',   'Harbor & Pine',           3, 13, null, '[["Website build support","hours",32,19500]]'),
        ('paid',   'Northwind Studio',        2,  8, null, '[["Mobile app redesign","hours",60,19500]]'),
        ('paid',   'Lumen Analytics d.o.o.',  2, 23, null, '[["Design retainer, Q3","flat",1,720000]]'),
        ('paid',   'Atlas Robotics Inc.',     2, 18, null, '[["Operator console design","hours",35,8000]]'),
        ('paid',   'Lumen Analytics d.o.o.',  1,  8, null, '[["Onboarding flow redesign","hours",44,19500]]'),
        ('paid',   'Atlas Robotics Inc.',     1, 12, null, '[["Operator console, iteration 2","hours",30,8000]]'),
        ('paid',   'Northwind Studio',        1, 15, null, '[["Design system documentation","flat",1,480000]]'),
        ('paid',   'Harbor & Pine',           1, 28, null, '[["Seasonal campaign assets","hours",38,19500]]'),
        ('paid',   'Northwind Studio',        0,  6, null, '[["Product design, sprint 4","hours",50,19500]]'),
        ('paid',   'Atlas Robotics Inc.',     0, 10, null, '[["Field app prototype","hours",25,8000]]'),
        ('paid',   'Lumen Analytics d.o.o.',  0, 19, null, '[["Design retainer, Q4","flat",1,600000]]'),
        ('unpaid', 'Harbor & Pine',        null, null, -16, '[["Website build support","hours",28,19500]]'),
        ('unpaid', 'Northwind Studio',     null, null,  -7, '[["Icon set","flat",1,285000]]'),
        ('unpaid', 'Lumen Analytics d.o.o.', null, null, 0, '[["Analytics dashboard, phase 2","hours",30,19500]]'),
        ('unpaid', 'Northwind Studio',     null, null,   3, '[["Product design, sprint 5","hours",22,19500]]'),
        ('unpaid', 'Atlas Robotics Inc.',  null, null,   5, '[["Field app usability study","hours",18,8000]]'),
        ('unpaid', 'Harbor & Pine',        null, null,   7, '[["Newsletter templates","flat",1,420000]]'),
        ('unpaid', 'Lumen Analytics d.o.o.', null, null, 19, '[["Design retainer, December","hours",40,19500]]'),
        ('draft',  'Northwind Studio',     null, null, null, '[["Website retainer, December","flat",1,450000]]')
    )
    , timed as (
      select
        s.*,
        -- Payments in the current month never land in the future.
        case when s.kind = 'paid' then
          least(
            (((v_month - make_interval(months => s.month_offset))::date + (s.day - 1)) + time '10:30') at time zone 'UTC',
            now() - interval '1 hour'
          )
        end as paid_at
      from specs s
    )
    select t.*
    from timed t
    -- Numbers follow the invoice dates, as if the invoices were made over the year.
    order by coalesce(t.paid_at::date - 14, least(current_date + t.due_offset - 14, current_date - 2), current_date - 1), t.client
  loop
    select * into strict v_client from public.clients
     where user_id = v_user and company_name = v_spec.client and email like '%@' || v_domain;

    -- Croatian VAT for EU clients, none for the US export.
    v_vat := case when v_spec.client = 'Atlas Robotics Inc.' then 0 else 25 end;

    insert into public.invoices (
      user_id, client_id, status, invoice_date, due_date, currency, comments,
      sender_full_name, sender_company_name, sender_email, sender_address, sender_vat_id, sender_website,
      client_full_name, client_company_name, client_email, client_address, client_vat_id, client_display_name
    )
    select
      v_user, v_client.id, case when v_spec.kind = 'draft' then 'draft' else 'unpaid' end::public.invoice_status,
      d.invoice_date, d.due_date,
      case when v_vat = 0 then 'USD' else 'EUR' end::public.currency_code,
      'Thank you for your business!',
      v_profile.full_name, v_profile.company_name, v_profile.email, v_profile.address, v_profile.vat_id, v_profile.website,
      v_client.full_name, v_client.company_name, v_client.email, v_client.address, v_client.vat_id, v_client.display_name
    from (
      select
        case v_spec.kind
          when 'paid'   then (v_spec.paid_at::date - 14)
          when 'unpaid' then least(current_date + v_spec.due_offset - 14, current_date - 2)
          else current_date - 1
        end as invoice_date,
        case v_spec.kind
          when 'paid'   then (v_spec.paid_at::date - 14) + 14
          when 'unpaid' then current_date + v_spec.due_offset
          else current_date + 13
        end as due_date
    ) d
    returning id into v_invoice;

    v_pos := 0; v_sub := 0; v_taxsum := 0;
    for v_item in select * from jsonb_array_elements(v_spec.items) loop
      v_net := (v_item->>2)::bigint * (v_item->>3)::bigint;
      v_tax := round(v_net * v_vat / 100);
      insert into public.invoice_items (invoice_id, user_id, position, description, unit, quantity, unit_price_cents, vat_rate, net_cents, vat_cents)
      values (v_invoice, v_user, v_pos, v_item->>0, (v_item->>1)::public.line_unit, (v_item->>2)::integer, (v_item->>3)::bigint, v_vat, v_net, v_tax);
      v_pos := v_pos + 1; v_sub := v_sub + v_net; v_taxsum := v_taxsum + v_tax;
    end loop;

    update public.invoices
       set subtotal_cents = v_sub, tax_cents = v_taxsum, total_cents = v_sub + v_taxsum,
           first_sent_at = case when v_spec.kind = 'draft' then null else invoice_date + time '09:00' end,
           last_sent_at  = case when v_spec.kind = 'draft' then null else invoice_date + time '09:00' end
     where id = v_invoice;

    -- Paid last: a paid invoice and its items are locked.
    if v_spec.kind = 'paid' then
      update public.invoices
         set status = 'paid', paid_at = v_spec.paid_at, paid_method = 'manual',
             paid_amount_cents = total_cents, paid_currency = currency
       where id = v_invoice;
    end if;

    v_count := v_count + 1;
  end loop;

  raise notice 'Dashboard demo data: 4 clients and % invoices added.', v_count;
end $$;
