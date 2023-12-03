import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true; // No roles defined, allow access

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role || !roles.includes(user.role.toLowerCase())) return false; // User doesn't have required role

    return true; // User has required role, allow access
  }
}
