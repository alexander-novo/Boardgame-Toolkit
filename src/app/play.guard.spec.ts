import { TestBed } from '@angular/core/testing';

import { PlayGuard } from './play.guard';

describe('PlayGuard', () => {
  let guard: PlayGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PlayGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
