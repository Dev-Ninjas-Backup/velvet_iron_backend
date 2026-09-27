const fs = require('fs');

let content = fs.readFileSync('src/auth/auth.controller.ts', 'utf8');

// Fix httpOnly in login
content = content.replace(/httpOnly: false/g, 'httpOnly: true');

// Replace logout
const logoutRegex = /@Delete\('logout'\)[\s\S]*?return result;\n  \}/;
const newLogout = `@Delete('logout')
  @ValidUser()
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Logout from current device (clears cookies)' })
  async logout(
    @Body() body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const refreshToken = req.headers['x-refresh-token'] || req.cookies?.refresh_token;
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    const result = await this.authService.logout(req.user.id, refreshToken);
    return result;
  }`;
content = content.replace(logoutRegex, newLogout);

// Replace refreshToken
const refreshRegex = /\/\/ @Post\('refresh-token'\)[\s\S]*?\/\/   \}/;
const newRefresh = `@Post('refresh-token')
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

content = content.replace(refreshRegex, newRefresh);

fs.writeFileSync('src/auth/auth.controller.ts', content);
