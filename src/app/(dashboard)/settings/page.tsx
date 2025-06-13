"use client";

import { useState, useEffect } from "react";
import { ProfileForm } from "./components/profile-form";
import { AccountSection } from "./components/account-section";
import { SettingsLoader } from "./components/settings-loader";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LockKeyhole, RefreshCw } from "lucide-react";
import { PasswordDialog } from "@/components/auth/change-password/password-dialog";
import { DeleteAccount } from "./components/delete-account";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./components/sidebar-nav";
import { settings } from "./settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

const sidebarNavItems = settings.sidebarNav;

export default function SettingsPage() {
  const { profile, isLoading } = useAuth();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading || isLoading) {
    return <SettingsLoader />;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Gestiona tu configuración de cuenta y preferencias.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <AccountSection />
          <ProfileForm />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Gestiona la configuración de seguridad de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Contraseña</h3>
                <p className="text-sm text-muted-foreground">
                  Actualiza tu contraseña regularmente para mayor seguridad.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setPasswordDialogOpen(true)}
                className="flex items-center"
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </div>
  );
}
