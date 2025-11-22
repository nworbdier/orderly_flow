import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { boardGroup } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

// GET /api/boards/[boardId]/groups - List all groups for a board
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;

    // Fetch all groups for this board, ordered by position
    const groups = await db
      .select()
      .from(boardGroup)
      .where(eq(boardGroup.boardId, boardId))
      .orderBy(boardGroup.position);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/groups - Create a new group
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
    const { id, title, position } = body;

    if (!id || !title || position === undefined) {
      return NextResponse.json(
        { error: "id, title, and position are required" },
        { status: 400 }
      );
    }

    const newGroup = {
      id,
      boardId,
      title,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(boardGroup).values(newGroup);

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
