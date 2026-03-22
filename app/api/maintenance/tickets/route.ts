import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

interface Ticket {
  id: string;
  type: string;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  category: string;
  title: string;
  description: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "scheduled";
  autoFix: string;
  detectedAt: string;
  scheduledFor?: string;
  assignedTo?: string;
  resolution?: string;
}

const TICKETS_FILE = path.join(
  process.env.USERPROFILE || "/root",
  ".openclaw",
  "workspace",
  "memory",
  "maintenance-tickets.json"
);

function ensureTicketsFile(): void {
  const dir = path.dirname(TICKETS_FILE);
  if (!existsSync(dir)) {
    require("fs").mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(TICKETS_FILE)) {
    writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2));
  }
}

function readTickets(): Ticket[] {
  ensureTicketsFile();
  try {
    return JSON.parse(readFileSync(TICKETS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeTickets(tickets: Ticket[]): void {
  ensureTicketsFile();
  writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2));
}

function generateTicketId(type: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const shortType = type.toLowerCase().replace(/\s+/g, "-").substring(0, 15);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `MC-${dateStr}-${shortType}-${random}`;
}

export async function GET() {
  try {
    const tickets = readTickets();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to read tickets:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, severity, category, title, description, message, autoFix } = body;

    if (!type || !severity || !title) {
      return NextResponse.json(
        { error: "Missing required fields: type, severity, title" },
        { status: 400 }
      );
    }

    const ticket: Ticket = {
      id: generateTicketId(type),
      type,
      severity,
      category: category || "general",
      title,
      description: description || message || "",
      message: message || description || "",
      status: "scheduled",
      autoFix: autoFix || "",
      detectedAt: new Date().toISOString(),
      scheduledFor: getNextMaintenanceWindow(),
    };

    const tickets = readTickets();
    tickets.unshift(ticket);
    writeTickets(tickets);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolution } = body;

    if (!id) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
    }

    const tickets = readTickets();
    const index = tickets.findIndex((t) => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (status) {
      tickets[index].status = status;
      if (resolution) {
        tickets[index].resolution = resolution;
      }
    }

    writeTickets(tickets);
    return NextResponse.json(tickets[index]);
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function getNextMaintenanceWindow(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(5, 0, 0, 0); // 5:00 AM

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}
