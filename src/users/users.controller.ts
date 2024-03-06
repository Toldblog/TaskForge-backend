import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import { CRUDService } from '../common/providers';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(
    private crudService: CRUDService,
    private usersService: UsersService,
    private utilService: UtilService,
  ) { }

  // ME

  @Get('me')
  getMe(@GetUser() user: User): User {
    return this.utilService.filterUserResponse(user);
  }

  @Patch('me')
  updateMe(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    return this.usersService.updateMe(user.id, updateUserDto);
  }

  @Delete('me') // Delete a user by ID using prismaService.user
  async deleteMe(@GetUser() user: User): Promise<any> {
    try {
      await this.crudService.updateOne('user', user.id, {
        active: false
      });

      return null;
    } catch (error) {
      throw error;
    }
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', {}))
  uploadAvatar(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    return this.usersService.uploadAvatar(user.id, file);
  }

  // CRUD API
  @Get()
  async getAllUsers(@GetUser() user: User, @Query() options: any): Promise<any> {
    try {
      const result = await this.crudService.getAll('user', options);
      if (user.role === 'USER') {
        result['users'] = result['users'].filter(user => user.role === 'USER');
      }

      return {
        results: result.results,
        users: result['users'].map(user => this.utilService.filterUserResponse(user))
      }
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.getOne('user', id);
      return {
        user: this.utilService.filterUserResponse(result['user'])
      }
    } catch (error) {
      throw error;
    }
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any): Promise<any> {
    try {
      const result = await this.crudService.updateOne('user', id, body);
      return {
        user: this.utilService.filterUserResponse(result['user'])
      }
    } catch (error) {
      throw error;
    }
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<any> {
    try {
      const result = await this.crudService.deleteOne('user', id);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
