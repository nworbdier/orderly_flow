import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { boardSubitem } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// PATCH /api/boards/[boardId]/subitems/[subitemId] - Update a subitem
export async function PATCH(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, subitemId } = await params;
    const body = await request.json();
    const { name, columns, position, itemId } = body;

    const updates = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updates.name = name;
    if (columns !== undefined) updates.columns = columns;
    if (position !== undefined) updates.position = position;
    if (itemId !== undefined) updates.itemId = itemId;

    await db
      .update(boardSubitem)
      .set(updates)
      .where(eq(boardSubitem.id, subitemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating subitem:", error);
    return NextResponse.json(
      { error: "Failed to update subitem" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/subitems/[subitemId] - Delete a subitem
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId, subitemId } = await params;

    await db.delete(boardSubitem).where(eq(boardSubitem.id, subitemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subitem:", error);
    return NextResponse.json(
      { error: "Failed to delete subitem" },
      { status: 500 }
    );
  }
}
