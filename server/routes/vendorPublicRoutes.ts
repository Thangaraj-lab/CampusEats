import { Router } from 'express';
import Vendor from '../models/Vendor';
import MenuCategory from '../models/MenuCategory';
import MenuItem from '../models/MenuItem';
import PickupSlot from '../models/PickupSlot';

const router = Router();

// GET /api/vendors - Discover approved vendors
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query: any = { status: 'APPROVED' };

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { location: searchRegex }];
    }

    const vendors = await Vendor.find(query).sort({ isOpen: -1, name: 1 });
    return res.json({ vendors });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ message: 'Failed to fetch vendors.' });
  }
});

// GET /api/vendors/:id - Vendor details
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    return res.json({ vendor });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch vendor details.' });
  }
});

// GET /api/vendors/:id/menu - Vendor menu categories & items
router.get('/:id/menu', async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    const categories = await MenuCategory.find({ vendorId, isActive: true }).sort({ sortOrder: 1, name: 1 });
    const items = await MenuItem.find({ vendorId, isAvailable: true }).sort({ name: 1 });

    return res.json({
      vendor: {
        id: vendor._id,
        name: vendor.name,
        isOpen: vendor.isOpen,
        location: vendor.location,
        estimatedPreparationTime: vendor.estimatedPreparationTime,
      },
      categories,
      items,
    });
  } catch (error: any) {
    console.error('Error fetching vendor menu:', error);
    return res.status(500).json({ message: 'Failed to fetch vendor menu.' });
  }
});

// GET /api/vendors/:id/pickup-slots - Vendor available pickup slots for today/tomorrow
router.get('/:id/pickup-slots', async (req, res) => {
  try {
    const vendorId = req.params.id;
    const dateQuery = (req.query.date as string) || new Date().toISOString().split('T')[0];

    let slots = await PickupSlot.find({ vendorId, date: dateQuery, isActive: true }).sort({ startTime: 1 });

    // If no slots exist for today/tomorrow yet, auto-generate standard 15-min slots for the vendor
    if (slots.length === 0) {
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        const slotDuration = vendor.pickupSlotDuration || 15;
        const capacity = vendor.pickupSlotCapacity || 10;
        const [openH, openM] = (vendor.openingTime || '08:00').split(':').map(Number);
        const [closeH, closeM] = (vendor.closingTime || '21:00').split(':').map(Number);

        let currH = openH;
        let currM = openM;

        const newSlotsToInsert = [];
        while (currH < closeH || (currH === closeH && currM < closeM)) {
          const startTimeStr = `${String(currH).padStart(2, '0')}:${String(currM).padStart(2, '0')}`;
          let endM = currM + slotDuration;
          let endH = currH;
          if (endM >= 60) {
            endM -= 60;
            endH += 1;
          }
          const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

          newSlotsToInsert.push({
            vendorId,
            date: dateQuery,
            startTime: startTimeStr,
            endTime: endTimeStr,
            maxOrders: capacity,
            bookedOrders: 0,
            isActive: true,
          });

          currM = endM;
          currH = endH;
        }

        if (newSlotsToInsert.length > 0) {
          slots = (await PickupSlot.insertMany(newSlotsToInsert)) as any;
        }
      }
    }

    return res.json({ date: dateQuery, slots });
  } catch (error: any) {
    console.error('Error fetching pickup slots:', error);
    return res.status(500).json({ message: 'Failed to fetch pickup slots.' });
  }
});

export default router;
