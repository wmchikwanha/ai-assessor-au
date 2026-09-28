
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null default 'Untitled assessment',
  provider text not null default '',
  unit_code text not null default '',
  unit_title text not null default '',
  program text not null default '',
  aqf_level int not null default 7,
  discipline text not null default '',
  cohort_size int not null default 0,
  delivery_mode text not null default 'On campus',
  teqsa_pathway text not null default 'unit-level',
  coordinator text not null default '',
  school text not null default '',
  learning_outcomes text not null default '',
  original_text text not null default '',
  clean_text text not null default '',
  privacy jsonb not null default '{}'::jsonb,
  privacy_cleared boolean not null default false,
  variants jsonb,
  swaps jsonb,
  scores jsonb,
  selected_stance text,
  certificate jsonb,
  certificate_hash text,
  certificate_history jsonb not null default '[]'::jsonb,
  prompt_version text,
  model text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assessments to authenticated;
grant all on public.assessments to service_role;
alter table public.assessments enable row level security;
create policy "own select" on public.assessments for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.assessments for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on public.assessments for update to authenticated using (auth.uid() = user_id);
create policy "own delete" on public.assessments for delete to authenticated using (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger assessments_touch before update on public.assessments for each row execute function public.touch_updated_at();

create table public.context_anchors (
  id uuid primary key default gen_random_uuid(),
  discipline text not null,
  generic_term text not null,
  au_equivalent text not null,
  source text not null,
  last_checked date not null default '2026-09-28'
);
grant select on public.context_anchors to authenticated;
grant all on public.context_anchors to service_role;
alter table public.context_anchors enable row level security;
create policy "read anchors" on public.context_anchors for select to authenticated using (true);

insert into public.context_anchors (discipline, generic_term, au_equivalent, source) values
('business','Wall Street / S&P 500','ASX 200 and ASX continuous disclosure (Listing Rule 3.1)','asx.com.au'),
('business','SEC','Australian Securities and Investments Commission (ASIC)','asic.gov.au'),
('business','FTC / consumer protection','Australian Competition and Consumer Commission (ACCC) and Australian Consumer Law','accc.gov.au'),
('business','Federal Reserve interest rate','Reserve Bank of Australia cash rate target','rba.gov.au'),
('business','IRS / federal income tax','Australian Taxation Office (ATO) income tax rules','ato.gov.au'),
('business','Sales tax / VAT','Goods and Services Tax (GST) administered by the ATO','ato.gov.au'),
('business','401(k) / pension plan','Superannuation guarantee and APRA-regulated super funds','ato.gov.au; apra.gov.au'),
('business','US GAAP','Australian Accounting Standards (AASB)','aasb.gov.au'),
('business','Sarbanes-Oxley','Corporations Act 2001 (Cth) and ASX Corporate Governance Principles and Recommendations','legislation.gov.au; asx.com.au'),
('business','Minimum wage (federal)','Fair Work Commission national minimum wage and modern awards','fairwork.gov.au'),
('business','At-will employment / labor law','Fair Work Act 2009 (Cth) and the National Employment Standards','fairwork.gov.au'),
('business','Enron / WorldCom case','Royal Commission into Misconduct in the Banking, Superannuation and Financial Services Industry (2019)','royalcommission.gov.au'),
('business','Census Bureau data','Australian Bureau of Statistics (ABS)','abs.gov.au'),
('it','GDPR','Privacy Act 1988 (Cth) and the Australian Privacy Principles','oaic.gov.au'),
('it','NIST Cybersecurity Framework','ASD Essential Eight maturity model','cyber.gov.au'),
('it','CISA','Australian Signals Directorate / Australian Cyber Security Centre','cyber.gov.au'),
('it','CCPA data breach notice','Notifiable Data Breaches scheme (Part IIIC, Privacy Act)','oaic.gov.au'),
('it','ACM professional code','Australian Computer Society (ACS) Code of Professional Ethics','acs.org.au'),
('it','EU AI Act','Voluntary AI Safety Standard (10 guardrails) and AI6 essential practices','industry.gov.au'),
('it','US government digital service','Digital Transformation Agency (DTA) Digital Service Standard','dta.gov.au'),
('it','Silicon Valley start-up','Australian tech sector case (e.g. an ASX-listed software company, to be confirmed by the academic)','[context: to be confirmed by the academic]'),
('it','HIPAA health data','My Health Records Act 2012 (Cth)','legislation.gov.au'),
('health','FDA','Therapeutic Goods Administration (TGA)','tga.gov.au'),
('health','CDC','Australian Centre for Disease Control / Department of Health, Disability and Ageing','health.gov.au'),
('health','Medicare (US) / insurance claims','Medicare Benefits Schedule (MBS) and Pharmaceutical Benefits Scheme (PBS)','health.gov.au'),
('health','State nursing board','Nursing and Midwifery Board of Australia under Ahpra','ahpra.gov.au'),
('health','NHS clinical guideline','Australian Commission on Safety and Quality in Health Care standards','safetyandquality.gov.au'),
('health','Joint Commission accreditation','National Safety and Quality Health Service (NSQHS) Standards','safetyandquality.gov.au'),
('health','Rural US community health','Rural, regional and remote health using the Modified Monash Model','health.gov.au'),
('education','Common Core','Australian Curriculum (ACARA) Version 9.0','acara.edu.au'),
('education','State teaching licence','AITSL Australian Professional Standards for Teachers and state teacher registration','aitsl.edu.au'),
('education','SAT / standardised testing','NAPLAN','nap.edu.au'),
('education','ESSA school AI guidance','Australian Framework for Generative AI in Schools','education.gov.au'),
('education','US accreditation (regional accreditor)','TEQSA and the Higher Education Standards Framework (Threshold Standards) 2021','teqsa.gov.au'),
('education','Title IX / disability accommodations','Disability Standards for Education 2005','education.gov.au'),
('engineering','ABET accreditation','Engineers Australia Stage 1 Competency Standard','engineersaustralia.org.au'),
('engineering','OSHA','Safe Work Australia and state WHS regulators (model WHS Act)','safeworkaustralia.gov.au'),
('engineering','International Building Code','National Construction Code (NCC) by the Australian Building Codes Board','abcb.gov.au'),
('engineering','ANSI / ASTM standard','Standards Australia (AS/NZS)','standards.org.au'),
('engineering','EPA environmental review','EPBC Act 1999 (Cth) assessment','dcceew.gov.au');
