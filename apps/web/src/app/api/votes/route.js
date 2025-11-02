import sql from "@/app/api/utils/sql";

// Create a vote for an issue
export async function POST(request) {
  try {
    const { issue_id, user_id } = await request.json();

    if (!issue_id || !user_id) {
      return Response.json(
        { error: "Issue ID and User ID are required" },
        { status: 400 },
      );
    }

    // Check if user already voted for this issue
    const existingVote = await sql`
      SELECT id FROM votes WHERE issue_id = ${issue_id} AND user_id = ${user_id}
    `;

    if (existingVote.length > 0) {
      return Response.json(
        { error: "User has already voted for this issue" },
        { status: 400 },
      );
    }

    // Check if user is from the same colony as the issue
    const issueColony = await sql`
      SELECT colony FROM issues WHERE id = ${issue_id}
    `;

    const userColony = await sql`
      SELECT colony FROM users WHERE id = ${user_id}
    `;

    if (issueColony.length === 0) {
      return Response.json({ error: "Issue not found" }, { status: 404 });
    }

    if (userColony.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (issueColony[0].colony !== userColony[0].colony) {
      return Response.json(
        { error: "You can only vote for issues in your colony" },
        { status: 403 },
      );
    }

    // Create the vote
    const result = await sql`
      INSERT INTO votes (issue_id, user_id)
      VALUES (${issue_id}, ${user_id})
      RETURNING *
    `;

    // Update vote count in issues table
    const voteCount = await sql`
      SELECT COUNT(*) as count FROM votes WHERE issue_id = ${issue_id}
    `;

    await sql`
      UPDATE issues 
      SET vote_count = ${parseInt(voteCount[0].count)}
      WHERE id = ${issue_id}
    `;

    // Award points to voter
    await sql`
      UPDATE users 
      SET points = points + 2 
      WHERE id = ${user_id}
    `;

    return Response.json({ vote: result[0] });
  } catch (error) {
    console.error("Error creating vote:", error);
    return Response.json({ error: "Failed to create vote" }, { status: 500 });
  }
}

// Get votes for an issue
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue_id = searchParams.get("issue_id");
    const user_id = searchParams.get("user_id");

    if (!issue_id) {
      return Response.json({ error: "Issue ID is required" }, { status: 400 });
    }

    let query = `
      SELECT 
        v.*,
        u.name as voter_name
      FROM votes v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.issue_id = $1
    `;
    const params = [issue_id];

    if (user_id) {
      query += ` AND v.user_id = $2`;
      params.push(user_id);
    }

    query += ` ORDER BY v.created_at DESC`;

    const votes = await sql(query, params);

    const totalCount = await sql`
      SELECT COUNT(*) as count FROM votes WHERE issue_id = ${issue_id}
    `;

    return Response.json({
      votes,
      total_count: parseInt(totalCount[0].count),
      user_voted: user_id ? votes.length > 0 : false,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return Response.json({ error: "Failed to fetch votes" }, { status: 500 });
  }
}
