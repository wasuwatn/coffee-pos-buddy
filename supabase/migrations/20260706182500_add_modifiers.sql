-- Modifier Groups
CREATE TABLE public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_selections INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modifier_groups TO authenticated;
GRANT ALL ON public.modifier_groups TO service_role;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop can read modifier_groups" ON public.modifier_groups FOR SELECT TO authenticated
  USING (owner_id = public.get_owner_id(auth.uid()));
CREATE POLICY "owner manages modifier_groups" ON public.modifier_groups FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'owner'))
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'owner'));

-- Modifier Options
CREATE TABLE public.modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modifier_options TO authenticated;
GRANT ALL ON public.modifier_options TO service_role;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop can read modifier_options" ON public.modifier_options FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modifier_groups g 
    WHERE g.id = modifier_options.group_id 
    AND g.owner_id = public.get_owner_id(auth.uid())
  ));
CREATE POLICY "owner manages modifier_options" ON public.modifier_options FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modifier_groups g 
    WHERE g.id = modifier_options.group_id 
    AND g.owner_id = auth.uid() 
    AND public.has_role(auth.uid(), 'owner')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.modifier_groups g 
    WHERE g.id = modifier_options.group_id 
    AND g.owner_id = auth.uid() 
    AND public.has_role(auth.uid(), 'owner')
  ));

-- Product Modifiers (Link Table)
CREATE TABLE public.product_modifiers (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_modifiers TO authenticated;
GRANT ALL ON public.product_modifiers TO service_role;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop can read product_modifiers" ON public.product_modifiers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_modifiers.product_id 
    AND p.owner_id = public.get_owner_id(auth.uid())
  ));
CREATE POLICY "owner manages product_modifiers" ON public.product_modifiers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_modifiers.product_id 
    AND p.owner_id = auth.uid() 
    AND public.has_role(auth.uid(), 'owner')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_modifiers.product_id 
    AND p.owner_id = auth.uid() 
    AND public.has_role(auth.uid(), 'owner')
  ));
