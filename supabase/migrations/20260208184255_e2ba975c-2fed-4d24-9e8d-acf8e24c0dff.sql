
-- ==========================================
-- CMS MODULE - COMPLETE SCHEMA
-- ==========================================

-- Enums
CREATE TYPE public.cms_page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.cms_section_type AS ENUM (
  'hero_banner', 'about', 'programs', 'admission_cta', 'testimonials',
  'statistics', 'gallery', 'notice_board', 'contact', 'custom_html'
);
CREATE TYPE public.cms_block_type AS ENUM (
  'text', 'image', 'button', 'heading', 'video', 'divider', 'spacer', 'html', 'icon'
);
CREATE TYPE public.cms_menu_type AS ENUM ('header', 'footer');
CREATE TYPE public.cms_link_type AS ENUM ('internal', 'external');

-- ==========================================
-- 1. CMS PAGES
-- ==========================================
CREATE TABLE public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  meta_description TEXT,
  page_type TEXT NOT NULL DEFAULT 'custom',
  status public.cms_page_status NOT NULL DEFAULT 'draft',
  is_system_page BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, slug)
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution pages"
  ON public.cms_pages FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can insert pages"
  ON public.cms_pages FOR INSERT
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Institution admins can update pages"
  ON public.cms_pages FOR UPDATE
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Institution admins can delete custom pages"
  ON public.cms_pages FOR DELETE
  USING (is_institution_admin(auth.uid(), institution_id) AND is_system_page = false);

CREATE POLICY "Platform admins full access to cms_pages"
  ON public.cms_pages FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Public access: anyone can view published pages for active institutions
CREATE POLICY "Public can view published pages"
  ON public.cms_pages FOR SELECT
  USING (
    status = 'published' AND
    institution_id IN (
      SELECT id FROM public.institutions WHERE status = 'active'
    )
  );

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 2. CMS PAGE VERSIONS (revision history)
-- ==========================================
CREATE TABLE public.cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  version_number INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view page versions"
  ON public.cms_page_versions FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can insert page versions"
  ON public.cms_page_versions FOR INSERT
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to page versions"
  ON public.cms_page_versions FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ==========================================
-- 3. CMS SECTIONS
-- ==========================================
CREATE TABLE public.cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  section_type public.cms_section_type NOT NULL,
  title TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution sections"
  ON public.cms_sections FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage sections"
  ON public.cms_sections FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to sections"
  ON public.cms_sections FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Public can view visible sections of published pages"
  ON public.cms_sections FOR SELECT
  USING (
    is_visible = true AND
    page_id IN (
      SELECT id FROM public.cms_pages 
      WHERE status = 'published' AND institution_id IN (
        SELECT id FROM public.institutions WHERE status = 'active'
      )
    )
  );

CREATE TRIGGER update_cms_sections_updated_at
  BEFORE UPDATE ON public.cms_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 4. CMS BLOCKS
-- ==========================================
CREATE TABLE public.cms_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.cms_sections(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  block_type public.cms_block_type NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution blocks"
  ON public.cms_blocks FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage blocks"
  ON public.cms_blocks FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to blocks"
  ON public.cms_blocks FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Public can view blocks of published pages"
  ON public.cms_blocks FOR SELECT
  USING (
    section_id IN (
      SELECT s.id FROM public.cms_sections s
      JOIN public.cms_pages p ON s.page_id = p.id
      WHERE s.is_visible = true AND p.status = 'published'
      AND p.institution_id IN (
        SELECT id FROM public.institutions WHERE status = 'active'
      )
    )
  );

CREATE TRIGGER update_cms_blocks_updated_at
  BEFORE UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 5. CMS MENUS
-- ==========================================
CREATE TABLE public.cms_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  menu_type public.cms_menu_type NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, menu_type)
);

ALTER TABLE public.cms_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution menus"
  ON public.cms_menus FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage menus"
  ON public.cms_menus FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to menus"
  ON public.cms_menus FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Public can view menus of active institutions"
  ON public.cms_menus FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM public.institutions WHERE status = 'active'
    )
  );

CREATE TRIGGER update_cms_menus_updated_at
  BEFORE UPDATE ON public.cms_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 6. CMS MENU ITEMS
-- ==========================================
CREATE TABLE public.cms_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.cms_menus(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  link_type public.cms_link_type NOT NULL DEFAULT 'internal',
  link_url TEXT,
  page_id UUID REFERENCES public.cms_pages(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution menu items"
  ON public.cms_menu_items FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage menu items"
  ON public.cms_menu_items FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to menu items"
  ON public.cms_menu_items FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Public can view menu items of active institutions"
  ON public.cms_menu_items FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM public.institutions WHERE status = 'active'
    )
  );

CREATE TRIGGER update_cms_menu_items_updated_at
  BEFORE UPDATE ON public.cms_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 7. CMS MEDIA FOLDERS
