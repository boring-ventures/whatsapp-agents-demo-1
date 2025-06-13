"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { profileFormSchema } from "@/lib/validations/profile";
import type { ProfileFormValues } from "@/lib/validations/profile";

export function SettingsForm() {
  const { profile, updateProfile } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] =
    useState<ProfileFormValues | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
    },
  });

  async function handleSubmit(data: ProfileFormValues) {
    setPendingChanges(data);
    setShowConfirmDialog(true);
  }

  async function handleConfirmUpdate() {
    if (!pendingChanges) return;

    try {
      setIsUpdating(true);

      await updateProfile({
        ...pendingChanges,
        avatarUrl: newAvatarUrl || profile?.avatarUrl || undefined,
      });

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente.",
      });

      form.reset(pendingChanges);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setShowConfirmDialog(false);
      setPendingChanges(null);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {profile && (
            <AvatarUpload
              userId={profile.id}
              currentAvatarUrl={profile.avatarUrl || null}
              onUploadComplete={(url) => setNewAvatarUrl(url)}
              onUploadError={(error) => {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive",
                });
              }}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu apellido"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar perfil
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isUpdating}
            >
              Restablecer
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmUpdate}
        title="Actualizar Perfil"
        description="¿Estás seguro de que quieres actualizar tu perfil? Esta acción no se puede deshacer."
      />
    </>
  );
}
