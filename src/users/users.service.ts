import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUser(user: User, updateUserDto: UpdateUserDto): Promise<void> {
    const { ...rest } = updateUserDto;
    if (rest.password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(rest.password, salt);
      rest.password = hashedPassword;
      rest.changePasswordAt = new Date().toISOString();
    }
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: rest,
      });
    } catch (error) {
        console.log(error)
      throw new NotFoundException('User not found');
    }
  }
}
