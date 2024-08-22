import { HealthService } from './health.service';

describe('HealthService', () => {
  it('marks status degraded when a dependency is down', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('db down')) };
    const storage = {
      put: jest.fn(),
      get: jest.fn(),
      signedUrl: jest.fn(),
    };
    const queue = { ping: jest.fn().mockResolvedValue(true), publish: jest.fn() };

    const service = new HealthService(
      prisma as never,
      storage as never,
      queue as never,
    );

    const report = await service.check();
    expect(report.dependencies.database.status).toBe('down');
    expect(report.status).toBe('degraded');
  });
});
