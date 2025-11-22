import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { boardItem } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// PATCH /api/boards/[boardId]/items/[itemId] - Update an item
export async function PATCH(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, itemId } = await params;
    const body = await request.json();
    const { name, columns, position, groupId } = body;

    const updates = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updates.name = name;
    if (columns !== undefined) updates.columns = columns;
    if (position !== undefined) updates.position = position;
    if (groupId !== undefined) updates.groupId = groupId;

    await db.update(boardItem).set(updates).where(eq(boardItem.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/items/[itemId] - Delete an item
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, itemId } = await params;

    await db.delete(boardItem).where(eq(boardItem.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
