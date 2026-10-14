import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_electricity_bazaar_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "super_secret_jwt_refresh_key_electricity_bazaar_2026";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  organisationName: z.string().min(2),
  orgType: z.enum([
    "BUYER_CI",
    "RE_DEVELOPER",
    "CONVENTIONAL_GENERATOR",
    "CAPTIVE_PRODUCER",
    "ELECTRICITY_TRADER",
    "STORAGE_OPERATOR",
    "SOLAR_EPC",
    "EQUIPMENT_SUPPLIER",
    "ADVISORY_CONSULTANT"
  ]),
  registeredState: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register new user and organization
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: { code: "EMAIL_TAKEN", message: "An account with this email address already exists" }
      });
      return;
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Determine initial role based on orgType
    const initialRole = validated.orgType === "BUYER_CI" 
      ? "BUYER_ADMIN" 
      : validated.orgType === "ADVISORY_CONSULTANT" 
      ? "SERVICE_PROVIDER" 
      : "SELLER_ADMIN";

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email.toLowerCase(),
          passwordHash,
          fullName: validated.fullName,
          phone: validated.phone,
          isEmailVerified: true
        }
      });

      const organisation = await tx.organisation.create({
        data: {
          legalName: validated.organisationName,
          orgType: validated.orgType,
          registeredState: validated.registeredState,
          verificationStatus: "UNVERIFIED"
        }
      });

      await tx.organisationMembership.create({
        data: {
          userId: user.id,
          organisationId: organisation.id,
          role: initialRole,
          isPrimaryOrg: true
        }
      });

      return { user, organisation, role: initialRole };
    });

    const accessToken = jwt.sign(
      { userId: result.user.id, role: result.role, orgId: result.organisation.id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: result.user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.role
        },
        organisation: result.organisation,
        accessToken,
        refreshToken
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid form fields", details: err.errors }
      });
      return;
    }
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create account" } });
  }
});

// User login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: {
        memberships: {
          include: { organisation: true }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Incorrect email or password" }
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Incorrect email or password" }
      });
      return;
    }

    const primaryMembership = user.memberships.find(m => m.isPrimaryOrg) || user.memberships[0];

    const accessToken = jwt.sign(
      { userId: user.id, role: primaryMembership?.role, orgId: primaryMembership?.organisationId },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: primaryMembership?.role
        },
        organisation: primaryMembership?.organisation,
        accessToken,
        refreshToken
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid credentials format" }
      });
      return;
    }
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to authenticate" } });
  }
});

// Current User Profile & Memberships
router.get("/me", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        memberships: {
          include: { organisation: true }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
      return;
    }

    const primaryMembership = user.memberships.find(m => m.isPrimaryOrg) || user.memberships[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          role: primaryMembership?.role
        },
        activeOrganisation: primaryMembership?.organisation,
        allMemberships: user.memberships.map(m => ({
          organisationId: m.organisationId,
          organisationName: m.organisation.legalName,
          orgType: m.organisation.orgType,
          role: m.role,
          isPrimaryOrg: m.isPrimaryOrg
        }))
      }
    });
  } catch (err) {
    console.error("Auth /me error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch user" } });
  }
});

export default router;
