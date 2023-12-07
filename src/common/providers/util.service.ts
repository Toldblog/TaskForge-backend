import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UtilService {
  public filterResponse(response: any): any {
    delete response?.createdAt, response?.updatedAt;
    return response
  }

  public filterUserResponse(user: User): any {
    const response = this.filterResponse(user);
    delete response.password,
      response.passwordConfirm,
      response.passwordResetExpires,
      response.passwordResetToken,
      response.changePasswordAt;

    return response;
  }
}

