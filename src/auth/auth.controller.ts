import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpCredentialsDto, SignInDto, UpdatePasswordDto } from './dtos/index';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { GetUser } from './decorators/get-user.decorator';

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
  @UseGuards(AuthGuard('jwt'))
  updatePassword(@GetUser() user: User, @Body() updatePasswordDto: UpdatePasswordDto): Promise<any> {
    return this.authService.updatePassword(user.id, updatePasswordDto);
  }
}
