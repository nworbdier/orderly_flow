"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, UserPlus, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrganizationPage() {
  const { data: activeOrg, isPending: isOrgLoading } =
    authClient.useActiveOrganization();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);

  // Load members
  useState(() => {
    if (activeOrg) {
      authClient.organization
        .listMembers({
          organizationId: activeOrg.id,
        })
        .then(({ data, error }) => {
          if (data) setMembers(data);
          setIsLoadingMembers(false);
        });

      authClient.organization
        .listInvitations({
          organizationId: activeOrg.id,
        })
        .then(({ data, error }) => {
          if (data) setInvitations(data);
          setIsLoadingInvitations(false);
        });
    }
  }, [activeOrg]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsInviting(true);
    try {
      const { data, error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
        organizationId: activeOrg?.id,
      });

      if (error) {
        toast.error(error.message || "Failed to send invitation");
        return;
      }

      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      setInviteRole("member");
      setIsInviteDialogOpen(false);

      // Refresh invitations
      const { data: newInvitations } =
        await authClient.organization.listInvitations({
          organizationId: activeOrg?.id,
        });
      if (newInvitations) setInvitations(newInvitations);
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Invite error:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail}?`)) return;

    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg?.id,
      });

      if (error) {
        toast.error(error.message || "Failed to remove member");
        return;
      }

      toast.success("Member removed successfully");
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Remove member error:", error);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message || "Failed to cancel invitation");
        return;
      }

      toast.success("Invitation cancelled");
      setInvitations(invitations.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Cancel invitation error:", error);
    }
  };

  if (isOrgLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>No Active Organization</CardTitle>
            <CardDescription>
              You need to create or join an organization first.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => (window.location.href = "/create-organization")}
            >
              Create Organization
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{activeOrg.name}</h1>
          <p className="text-muted-foreground">
            Manage your organization members and settings
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite team member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={setInviteRole}
                  disabled={isInviting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button onClick={handleInviteMember} disabled={isInviting}>
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">{activeOrg.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Slug</Label>
                <p className="text-lg font-mono">{activeOrg.slug}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>
              People who have access to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMembers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No members yet
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {member.user?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {member.role}
                      </span>
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveMember(member.id, member.user?.email)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            <CardDescription>
              Outstanding invitations to join this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvitations ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No pending invitations
              </p>
            ) : (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited{" "}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                        {invitation.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
