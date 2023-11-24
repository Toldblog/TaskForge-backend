import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { SignUpCredentialsDto, SignInDto, UpdatePasswordDto } from './dtos/index';
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
    private readonly mailService: MailService
  ) { }

  private filterUserResponse(user: User) {
    const { username, email, name, bio, avatar } = user;
    return {
      user: {
        username,
        email,
        name,
        bio,
        avatar
      }
    }
  }

  private async generateAccessToken(id: number): Promise<string> {
    const payload = { id };
    const accessToken: string = await this.jwtService.signAsync(payload);

    return accessToken;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  }

  async signUp(authCredentialsDto: SignUpCredentialsDto): Promise<any> {
    const { username, email, name, password } = authCredentialsDto;

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    try {
      const user = await this.prismaService.user.create({
        data: {
          username,
          email,
          name,
          password: hashedPassword,
          passwordConfirm: ''
        },
      });

      const userRes = this.filterUserResponse(user);
      const accessToken = await this.generateAccessToken(user.id);

      // send email verification
      await this.mailService.sendEmailVerification(user);

      return {
        user: userRes,
        accessToken
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
      if (!await bcrypt.compare(password, user.password)) {
        throw new UnauthorizedException('Wrong password');
      }
      if (!user.active) {
        throw new UnauthorizedException('This account is not active');
      }

      const accessToken = await this.generateAccessToken(user.id);
      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto): Promise<{ accessToken: string }> {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.prismaService.user.findUnique({
      where: { id }
    });

    try {
      // check if POSTed current password is correct
      if (!await bcrypt.compare(currentPassword, user.password)) {
        throw new UnauthorizedException('Wrong current password');
      }

      // update password
      const hashedNewPassword = await this.hashPassword(newPassword);
      await this.prismaService.user.update({
        where: { id },
        data: {
          password: hashedNewPassword
        }
      });
      
      // new access token
      const accessToken = await this.generateAccessToken(user.id);
      return { accessToken };
    } catch (error) {
      throw error;
    }
  }
}
