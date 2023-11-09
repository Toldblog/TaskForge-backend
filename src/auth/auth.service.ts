import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dtos/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dtos/jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      await this.prismaService.user.create({
        data: {
          username: username,
          password: hashedPassword,
        },
      });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialsDto;

    let user;
    try {
      user = await this.prismaService.user.findUnique({
        where: { username: username },
      });
    } catch (error) {
      console.log(error);
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { username: username };
      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }
}
