import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockTenantModel = {
    findById: jest.fn(),
  };

  const mockSessionModel = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockTokenModel = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
        { provide: getModelToken('Session'), useValue: mockSessionModel },
        { provide: getModelToken('Token'), useValue: mockTokenModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      
      await expect(service.verifyOtp('test@test.com', '123456')).rejects.toThrow(UnauthorizedException);
    });
  });
});
