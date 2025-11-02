import sql from "@/app/api/utils/sql";

// Create a new issue
export async function POST(request) {
  try {
    const {
      title,
      description,
      category,
      location,
      colony,
      latitude,
      longitude,
      image_url,
      reported_by,
    } = await request.json();

    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !colony ||
      !reported_by
    ) {
      return Response.json(
        {
          error:
            "Title, description, category, location, colony, and reported_by are required",
        },
        { status: 400 },
      );
    }

    // Analyze severity using AI
    let severity_level = 3; // Default medium severity
    let ai_analysis = "";

    try {
      const aiResponse = await fetch(
        `${process.env.APP_URL}/integrations/chat-gpt/conversationgpt4`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Analyze this civic issue and rate its severity from 1-5 (1=low, 5=critical). Also provide a brief analysis.
            
            Title: ${title}
            Description: ${description}
            Category: ${category}
            Location: ${location}
            
            Consider factors like public safety, health impact, infrastructure damage, and urgency. Respond with just the severity number (1-5) followed by a brief analysis.`,
              },
            ],
            json_schema: {
              name: "severity_analysis",
              schema: {
                type: "object",
                properties: {
                  severity: { type: "integer" },
                  analysis: { type: "string" },
                },
                required: ["severity", "analysis"],
                additionalProperties: false,
              },
            },
          }),
        },
      );

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        const parsed = JSON.parse(aiResult.choices[0].message.content);
        severity_level = Math.max(1, Math.min(5, parsed.severity));
        ai_analysis = parsed.analysis;
      }
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
    }

    const result = await sql`
      INSERT INTO issues (
        title, description, category, severity_level, location, colony, 
        latitude, longitude, image_url, reported_by, ai_analysis
      )
      VALUES (
        ${title}, ${description}, ${category}, ${severity_level}, ${location}, ${colony},
        ${latitude || null}, ${longitude || null}, ${image_url || null}, ${reported_by}, ${ai_analysis}
      )
      RETURNING *
    `;

    // Award points to user for reporting
    await sql`
      UPDATE users 
      SET points = points + 10 
      WHERE id = ${reported_by}
    `;

    // Check for badge eligibility
    const userStats = await sql`
      SELECT 
        u.points,
        u.badges,
        COUNT(i.id) as report_count
      FROM users u
      LEFT JOIN issues i ON i.reported_by = u.id
      WHERE u.id = ${reported_by}
      GROUP BY u.id, u.points, u.badges
    `;

    if (userStats.length > 0) {
      const { points, badges, report_count } = userStats[0];
      const currentBadges = badges || [];

      const badgeDefinitions = await sql`
        SELECT * FROM badge_definitions 
        WHERE points_required <= ${points} 
        AND reports_required <= ${report_count}
      `;

      const newBadges = badgeDefinitions
        .filter((badge) => !currentBadges.includes(badge.name))
        .map((badge) => badge.name);

      if (newBadges.length > 0) {
        const updatedBadges = [...currentBadges, ...newBadges];
        await sql`
          UPDATE users 
          SET badges = ${updatedBadges}
          WHERE id = ${reported_by}
        `;

        // Create notifications for new badges
        for (const badgeName of newBadges) {
          await sql`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (
              ${reported_by}, 
              'badge_earned', 
              'New Badge Earned!', 
              ${`Congratulations! You've earned the "${badgeName}" badge.`}
            )
          `;
        }
      }
    }

    return Response.json({ issue: result[0] });
  } catch (error) {
    console.error("Error creating issue:", error);
    return Response.json({ error: "Failed to create issue" }, { status: 500 });
  }
}

// Get all issues with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const colony = searchParams.get("colony");
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const order = searchParams.get("order") || "DESC";

    let query = `
      SELECT 
        i.*,
        u.name as reporter_name,
        u.colony as reporter_colony,
        gov.name as assigned_to_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      LEFT JOIN users gov ON i.assigned_to = gov.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    if (colony) {
      paramCount++;
      query += ` AND i.colony = $${paramCount}`;
      params.push(colony);
    }

    if (category) {
      paramCount++;
      query += ` AND i.category = $${paramCount}`;
      params.push(category);
    }

    if (severity) {
      paramCount++;
      query += ` AND i.severity_level = $${paramCount}`;
      params.push(parseInt(severity));
    }

    // Sort by severity first, then by specified field
    if (sortBy === "severity") {
      query += ` ORDER BY i.severity_level ${order}, i.created_at DESC`;
    } else {
      query += ` ORDER BY i.${sortBy} ${order}`;
    }

    const issues = await sql(query, params);
    return Response.json({ issues });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return Response.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}
