import mongoose, { Document, Schema } from "mongoose";

export interface ITicket extends Document {
  student: mongoose.Types.ObjectId;
  category: string;
  subject: string;
  description: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  priority: "low" | "medium" | "high";
  assignedTo?: mongoose.Types.ObjectId;
  comments: {
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
}

const TicketSchema = new Schema<ITicket>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide student ID"],
    },
    category: {
      type: String,
      required: [true, "Please provide category"],
      enum: [
        "bullying",
        "grade-consultation",
        "teacher-abuse",
        "facility-issue",
        "other",
      ],
    },
    subject: {
      type: String,
      required: [true, "Please provide subject"],
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Please provide description"],
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// Use mongoose.models to prevent model recompilation error in development
const Ticket =
  mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
