"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROLE_DISPLAY_NAMES } from "@/types/roles";

interface Invitation {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  status: string;
  expiresAt: Date;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.inviteId) {
      fetchInvite();
    }
  }, [params.inviteId]);

  const fetchInvite = async () => {
    try {
      const response = await fetch(`/api/invitations/${params.inviteId}`);
      if (response.ok) {
        const data = await response.json();
        setInvite(data.invite);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Invitation not found");
      }
    } catch (error) {
      console.error("Error fetching invitation:", error);
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invite) return;

    setAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${params.inviteId}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to tenant dashboard
        router.push(`/dashboard`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600">{error || "Invitation not found"}</p>
        </Card>
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Invitation {invite.status}</h1>
          <p className="text-gray-600">
            This invitation has already been {invite.status}.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="max-w-md p-8 w-full">
        <h1 className="text-2xl font-bold mb-4">Farm Invitation</h1>
        <p className="mb-2 text-gray-600">You've been invited to join as:</p>
        <p className="text-xl font-semibold mb-6">
          {ROLE_DISPLAY_NAMES[invite.role as keyof typeof ROLE_DISPLAY_NAMES]}
        </p>

        {!isLoaded ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Signed in as: {user.emailAddresses[0]?.emailAddress}
            </p>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? "Accepting..." : "Accept Invitation"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please sign in to accept this invitation
            </p>
            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full"
            >
              Sign In to Accept
            </Button>
          </div>
        )}

        {invite.expiresAt && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            Expires: {new Date(invite.expiresAt).toLocaleDateString()}
          </p>
        )}
      </Card>
    </div>
  );
}

