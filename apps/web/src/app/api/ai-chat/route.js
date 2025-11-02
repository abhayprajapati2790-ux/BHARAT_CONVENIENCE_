import sql from "@/app/api/utils/sql";

// AI Chat assistant for user guidance
export async function POST(request) {
  try {
    const { messages, user_id } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // Get user context if user_id is provided
    let userContext = "";
    if (user_id) {
      const user = await sql`SELECT * FROM users WHERE id = ${user_id}`;
      if (user.length > 0) {
        const userStats = await sql`
          SELECT 
            COUNT(i.id) as total_reports,
            COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) as resolved_reports
          FROM issues i
          WHERE i.reported_by = ${user_id}
        `;

        userContext = `User context: ${user[0].name} from ${user[0].colony || "unknown colony"}, ${user[0].user_type} user with ${user[0].points} points, ${user[0].badges?.length || 0} badges. Total reports: ${userStats[0].total_reports}, Resolved: ${userStats[0].resolved_reports}.`;
      }
    }

    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant for BHARAT CONVENIENCE, a civic issue reporting platform. Help users with:

1. How to report issues effectively
2. Understanding the voting system
3. Tracking issue status
4. Earning points and badges
5. Using the donation system
6. General platform navigation

Key features:
- Users can report civic issues with photos
- AI analyzes severity (1-5 scale)
- Colony-based voting system
- Gamification with points and badges
- Government and public panels
- Status tracking and notifications
- Optional Aptos blockchain donations for poor people

${userContext}

Be helpful, concise, and guide users to use the platform effectively. If asked about technical issues, suggest contacting support.`,
    };

    const response = await fetch(
      `${process.env.APP_URL}/integrations/chat-gpt/conversationgpt4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [systemMessage, ...messages],
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("AI service unavailable");
    }

    const result = await response.json();
    return Response.json({
      message: result.choices[0].message.content,
      usage: result.usage,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return Response.json(
      {
        error:
          "AI assistant is temporarily unavailable. Please try again later.",
      },
      { status: 500 },
    );
  }
}
