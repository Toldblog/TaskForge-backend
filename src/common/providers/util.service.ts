import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UtilService {
  public filterUserResponse(user: User): any {
    const { username, email, name, bio, avatar } = user;
    return {
      username,
      email,
      name,
      bio,
      avatar,
    };
  }
}

