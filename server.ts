import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB, seedInitialDataIfNeeded } from './server/db';
import { initSocketIO } from './server/socket';
import { authenticate, authorizeRole, AuthRequest } from './server/middleware/auth';
import Order from './server/models/Order';
import Payment from './server/models/Payment';
import PickupSlot from './server/models/PickupSlot';

import authRoutes from './server/routes/authRoutes';
import vendorPublicRoutes from './server/routes/vendorPublicRoutes';
import studentOrderRoutes from './server/routes/studentOrderRoutes';
import vendorKitchenRoutes from './server/routes/vendorKitchenRoutes';
import adminRoutes from './server/routes/adminRoutes';
import { emitOrderUpdate } from './server/socket';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 3000;

  // Initialize Socket.IO
  initSocketIO(server);

  // Security Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP headers for iframe & Vite compatibility
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Razorpay signs the original bytes, so this route must run before the JSON
  // body parser and must verify the unmodified request body.
  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ message: 'Payment webhook is not configured.' });
    }

    const rawBody = req.body as Buffer;
    const receivedSignature = req.header('x-razorpay-signature') || '';
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    if (
      !receivedSignature ||
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))
    ) {
      return res.status(400).json({ message: 'Invalid Razorpay webhook signature.' });
    }

    try {
      const event = JSON.parse(rawBody.toString('utf8'));
      const payment = event?.payload?.payment?.entity;
      if (!payment?.order_id) return res.status(200).json({ received: true });

      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (!order) return res.status(200).json({ received: true });

      if (event.event === 'payment.captured' && order.paymentStatus !== 'PAID') {
        const slot = await PickupSlot.findById(order.pickupSlotId);
        const reservedSlot = slot
          ? await PickupSlot.findOneAndUpdate(
              { _id: slot._id, isActive: true, bookedOrders: { $lt: slot.maxOrders } },
              { $inc: { bookedOrders: 1 } },
              { new: true }
            )
          : null;

        if (!reservedSlot) {
          return res.status(409).json({ message: 'Pickup slot capacity could not be reserved.' });
        }

        order.paymentStatus = 'PAID';
        order.orderStatus = 'PLACED';
        order.paymentId = payment.id;
        await order.save();
        await Payment.findOneAndUpdate(
          { orderId: order._id },
          { providerPaymentId: payment.id, status: 'PAID' }
        );

        emitOrderUpdate(order.vendorId.toString(), order.studentId.toString(), order._id.toString(), 'order:new', {
          id: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          pickupStartTime: order.pickupStartTime,
          pickupEndTime: order.pickupEndTime,
        });
      }

      if (event.event === 'payment.failed' && order.paymentStatus === 'PENDING') {
        order.paymentStatus = 'FAILED';
        await order.save();
        await Payment.findOneAndUpdate({ orderId: order._id }, { status: 'FAILED' });
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Razorpay webhook processing failed:', error);
      return res.status(500).json({ message: 'Webhook processing failed.' });
    }
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic Rate Limiting for auth routes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 200, // limit each IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api/auth/login', limiter);
  app.use('/api/auth/register', limiter);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/vendors', vendorPublicRoutes);
  app.use('/api/orders', studentOrderRoutes);
  app.use('/api/payments', studentOrderRoutes);
  app.use('/api/vendor', vendorKitchenRoutes);
  app.use('/api/admin', adminRoutes);

  // Manual Database Reseed Endpoint
  app.post('/api/seed', authenticate, authorizeRole(['admin']), async (req: AuthRequest, res) => {
    try {
      await seedInitialDataIfNeeded(true);
      return res.json({ message: 'Database reseeded successfully.' });
    } catch (err: any) {
      return res.status(500).json({ message: 'Seed failed.', error: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Campus Eats API', timestamp: new Date().toISOString() });
  });

  // Connect to MongoDB
  await connectDB();

  // Vite Middleware in Development vs Static in Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Express Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'An unexpected internal server error occurred.',
    });
  });

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Campus Eats Full-Stack Server Running on Port ${PORT}`);
    console.log(`👉 http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
