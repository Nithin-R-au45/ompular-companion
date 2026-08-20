CREATE TABLE public.auth_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  outcome text NOT NULL DEFAULT 'failure',
  email text,
  error_message text,
  error_code text,
  path text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_event_logs_created_at_idx ON public.auth_event_logs (created_at DESC);
CREATE INDEX auth_event_logs_event_type_idx ON public.auth_event_logs (event_type);

GRANT ALL ON public.auth_event_logs TO service_role;

ALTER TABLE public.auth_event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to auth event logs"
ON public.auth_event_logs FOR SELECT TO authenticated USING (false);