import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity, AuthProvider } from '../database/entities/user.entity';
import { RegisterDto, LoginDto, FirebaseAuthDto } from './dto/auth.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      provider: AuthProvider.LOCAL,
    });
    await this.usersRepo.save(user);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'displayName', 'passwordHash', 'provider'],
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async firebaseLogin(dto: FirebaseAuthDto) {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(dto.idToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    let user = await this.usersRepo.findOne({ where: { email: decoded.email } });
    if (!user) {
      user = this.usersRepo.create({
        email: decoded.email!,
        displayName: decoded.name ?? decoded.email!,
        photoUrl: decoded.picture,
        provider: AuthProvider.FIREBASE,
        providerId: decoded.uid,
      });
      await this.usersRepo.save(user);
    }

    return this.issueTokens(user);
  }

  private issueTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      },
    };
  }
}
