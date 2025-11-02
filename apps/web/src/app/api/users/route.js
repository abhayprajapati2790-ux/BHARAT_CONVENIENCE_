import sql from "@/app/api/utils/sql";

// Create a new user
export async function POST(request) {
  try {
    const { email, name, user_type, colony, phone } = await request.json();

    if (!email || !name || !user_type) {
      return Response.json(
        { error: "Email, name, and user_type are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO users (email, name, user_type, colony, phone)
      VALUES (${email}, ${name}, ${user_type}, ${colony || null}, ${phone || null})
      RETURNING *
    `;

    return Response.json({ user: result[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// Get all users with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_type = searchParams.get("user_type");
    const colony = searchParams.get("colony");

    let query = "SELECT * FROM users WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (user_type) {
      paramCount++;
      query += ` AND user_type = $${paramCount}`;
      params.push(user_type);
    }

    if (colony) {
      paramCount++;
      query += ` AND colony = $${paramCount}`;
      params.push(colony);
    }

    query += " ORDER BY created_at DESC";

    const users = await sql(query, params);
    return Response.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
