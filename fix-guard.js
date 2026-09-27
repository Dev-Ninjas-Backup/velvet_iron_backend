const fs = require('fs');

const content = `import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    // Extract access token from headers or cookies
    const accessToken =
      request.headers['authorization']?.replace('Bearer ', '') ||
      request.cookies?.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const decoded = this.jwtService.verify(accessToken);
      if (decoded && decoded.id) {
        request.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        };
        return true;
      }
    } catch (err) {
      throw new UnauthorizedException('Access token is expired or invalid');
    }

    throw new UnauthorizedException('Access token is invalid');
  }
}
`;

fs.writeFileSync('src/common/optional-auth.guard.ts', content);
