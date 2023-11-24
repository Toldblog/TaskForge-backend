import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpCredentialsDto, SignInDto } from './dtos/index';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/signup')
  signUp(
    @Body()
    authCredentialsDto: SignUpCredentialsDto,
  ): Promise<any> {
    return this.authService.signUp(authCredentialsDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signin')
  signIn(@Body() authDto: SignInDto): Promise<any> {
    return this.authService.signIn(authDto);
  }
}
