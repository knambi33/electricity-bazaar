import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_electricity_bazaar_2026";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  activeOrganisationId?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization token" }
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        memberships: {
          include: { organisation: true }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User account no longer exists" }
      });
      return;
    }

    const primaryMembership = user.memberships.find(m => m.isPrimaryOrg) || user.memberships[0];

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      activeOrganisationId: primaryMembership?.organisationId,
      role: primaryMembership?.role
    };

    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Session token expired or signature invalid" }
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      });
      return;
    }

    if (req.user.role === "PLATFORM_ADMIN" || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: `Action requires one of the following roles: ${allowedRoles.join(", ")}`
      }
    });
  };
}
