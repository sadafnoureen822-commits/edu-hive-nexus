import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Users, Building2 } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 hero-glow rounded-full animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 hero-glow rounded-full animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              Trusted by 500+ Educational Institutions
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            One Platform for{" "}
            <span className="gradient-text">All Your Institutions</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Multi-tenant education management SaaS that empowers schools, colleges, 
            and universities to operate independently under one unified system.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Building2, value: "500+", label: "Institutions" },
              { icon: Users, value: "2M+", label: "Active Users" },
              { icon: Shield, value: "99.9%", label: "Uptime SLA" },
              { icon: Shield, value: "ISO 27001", label: "Certified" },
            ].map((stat, index) => (
              <div key={index} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <stat.icon className="w-6 h-6 text-primary mb-3 mx-auto" />
                <div className="font-display font-bold text-2xl md:text-3xl text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/30 mx-auto max-w-6xl">
            <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2 border-b border-border/50">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-amber-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <div className="flex-1 text-center">
                <span className="text-xs text-muted-foreground">Super Admin Dashboard — EduCloud</span>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-secondary/30 to-background">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Institutions", value: "128", change: "+12 this month" },
                  { label: "Active Students", value: "245,892", change: "+8.2% growth" },
                  { label: "Monthly Revenue", value: "$1.2M", change: "+15% MoM" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/60 rounded-xl p-5 backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
                    <div className="font-display font-bold text-2xl text-foreground">{item.value}</div>
                    <div className="text-xs text-accent font-medium">{item.change}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/40 rounded-xl h-48 flex items-center justify-center backdrop-blur-sm">
                <span className="text-muted-foreground">Analytics Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
