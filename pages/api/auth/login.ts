import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../lib/dbConnect";
import { login } from "../../../services/auth";
import { loginRateLimitMiddleware } from "../../../middleware/rateLimit";

type ResponseData = {
  token?: string;
  user?: any;
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
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Apply rate limiting middleware
    await runMiddleware(req, res, loginRateLimitMiddleware);

    // Connect to database
    await dbConnect();

    const { studentId, password } = req.body;

    // Validate input
    if (!studentId || !password) {
      return res
        .status(400)
        .json({ message: "Please provide student ID and password" });
    }

    // Attempt login
    const { token, user } = await login(studentId, password);

    // Return token and user data (excluding password)
    const userData = {
      _id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      course: user.course,
      yearLevel: user.yearLevel,
    };

    return res.status(200).json({ token, user: userData });
  } catch (error: any) {
    console.error("Login error:", error);
    return res
      .status(401)
      .json({ message: error.message || "Authentication failed" });
  }
}
