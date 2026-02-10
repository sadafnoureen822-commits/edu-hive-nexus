import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  usePublicInstitution,
  usePublicSiteSettings,
  usePublicPage,
  usePublicSections,
  usePublicMenus,
  usePublicPages,
} from "@/hooks/cms/use-public-site";
import PublicHeader from "@/components/cms/public/PublicHeader";
import PublicFooter from "@/components/cms/public/PublicFooter";
import PublicSectionRenderer from "@/components/cms/public/PublicSectionRenderer";

export default function PublicSite() {
  const { slug, "*": pageSlug } = useParams<{ slug: string; "*": string }>();
  const currentSlug = pageSlug || "home";

  const { data: institution, isLoading: instLoading } = usePublicInstitution(slug);
  const { data: settings } = usePublicSiteSettings(institution?.id);
  const { data: page, isLoading: pageLoading } = usePublicPage(institution?.id, currentSlug);
  const { data: sections } = usePublicSections(page?.id);
  const { data: menus } = usePublicMenus(institution?.id);
  const { data: pages } = usePublicPages(institution?.id);

  const headerMenu = menus?.find((m) => m.menu_type === "header");
  const footerMenu = menus?.find((m) => m.menu_type === "footer");

  if (instLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: settings?.primary_color || "#1a56db" }} />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Site Not Found</h1>
          <p className="text-gray-500">This institution website does not exist or is inactive.</p>
        </div>
      </div>
    );
  }

  const siteStyles = {
    "--site-primary": settings?.primary_color || "#1a56db",
    "--site-secondary": settings?.secondary_color || "#7e3af2",
    fontFamily: settings?.font_family || "Inter, sans-serif",
  } as React.CSSProperties;

  return (
    <div style={siteStyles} className="min-h-screen flex flex-col">
      {settings?.custom_css && <style>{settings.custom_css}</style>}

      <PublicHeader
        institution={institution}
        settings={settings}
        menu={headerMenu}
        slug={slug!}
        pages={pages}
      />

      <main className="flex-1">
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: settings?.primary_color || "#1a56db" }} />
          </div>
        ) : !page ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold">Page Not Found</h1>
              <p className="text-gray-500">This page doesn't exist or hasn't been published yet.</p>
            </div>
          </div>
        ) : (
          <>
            {page.meta_description && (
              <head>
                <title>{page.title} - {settings?.site_title || institution.name}</title>
                <meta name="description" content={page.meta_description} />
              </head>
            )}
            {sections?.map((section: any) => (
              <PublicSectionRenderer
                key={section.id}
                section={section}
                settings={settings}
                slug={slug!}
              />
            ))}
            {(!sections || sections.length === 0) && (
              <div className="flex items-center justify-center py-24 text-gray-400">
                <p>This page has no content yet.</p>
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter
        institution={institution}
        settings={settings}
        menu={footerMenu}
        slug={slug!}
        pages={pages}
      />
    </div>
  );
}
