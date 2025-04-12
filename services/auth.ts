import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import User, { IUser } from "../models/User";
import dbConnect from "../lib/dbConnect";

const JWT_SECRET = process.env.JWT_SECRET || "ticksolve-secret-key";

export interface AuthRequest extends NextApiRequest {
  user?: IUser;
}

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Login with student ID and password
export const login = async (studentId: string, password: string) => {
  await dbConnect();

  const user = await User.findOne({ studentId });
  if (!user) {
    throw new Error("Invalid student ID");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const token = generateToken(user._id.toString());
  return { token, user };
};

// Logout function (client-side only)
export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

// Authentication middleware for API routes
export const authMiddleware = async (
  req: AuthRequest,
  res: NextApiResponse,
  next: () => void,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication invalid" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      await dbConnect();
      const user = await User.findById(payload.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "Authentication invalid" });
      }

      req.user = user as IUser;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Authentication invalid" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Get current user from token (client-side)
export const getCurrentUser = async (token: string) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    await dbConnect();
    const user = await User.findById(payload.userId).select("-password");
    return user;
  } catch (error) {
    return null;
  }
};
