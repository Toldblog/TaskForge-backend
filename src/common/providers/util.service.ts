import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UtilService {
  public filterResponse(response: any): any {
    delete response?.createdAt;
    delete response?.updatedAt;
    return response
  }

  public filterUserResponse(user: User): any {
    const response = this.filterResponse(user);

    delete response.password;
    delete response.passwordConfirm;
    delete response.passwordResetExpires;
    delete response.passwordResetToken;
    delete response.changePasswordAt;

    return response;
  }
}

