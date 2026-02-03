import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementController } from './announcement.controller';

describe('AnnouncementController', () => {
  let controller: AnnouncementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<AnnouncementController>(AnnouncementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
