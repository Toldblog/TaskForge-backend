import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SignUpCredentialsDto, SignInDto, UpdatePasswordDto, ResetPasswordDto, GoogleAddPasswordDto } from './dtos/index';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/email/mail.service';
import * as crypto from 'crypto';
import { UtilService } from 'src/common/providers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly utilService: UtilService,
    private readonly configService: ConfigService
  ) { }

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
          passwordConfirm: '',
        },
      });

      const userRes = this.utilService.filterUserResponse(user);
      const accessToken = await this.generateAccessToken(user.id);

      // send email verification
      await this.mailService.sendEmailVerification(user);

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
    const { email, password } = authDto;
    try {
      const user = await this.prismaService.user.findFirst({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Email not found');
      }
      if (!(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException('Wrong password');
      }
      if (!user.active) {
        throw new UnauthorizedException('This account is not active');
      }

      const accessToken = await this.generateAccessToken(user.id);
      const { iat } = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.get('JWT_SECRET')
        }
      );
      // Create TOKEN record
      await this.prismaService.token.create({
        data: {
          userId: user.id,
          token: accessToken,
          createdAt: new Date(iat)
        }
      });

      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  async googleLogin(
    email: string, name: string, givenName: string, familyName: string, avatar: string
  ): Promise<{ user: any, accessToken: string }> {
    let user = await this.prismaService.user.findFirst({
      where: { email }
    });


    // if user does not exist, create a new user with profile information (** NOT set active for user)
    // 'active' attribute only changed when user is created by sign up or password is added
    if (!user) {
      // create a random username for the new user
      let username = `${familyName.substring(0, 2)}${givenName.split(" ").pop()}`;
      username = username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      while (await this.prismaService.user.findFirst({
        where: { username }
      })) {
        const rand = Math.floor(Math.random() * 10000);
        username = `${username}${rand}`;
      }

      user = await this.prismaService.user.create({
        data: {
          email,
          username,
          name,
          avatar,
          active: true
        }
      });
    }

    const userRes = this.utilService.filterUserResponse(user);
    const accessToken = await this.generateAccessToken(user.id);
    const { id: userId, iat } = await this.jwtService.verifyAsync(
      accessToken,
      {
        secret: this.configService.get('JWT_SECRET')
      }
    );
    // Create TOKEN record
    await this.prismaService.token.create({
      data: {
        userId,
        token: accessToken,
        createdAt: new Date(iat)
      }
    });

    return {
      user: userRes,
      accessToken
    };
  }

  async updatePassword(id: number, updatePasswordDto: UpdatePasswordDto): Promise<any> {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    try {
      // check if POSTed current password is correct
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new BadRequestException('Wrong current password');
      }

      // update password
      const hashedNewPassword = await this.hashPassword(newPassword);
      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: {
          password: hashedNewPassword,
        },
      });

      // new access token
      const accessToken = await this.generateAccessToken(user.id);
      const { id: userId, iat } = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.get('JWT_SECRET')
        }
      );
      // Create TOKEN record
      await this.prismaService.token.create({
        data: {
          userId,
          token: accessToken,
          createdAt: new Date(iat)
        }
      });

      const userRes = this.utilService.filterUserResponse(updatedUser)
      return {
        user: userRes,
        accessToken,
      };
    } catch (error) {
      throw error;
    }
  }

  private createPasswordResetToken(): {
    resetToken: string;
    passwordResetToken: string;
  } {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    return { resetToken, passwordResetToken };
  }

  async forgotPassword(email: string): Promise<any> {
    try {
      // get user based on POSTed email
      const user = await this.prismaService.user.findFirst({
        where: { email },
      });
      if (!user) {
        throw new NotFoundException('There is no user with email address.');
      }

      // generate reset token and passwordResetToken
      const { resetToken, passwordResetToken } =
        this.createPasswordResetToken();

      // save passwordResetToken
      await this.prismaService.user.update({
        where: { email },
        data: {
          passwordResetToken,
          passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // send reset password link to email
      await this.mailService.sendEmailResetPassword(email, resetToken);

      return { resetToken };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<any> {
    const { password } = resetPasswordDto;

    try {
      // get user based on the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await this.prismaService.user.findFirst({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: {
            gte: new Date(),
          },
        },
      });

      // if token is not expired -> user, set new password
      if (!user) {
        throw new BadRequestException('Reset token is invalid or has expired.');
      }

      const hashedPassword = await this.hashPassword(password);
      const updatedUser = await this.prismaService.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      const userRes = this.utilService.filterUserResponse(updatedUser);
      return { user: userRes };
    } catch (error) {
      throw error;
    }
  }

  async googleAddPassword(userId: number, googleAddPassword: GoogleAddPasswordDto): Promise<{ user: any, accessToken: string }> {
    const { newPassword } = googleAddPassword;

    try {
      const hashedPassword = await this.hashPassword(newPassword);

      // create accessToken based on user ID
      const accessToken = await this.generateAccessToken(userId);

      // add new password
      const updatedUser = await this.prismaService.user.update({
        where: {
          id: userId
        },
        data: {
          password: hashedPassword
        }
      });

      const userRes = this.utilService.filterUserResponse(updatedUser);
      return {
        user: userRes,
        accessToken
      }
    } catch (error) {
      throw new InternalServerErrorException("Server error");
    }
  }

  async logout(token: string): Promise<any> {
    try {
      await this.prismaService.token.delete({
        where: { token }
      });
      return null;
    } catch (error) {
      throw error;
    }
  }
}
