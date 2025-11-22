import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { boardItem } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// GET /api/boards/[boardId]/items - List all items for a board
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;

    // Fetch all items for this board, ordered by position
    const items = await db
      .select()
      .from(boardItem)
      .where(eq(boardItem.boardId, boardId))
      .orderBy(boardItem.position);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/items - Create a new item
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const body = await request.json();
    const { id, groupId, name, columns, position } = body;

    if (!id || !groupId || !name || !columns || position === undefined) {
      return NextResponse.json(
        { error: "id, groupId, name, columns, and position are required" },
        { status: 400 }
      );
    }

    const newItem = {
      id,
      boardId,
      groupId,
      name,
      columns,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(boardItem).values(newItem);

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
