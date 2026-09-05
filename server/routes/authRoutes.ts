import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Vendor from '../models/Vendor';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campus_eats_jwt_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Student Registration
router.post('/register/student', async (req, res) => {
  try {
    const { name, email, phone, studentId, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      studentId: studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      passwordHash,
      role: 'student',
      isActive: true,
    });

    const token = generateToken((user._id as any).toString());

    return res.status(201).json({
      message: 'Student registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error: any) {
    console.error('Error in student registration:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Vendor Application/Registration
router.post('/register/vendor', async (req, res) => {
  try {
    const { ownerName, email, phone, password, vendorName, vendorDescription, location } = req.body;

    if (!ownerName || !email || !phone || !password || !vendorName || !location) {
      return res.status(400).json({ message: 'All required vendor application fields must be provided.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create vendor user
    const user = await User.create({
      name: ownerName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'vendor',
      isActive: true,
    });

    // Create Vendor profile with PENDING status
    const slug = vendorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Math.floor(100 + Math.random() * 900)}`;

    const vendor = await Vendor.create({
      ownerId: user._id,
      name: vendorName,
      slug,
      description: vendorDescription || '',
      location,
      phone,
      openingTime: '08:00',
      closingTime: '21:00',
      status: 'PENDING',
      isOpen: false,
    });

    user.vendorId = vendor._id as any;
    await user.save();

    const token = generateToken((user._id as any).toString());

    return res.status(201).json({
      message: 'Vendor application submitted successfully. Pending administrator approval.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: vendor._id,
        vendorStatus: vendor.status,
      },
    });
  } catch (error: any) {
    console.error('Error in vendor registration:', error);
    return res.status(500).json({ message: 'Internal server error during vendor registration.' });
  }
});

// Role-aware Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    let vendorData = null;
    if (user.role === 'vendor' && user.vendorId) {
      vendorData = await Vendor.findById(user.vendorId);
    }

    const token = generateToken((user._id as any).toString());

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        studentId: user.studentId,
        vendorId: user.vendorId,
        vendor: vendorData
          ? {
              id: vendorData._id,
              name: vendorData.name,
              status: vendorData.status,
              isOpen: vendorData.isOpen,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Current User Me Endpoint
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let vendorData = null;

    if (user.role === 'vendor' && user.vendorId) {
      vendorData = await Vendor.findById(user.vendorId);
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        studentId: user.studentId,
        vendorId: user.vendorId,
        vendor: vendorData
          ? {
              id: vendorData._id,
              name: vendorData.name,
              status: vendorData.status,
              isOpen: vendorData.isOpen,
            }
          : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch current user context.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  return res.json({ message: 'Logged out successfully.' });
});

export default router;
