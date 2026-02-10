import {
  Type,
  Image,
  MousePointer,
  Heading,
  Video,
  Minus,
  Code,
} from "lucide-react";

export const SECTION_TYPES = [
  { value: "hero_banner", label: "Hero Banner" },
  { value: "about", label: "About Section" },
  { value: "programs", label: "Programs / Courses" },
  { value: "admission_cta", label: "Admission CTA" },
  { value: "testimonials", label: "Testimonials" },
  { value: "statistics", label: "Statistics Counter" },
  { value: "gallery", label: "Gallery" },
  { value: "notice_board", label: "Notice Board" },
  { value: "contact", label: "Contact Block" },
  { value: "custom_html", label: "Custom HTML" },
];

export const BLOCK_TYPES = [
  { value: "heading", label: "Heading", icon: Heading },
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: Image },
  { value: "button", label: "Button", icon: MousePointer },
  { value: "video", label: "Video", icon: Video },
  { value: "divider", label: "Divider", icon: Minus },
  { value: "html", label: "HTML", icon: Code },
];
