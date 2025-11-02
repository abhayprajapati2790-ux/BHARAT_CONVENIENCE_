import sql from "@/app/api/utils/sql";

// Create a new donation record
export async function POST(request) {
  try {
    const {
      donor_name,
      donor_email,
      amount,
      transaction_hash,
      blockchain_network = "aptos",
    } = await request.json();

    if (!donor_name || !amount || !transaction_hash) {
      return Response.json(
        {
          error: "Donor name, amount, and transaction hash are required",
        },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO donations (donor_name, donor_email, amount, transaction_hash, blockchain_network)
      VALUES (${donor_name}, ${donor_email || null}, ${amount}, ${transaction_hash}, ${blockchain_network})
      RETURNING *
    `;

    return Response.json({ donation: result[0] });
  } catch (error) {
    console.error("Error creating donation:", error);
    return Response.json(
      { error: "Failed to create donation" },
      { status: 500 },
    );
  }
}

// Get all donations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    const donations = await sql`
      SELECT * FROM donations 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalResult = await sql`
      SELECT 
        COUNT(*) as total_donations,
        SUM(amount) as total_amount
      FROM donations
    `;

    return Response.json({
      donations,
      total_donations: parseInt(totalResult[0].total_donations),
      total_amount: parseFloat(totalResult[0].total_amount) || 0,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return Response.json(
      { error: "Failed to fetch donations" },
      { status: 500 },
    );
  }
}
