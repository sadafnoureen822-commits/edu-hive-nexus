import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  CalendarDays,
  UserCheck,
} from "lucide-react";

const statCards = [
  {
    label: "Total Students",
    value: "—",
    icon: GraduationCap,
    change: "Manage in Users",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Total Teachers",
    value: "—",
    icon: UserCheck,
    change: "Manage in Users",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Active Classes",
    value: "—",
    icon: BookOpen,
    change: "Set up in Academics",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Subjects",
    value: "—",
    icon: TrendingUp,
    change: "Set up in Academics",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export default function InstitutionOverview() {
  const { institution, membership } = useTenant();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Welcome back 👋
          </h1>
        </div>
        <p className="text-muted-foreground">
          Here's what's happening at{" "}
          <span className="font-medium text-foreground">{institution?.name}</span> today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-display font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.change}</p>
                </div>
                <div className={`${card.bgColor} p-2.5 rounded-xl`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Activity feed will appear here</p>
              <p className="text-xs mt-1">Start by setting up your institution profile</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Complete Institution Profile", status: "pending" },
              { label: "Add Teachers & Staff", status: "pending" },
              { label: "Set Up Academic Year", status: "pending" },
              { label: "Create Classes", status: "pending" },
              { label: "Invite Students", status: "pending" },
            ].map((action) => (
              <div
                key={action.label}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-sm">{action.label}</span>
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  {action.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
