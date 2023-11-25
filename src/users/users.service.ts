import {
  Injectable,
  NotFoundException,
  // UploadedFile,
  // UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  private supabase = createClient(
    this.configService.get('SUPABASE_URL'),
    this.configService.get('SUPABASE_API_KEY'),
  );

  async updateUser(user: User, updateUserDto: UpdateUserDto): Promise<void> {
    const { ...rest } = updateUserDto;
    if (rest.password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(rest.password, salt);
      rest.password = hashedPassword;
      rest.passwordConfirm = null;
      rest.changePasswordAt = new Date().toISOString();
    }
    try {
      await this.prismaService.user.update({
        where: { id: user.id },
        data: rest,
      });
    } catch (error) {
      console.log(error);
      throw new NotFoundException('User not found');
    }
  }

  async uploadAvatar(user: User, file: Express.Multer.File) {
    try {
      const { data, error } = await this.supabase.storage
        .from('avatars') // Bucket name
        .upload(`${user.id}/${file.originalname + Date.now()}`, file.buffer);

      if (error) {
        console.error('Error fetching file:', error);
        return null;
      }

      console.log('File fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  }

  async getAvatar(user: User) {
    try {
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .list(`${user.id}/`);

      if (error) {
        console.error('Error fetching file:', error);
        return null;
      }

      // Data variable contains the downloaded file
      console.log('File fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching file:', error);
      return null;
    }
  }

  async deleteUser(user: User): Promise<void> {
    try {
      await this.prismaService.user.delete({
        where: {
          id: user.id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
