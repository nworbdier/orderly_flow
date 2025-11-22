import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { person } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/boards/[boardId]/people/[personId] - Update a person
export async function PATCH(request, { params }) {
  try {
    const { personId } = params;
    const body = await request.json();

    const updatedPerson = await db
      .update(person)
      .set(body)
      .where(eq(person.id, personId))
      .returning();

    return NextResponse.json(updatedPerson[0]);
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { error: "Failed to update person" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/people/[personId] - Delete a person
export async function DELETE(request, { params }) {
  try {
    const { personId } = params;

    await db.delete(person).where(eq(person.id, personId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { error: "Failed to delete person" },
      { status: 500 }
    );
  }
}

