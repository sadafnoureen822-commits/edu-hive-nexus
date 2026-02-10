import { Link } from "react-router-dom";

interface PublicFooterProps {
  institution: any;
  settings: any;
  menu: any;
  slug: string;
  pages?: any[];
}

export default function PublicFooter({
  institution,
  settings,
  menu,
  slug,
  pages,
}: PublicFooterProps) {
  const primaryColor = settings?.primary_color || "#1a56db";
  const menuItems = menu?.cms_menu_items
    ? [...menu.cms_menu_items].sort((a: any, b: any) => a.position - b.position)
    : [];

  const getPageSlug = (pageId: string) =>
    pages?.find((p) => p.id === pageId)?.slug;

  const getItemLink = (item: any) => {
    if (item.link_type === "external") return item.link_url || "#";
    const pageSlug = item.page_id ? getPageSlug(item.page_id) : null;
    return pageSlug ? `/site/${slug}/${pageSlug}` : "#";
  };

  return (
    <footer
      className="border-t py-12"
      style={{ borderColor: `${primaryColor}20` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {settings?.logo_url && (
                <img src={settings.logo_url} alt="" className="h-6 w-auto" />
              )}
              <span className="font-bold" style={{ color: primaryColor }}>
                {settings?.site_title || institution.name}
              </span>
            </div>
            {settings?.tagline && (
              <p className="text-sm text-gray-500">{settings.tagline}</p>
            )}
          </div>

          {/* Footer Links */}
          {menuItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
              <ul className="space-y-2">
                {menuItems
                  .filter((i: any) => !i.parent_id)
                  .map((item: any) => (
                    <li key={item.id}>
                      <Link
                        to={getItemLink(item)}
                        className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        target={item.link_type === "external" ? "_blank" : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Contact</h3>
            <p className="text-sm text-gray-500">
              Visit our contact page for more information.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {institution.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
