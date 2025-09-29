import { ErrorCorrectionLevel } from "ngx-qrcode-styling"

export const errorCorrectionLevels = [
    { value: 'L' as ErrorCorrectionLevel, label: 'Low' },
    { value: 'M' as ErrorCorrectionLevel, label: 'Medium' },
    { value: 'Q' as ErrorCorrectionLevel, label: 'Quartile' },
    { value: 'H' as ErrorCorrectionLevel, label: 'High' }
];
