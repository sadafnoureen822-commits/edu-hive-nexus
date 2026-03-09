import DOMPurify from "dompurify";

interface PublicSectionRendererProps {
  section: any;
  settings: any;
  slug: string;
}

export default function PublicSectionRenderer({
  section,
  settings,
  slug,
}: PublicSectionRendererProps) {
  const blocks = section.cms_blocks
    ? [...section.cms_blocks].sort((a: any, b: any) => a.position - b.position)
    : [];
  const primaryColor = settings?.primary_color || "#1a56db";
  const secondaryColor = settings?.secondary_color || "#7e3af2";

  const renderBlock = (block: any) => {
    const content = block.content || {};
    switch (block.block_type) {
      case "heading": {
        const Tag = `h${content.level || 2}` as keyof JSX.IntrinsicElements;
        const sizes: Record<number, string> = {
          1: "text-4xl md:text-5xl font-bold",
          2: "text-3xl md:text-4xl font-bold",
          3: "text-2xl md:text-3xl font-semibold",
          4: "text-xl md:text-2xl font-semibold",
          5: "text-lg font-medium",
          6: "text-base font-medium",
        };
        return (
          <Tag key={block.id} className={`${sizes[content.level || 2]} mb-4`}>
            {content.text || ""}
          </Tag>
        );
      }
      case "text":
        return (
          <p key={block.id} className="text-base leading-relaxed text-gray-700 mb-4 whitespace-pre-wrap">
            {content.text || ""}
          </p>
        );
      case "image":
        return content.url ? (
          <div key={block.id} className="mb-4">
            <img
              src={content.url}
              alt={content.alt || ""}
              className="w-full rounded-lg shadow-sm"
              loading="lazy"
            />
          </div>
        ) : null;
      case "button":
        return (
          <a
            key={block.id}
            href={content.url || "#"}
            className="inline-block px-6 py-3 rounded-lg text-white font-medium mb-4 transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {content.text || "Button"}
          </a>
        );
      case "video":
        return content.url ? (
          <div key={block.id} className="mb-4 aspect-video rounded-lg overflow-hidden">
            <iframe
              src={content.url}
              className="w-full h-full"
              allowFullScreen
              title="Video"
            />
          </div>
        ) : null;
      case "divider":
        return (
          <hr
            key={block.id}
            className="my-6 border-gray-200"
            style={{ borderStyle: content.style || "solid" }}
          />
        );
      case "html":
        return content.html ? (
          <div
            key={block.id}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        ) : null;
      default:
        return null;
    }
  };

  // Section-type-specific wrappers
  const getSectionStyle = () => {
    switch (section.section_type) {
      case "hero_banner":
        return {
          background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
          padding: "4rem 0",
        };
      case "statistics":
        return {
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          color: "white",
          padding: "3rem 0",
        };
      case "admission_cta":
        return {
          backgroundColor: `${primaryColor}08`,
          padding: "3rem 0",
        };
      case "contact":
        return {
          backgroundColor: "#f9fafb",
          padding: "3rem 0",
        };
      default:
        return { padding: "3rem 0" };
    }
  };

  return (
    <section style={getSectionStyle()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && section.section_type !== "hero_banner" && (
          <h2
            className="text-2xl md:text-3xl font-bold mb-8 text-center"
            style={{ color: primaryColor }}
          >
            {section.title}
          </h2>
        )}
        <div>{blocks.map(renderBlock)}</div>
      </div>
    </section>
  );
}
