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
import { AuthDto } from './dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, email, name, password, passwordConfirm } =
      authCredentialsDto;

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
          passwordConfirm: passwordConfirm,
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

  async signIn(authDto: AuthDto): Promise<{ accessToken: string }> {
    const { username, password } = authDto;

    let user: any;
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
