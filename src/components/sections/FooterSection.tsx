import { GraduationCap, Github, Twitter, Linkedin, Mail } from "lucide-react";

const FooterSection = () => {
  const links = {
    Product: ["Features", "Modules", "Pricing", "Roadmap", "Changelog"],
    Resources: ["Documentation", "API Reference", "Guides", "Blog", "Community"],
    Company: ["About Us", "Careers", "Partners", "Contact", "Press"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"],
  };

  return (
    <footer className="bg-foreground text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-display font-bold text-xl">EduCloud</span>
            </div>
            <p className="text-white/60 text-sm mb-6 max-w-xs">
              The complete multi-tenant education management platform for modern institutions.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            © 2024 EduCloud. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/60">Made with ❤️ for educators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
