import { TestBed } from '@angular/core/testing';

import { BiometricsService } from './biometrics.service';

describe('BiometricsService', () => {
  let service: BiometricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BiometricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
