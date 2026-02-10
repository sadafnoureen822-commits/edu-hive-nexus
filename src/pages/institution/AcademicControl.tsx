import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarRange,
  BookOpen,
  Layers,
  GraduationCap,
  Plus,
} from "lucide-react";

const academicTabs = [
  { value: "years", label: "Academic Years", icon: CalendarRange },
  { value: "classes", label: "Classes / Grades", icon: BookOpen },
  { value: "sections", label: "Sections", icon: Layers },
  { value: "subjects", label: "Subjects", icon: GraduationCap },
];

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1">{description}</p>
    </div>
  );
}

export default function AcademicControl() {
  const [activeTab, setActiveTab] = useState("years");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Academic Control
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage academic years, classes, sections, and subjects
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {academicTabs.map((tab) => (
          <Card
            key={tab.value}
            className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab(tab.value)}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <tab.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tab.label}</p>
                  <p className="text-xl font-display font-bold">—</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="bg-secondary/50">
            {academicTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button className="gap-2 self-start">
            <Plus className="h-4 w-4" />
            Add {academicTabs.find((t) => t.value === activeTab)?.label.replace(/s$/, "")}
          </Button>
        </div>

        <TabsContent value="years">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Academic Years</CardTitle>
              <CardDescription>
                Define your institution's academic calendar periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={CalendarRange}
                title="No academic years defined"
                description="Create your first academic year to get started"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Classes / Grades</CardTitle>
              <CardDescription>
                Manage grades, classes, and programs offered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={BookOpen}
                title="No classes created"
                description="Add classes or grades for your institution"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Sections</CardTitle>
              <CardDescription>
                Create and manage sections within each class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Layers}
                title="No sections created"
                description="Add sections after creating classes"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Subjects</CardTitle>
              <CardDescription>
                Manage subjects with name, code, and credit hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={GraduationCap}
                title="No subjects added"
                description="Add subjects with details like code and credit hours"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
