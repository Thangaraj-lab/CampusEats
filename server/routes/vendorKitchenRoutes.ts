import { Router, Response } from 'express';
import crypto from 'crypto';
import Order, { OrderStatus } from '../models/Order';
import Vendor from '../models/Vendor';
import MenuCategory from '../models/MenuCategory';
import MenuItem from '../models/MenuItem';
import PickupSlot from '../models/PickupSlot';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';
import { emitOrderUpdate } from '../socket';

const router = Router();

// Middleware helper to ensure user is a vendor and has an associated vendor ID
async function requireVendor(req: AuthRequest, res: Response, next: Function) {
  if (!req.user || req.user.role !== 'vendor' || !req.user.vendorId) {
    return res.status(403).json({ message: 'Vendor account required.' });
  }

  const vendor = await Vendor.findById(req.user.vendorId);
  if (!vendor) {
    return res.status(404).json({ message: 'Vendor record not found.' });
  }

  if (vendor.status === 'SUSPENDED' || vendor.status === 'REJECTED') {
    return res.status(403).json({ message: `Vendor account is ${vendor.status.toLowerCase()}. Operation forbidden.` });
  }

  (req as any).vendor = vendor;
  next();
}

// Apply auth to all vendor routes
router.use(authenticate, authorizeRole(['vendor']), requireVendor);

// GET /api/vendor/dashboard - Kitchen Summary Metrics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({
      vendorId: vendor._id,
      createdAt: { $gte: startOfToday },
    });

    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === 'PAID' && o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + o.subtotal, 0);

    const pendingPlaced = todayOrders.filter((o) => o.orderStatus === 'PLACED').length;
    const accepted = todayOrders.filter((o) => o.orderStatus === 'ACCEPTED').length;
    const preparing = todayOrders.filter((o) => o.orderStatus === 'PREPARING').length;
    const ready = todayOrders.filter((o) => o.orderStatus === 'READY').length;
    const completed = todayOrders.filter((o) => o.orderStatus === 'COMPLETED').length;

    return res.json({
      vendor: {
        id: vendor._id,
        name: vendor.name,
        status: vendor.status,
        isOpen: vendor.isOpen,
        location: vendor.location,
        openingTime: vendor.openingTime,
        closingTime: vendor.closingTime,
      },
      metrics: {
        todayOrdersCount: todayOrders.length,
        todayRevenue,
        pendingPlaced,
        accepted,
        preparing,
        ready,
        completed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendor dashboard:', error);
    return res.status(500).json({ message: 'Failed to fetch kitchen metrics.' });
  }
});

// GET /api/vendor/settings - Store configuration for the vendor settings screen
router.get('/settings', async (req: AuthRequest, res: Response) => {
  const vendor = (req as any).vendor;
  return res.json({ vendor });
});

// GET /api/vendor/orders - Active & Past Orders Queue with Urgency
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { status, limit } = req.query;

    // A kitchen must never receive an order before its payment is confirmed.
    const filter: any = { vendorId: vendor._id, paymentStatus: 'PAID' };
    if (status && typeof status === 'string') {
      filter.orderStatus = status;
    }

    let orders = await Order.find(filter)
      .populate('studentId', 'name phone email studentId')
      .sort({ pickupStartTime: 1, createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 100);

    // Calculate Kitchen Urgency (DUE SOON, OVERDUE, NORMAL)
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const ordersWithUrgency = orders.map((ord) => {
      let urgency: 'NORMAL' | 'DUE SOON' | 'OVERDUE' = 'NORMAL';

      if (['PLACED', 'ACCEPTED', 'PREPARING'].includes(ord.orderStatus)) {
        if (ord.pickupStartTime < currentTimeStr) {
          urgency = 'OVERDUE';
        } else {
          // Check if pickup start time is within 20 minutes
          const [pH, pM] = ord.pickupStartTime.split(':').map(Number);
          const pickupMinutes = pH * 60 + pM;
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          if (pickupMinutes - currentMinutes <= 20) {
            urgency = 'DUE SOON';
          }
        }
      }

      return {
        ...ord.toObject(),
        urgency,
      };
    });

    return res.json({ orders: ordersWithUrgency });
  } catch (error: any) {
    console.error('Error fetching kitchen orders:', error);
    return res.status(500).json({ message: 'Failed to fetch kitchen order queue.' });
  }
});

// PATCH /api/vendor/orders/:id/status - Order State Machine Transitions
router.patch('/orders/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { nextStatus } = req.body as { nextStatus: OrderStatus };

    if (!nextStatus) {
      return res.status(400).json({ message: 'Next status required.' });
    }

    const order = await Order.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const currentStatus = order.orderStatus;

    // Strict State Machine Validation Matrix
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PLACED: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
      });
    }

    order.orderStatus = nextStatus;
    const now = new Date();

    if (nextStatus === 'ACCEPTED') order.acceptedAt = now;
    if (nextStatus === 'PREPARING') order.preparingAt = now;
    if (nextStatus === 'READY') order.readyAt = now;
    if (nextStatus === 'COMPLETED') order.completedAt = now;
    if (nextStatus === 'CANCELLED') order.cancelledAt = now;

    await order.save();

    // Event Name mapping
    const eventNameMap: Record<string, string> = {
      ACCEPTED: 'order:accepted',
      PREPARING: 'order:preparing',
      READY: 'order:ready',
      CANCELLED: 'order:cancelled',
      COMPLETED: 'order:completed',
    };

    const eventName = eventNameMap[nextStatus] || 'order:statusUpdated';

    emitOrderUpdate(
      vendor._id.toString(),
      order.studentId.toString(),
      (order._id as any).toString(),
      eventName,
      {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        updatedAt: now,
      }
    );

    return res.json({
      message: `Order status updated to ${nextStatus}.`,
      order,
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Failed to update order status.' });
  }
});