-- ==========================================
CREATE TABLE public.cms_media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.cms_media_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution folders"
  ON public.cms_media_folders FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage folders"
  ON public.cms_media_folders FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to folders"
  ON public.cms_media_folders FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE TRIGGER update_cms_media_folders_updated_at
  BEFORE UPDATE ON public.cms_media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 8. CMS MEDIA FILES
-- ==========================================
CREATE TABLE public.cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.cms_media_folders(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  alt_text TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution media"
  ON public.cms_media FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage media"
  ON public.cms_media FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to media"
  ON public.cms_media FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Public access for media used in published pages
CREATE POLICY "Public can view media of active institutions"
  ON public.cms_media FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM public.institutions WHERE status = 'active'
    )
  );

-- ==========================================
-- 9. CMS SITE SETTINGS
-- ==========================================
CREATE TABLE public.cms_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE UNIQUE,
  site_title TEXT,
  tagline TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#1a56db',
  secondary_color TEXT DEFAULT '#7e3af2',
  font_family TEXT DEFAULT 'Inter',
  custom_css TEXT,
  analytics_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their institution site settings"
  ON public.cms_site_settings FOR SELECT
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Institution admins can manage site settings"
  ON public.cms_site_settings FOR ALL
  USING (is_institution_admin(auth.uid(), institution_id))
  WITH CHECK (is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Platform admins full access to site settings"
  ON public.cms_site_settings FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Public can view site settings of active institutions"
  ON public.cms_site_settings FOR SELECT
  USING (
    institution_id IN (
      SELECT id FROM public.institutions WHERE status = 'active'
    )
  );

CREATE TRIGGER update_cms_site_settings_updated_at
  BEFORE UPDATE ON public.cms_site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 10. AUTO-GENERATE DEFAULT PAGES & SETTINGS ON NEW INSTITUTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.setup_institution_cms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default system pages
  INSERT INTO public.cms_pages (institution_id, title, slug, page_type, is_system_page, status) VALUES
    (NEW.id, 'Home', 'home', 'system', true, 'draft'),
    (NEW.id, 'About Us', 'about', 'system', true, 'draft'),
    (NEW.id, 'Programs', 'programs', 'system', true, 'draft'),
    (NEW.id, 'Admissions', 'admissions', 'system', true, 'draft'),
    (NEW.id, 'LMS Login', 'lms-login', 'system', true, 'draft'),
    (NEW.id, 'Results', 'results', 'system', true, 'draft'),
    (NEW.id, 'Contact Us', 'contact', 'system', true, 'draft');

  -- Create default site settings
  INSERT INTO public.cms_site_settings (institution_id, site_title, tagline)
  VALUES (NEW.id, NEW.name, 'Welcome to ' || NEW.name);

  -- Create default header and footer menus
  INSERT INTO public.cms_menus (institution_id, menu_type, name) VALUES
    (NEW.id, 'header', 'Main Navigation'),
    (NEW.id, 'footer', 'Footer Navigation');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_institution_created_setup_cms
  AFTER INSERT ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.setup_institution_cms();

-- ==========================================
-- 11. STORAGE BUCKET FOR INSTITUTION MEDIA
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('institution-media', 'institution-media', true);

-- Storage policies - institution members can view
CREATE POLICY "Anyone can view institution media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'institution-media');

-- Institution admins can upload to their folder
CREATE POLICY "Institution admins can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'institution-media' AND
    auth.uid() IS NOT NULL
  );

-- Institution admins can update their media
CREATE POLICY "Institution admins can update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'institution-media' AND
    auth.uid() IS NOT NULL
  );

-- Institution admins can delete their media
CREATE POLICY "Institution admins can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'institution-media' AND
    auth.uid() IS NOT NULL
  );

-- ==========================================
-- 12. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_cms_pages_institution ON public.cms_pages(institution_id);
CREATE INDEX idx_cms_pages_slug ON public.cms_pages(institution_id, slug);
CREATE INDEX idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX idx_cms_sections_page ON public.cms_sections(page_id);
CREATE INDEX idx_cms_sections_position ON public.cms_sections(page_id, position);
CREATE INDEX idx_cms_blocks_section ON public.cms_blocks(section_id);
CREATE INDEX idx_cms_blocks_position ON public.cms_blocks(section_id, position);
CREATE INDEX idx_cms_menu_items_menu ON public.cms_menu_items(menu_id);
CREATE INDEX idx_cms_menu_items_parent ON public.cms_menu_items(parent_id);
CREATE INDEX idx_cms_media_institution ON public.cms_media(institution_id);
CREATE INDEX idx_cms_media_folder ON public.cms_media(folder_id);
CREATE INDEX idx_cms_page_versions_page ON public.cms_page_versions(page_id);
