import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WsGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      // check if the password was changed after the token'd been created
      const { id, iat } = payload;
      const user = await this.prismaService.user.findUnique({
        where: { id },
      });

      if (
        user.changePasswordAt &&
        iat < parseFloat(user.changePasswordAt.getTime().toString()) / 1000
      ) {
        throw new UnauthorizedException(
          'Your password has already been changed.',
        );
      }

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      context.switchToHttp().getRequest().user = user;
    } catch (error) {
      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Your token is invalid');
      } else if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Your token is expired');
      } else {
        throw error;
      }
    }

    return true;
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const [type, token] =
      client.handshake.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
