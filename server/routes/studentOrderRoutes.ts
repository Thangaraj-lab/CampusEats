import { Router, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import Payment from '../models/Payment';
import Vendor from '../models/Vendor';
import MenuItem from '../models/MenuItem';
import PickupSlot from '../models/PickupSlot';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';
import { emitOrderUpdate } from '../socket';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_campus_eats';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_campus_eats';
const ALLOW_TEST_PAYMENTS = process.env.ALLOW_TEST_PAYMENTS === 'true';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Helper to generate secure random 4-digit PIN
function generatePickupPin(): { plain: string; hash: string } {
  const pinNum = crypto.randomInt(1000, 10000); // 1000 to 9999
  const plain = String(pinNum);
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
}

// POST /api/orders/checkout - Initiate checkout and create Razorpay order
router.post('/checkout', authenticate, authorizeRole(['student']), async (req: AuthRequest, res: Response) => {
  try {
    const student = req.user!;
    const { vendorId, items, pickupSlotId } = req.body;

    if (!vendorId || !items || !Array.isArray(items) || items.length === 0 || !pickupSlotId) {
      return res.status(400).json({ message: 'Vendor, items, and pickup slot are required.' });
    }

    // 1. Verify Vendor status
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    if (vendor.status !== 'APPROVED') {
      return res.status(400).json({ message: 'This vendor is currently not accepting orders.' });
    }

    if (!vendor.isOpen) {
      return res.status(400).json({ message: 'Vendor is currently closed.' });
    }

    // 2. Verify Pickup Slot capacity
    const slot = await PickupSlot.findById(pickupSlotId);
    if (!slot || !slot.isActive) {
      return res.status(400).json({ message: 'Selected pickup slot is invalid or inactive.' });
    }

    if (slot.bookedOrders >= slot.maxOrders) {
      return res.status(400).json({ message: 'Selected pickup slot is full. Please choose another slot.' });
    }

    if (slot.vendorId.toString() !== vendor._id.toString()) {
      return res.status(400).json({ message: 'Selected pickup slot does not belong to this vendor.' });
    }

    // 3. Recalculate Subtotal & Verify Item Availability from MongoDB
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item quantity.' });
      }

      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `Item "${item.name || 'Food item'}" is currently unavailable.` });
      }

      if (menuItem.vendorId.toString() !== vendorId) {
        return res.status(400).json({ message: 'All cart items must belong to the same vendor.' });
      }

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        subtotal: itemSubtotal,
      });
    }

    const platformFee = 5; // ₹5 platform convenience fee
    const totalAmount = subtotal + platformFee;

    // 4. Generate Order Number & PIN
    const dateStr = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 8);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CE-${dateStr}-${randomSuffix}`;

    const { plain: pinPlain, hash: pinHash } = generatePickupPin();

    // 5. Create Razorpay Order
    let razorpayOrderId = `order_${Date.now()}_${randomSuffix}`;
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // in paise
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          studentId: (student._id as any).toString(),
          vendorId,
          orderNumber,
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.log('Razorpay API error or test mode fallback:', rzpErr);
    }

    // 6. Save Order in MongoDB
    const newOrder = await Order.create({
      orderNumber,
      studentId: student._id,
      vendorId: vendor._id,
      items: validatedItems,
      subtotal,
      platformFee,
      totalAmount,
      pickupSlotId: slot._id,
      pickupDate: slot.date,
      pickupStartTime: slot.startTime,
      pickupEndTime: slot.endTime,
      orderStatus: 'PLACED',
      paymentStatus: 'PENDING',
      razorpayOrderId,
      pickupPinHash: pinHash,
      pickupPinPlain: pinPlain,
    });

    // 7. Create Payment Record
    const payment = await Payment.create({
      orderId: newOrder._id,
      studentId: student._id,
      provider: 'RAZORPAY',
      providerOrderId: razorpayOrderId,
      amount: totalAmount,
      currency: 'INR',
      status: 'CREATED',
    });

    return res.status(201).json({
      message: 'Checkout initiated. Proceed to payment.',
      order: {
        id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        subtotal: newOrder.subtotal,
        platformFee: newOrder.platformFee,
        totalAmount: newOrder.totalAmount,
        pickupDate: newOrder.pickupDate,
        pickupStartTime: newOrder.pickupStartTime,
        pickupEndTime: newOrder.pickupEndTime,
      },
      razorpayOrder: {
        id: razorpayOrderId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
      },
    });
  } catch (error: any) {
    console.error('Error during checkout:', error);
    return res.status(500).json({ message: 'Checkout failed due to server error.' });
  }
});

// POST /api/payments/verify - Server-side Payment Verification
router.post('/verify', authenticate, authorizeRole(['student']), async (req: AuthRequest, res: Response) => {
  try {
    const student = req.user!;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!orderId || !razorpayOrderId) {
      return res.status(400).json({ message: 'Order reference required for verification.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.studentId.toString() !== (student._id as any).toString()) {
      return res.status(403).json({ message: 'Unauthorized access to order.' });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: 'Payment order reference does not match this checkout.' });
    }

    // Idempotency check: if already paid, return existing status
    if (order.paymentStatus === 'PAID') {
      return res.json({
        message: 'Payment already verified.',
        order,
      });
    }

    // A signature is mandatory except when an explicitly enabled local test mode is used.
    let isValidSignature = ALLOW_TEST_PAYMENTS && !razorpaySignature && !razorpayPaymentId;
    if (razorpaySignature && razorpayPaymentId) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValidSignature = generatedSignature === razorpaySignature;
    }

    if (!isValidSignature) {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ message: 'Payment signature verification failed.' });
    }

    // Reserve capacity atomically before accepting the paid order. This prevents
    // concurrent payments from overselling a pickup slot.
    const slot = await PickupSlot.findById(order.pickupSlotId);
    if (!slot) {
      return res.status(400).json({ message: 'Pickup slot is no longer available.' });
    }
    const reservedSlot = await PickupSlot.findOneAndUpdate(
      { _id: slot._id, isActive: true, bookedOrders: { $lt: slot.maxOrders } },
      { $inc: { bookedOrders: 1 } },
      { new: true }
    );
    if (!reservedSlot) {
      return res.status(409).json({ message: 'This pickup slot just filled up. Please choose another slot.' });
    }

    // Update Payment & Order
    order.paymentStatus = 'PAID';
    order.orderStatus = 'PLACED';
    order.paymentId = razorpayPaymentId || `pay_test_${Date.now()}`;
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        providerPaymentId: razorpayPaymentId || `pay_test_${Date.now()}`,
        status: 'PAID',
      }
    );

    // Real-time notification via Socket.IO to Vendor and Student
    emitOrderUpdate(
      order.vendorId.toString(),
      student._id.toString(),
      (order._id as any).toString(),
      'order:new',
      {
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        pickupStartTime: order.pickupStartTime,
        pickupEndTime: order.pickupEndTime,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      }
    );

    return res.json({
      message: 'Payment verified and order placed successfully!',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        pickupPin: order.pickupPinPlain,
        pickupDate: order.pickupDate,
        pickupStartTime: order.pickupStartTime,
        pickupEndTime: order.pickupEndTime,
      },
    });
  } catch (error: any) {
    console.error('Error in payment verification:', error);
    return res.status(500).json({ message: 'Server error during payment verification.' });
  }
});

// GET /api/orders - Student's Orders
router.get('/', authenticate, authorizeRole(['student']), async (req: AuthRequest, res: Response) => {
  try {
    const student = req.user!;
    const orders = await Order.find({ studentId: student._id })
      .populate('vendorId', 'name logo location phone')
      .sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch student orders.' });
  }
});

// GET /api/orders/:id - Student Order details
router.get('/:id', authenticate, authorizeRole(['student']), async (req: AuthRequest, res: Response) => {
  try {
    const student = req.user!;
    const order = await Order.findById(req.params.id).populate('vendorId', 'name logo location phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.studentId.toString() !== (student._id as any).toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    return res.json({
      order: {
        ...order.toObject(),
        pickupPin: order.pickupPinPlain, // return PIN to owner student
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch order details.' });
  }
});

export default router;
