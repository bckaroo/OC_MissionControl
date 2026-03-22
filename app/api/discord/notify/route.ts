import { NextResponse } from "next/server";

const DISCORD_CHANNEL_ID = "1484701256625819658"; // #mission_control

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, channelId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // In production, this would use the OpenClaw message tool or Discord API
    // For now, we'll log it and return success
    console.log(`[Discord Notification] To channel ${channelId || DISCORD_CHANNEL_ID}:`);
    console.log(message);

    // TODO: Implement actual Discord notification via OpenClaw gateway
    // This would typically call something like:
    // message.send({
    //   channel: "discord",
    //   target: channelId || DISCORD_CHANNEL_ID,
    //   message: message,
    // });

    return NextResponse.json({
      success: true,
      channel: channelId || DISCORD_CHANNEL_ID,
      message: "Notification queued",
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
