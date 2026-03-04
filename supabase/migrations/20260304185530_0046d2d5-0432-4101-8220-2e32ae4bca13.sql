
-- ============================================================
-- SUBSCRIPTION & BILLING SYSTEM
-- ============================================================

-- Subscription Plans (managed by platform admin)
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  max_students INTEGER,
  max_teachers INTEGER,
  max_storage_gb INTEGER DEFAULT 5,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage plans" ON public.subscription_plans
  FOR ALL USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Institution Subscriptions
CREATE TABLE public.institution_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspension_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id)
);

ALTER TABLE public.institution_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access subscriptions" ON public.institution_subscriptions
  FOR ALL USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Institution admins view own subscription" ON public.institution_subscriptions
  FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Institution members view own subscription" ON public.institution_subscriptions
  FOR SELECT USING (is_institution_member(auth.uid(), institution_id));

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.institution_subscriptions(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  billing_period_start DATE,
  billing_period_end DATE,
  notes TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access invoices" ON public.invoices
  FOR ALL USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Institution admins view own invoices" ON public.invoices
  FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Institution members view own invoices" ON public.invoices
  FOR SELECT USING (is_institution_member(auth.uid(), institution_id));

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT DEFAULT 'bank_transfer',
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access payments" ON public.payments
  FOR ALL USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Institution admins view own payments" ON public.payments
  FOR SELECT USING (is_institution_admin(auth.uid(), institution_id));

-- Parent-Child relationships
CREATE TABLE public.parent_student_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL,
  student_user_id UUID NOT NULL,
  relationship TEXT DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, parent_user_id, student_user_id)
);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access parent links" ON public.parent_student_links
  FOR ALL USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Institution admins manage parent links" ON public.parent_student_links
  FOR ALL USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Parents view own links" ON public.parent_student_links
  FOR SELECT USING (parent_user_id = auth.uid() AND is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Students view own parent links" ON public.parent_student_links
  FOR SELECT USING (student_user_id = auth.uid());

-- Generate invoice number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_institution_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.invoices
  WHERE institution_id = p_institution_id;
  
  invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN invoice_num;
END;
$$;

-- Timestamps triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institution_subscriptions_updated_at
  BEFORE UPDATE ON public.institution_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
