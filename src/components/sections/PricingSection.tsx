import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small schools",
    price: "$299",
    period: "/month",
    students: "Up to 500 students",
    features: [
      "All core modules",
      "5 admin accounts",
      "Email support",
      "Basic analytics",
      "Subdomain hosting",
      "Standard integrations",
    ],
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing institutions",
    price: "$799",
    period: "/month",
    students: "Up to 2,500 students",
    features: [
      "Everything in Starter",
      "25 admin accounts",
      "Priority support",
      "Advanced analytics",
      "Custom domain",
      "API access",
      "White-labeling",
      "SSO integration",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large universities",
    price: "Custom",
    period: "",
    students: "Unlimited students",
    features: [
      "Everything in Professional",
      "Unlimited admins",
      "Dedicated support",
      "Custom development",
      "SLA guarantee",
      "On-premise option",
      "Multi-campus support",
      "Dedicated infrastructure",
    ],
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Simple Pricing</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Pricing That{" "}
            <span className="gradient-text">Scales With You</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your institution. Upgrade anytime as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-glow"
                  : "glass-card hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display font-bold text-2xl mb-2">{plan.name}</h3>
                <p className={plan.popular ? "text-white/80" : "text-muted-foreground"}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-bold text-4xl">{plan.price}</span>
                  <span className={plan.popular ? "text-white/80" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.students}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className={`w-4 h-4 ${plan.popular ? "text-accent" : "text-accent"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "heroOutline" : "default"}
                className={`w-full ${plan.popular ? "bg-white text-primary hover:bg-white/90" : ""}`}
                size="lg"
              >
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Need a custom solution for multiple institutions?
          </p>
          <Button variant="outline" size="lg">
            Schedule Enterprise Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
