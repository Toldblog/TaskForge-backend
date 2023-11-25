import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/me')
  getUser(@GetUser() user: User): User {
    return user;
  }

  @Patch()
  async updateUser(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    return this.usersService.updateUser(user, updateUserDto);
  }

  @Post('/uploadAvatar')
  @UseInterceptors(FileInterceptor('avatar', {}))
  async uploadAvatar(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user, file);
  }

  @Get('/getAvatar')
  async getAvatar(@GetUser() user: User) {
    return this.usersService.getAvatar(user);
  }

  @Delete()
  async deleteUser(@GetUser() user: User): Promise<void> {
    console.log(user);
    return this.usersService.deleteUser(user);
  }
}
