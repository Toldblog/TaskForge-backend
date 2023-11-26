import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

// Create a custom authentication strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  // async validate(payload: JwtPayload) {
  //   const { id } = payload;

  //   const user: User = await this.prismaService.user.findUnique({
  //     where: { id },
  //   });

  //   if (!user) {
  //     throw new UnauthorizedException();
  //   }

  //   return user;
  // }
}
