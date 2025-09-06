import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VapiDemoComponent } from './vapi-demo.component';

describe('VapiDemoComponent', () => {
  let component: VapiDemoComponent;
  let fixture: ComponentFixture<VapiDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VapiDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VapiDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
