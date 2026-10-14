import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Public: Search and list tenders
router.get("/tenders", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenderType, state, search } = req.query;

    const where: any = {};
    if (tenderType) where.tenderType = tenderType as string;
    if (state) where.state = state as string;
    if (search) {
      const searchStr = (search as string).trim();
      where.OR = [
        { title: { contains: searchStr } },
        { issuingAuthority: { contains: searchStr } },
        { tenderRefNo: { contains: searchStr } }
      ];
    }

    const tenders = await prisma.tenderOpportunity.findMany({
      where,
      orderBy: { submissionDeadline: "asc" }
    });

    res.json({ success: true, data: tenders });
  } catch (err) {
    console.error("Get tenders error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch tenders" } });
  }
});

// Public: List energy advisory & EPC services
router.get("/services", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    const where: any = { status: "PUBLISHED" };
    if (category) where.category = category as string;
    if (search) {
      const searchStr = (search as string).trim();
      where.OR = [
        { title: { contains: searchStr } },
        { description: { contains: searchStr } }
      ];
    }

    const services = await prisma.serviceListing.findMany({
      where,
      include: {
        organisation: {
          select: {
            legalName: true,
            tradeName: true,
            verificationStatus: true,
            registeredState: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: services });
  } catch (err) {
    console.error("Get services error:", err);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch services" } });
  }
});

export default router;
