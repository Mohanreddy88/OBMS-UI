import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEpfSlabComponent } from './new-epf-slab.component';

describe('NewEpfSlabComponent', () => {
  let component: NewEpfSlabComponent;
  let fixture: ComponentFixture<NewEpfSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewEpfSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewEpfSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
