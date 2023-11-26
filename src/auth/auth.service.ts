import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dtos/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dtos/jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) { }

  async signUp(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { username, email, name, password } = authCredentialsDto;

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      await this.prismaService.user.create({
        data: {
          username: username,
          email: email,
          name: name,
          password: hashedPassword,
          passwordConfirm: null,
        },
      });
      const payload: JwtPayload = { email };
      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      console.log(error);
      if (error.code === '23505' || error.code === 'P2002') {
        throw new ConflictException('Username or email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(authDto: AuthDto): Promise<{ accessToken: string }> {
    const { email, password } = authDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found');

    if (await bcrypt.compare(password, user.password)) {
      const payload: JwtPayload = { email };
      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }
}
