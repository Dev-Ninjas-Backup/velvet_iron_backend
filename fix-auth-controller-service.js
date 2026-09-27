const fs = require('fs');

// 1. Fix auth.service.ts
let service = fs.readFileSync('src/auth/auth.service.ts', 'utf8');

// Fix generateTokens
const genTokensTarget = `  async generateTokens(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessTokenMs =
      Number(this.configService.get<number>('ACCESS_TOKEN_EXPIRATION_MS')) ||
      15 * 60 * 1000;
    const refreshTokenMs =
      Number(this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS')) ||
      7 * 24 * 60 * 60 * 1000;

    const access_token = this.jwtService.sign(payload, {
      expiresIn: Math.floor(accessTokenMs / 1000),
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: Math.floor(refreshTokenMs / 1000),
    });`;

const genTokensReplacement = `  async generateTokens(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessTokenMs =
      Number(this.configService.get<number>('ACCESS_TOKEN_EXPIRATION_MS')) ||
      15 * 60 * 1000;
    const refreshTokenMs =
      Number(this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS')) ||
      7 * 24 * 60 * 60 * 1000;

    const access_token = this.jwtService.sign(payload, {
      expiresIn: Math.floor(accessTokenMs / 1000),
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: Math.floor(refreshTokenMs / 1000),
    });

    await this.Prisma.client.session.create({
      data: {
        userId: user.id,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + refreshTokenMs),
      },
    });`;

service = service.replace(genTokensTarget, genTokensReplacement);

// Fix logout
const logoutTarget = `  async logout(userId: string) {
    await this.Prisma.client.session.deleteMany({
      where: {
        userId,
      },
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }`;

const logoutReplacement = `  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.Prisma.client.session.deleteMany({
        where: {
          userId,
          refreshToken,
        },
      });
    } else {
      await this.Prisma.client.session.deleteMany({
        where: { userId },
      });
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }`;
  
service = service.replace(logoutTarget, logoutReplacement);
fs.writeFileSync('src/auth/auth.service.ts', service);


// 2. Fix auth.controller.ts
let controller = fs.readFileSync('src/auth/auth.controller.ts', 'utf8');

// Ensure UnauthorizedException is imported
if (!controller.includes('UnauthorizedException')) {
  controller = controller.replace('import { Controller', 'import { Controller, UnauthorizedException');
}

// Fix logout to pass refresh token
const logoutCtrlTarget = `  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    const result = await this.authService.logout(req.user.id);

    // Clear cookies on logout

    return result;
  }`;

const logoutCtrlReplacement = `  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const refreshToken = req.headers['x-refresh-token'] || req.cookies?.refresh_token;
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    const result = await this.authService.logout(req.user.id, refreshToken);
    return result;
  }`;

controller = controller.replace(logoutCtrlTarget, logoutCtrlReplacement);

// Fix refreshToken endpoint
const refreshCtrlTarget = `  // @Post('refresh-token')
  // @ApiOperation({
  //   summary:
  //     'Refresh access token using refresh token (returns new tokens + sets cookies)',
  // })
  // async refreshToken(
  //   @Body() body: RefreshTokenDto,
  //   @Res({ passthrough: true }) res: any,
  // ) {
  //   const result = await this.authService.refreshToken(body.refreshToken);

  //   const isProduction = process.env.NODE_ENV === 'production';

  //   // Update cookies with new tokens - use config values for expiration
  //   const accessTokenExpirMs =
  //     this.configService.get<number>('ACCESS_TOKEN_EXPIRATION_MS') ||
  //     15 * 60 * 1000;
  //   const refreshTokenExpirMs =
  //     this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS') ||
  //     7 * 24 * 60 * 60 * 1000;

  //   res.cookie('access_token', result.access_token, {
  //     httpOnly: false,
  //     secure: isProduction,
  //     sameSite: 'lax',
  //     maxAge: accessTokenExpirMs,
  //   });

  //   res.cookie('refresh_token', result.refresh_token, {
  //     httpOnly: false,
  //     secure: isProduction,
  //     sameSite: 'lax',
  //     maxAge: refreshTokenExpirMs,
  //   });

  //   // Send in headers for easy access
  //   res.setHeader('X-Access-Token', result.access_token);
  //   res.setHeader('X-Refresh-Token', result.refresh_token);

  //   // Return tokens explicitly in response body for Swagger visibility
  //   return {
  //     access_token: result?.access_token,
  //     refresh_token: result?.refresh_token,
  //     user: result?.user,
  //     message: 'Tokens refreshed successfully',
  //     success: true,
  //   };
  // }`;

const refreshCtrlReplacement = `  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token using refresh token (returns new tokens + sets cookies)',
  })
  async refreshToken(
    @Body() body: RefreshTokenDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const token = body.refreshToken || req.headers['x-refresh-token'] || req.cookies?.refresh_token;
    if (!token) throw new UnauthorizedException('Refresh token is required');
    
    const result = await this.authService.refreshToken(token);

    const isProduction = process.env.NODE_ENV === 'production';

    const accessTokenConfigMs = Number(this.configService.get('ACCESS_TOKEN_EXPIRATION_MS'));
    const refreshTokenConfigMs = Number(this.configService.get('REFRESH_TOKEN_EXPIRATION_MS'));
    const accessTokenMs = isNaN(accessTokenConfigMs) || accessTokenConfigMs === 0 ? 15 * 60 * 1000 : accessTokenConfigMs;
    const refreshTokenMs = isNaN(refreshTokenConfigMs) || refreshTokenConfigMs === 0 ? 7 * 24 * 60 * 60 * 1000 : refreshTokenConfigMs;

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: accessTokenMs,
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: refreshTokenMs,
    });

    res.setHeader('X-Access-Token', result.access_token);
    res.setHeader('X-Refresh-Token', result.refresh_token);

    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
      message: 'Tokens refreshed successfully',
      success: true,
    };
  }`;

controller = controller.replace(refreshCtrlTarget, refreshCtrlReplacement);

// Secure all remaining httpOnly: false in controller
controller = controller.replace(/httpOnly: false/g, 'httpOnly: true');

fs.writeFileSync('src/auth/auth.controller.ts', controller);
