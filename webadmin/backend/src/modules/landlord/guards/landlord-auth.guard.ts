import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';

@Injectable()
export class LandlordAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }

    const token = authHeader.substring(7);
    const payload = this.authService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    if (payload.type !== 'landlord') {
      throw new UnauthorizedException('权限不足');
    }

    request.user = payload;
    return true;
  }
}
