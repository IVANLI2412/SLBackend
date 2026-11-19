import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

describe('CouponsController (Issue #198) - Unit Tests for Endpoints', () => {
  let controller: CouponsController;
  let service: CouponsService;

  const mockPrisma = {
    coupon: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    getRedemptions: jest.fn(),
    validate: jest.fn(),
    redeem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsController,
        { provide: CouponsService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<CouponsController>(CouponsController);
    service = module.get<CouponsService>(CouponsService);
    jest.clearAllMocks();
  });

  describe('CouponsController.create', () => {
    it('should create a coupon successfully with valid inputs', async () => {
      const dto: CreateCouponDto = {
        code: 'TEST123',
        discountType: 'PERCENTAGE' as const,
        discountValue: 20,
        minOrderAmount: 10,
        maxRedemptions: 100,
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockService.create.mockResolvedValue({ id: 'coupon-1', ...dto });

      const result = await controller.create('user-1', dto);
      expect(result).toBeDefined();
      expect(mockService.create).toHaveBeenCalledWith('user-1', dto);
    });

    it('should reject creation with invalid discountValue', async () => {
      const dto: CreateCouponDto = {
        code: 'TEST123',
        discountType: 'PERCENTAGE' as const,
        discountValue: -5,
      };

      await expect(controller.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject creation with invalid code format', async () => {
      const dto: CreateCouponDto = {
        code: 'BAD CODE',
        discountType: 'PERCENTAGE' as const,
        discountValue: 20,
      };

      await expect(controller.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('CouponsController.findAll', () => {
    it('should return list of coupons', async () => {
      mockService.findAll.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);

      const result = await controller.findAll();
      expect(result).toBeDefined();
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('CouponsController.findOne', () => {
    it('should return a coupon by ID', async () => {
      mockService.findOne.mockResolvedValue({ id: 'c1' });

      const result = await controller.findOne('c1');
      expect(result).toBeDefined();
      expect(mockService.findOne).toHaveBeenCalledWith('c1');
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      mockService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('CouponsController.update', () => {
    it('should update a coupon successfully', async () => {
      const dto: UpdateCouponDto = { discountValue: 30 };
      mockService.findOne.mockResolvedValue({ id: 'c1' });
      mockService.update.mockResolvedValue({ id: 'c1', discountValue: 30 });

      const result = await controller.update('c1', dto);
      expect(result.discountValue).toBe(30);
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      mockService.findOne.mockResolvedValue(null);

      await expect(controller.update('nonexistent', { discountValue: 10 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('CouponsController.validate', () => {
    it('should validate a coupon successfully', async () => {
      mockService.validate.mockResolvedValue({ valid: true, code: 'TEST123' });

      const result = await controller.validate('user-1', { code: 'TEST123', originalPrice: 100 });
      expect(result).toBeDefined();
      expect(mockService.validate).toHaveBeenCalledWith('user-1', { code: 'TEST123', originalPrice: 100 });
    });

    it('should throw NotFoundException for invalid coupon code', async () => {
      mockService.validate.mockResolvedValue({ valid: false });

      await expect(controller.validate('user-1', { code: 'INVALID', originalPrice: 100 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('CouponsController.redeem', () => {
    it('should record a coupon redemption', async () => {
      mockService.redeem.mockResolvedValue(undefined);

      const result = await controller.redeem('user-1', 'c1', 'course-1', 20);
      expect(result).toBeDefined();
      expect(mockService.redeem).toHaveBeenCalledWith('user-1', 'c1', 'course-1', 20);
    });
  });