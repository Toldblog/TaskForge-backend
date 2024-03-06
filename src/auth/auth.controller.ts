import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, Patch, UseGuards, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpCredentialsDto, SignInDto, UpdatePasswordDto, ForgotPasswordDto, ResetPasswordDto, GoogleAddPasswordDto } from './dtos/index';
import { ResponseInterceptor } from 'src/common/interceptors';
import { User } from '@prisma/client';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) { }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signUp(
    @Body()
    authCredentialsDto: SignUpCredentialsDto,
  ): Promise<any> {
    return this.authService.signUp(authCredentialsDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() authDto: SignInDto): Promise<any> {
    return this.authService.signIn(authDto);
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  updatePassword(
    @GetUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<any> {
    return this.authService.updatePassword(user.id, updatePasswordDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Patch('reset-password/:token')
  resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<any> {
    return this.authService.resetPassword(token, resetPasswordDto);
  }

  @Post('google/signin')
  async googleLogin(@Body() body: { name: string, givenName: string, familyName: string, avatar: string, email: string }): Promise<any> {
    try {
      const data = await this.authService.googleLogin(body.email, body.name, body.givenName, body.familyName, body.avatar);
      return data;
    } catch (error) {
      throw error;
    }
  }

  @Patch('google/add-password')
  @UseGuards(JwtAuthGuard)
  googleAddPassword(@GetUser() user: User, @Body() googleAddPasswordDto: GoogleAddPasswordDto): Promise<any> {
    return this.authService.googleAddPassword(user?.id, googleAddPasswordDto);
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  logout(@GetUser() user: any): any {
    return this.authService.logout(user.token);
  }
}
