"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  const handleNameChange = (e) => {
    const name = e.target.value;
    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setFormData({ name, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Organization slug is required");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await authClient.organization.create({
        name: formData.name,
        slug: formData.slug,
      });

      if (error) {
        toast.error(error.message || "Failed to create organization");
        return;
      }

      toast.success("Organization created successfully!");

      // Set as active organization
      await authClient.organization.setActive({
        organizationId: data.id,
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Create organization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Create Organization
          </CardTitle>
          <CardDescription>
            Set up your organization to start managing your team
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Company"
                value={formData.name}
                onChange={handleNameChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Organization Slug
                <span className="text-xs text-muted-foreground ml-2">
                  (auto-generated)
                </span>
              </Label>
              <Input
                id="slug"
                type="text"
                placeholder="my-company"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This will be used in URLs: orderlyflow.app/
                {formData.slug || "your-slug"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
