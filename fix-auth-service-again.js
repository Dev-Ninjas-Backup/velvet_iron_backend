const fs = require('fs');

// 1. Fix auth.service.ts
let service = fs.readFileSync('src/auth/auth.service.ts', 'utf8');

// Fix generateTokens
const genTokensTarget = `  async generateTokens(user: any) {
    const accessTokenExpiration =
      //convert day from milliseconds
      Number(this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_MS')) /
        86400000 || 15; // 15 minutes
    const refreshTokenExpiration =
      //convert days from milliseconds
      Number(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_MS')) /
        86400000 || 7;

    // Minimal token payload - only essential claims
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: \`\${accessTokenExpiration}d\`,
      // expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_MS'),
    } as any);

    const refreshToken = this.jwtService.sign(tokenPayload, {
      expiresIn: \`\${refreshTokenExpiration}d\`,
      // expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_MS'),
    } as any);`;

const genTokensReplacement = `  async generateTokens(user: any) {
    const accessTokenMs =
      Number(this.configService.get<number>('ACCESS_TOKEN_EXPIRATION_MS')) ||
      15 * 60 * 1000;
    const refreshTokenMs =
      Number(this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS')) ||
      7 * 24 * 60 * 60 * 1000;

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: Math.floor(accessTokenMs / 1000),
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      expiresIn: Math.floor(refreshTokenMs / 1000),
    });

    await this.Prisma.client.session.create({
      data: {
        userId: user.id,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + refreshTokenMs),
      },
    });`;

service = service.replace(genTokensTarget, genTokensReplacement);

// Fix generateRefreshTokenOnly
const genRefreshTarget = `  async generateRefreshTokenOnly(user: any, oldRefreshToken?: string) {
    const refreshTokenExpiration =
      Number(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_MS')) /
        86400000 || 7;

    // Minimal token payload - only essential claims
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const refreshToken = this.jwtService.sign(tokenPayload, {
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_MS'),
    } as any);`;

const genRefreshReplacement = `  async generateRefreshTokenOnly(user: any, oldRefreshToken?: string) {
    const refreshTokenMs =
      Number(this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS')) ||
      7 * 24 * 60 * 60 * 1000;

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const refreshToken = this.jwtService.sign(tokenPayload, {
      expiresIn: Math.floor(refreshTokenMs / 1000),
    });`;

service = service.replace(genRefreshTarget, genRefreshReplacement);

fs.writeFileSync('src/auth/auth.service.ts', service);
