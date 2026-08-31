import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PrediccionComponent } from './prediccion.component';

describe('PrediccionComponent', () => {
  let component: PrediccionComponent;
  let fixture: ComponentFixture<PrediccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrediccionComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrediccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
