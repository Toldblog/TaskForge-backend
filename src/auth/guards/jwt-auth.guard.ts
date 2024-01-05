import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (request.route.path.includes('/cards/download-file')) {
            return true;
        }

        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: this.configService.get('JWT_SECRET')
                }
            );

            // check if the password was changed after the token'd been created 
            const { id, iat } = payload;
            const user = await this.prismaService.user.findUnique({
                where: { id },
            });

            if (
                user.changePasswordAt &&
                iat < parseFloat(user.changePasswordAt.getTime().toString()) / 1000
            ) {
                throw new UnauthorizedException("Your password has already been changed.");
            }

            if(!user.active) {
                throw new UnauthorizedException("This account is not active.");
            }

            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            delete user.password, user.active, user.passwordResetToken, user.passwordResetExpires;
            request['user'] = user;
        } catch (error) {
            if (error?.name === 'JsonWebTokenError') {
                throw new UnauthorizedException("Your token is invalid");
            } else if (error?.name === 'TokenExpiredError') {
                throw new UnauthorizedException("Your token is expired");
            }
             else {
                throw error;
            }
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}