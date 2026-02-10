import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface PublicHeaderProps {
  institution: any;
  settings: any;
  menu: any;
  slug: string;
  pages?: any[];
}

export default function PublicHeader({
  institution,
  settings,
  menu,
  slug,
  pages,
}: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const primaryColor = settings?.primary_color || "#1a56db";
  const menuItems = menu?.cms_menu_items
    ? [...menu.cms_menu_items].sort((a: any, b: any) => a.position - b.position)
    : [];

  const topLevel = menuItems.filter((i: any) => !i.parent_id);
  const getChildren = (parentId: string) =>
    menuItems.filter((i: any) => i.parent_id === parentId);

  const getPageSlug = (pageId: string) =>
    pages?.find((p) => p.id === pageId)?.slug;

  const getItemLink = (item: any) => {
    if (item.link_type === "external") return item.link_url || "#";
    const pageSlug = item.page_id ? getPageSlug(item.page_id) : null;
    return pageSlug ? `/site/${slug}/${pageSlug}` : "#";
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <Link to={`/site/${slug}`} className="flex items-center gap-3">
            {settings?.logo_url && (
              <img
                src={settings.logo_url}
                alt={institution.name}
                className="h-8 w-auto"
              />
            )}
            <span className="font-bold text-lg" style={{ color: primaryColor }}>
              {settings?.site_title || institution.name}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {topLevel.map((item: any) => {
              const children = getChildren(item.id);
              return (
                <div key={item.id} className="relative group">
                  <Link
                    to={getItemLink(item)}
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-black/5"
                    target={item.link_type === "external" ? "_blank" : undefined}
                  >
                    {item.label}
                  </Link>
                  {children.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      {children.map((child: any) => (
                        <Link
                          key={child.id}
                          to={getItemLink(child)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                          target={child.link_type === "external" ? "_blank" : undefined}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-black/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            {topLevel.map((item: any) => (
              <div key={item.id}>
                <Link
                  to={getItemLink(item)}
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {getChildren(item.id).map((child: any) => (
                  <Link
                    key={child.id}
                    to={getItemLink(child)}
                    className="block pl-8 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
