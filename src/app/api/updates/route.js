import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { update } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

// GET /api/updates?boardId=xxx&itemId=xxx&itemType=xxx
export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId");
    const itemId = searchParams.get("itemId");
    const itemType = searchParams.get("itemType");

    if (!boardId || !itemId || !itemType) {
      return NextResponse.json(
        { error: "boardId, itemId, and itemType are required" },
        { status: 400 }
      );
    }

    // Fetch updates for this item based on type
    let updates;
    if (itemType === "group") {
      updates = await db
        .select()
        .from(update)
        .where(and(eq(update.boardId, boardId), eq(update.groupId, itemId)))
        .orderBy(update.createdAt);
    } else if (itemType === "item") {
      updates = await db
        .select()
        .from(update)
        .where(and(eq(update.boardId, boardId), eq(update.itemId, itemId)))
        .orderBy(update.createdAt);
    } else if (itemType === "subitem") {
      updates = await db
        .select()
        .from(update)
        .where(and(eq(update.boardId, boardId), eq(update.subitemId, itemId)))
        .orderBy(update.createdAt);
    } else {
      return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

// POST /api/updates
export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { boardId, itemId, itemType, message } = body;

    if (!boardId || !itemId || !itemType || !message) {
      return NextResponse.json(
        { error: "boardId, itemId, itemType, and message are required" },
        { status: 400 }
      );
    }

    // Create the update with the correct foreign key field
    const newUpdate = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      boardId,
      itemType,
      message: message.trim(),
      authorId: session.user.id,
      authorName: session.user.name || session.user.email,
      authorEmail: session.user.email,
      createdAt: new Date(),
    };

    // Set the appropriate foreign key based on itemType
    if (itemType === "group") {
      newUpdate.groupId = itemId;
      newUpdate.itemId = null;
      newUpdate.subitemId = null;
    } else if (itemType === "item") {
      newUpdate.groupId = null;
      newUpdate.itemId = itemId;
      newUpdate.subitemId = null;
    } else if (itemType === "subitem") {
      newUpdate.groupId = null;
      newUpdate.itemId = null;
      newUpdate.subitemId = itemId;
    } else {
      return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    await db.insert(update).values(newUpdate);

    return NextResponse.json({ update: newUpdate }, { status: 201 });
  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json(
      { error: "Failed to create update" },
      { status: 500 }
    );
  }
}

// DELETE /api/updates?updateId=xxx
export async function DELETE(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get("updateId");

    if (!updateId) {
      return NextResponse.json(
        { error: "updateId is required" },
        { status: 400 }
      );
    }

    // First, fetch the update to verify ownership
    const [updateToDelete] = await db
      .select()
      .from(update)
      .where(eq(update.id, updateId))
      .limit(1);

    if (!updateToDelete) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Verify the user owns this update
    if (updateToDelete.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own updates" },
        { status: 403 }
      );
    }

    // Delete the update
    await db.delete(update).where(eq(update.id, updateId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting update:", error);
    return NextResponse.json(
      { error: "Failed to delete update" },
      { status: 500 }
    );
  }
}
