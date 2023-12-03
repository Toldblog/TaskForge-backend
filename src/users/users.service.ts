import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { UtilService } from 'src/common/providers';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private configService: ConfigService,
    private readonly utilService: UtilService,
  ) {}

  private supabase = createClient(
    this.configService.get('SUPABASE_URL'),
    this.configService.get('SUPABASE_API_KEY'),
  );

  async updateMe(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<{ user: any }> {
    const { username } = updateUserDto;

    try {
      // check if the changed username already exists in database
      if (
        await this.prismaService.user.findFirst({
          where: {
            id: {
              not: userId,
            },
            username,
          },
        })
      ) {
        throw new BadRequestException('Username already exists');
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: updateUserDto,
      });
      const userRes = this.utilService.filterUserResponse(updatedUser);

      return { user: userRes };
    } catch (error) {
      throw error;
    }
  }

  async deleteMe(userId: number): Promise<any> {
    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: { active: false },
      });
    } catch (error) {
      throw error;
    }
  }

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ user: any }> {
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
          avatar: `${this.configService.get(
            'SUPABASE_URL',
          )}/storage/v1/object/public/avatars/${fileName}`,
        },
      });
      const userRes = this.utilService.filterUserResponse(updatedUser);

      return { user: userRes };
    } catch (error) {
      throw error;
    }
  }
}
