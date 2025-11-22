import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { board } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/boards/[boardId] - Get a specific board
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const activeOrgId = session.session.activeOrganizationId;

    const boardData = await db
      .select()
      .from(board)
      .where(and(eq(board.id, boardId), eq(board.organizationId, activeOrgId)))
      .limit(1);

    if (!boardData.length) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ board: boardData[0] });
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/boards/[boardId] - Update a board
export async function PATCH(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const activeOrgId = session.session.activeOrganizationId;
    const body = await request.json();

    // Verify board belongs to user's organization
    const existingBoard = await db
      .select()
      .from(board)
      .where(and(eq(board.id, boardId), eq(board.organizationId, activeOrgId)))
      .limit(1);

    if (!existingBoard.length) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const updatedBoard = await db
      .update(board)
      .set({
        name: body.name ?? existingBoard[0].name,
        columns: body.columns ?? existingBoard[0].columns,
        updatedAt: new Date(),
      })
      .where(eq(board.id, boardId))
      .returning();

    return NextResponse.json({ board: updatedBoard[0] });
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId] - Delete a board
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const activeOrgId = session.session.activeOrganizationId;

    // Verify board belongs to user's organization
    const existingBoard = await db
      .select()
      .from(board)
      .where(and(eq(board.id, boardId), eq(board.organizationId, activeOrgId)))
      .limit(1);

    if (!existingBoard.length) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    await db.delete(board).where(eq(board.id, boardId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
