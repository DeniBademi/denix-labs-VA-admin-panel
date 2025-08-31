import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { CornerDotType, CornerSquareType, DotType, ErrorCorrectionLevel, ShapeType } from 'ngx-qrcode-styling';

export function createQrForm(fb: FormBuilder): FormGroup {
  return fb.group({
    // Branding
    showLogo: [false],
    logoUrl: [''],
    logoSize: [0.4],
    logoMargin: [0],
    hideBackgroundDots: [true],

    // General
    size: [300],
    backgroundColorType: ['single'],
    backgroundShape: [0],
    backgroundColor: ['#ffffff'],
    backgroundGradient: fb.group({
      type: ['linear'],
      rotation: [0],
      colorStops: fb.array([
        fb.group({ offset: [0], color: ['#ffffff'] }),
        fb.group({ offset: [1], color: ['#ff6b6b'] })
      ]) as FormArray
    }),


    // Dots
    dotStyle: ['square' as DotType],
    colorType: ['single'],
    dotColor: ['#000000FF'],
    dotGradient: fb.group({
      type: ['linear'],
      rotation: [0],
      colorStops: fb.array([
        fb.group({ offset: [0], color: ['#000000FF'] }),
        fb.group({ offset: [1], color: ['#ff6b6b'] })
      ]) as FormArray
    }),

    // Error correction
    errorCorrectionLevel: ['Q' as ErrorCorrectionLevel],

    // Corners
    cornerSquareType: ['square' as CornerSquareType],
    cornerSquareColorType: ['single'],
    cornerSquareColor: ['#000000FF'],
    cornerSquareGradient: fb.group({
      type: ['linear'],
      rotation: [0],
      colorStops: fb.array([
        fb.group({ offset: [0], color: ['#000000FF'] }),
        fb.group({ offset: [1], color: ['#ff6b6b'] })
      ]) as FormArray
    }),

    cornerDotType: ['square' as CornerDotType],
    cornerDotColorType: ['single'],
    cornerDotColor: ['#000000FF'],
    cornerDotGradient: fb.group({
      type: ['linear'],
      rotation: [0],
      colorStops: fb.array([
        fb.group({ offset: [0], color: ['#000000FF'] }),
        fb.group({ offset: [1], color: ['#ff6b6b'] })
      ]) as FormArray
    }),

    // Misc
    shape: ['circle' as ShapeType]
  });
}

export const defaultFormValues = () => {
  return createQrForm(new FormBuilder()).value;
}