import type { NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import Ticket from '../../../models/Ticket';
import { authMiddleware, AuthRequest } from '../../../services/auth';
import { apiRateLimitMiddleware } from '../../../middleware/rateLimit';
import { emitTicketUpdate } from '../../../services/websocket';

type ResponseData = {
  success?: boolean;
  ticket?: any;
  message?: string;
};

// Helper function to run middleware
const runMiddleware = (
  req: AuthRequest,
  res: NextApiResponse,
  fn: Function
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
  res: NextApiResponse<ResponseData>
) {
  try {
    // Apply rate limiting middleware
    await runMiddleware(req, res, apiRateLimitMiddleware);
    
    // Apply authentication middleware
    await runMiddleware(req, res, authMiddleware);
    
    // Connect to database
    await dbConnect();
    
    // Get ticket ID from query
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return getTicket(req, res, id);
      case 'PUT':
        return updateTicket(req, res, id);
      case 'DELETE':
        return deleteTicket(req, res, id);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Ticket API error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET - Fetch a single ticket by ID
async function getTicket(req: AuthRequest, res: NextApiResponse<ResponseData>, id: string) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find ticket by ID
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if the ticket belongs to the current user
    if (ticket.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this ticket' });
    }
    
    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Get ticket error:', error);
    return res.status(500).json({ message: 'Failed to fetch ticket' });
  }
}

// PUT - Update a ticket
async function updateTicket(req: AuthRequest, res: NextApiResponse<ResponseData>, id: string) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find ticket by ID
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check if the ticket belongs to the current user
    if (ticket.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }
    
    // Only allow updates if ticket is not resolved or rejected
    if (ticket.status === 'resolved' || ticket.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot update a resolved or rejected ticket' });
    }
    
    const { description } = req.body;
    
    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { description },
      { new: true, runValidators: true }
    );
    
    // Emit websocket event for real-time updates
    emitTicketUpdate(id, { action: 'updated', ticket: updatedTicket });
    
