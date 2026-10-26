CREATE TABLE public.assessment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL DEFAULT 'Reviewer',
  kind text NOT NULL DEFAULT 'comment' CHECK (kind IN ('comment','decision')),
  decision text CHECK (decision IN ('approved','returned')),
  stance text,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessment_reviews_assessment_idx ON public.assessment_reviews(assessment_id, created_at);
GRANT SELECT, INSERT ON public.assessment_reviews TO anon, authenticated;
GRANT ALL ON public.assessment_reviews TO service_role;
ALTER TABLE public.assessment_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read reviews" ON public.assessment_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "open add reviews" ON public.assessment_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);