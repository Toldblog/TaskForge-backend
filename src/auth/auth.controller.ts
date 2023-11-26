import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, Patch, UseGuards, Param, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpCredentialsDto, SignInDto, UpdatePasswordDto, ForgotPasswordDto, ResetPasswordDto, GoogleAddPasswordDto } from './dtos/index';
import { ResponseInterceptor } from 'src/common/interceptors';
import { User } from '@prisma/client';
import { GetUser } from './decorators/get-user.decorator';
import { JwtAuthGuard } from './guards';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  signUp(
    @Body()
    authCredentialsDto: SignUpCredentialsDto,
  ): Promise<any> {
    return this.authService.signUp(
      authCredentialsDto,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(
    @Body() authDto: SignInDto,
  ): Promise<any> {
    return this.authService.signIn(authDto);
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  updatePassword(@GetUser() user: User, @Body() updatePasswordDto: UpdatePasswordDto): Promise<any> {
    return this.authService.updatePassword(user.id, updatePasswordDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Patch('reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() resetPasswordDto: ResetPasswordDto): Promise<any> {
    return this.authService.resetPassword(token, resetPasswordDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() { }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@GetUser() user: User): Promise<any> {
    return this.authService.googleLogin(user);
  }

  @Patch('google/add-password')
  @UseGuards(JwtAuthGuard)
  googleAddPassword(@GetUser() user: User, @Body() googleAddPasswordDto: GoogleAddPasswordDto): Promise<any> {
    return this.authService.googleAddPassword(user?.id, googleAddPasswordDto);
  }
}
