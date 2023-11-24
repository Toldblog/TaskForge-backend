import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SignUpCredentialsDto, SignInDto, JwtPayload } from './dtos/index';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { MailService } from 'src/email/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private filterUserResponse(user: User) {
    const { username, email, name, bio, avatar } = user;
    return {
      user: {
        username,
        email,
        name,
        bio,
        avatar,
      },
    };
  }

  private async generateAccessToken(id: number): Promise<string> {
    const payload: JwtPayload = { id };
    const accessToken: string = await this.jwtService.signAsync(payload);

    return accessToken;
  }

  async signUp(authCredentialsDto: SignUpCredentialsDto): Promise<any> {
    const { username, email, name, password } = authCredentialsDto;

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const user = await this.prismaService.user.create({
        data: {
          username,
          email,
          name,
          password: hashedPassword,
          passwordConfirm: '',
        },
      });

      const userRes = this.filterUserResponse(user);
      const accessToken = await this.generateAccessToken(user.id);

      // send email verification
      await this.mailService.sendUserConfirmation(user);

      return {
        user: userRes,
        accessToken,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(`${error.meta.target} already exists`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(authDto: SignInDto): Promise<{ accessToken: string }> {
    const { username, password } = authDto;

    try {
      const user = await this.prismaService.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        throw new UnauthorizedException('Username not found');
      }
      if (!(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException('Wrong password');
      }

      const accessToken = await this.generateAccessToken(user.id);
      return { accessToken };
    } catch (error) {
      throw error;
    }
  }
}
