import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateUserDto } from './dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role, Roles, RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { JwtAuthGuard } from 'src/auth/guards';
import { UtilService } from 'src/common/providers';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private utilService: UtilService
  ) { }

  @Get('me')
  getUser(@GetUser() user: User): User {
    return this.utilService.filterUserResponse(user);
  }

  @Patch('update-me')
  updateMe(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Patch('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', {}))
  uploadAvatar(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  // delete me

  // FOR ADMIN
  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id') id: string): Promise<any> {
    return this.usersService.deleteUser(Number(id));
  }

  // get user
  // get all users
}
