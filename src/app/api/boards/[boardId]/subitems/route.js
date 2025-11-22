import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { boardSubitem } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// GET /api/boards/[boardId]/subitems - List all subitems for a board
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;

    // Fetch all subitems for this board, ordered by position
    const subitems = await db
      .select()
      .from(boardSubitem)
      .where(eq(boardSubitem.boardId, boardId))
      .orderBy(boardSubitem.position);

    return NextResponse.json({ subitems });
  } catch (error) {
    console.error("Error fetching subitems:", error);
    return NextResponse.json(
      { error: "Failed to fetch subitems" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/subitems - Create a new subitem
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
    const { id, itemId, name, columns, position } = body;

    if (!id || !itemId || !name || !columns || position === undefined) {
      return NextResponse.json(
        { error: "id, itemId, name, columns, and position are required" },
        { status: 400 }
      );
    }

    const newSubitem = {
      id,
      boardId,
      itemId,
      name,
      columns,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(boardSubitem).values(newSubitem);

    return NextResponse.json({ subitem: newSubitem }, { status: 201 });
  } catch (error) {
    console.error("Error creating subitem:", error);
    return NextResponse.json(
      { error: "Failed to create subitem" },
      { status: 500 }
    );
  }
}
