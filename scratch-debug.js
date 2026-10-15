const fs = require('fs');
let service = fs.readFileSync('src/auth/auth.service.ts', 'utf8');

const target = `    const session = await this.Prisma.client.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }`;

const replacement = `    const session = await this.Prisma.client.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    console.log('--- DEBUG REFRESH TOKEN ---');
    console.log('Incoming token:', refreshToken);
    console.log('Found session:', session ? session.id : 'null');
    if (session) {
      console.log('Session expiresAt:', session.expiresAt);
      console.log('Current Date:', new Date());
      console.log('Is expired?', session.expiresAt < new Date());
    }

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }`;

service = service.replace(target, replacement);
fs.writeFileSync('src/auth/auth.service.ts', service);
