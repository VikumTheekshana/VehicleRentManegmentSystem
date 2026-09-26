import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../users/user.schema';
import { EncryptionService } from '../../core/encryption/encryption.service';
import { AuditService } from '../../core/audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
  ) {}

  async register(dto: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    nicNumber?: string;
    drivingLicense?: string;
    role?: UserRole;
  }) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = new this.userModel({
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role || UserRole.CUSTOMER,
      phoneEncrypted: dto.phone ? this.encryptionService.encrypt(dto.phone) : undefined,
      nicNumberEncrypted: dto.nicNumber ? this.encryptionService.encrypt(dto.nicNumber) : undefined,
      drivingLicenseEncrypted: dto.drivingLicense ? this.encryptionService.encrypt(dto.drivingLicense) : undefined,
      isVerified: true,
    });

    await user.save();

    await this.auditService.log({
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      resource: 'User',
      resourceId: user._id.toString(),
    });

    return this.generateTokens(user);
  }

  async login(dto: { email: string; password: string; ipAddress?: string; userAgent?: string }) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact fleet support.');
    }

    const tokens = await this.generateTokens(user);

    // Save refresh token hash
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = refreshHash;
    await user.save();

    await this.auditService.log({
      actorId: user._id.toString(),
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user._id.toString(),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    return tokens;
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'super_enterprise_vms_jwt_refresh_token_2026',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  sanitizeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneMasked: user.phoneEncrypted ? this.encryptionService.mask(user.phoneEncrypted) : null,
      nicMasked: user.nicNumberEncrypted ? this.encryptionService.mask(user.nicNumberEncrypted) : null,
      drivingLicenseMasked: user.drivingLicenseEncrypted ? this.encryptionService.mask(user.drivingLicenseEncrypted) : null,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: (user as any).createdAt,
    };
  }
}
