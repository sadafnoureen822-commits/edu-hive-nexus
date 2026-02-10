import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  History,
  Users,
  MessageCircle,
} from "lucide-react";

export default function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState("compose");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Communication Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Send messages via WhatsApp, SMS, and Email
        </p>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Email", icon: Mail, color: "text-primary", bg: "bg-primary/10", sent: "—" },
          { label: "WhatsApp", icon: MessageCircle, color: "text-accent", bg: "bg-accent/10", sent: "—" },
          { label: "SMS", icon: Phone, color: "text-primary", bg: "bg-primary/10", sent: "—" },
        ].map((ch) => (
          <Card key={ch.label} className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`${ch.bg} p-2.5 rounded-xl`}>
                  <ch.icon className={`h-5 w-5 ${ch.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{ch.label} Sent</p>
                  <p className="text-2xl font-display font-bold">{ch.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="compose" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                New Message
              </CardTitle>
              <CardDescription>
                Compose and send a message to selected recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                      <SelectItem value="sms">📱 SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="teachers">All Teachers</SelectItem>
                      <SelectItem value="students">All Students</SelectItem>
                      <SelectItem value="parents">All Parents</SelectItem>
                      <SelectItem value="staff">All Staff</SelectItem>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="Message subject" />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={6}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  <Users className="h-3 w-3 inline mr-1" />
                  0 recipients selected
                </p>
                <Button className="gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <History className="h-5 w-5 text-accent" />
                Message History
              </CardTitle>
              <CardDescription>
                View all sent messages and delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">No messages sent yet</p>
                <p className="text-xs mt-1">
                  Compose your first message to see history here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
