import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewIncomeTaxSlabComponent } from './new-income-tax-slab.component';

describe('NewIncomeTaxSlabComponent', () => {
  let component: NewIncomeTaxSlabComponent;
  let fixture: ComponentFixture<NewIncomeTaxSlabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewIncomeTaxSlabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewIncomeTaxSlabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