// POST /api/vendor/orders/:id/verify-pickup - Verify Student Pickup PIN
router.post('/orders/:id/verify-pickup', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { pin } = req.body;

    if (!pin || String(pin).trim().length !== 4) {
      return res.status(400).json({ message: 'A 4-digit pickup PIN is required.' });
    }

    const order = await Order.findOne({ _id: req.params.id, vendorId: vendor._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus !== 'READY') {
      return res.status(400).json({
        message: `Pickup PIN can only be verified when order status is READY. Current status: ${order.orderStatus}`,
      });
    }

    const inputHash = crypto.createHash('sha256').update(String(pin).trim()).digest('hex');

    const isMatch = inputHash === order.pickupPinHash || String(pin).trim() === order.pickupPinPlain;

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect Pickup PIN. Verification failed.' });
    }

    // PIN match success -> complete order
    order.orderStatus = 'COMPLETED';
    order.completedAt = new Date();
    await order.save();

    emitOrderUpdate(
      vendor._id.toString(),
      order.studentId.toString(),
      (order._id as any).toString(),
      'order:completed',
      {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'COMPLETED',
        completedAt: order.completedAt,
      }
    );

    return res.json({
      message: 'Pickup verified successfully! Order marked as COMPLETED.',
      order,
    });
  } catch (error: any) {
    console.error('Error verifying pickup PIN:', error);
    return res.status(500).json({ message: 'Server error during pickup PIN verification.' });
  }
});

// Menu Categories Management
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const categories = await MenuCategory.find({ vendorId: vendor._id }).sort({ sortOrder: 1, name: 1 });
    return res.json({ categories });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { name, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const category = await MenuCategory.create({
      vendorId: vendor._id,
      name: name.trim(),
      sortOrder: sortOrder || 0,
      isActive: true,
    });

    return res.status(201).json({ message: 'Category created.', category });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create category.' });
  }
});

router.patch('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { name, sortOrder, isActive } = req.body;

    const category = await MenuCategory.findOneAndUpdate(
      { _id: req.params.id, vendorId: vendor._id },
      { $set: { name, sortOrder, isActive } },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: 'Category not found.' });
    return res.json({ message: 'Category updated.', category });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    await MenuCategory.deleteOne({ _id: req.params.id, vendorId: vendor._id });
    await MenuItem.deleteMany({ categoryId: req.params.id, vendorId: vendor._id });
    return res.json({ message: 'Category and associated items deleted.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
});

// Menu Items Management
router.get('/menu', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const items = await MenuItem.find({ vendorId: vendor._id }).populate('categoryId', 'name').sort({ name: 1 });
    return res.json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch menu items.' });
  }
});

router.post('/menu', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { categoryId, name, description, price, image, preparationTime, isVegetarian, isAvailable } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ message: 'Category, name, and price are required.' });
    }

    const item = await MenuItem.create({
      vendorId: vendor._id,
      categoryId,
      name,
      description: description || '',
      price: Number(price),
      image: image || '',
      preparationTime: Number(preparationTime) || 10,
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    return res.status(201).json({ message: 'Menu item created.', item });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create menu item.' });
  }
});

router.patch('/menu/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const updateFields = req.body;

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, vendorId: vendor._id },
      { $set: updateFields },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Menu item not found.' });
    return res.json({ message: 'Menu item updated.', item });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update menu item.' });
  }
});

router.delete('/menu/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    await MenuItem.deleteOne({ _id: req.params.id, vendorId: vendor._id });
    return res.json({ message: 'Menu item deleted.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete menu item.' });
  }
});

// Vendor Settings
router.patch('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const {
      name,
      description,
      location,
      phone,
      openingTime,
      closingTime,
      isOpen,
      estimatedPreparationTime,
      pickupSlotCapacity,
      pickupSlotDuration,
      maxOrdersPerSlot,
      slotIntervalMinutes,
    } = req.body;

    if (name) vendor.name = name;
    if (description !== undefined) vendor.description = description;
    if (location) vendor.location = location;
    if (phone) vendor.phone = phone;
    if (openingTime) vendor.openingTime = openingTime;
    if (closingTime) vendor.closingTime = closingTime;
    if (isOpen !== undefined) vendor.isOpen = Boolean(isOpen);
    if (estimatedPreparationTime !== undefined) vendor.estimatedPreparationTime = Number(estimatedPreparationTime);
    if (pickupSlotCapacity !== undefined || maxOrdersPerSlot !== undefined) {
      vendor.pickupSlotCapacity = Number(pickupSlotCapacity ?? maxOrdersPerSlot);
    }
    if (pickupSlotDuration !== undefined || slotIntervalMinutes !== undefined) {
      vendor.pickupSlotDuration = Number(pickupSlotDuration ?? slotIntervalMinutes);
    }

    await vendor.save();

    return res.json({ message: 'Vendor settings updated.', vendor });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update vendor settings.' });
  }
});

export default router;
