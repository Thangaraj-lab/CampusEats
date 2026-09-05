import { Router, Response } from 'express';
import User from '../models/User';
import Vendor from '../models/Vendor';
import Order from '../models/Order';
import Payment from '../models/Payment';
import AuditLog from '../models/AuditLog';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Require admin role
router.use(authenticate, authorizeRole(['admin']));

// GET /api/admin/dashboard - Real MongoDB calculated platform metrics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeVendors = await Vendor.countDocuments({ status: 'APPROVED' });
    const pendingApplications = await Vendor.countDocuments({ status: 'PENDING' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({ createdAt: { $gte: startOfToday } });
    const todayOrdersCount = todayOrders.length;
    const completedOrdersCount = todayOrders.filter((o) => o.orderStatus === 'COMPLETED').length;

    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === 'PAID' && o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const overallRevenue = totalRevenueResult[0]?.total || 0;

    return res.json({
      metrics: {
        totalStudents,
        activeVendors,
        pendingApplications,
        todayOrdersCount,
        completedOrdersCount,
        todayRevenue,
        overallRevenue,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({ message: 'Failed to fetch admin dashboard metrics.' });
  }
});

// GET /api/admin/vendors - All vendors
router.get('/vendors', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const vendors = await Vendor.find(filter).populate('ownerId', 'name email phone').sort({ createdAt: -1 });
    return res.json({ vendors });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch vendors list.' });
  }
});

// GET /api/admin/applications - Pending vendor applications
router.get('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const applications = await Vendor.find({ status: 'PENDING' })
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch vendor applications.' });
  }
});

// Approve Vendor Application
router.patch('/vendors/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

    vendor.status = 'APPROVED';
    vendor.isOpen = true;
    await vendor.save();

    await AuditLog.create({
      actor: req.user!._id,
      action: 'VENDOR_APPROVED',
      target: vendor._id.toString(),
      metadata: { vendorName: vendor.name },
    });

    return res.json({ message: `Vendor "${vendor.name}" approved successfully.`, vendor });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to approve vendor.' });
  }
});

// Reject Vendor Application
router.patch('/vendors/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

    vendor.status = 'REJECTED';
    vendor.isOpen = false;
    await vendor.save();

    await AuditLog.create({
      actor: req.user!._id,
      action: 'VENDOR_REJECTED',
      target: vendor._id.toString(),
      metadata: { vendorName: vendor.name },
    });

    return res.json({ message: `Vendor "${vendor.name}" application rejected.`, vendor });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to reject vendor.' });
  }
});

// Suspend Vendor
router.patch('/vendors/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

    vendor.status = 'SUSPENDED';
    vendor.isOpen = false;
    await vendor.save();

    await AuditLog.create({
      actor: req.user!._id,
      action: 'VENDOR_SUSPENDED',
      target: vendor._id.toString(),
      metadata: { vendorName: vendor.name },
    });

    return res.json({ message: `Vendor "${vendor.name}" suspended.`, vendor });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to suspend vendor.' });
  }
});

// Reactivate Vendor
router.patch('/vendors/:id/reactivate', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

    vendor.status = 'APPROVED';
    vendor.isOpen = true;
    await vendor.save();

    await AuditLog.create({
      actor: req.user!._id,
      action: 'VENDOR_REACTIVATED',
      target: vendor._id.toString(),
      metadata: { vendorName: vendor.name },
    });

    return res.json({ message: `Vendor "${vendor.name}" reactivated.`, vendor });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to reactivate vendor.' });
  }
});

// GET /api/admin/users - Users management with search and role filter
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, search } = req.query;
    const query: any = {};

    if (role && typeof role === 'string') query.role = role;
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }, { studentId: searchRegex }];
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch users list.' });
  }
});

// Toggle User Active Status
router.patch('/users/:id/toggle-active', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate admin accounts.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({ message: `User account ${user.isActive ? 'activated' : 'deactivated'}.`, isActive: user.isActive });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to toggle user status.' });
  }
});

// GET /api/admin/orders - Real orders with server-side pagination and filters
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { vendorId, status, paymentStatus, search, page = '1', limit = '20' } = req.query;

    const filter: any = {};
    if (vendorId) filter.vendorId = vendorId;
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search && typeof search === 'string' && search.trim()) {
      filter.orderNumber = new RegExp(search.trim(), 'i');
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalOrders = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('studentId', 'name email phone studentId')
      .populate('vendorId', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      orders,
      pagination: {
        total: totalOrders,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalOrders / limitNum),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// GET /api/admin/payments - Real payments record
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find()
      .populate('studentId', 'name email')
      .populate('orderId', 'orderNumber totalAmount orderStatus')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ payments });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch payment records.' });
  }
});

// GET /api/admin/reports - MongoDB aggregation analytics reports
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    // 1. Vendor Performance Breakdown
    const vendorPerformance = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      {
        $group: {
          _id: '$vendorId',
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'COMPLETED'] }, 1, 0] },
          },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendorId: '$_id',
          vendorName: '$vendor.name',
          totalOrders: 1,
          completedOrders: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // 2. Order Status Distribution
    const statusDistribution = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    return res.json({
      vendorPerformance,
      statusDistribution,
    });
  } catch (error: any) {
    console.error('Error calculating reports:', error);
    return res.status(500).json({ message: 'Failed to generate reports.' });
  }
});

// GET /api/admin/audit-logs - Recent administrative actions for the dashboard
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({
      logs: logs.map((log) => ({
        _id: log._id,
        action: log.action,
        userId: log.actor,
        details: log.metadata?.vendorName ? `${log.action}: ${log.metadata.vendorName}` : `Target: ${log.target}`,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
});

export default router;
