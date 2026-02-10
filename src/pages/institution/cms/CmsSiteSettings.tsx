import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  useCmsSiteSettings,
  useUpdateCmsSiteSettings,
} from "@/hooks/cms/use-cms-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Palette, Type, Globe, Code, Loader2 } from "lucide-react";

const FONT_OPTIONS = [
  "Inter",
  "Plus Jakarta Sans",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Nunito",
  "Source Sans Pro",
  "Merriweather",
];

export default function CmsSiteSettings() {
  const { institution } = useTenant();
  const { data: settings, isLoading } = useCmsSiteSettings(institution?.id);
  const updateSettings = useUpdateCmsSiteSettings();

  const [siteTitle, setSiteTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1a56db");
  const [secondaryColor, setSecondaryColor] = useState("#7e3af2");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [customCss, setCustomCss] = useState("");
  const [analyticsCode, setAnalyticsCode] = useState("");

  useEffect(() => {
    if (settings) {
      setSiteTitle(settings.site_title || "");
      setTagline(settings.tagline || "");
      setLogoUrl(settings.logo_url || "");
      setFaviconUrl(settings.favicon_url || "");
      setPrimaryColor(settings.primary_color || "#1a56db");
      setSecondaryColor(settings.secondary_color || "#7e3af2");
      setFontFamily(settings.font_family || "Inter");
      setCustomCss(settings.custom_css || "");
      setAnalyticsCode(settings.analytics_code || "");
    }
  }, [settings]);

  const handleSave = () => {
    if (!institution) return;
    updateSettings.mutate({
      institutionId: institution.id,
      site_title: siteTitle,
      tagline,
      logo_url: logoUrl || undefined,
      favicon_url: faviconUrl || undefined,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: fontFamily,
      custom_css: customCss || undefined,
      analytics_code: analyticsCode || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Site Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure branding, colors, and global website settings.
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-1.5">
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Title</Label>
              <Input
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Your Institution Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A short description..."
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... or upload in Media Library"
              />
              {logoUrl && (
                <div className="w-16 h-16 rounded-lg border border-border overflow-hidden">
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-3.5 w-3.5" />
                Font Family
              </Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Preview */}
            <div
              className="p-4 rounded-lg border border-border"
              style={{ fontFamily, backgroundColor: `${primaryColor}10` }}
            >
              <p className="text-sm" style={{ color: primaryColor }}>
                Preview with {fontFamily}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This is how your text will look.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Custom CSS</Label>
              <Textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder="/* Custom styles for your website */"
                className="font-mono text-xs min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Add custom CSS that will be injected into your public website.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Analytics Code</Label>
              <Textarea
                value={analyticsCode}
                onChange={(e) => setAnalyticsCode(e.target.value)}
                placeholder="Google Analytics or other tracking code..."
                className="font-mono text-xs min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Paste your tracking code (e.g., Google Analytics, Plausible).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
