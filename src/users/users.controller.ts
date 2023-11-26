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
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/guards/roles.enum';
import { Roles } from 'src/auth/guards/roles.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('/me')
  getUser(@GetUser() user: User): User {
    return user;
  }

  @Patch('/update-me')
  updateMe(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Patch('/upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', {}))
  uploadAvatar(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  // delete me

  // FOR ADMIN
  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUser(Number(id));
  }

  // get user
  // get all users
}
