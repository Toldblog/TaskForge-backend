import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from '../dtos/jwt-payload.interface';
import { User } from '@prisma/client';

// Create a custom authentication strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload) {
    const { id, iat } = payload;

    const user: User = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // check if the password was changed after the token'd been created 
    if (user.changePasswordAt && iat < parseFloat(user.changePasswordAt.getTime().toString()) / 1000) {
      throw new UnauthorizedException("Your password has already been changed.");
    }

    return user;
  }
}
