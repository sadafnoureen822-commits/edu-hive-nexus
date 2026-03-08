import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Users, Search, Plus, Edit, ChevronRight, GraduationCap, Phone, Calendar } from "lucide-react";

export default function StudentProfilesPage() {
  const { institution } = useTenant();
  const institutionId = institution?.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [editProfile, setEditProfile] = useState<any>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: classes } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("institution_id", institutionId!).order("numeric_level");
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", institutionId],
    queryFn: async () => {
      const { data } = await supabase.from("sections").select("*").eq("institution_id", institutionId!);
      return data || [];
    },
    enabled: !!institutionId,
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["student_profiles", institutionId, selectedClass],
    queryFn: async () => {
      let q = supabase
        .from("student_profiles")
        .select("*, classes(name), sections(name)")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      if (selectedClass) q = q.eq("class_id", selectedClass);
      const { data } = await q;
      return data || [];
    },
    enabled: !!institutionId,
  });

  const saveProfile = useMutation({
    mutationFn: async (values: any) => {
      if (editProfile?.id) {
        const { error } = await supabase.from("student_profiles").update({
          roll_number: values.roll_number,
          date_of_birth: values.date_of_birth || null,
          gender: values.gender || null,
          blood_group: values.blood_group || null,
          address: values.address || null,
          phone: values.phone || null,
          emergency_contact: values.emergency_contact || null,
          father_name: values.father_name || null,
          mother_name: values.mother_name || null,
          guardian_name: values.guardian_name || null,
          guardian_phone: values.guardian_phone || null,
          class_id: values.class_id || null,
          section_id: values.section_id || null,
          admission_date: values.admission_date || null,
        }).eq("id", editProfile.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_profiles"] });
      toast.success("Profile updated");
      setEditProfile(null);
      reset();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = profiles?.filter((p: any) =>
    !search ||
    p.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.father_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  ) || [];

  const openEdit = (profile: any) => {
    setEditProfile(profile);
    Object.entries(profile).forEach(([k, v]) => setValue(k, v));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Student Profiles</h1>
          <p className="text-muted-foreground text-sm">View and manage extended student information</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {profiles?.length || 0} students
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by roll number, parent name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All classes</SelectItem>
            {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No student profiles found</p>
          <p className="text-sm mt-1">Profiles are created automatically when students are added to the institution</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {p.photo_url
                        ? <img src={p.photo_url} className="w-full h-full rounded-full object-cover" alt="" />
                        : <GraduationCap className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.roll_number || "No Roll #"}</p>
                      <p className="text-xs text-muted-foreground">{p.classes?.name || "No class"} {p.sections?.name ? `• ${p.sections.name}` : ""}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {p.father_name && <div className="flex gap-2"><span className="font-medium text-foreground/70">Father:</span><span>{p.father_name}</span></div>}
                  {p.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /><span>{p.phone}</span></div>}
                  {p.date_of_birth && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>DOB: {p.date_of_birth}</span></div>}
                  {p.blood_group && <Badge variant="outline" className="text-[10px] mt-1">{p.blood_group}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editProfile} onOpenChange={(o) => !o && setEditProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Student Profile</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => saveProfile.mutate(v))} className="space-y-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="family">Family</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Roll Number</Label><Input {...register("roll_number")} /></div>
                  <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" {...register("date_of_birth")} /></div>
                  <div className="space-y-1">
                    <Label>Gender</Label>
                    <Select onValueChange={(v) => setValue("gender", v)} defaultValue={editProfile?.gender}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Blood Group</Label><Input {...register("blood_group")} placeholder="e.g. A+" /></div>
                  <div className="space-y-1"><Label>Phone</Label><Input {...register("phone")} /></div>
                  <div className="space-y-1"><Label>Emergency Contact</Label><Input {...register("emergency_contact")} /></div>
                </div>
                <div className="space-y-1"><Label>Address</Label><Input {...register("address")} /></div>
              </TabsContent>
              <TabsContent value="academic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Class</Label>
                    <Select onValueChange={(v) => setValue("class_id", v)} defaultValue={editProfile?.class_id}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Section</Label>
                    <Select onValueChange={(v) => setValue("section_id", v)} defaultValue={editProfile?.section_id}>
                      <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                      <SelectContent>
                        {sections?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Admission Date</Label><Input type="date" {...register("admission_date")} /></div>
                </div>
              </TabsContent>
              <TabsContent value="family" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Father's Name</Label><Input {...register("father_name")} /></div>
                  <div className="space-y-1"><Label>Mother's Name</Label><Input {...register("mother_name")} /></div>
                  <div className="space-y-1"><Label>Guardian Name</Label><Input {...register("guardian_name")} /></div>
                  <div className="space-y-1"><Label>Guardian Phone</Label><Input {...register("guardian_phone")} /></div>
                </div>
              </TabsContent>
            </Tabs>
            <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
