import { Request, Response } from "express";
import distributor_model from "../models/distributor.js";

export const get_distributors = async (req: Request, res: Response) => {
  try {
    const { search = "", limit = "100", page = "1" } = req.query as Record<string, string>;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { gstinNumber: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      distributor_model.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      distributor_model.countDocuments(filter),
    ]);

    const data = items.map((d) => ({ ...d, id: d._id.toString(), _id: d._id.toString() }));

    res.json({ success: true, data: { distributors: data, pagination: { total, page: pageNum, limit: limitNum } } });
  } catch (error) {
    console.error("Error fetching distributors:", error);
    res.status(500).json({ success: false, error: "Failed to fetch distributors" });
  }
};

export const post_distributor = async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, address, gstinNumber, email } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }
    const distributor = await distributor_model.create({ name, phoneNumber, address, gstinNumber, email });
    const obj = distributor.toObject();
    res.status(201).json({ success: true, data: { ...obj, id: obj._id.toString(), _id: obj._id.toString() } });
  } catch (error) {
    console.error("Error creating distributor:", error);
    res.status(500).json({ success: false, error: "Failed to create distributor" });
  }
};

export const put_distributor = async (req: Request, res: Response) => {
  try {
    const updated = await distributor_model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, error: "Distributor not found" });
    const obj = updated.toObject();
    res.json({ success: true, data: { ...obj, id: obj._id.toString(), _id: obj._id.toString() } });
  } catch (error) {
    console.error("Error updating distributor:", error);
    res.status(500).json({ success: false, error: "Failed to update distributor" });
  }
};

export const delete_distributor = async (req: Request, res: Response) => {
  try {
    const deleted = await distributor_model.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: "Distributor not found" });
    res.json({ success: true, message: "Distributor permanently deleted" });
  } catch (error) {
    console.error("Error deleting distributor:", error);
    res.status(500).json({ success: false, error: "Failed to delete distributor" });
  }
};

export const delete_all_distributors = async (req: Request, res: Response) => {
  try {
    const { confirmDeleteAll } = req.body || {};
    if (!confirmDeleteAll) {
      return res.status(400).json({ success: false, error: "confirmDeleteAll is required" });
    }
    const result = await distributor_model.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount || 0, message: "All distributors deleted" });
  } catch (error) {
    console.error("Error deleting all distributors:", error);
    res.status(500).json({ success: false, error: "Failed to delete all distributors" });
  }
};

export default {
  get_distributors,
  post_distributor,
  put_distributor,
  delete_distributor,
  delete_all_distributors,
};


