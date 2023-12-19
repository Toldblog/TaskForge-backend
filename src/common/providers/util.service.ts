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

  public swapTwoElementsInArray(array: any, firstElement: any, secondElement: any): any {
    const firstIndex = array.indexOf(firstElement);
    const secondIndex = array.indexOf(secondElement);

    const tmp = array[firstIndex];
    array[firstIndex] = array[secondIndex];
    array[secondIndex] = tmp;

    return array;
  }
}

