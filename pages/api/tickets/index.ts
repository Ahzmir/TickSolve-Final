import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../lib/dbConnect";
import Ticket from "../../../models/Ticket";
import { authMiddleware, AuthRequest } from "../../../services/auth";
import { apiRateLimitMiddleware } from "../../../middleware/rateLimit";
import { emitTicketUpdate } from "../../../services/websocket";

type ResponseData = {
  success?: boolean;
  tickets?: any[];
  ticket?: any;
  totalPages?: number;
  message?: string;
};

// Helper function to run middleware
const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function,
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(
  req: AuthRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    // Apply rate limiting middleware
    await runMiddleware(req, res, apiRateLimitMiddleware);

    // Apply authentication middleware
    await runMiddleware(req, res, authMiddleware);

    // Connect to database
    await dbConnect();

    // Handle different HTTP methods
    switch (req.method) {
      case "GET":
        return getTickets(req, res);
      case "POST":
        return createTicket(req, res);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Tickets API error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET - Fetch tickets with pagination and sorting
async function getTickets(
  req: AuthRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || "createdAt";
    const direction = (req.query.direction as string) || "desc";

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Create sort object
    const sortObj: any = {};
    sortObj[sort] = direction === "asc" ? 1 : -1;

    // Query tickets for the current user
    const tickets = await Ticket.find({ student: req.user._id })
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Count total tickets for pagination
    const totalTickets = await Ticket.countDocuments({ student: req.user._id });
    const totalPages = Math.ceil(totalTickets / limit);

    return res.status(200).json({
      success: true,
      tickets,
      totalPages,
    });
  } catch (error: any) {
    console.error("Get tickets error:", error);
    return res.status(500).json({ message: "Failed to fetch tickets" });
  }
}

// POST - Create a new ticket
async function createTicket(
  req: AuthRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { category, subject, description, priority } = req.body;

    // Validate input
    if (!category || !subject || !description) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Create new ticket
    const ticket = await Ticket.create({
      student: req.user._id,
      category,
      subject,
      description,
      priority: priority || "medium",
      status: "pending",
    });

    // Emit websocket event for real-time updates
    emitTicketUpdate(ticket._id.toString(), { action: "created", ticket });

    return res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ message: "Failed to create ticket" });
  }
}
