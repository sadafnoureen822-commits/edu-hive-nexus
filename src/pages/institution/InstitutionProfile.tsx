import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Upload,
  Phone,
  Mail,
  Globe,
  MapPin,
  Palette,
} from "lucide-react";

export default function InstitutionProfile() {
  const { institution } = useTenant();

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Institution Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your institution's identity and branding
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo & Identity */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Logo & Identity
            </CardTitle>
            <CardDescription>Upload your institution's logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-2xl bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                {institution?.logo_url ? (
                  <img
                    src={institution.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-3.5 w-3.5" />
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                PNG, JPG up to 2MB. Recommended 512×512px.
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Institution Name</Label>
              <Input
                defaultValue={institution?.name}
                placeholder="Your institution name"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  defaultValue={institution?.slug}
                  disabled
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div>
                <Badge
                  variant="outline"
                  className="bg-accent/10 text-accent border-accent/20"
                >
                  {institution?.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Address */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Contact & Address
            </CardTitle>
            <CardDescription>
              Add contact details and address information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input placeholder="admin@institution.edu" type="email" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Website
                </Label>
                <Input placeholder="https://institution.edu" type="url" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Fax
                </Label>
                <Input placeholder="+1 (555) 000-0001" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </Label>
              <Textarea
                placeholder="123 Education Street, Suite 100&#10;City, State 12345&#10;Country"
                rows={3}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <Palette className="h-3.5 w-3.5" /> Branding Colors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#4338ca"
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input defaultValue="#4338ca" className="font-mono text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#0d9488"
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input defaultValue="#0d9488" className="font-mono text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button className="gap-2">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
