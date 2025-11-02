import sql from "@/app/api/utils/sql";

// Get notifications for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const unread_only = searchParams.get("unread_only") === "true";
    const limit = parseInt(searchParams.get("limit")) || 20;

    if (!user_id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    let query = `
      SELECT 
        n.*,
        i.title as issue_title
      FROM notifications n
      LEFT JOIN issues i ON n.issue_id = i.id
      WHERE n.user_id = $1
    `;
    const params = [user_id];

    if (unread_only) {
      query += ` AND n.is_read = false`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $2`;
    params.push(limit);

    const notifications = await sql(query, params);

    const unreadCount = await sql`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ${user_id} AND is_read = false
    `;

    return Response.json({
      notifications,
      unread_count: parseInt(unreadCount[0].count),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return Response.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// Mark notifications as read
export async function PUT(request) {
  try {
    const { notification_ids, user_id } = await request.json();

    if (!user_id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    let query;
    let params;

    if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const placeholders = notification_ids
        .map((_, index) => `$${index + 2}`)
        .join(",");
      query = `
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND id IN (${placeholders})
        RETURNING *
      `;
      params = [user_id, ...notification_ids];
    } else {
      // Mark all notifications as read for the user
      query = `
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1
        RETURNING *
      `;
      params = [user_id];
    }

    const result = await sql(query, params);

    return Response.json({
      updated_count: result.length,
      notifications: result,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return Response.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
