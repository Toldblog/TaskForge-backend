import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private configService: ConfigService,
  ) { }

  private supabase = createClient(
    this.configService.get('SUPABASE_URL'),
    this.configService.get('SUPABASE_API_KEY'),
  );

  async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<{ user: any }> {
    const { username } = updateUserDto;

    try {
      // check if the changed username already exists in database
      if (await this.prismaService.user.findFirst({
        where: {
          id: {
            not: userId
          },
          username
        }
      })) {
        throw new BadRequestException("Username already exists")
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: updateUserDto,
      });

      return { user: updatedUser };
    } catch (error) {
      throw error;
    }
  }

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ user: any }> {
    try {
      // create random file name
      const fileName = `avatar-${userId}-${Date.now()}`;

      // upload file
      const { error: storageError } = await this.supabase.storage
        .from('avatars') // Bucket name
        .upload(fileName, file.buffer);

      if (storageError) {
        throw new Error(storageError.message);
      }

      // update avatar link
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          avatar: `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/avatars/${fileName}`
        }
      });

      return { user: updatedUser };
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      // check if the user exists
      if (!(await this.prismaService.user.findFirst({ where: { id: userId } }))) {
        throw new NotFoundException("User ID not found");
      }

      // delete user
      await this.prismaService.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
