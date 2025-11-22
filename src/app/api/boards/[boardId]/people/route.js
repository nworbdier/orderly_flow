import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { person } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/boards/[boardId]/people - Get all people for a board
export async function GET(request, { params }) {
  try {
    const { boardId } = await params;

    // console.log("Fetching people for board:", boardId);

    const people = await db
      .select()
      .from(person)
      .where(eq(person.boardId, boardId));

    // console.log("Found people:", people);

    return NextResponse.json(people);
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/people - Create a new person
export async function POST(request, { params }) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const { id, name, email, color } = body;

    console.log("Creating person:", { id, boardId, name, email, color });

    const newPerson = await db
      .insert(person)
      .values({
        id,
        boardId,
        name,
        email: email || null,
        color,
      })
      .returning();

    // console.log("Created person:", newPerson[0]);

    return NextResponse.json(newPerson[0]);
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person", details: error.message },
      { status: 500 }
    );
  }
}
