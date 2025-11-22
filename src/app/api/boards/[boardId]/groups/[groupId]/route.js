import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { boardGroup } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// PATCH /api/boards/[boardId]/groups/[groupId] - Update a group
export async function PATCH(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, groupId } = await params;
    const body = await request.json();
    const { title, position } = body;

    const updates = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title;
    if (position !== undefined) updates.position = position;

    await db.update(boardGroup).set(updates).where(eq(boardGroup.id, groupId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/groups/[groupId] - Delete a group
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, groupId } = await params;

    await db.delete(boardGroup).where(eq(boardGroup.id, groupId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
