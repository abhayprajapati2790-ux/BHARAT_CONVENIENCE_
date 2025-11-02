import sql from "@/app/api/utils/sql";

// Get a specific issue
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      SELECT 
        i.*,
        u.name as reporter_name,
        u.email as reporter_email,
        u.colony as reporter_colony,
        gov.name as assigned_to_name,
        gov.email as assigned_to_email
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      LEFT JOIN users gov ON i.assigned_to = gov.id
      WHERE i.id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get status updates for this issue
    const statusUpdates = await sql`
      SELECT 
        su.*,
        u.name as updated_by_name
      FROM status_updates su
      LEFT JOIN users u ON su.updated_by = u.id
      WHERE su.issue_id = ${id}
      ORDER BY su.created_at DESC
    `;

    // Get vote count
    const voteCount = await sql`
      SELECT COUNT(*) as count FROM votes WHERE issue_id = ${id}
    `;

    const issue = {
      ...result[0],
      status_updates: statusUpdates,
      vote_count: parseInt(voteCount[0].count),
    };

    return Response.json({ issue });
  } catch (error) {
    console.error("Error fetching issue:", error);
    return Response.json({ error: "Failed to fetch issue" }, { status: 500 });
  }
}

// Update an issue
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updates = await request.json();

    const allowedFields = [
      "title",
      "description",
      "category",
      "status",
      "assigned_to",
    ];
    const setClause = [];
    const values = [];
    let paramCount = 0;

    // Store old status for status update tracking
    const currentIssue =
      await sql`SELECT status, reported_by FROM issues WHERE id = ${id}`;
    if (currentIssue.length === 0) {
      return Response.json({ error: "Issue not found" }, { status: 404 });
    }

    const oldStatus = currentIssue[0].status;
    const reportedBy = currentIssue[0].reported_by;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (setClause.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE issues 
      SET ${setClause.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    // If status changed, create status update record
    if (updates.status && updates.status !== oldStatus) {
      await sql`
        INSERT INTO status_updates (issue_id, updated_by, old_status, new_status, comment)
        VALUES (${id}, ${updates.updated_by || null}, ${oldStatus}, ${updates.status}, ${updates.comment || null})
      `;

      // Create notification for the reporter
      const statusMessages = {
        in_progress: "Your reported issue is now being worked on.",
        resolved: "Great news! Your reported issue has been resolved.",
        rejected: "Your reported issue has been reviewed and rejected.",
      };

      if (statusMessages[updates.status]) {
        await sql`
          INSERT INTO notifications (user_id, issue_id, type, title, message)
          VALUES (
            ${reportedBy}, 
            ${id}, 
            'status_update', 
            'Issue Status Updated', 
            ${statusMessages[updates.status]}
          )
        `;
      }

      // Award bonus points for resolved issues
      if (updates.status === "resolved") {
        await sql`
          UPDATE users 
          SET points = points + 20 
          WHERE id = ${reportedBy}
        `;
      }
    }

    return Response.json({ issue: result[0] });
  } catch (error) {
    console.error("Error updating issue:", error);
    return Response.json({ error: "Failed to update issue" }, { status: 500 });
  }
}
