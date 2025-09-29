// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-vapi-demo',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './vapi-demo.component.html',
//   styleUrl: './vapi-demo.component.css'
// })
// export class VapiDemoComponent implements OnInit, OnDestroy {
//   isSpeaking = false;
//   isInCall = false;
//   volumeLevel = 0;
//   pitchLevels = [0, 0, 0, 0, 0];
//   isLoading = false;
//   errorMessage: string | null = null;
//   private loadingTimeout: any;

//   ngOnInit() {
//     // Initialize component
//   }

//   // useful methods
//   // vapi.on("speech-start", () => {
//   //   console.log("Assistant speech has started.");
//   // });
//   // vapi.on("speech-end", () => {
//   //   console.log("Assistant speech has ended.");
//   // });
//   // vapi.on("volume-level", (volume) => {
//   //   console.log(`Assistant volume level: ${volume}`);
//   // });

//   async startVapi() {
//     this.isLoading = true;
//     this.errorMessage = null;
//     this.loadingTimeout = setTimeout(() => {
//       if (this.isLoading) {
//         this.isLoading = false;
//         this.errorMessage = 'Нещо се обърка. Опитайте отново.';

//         if (this.vapi) {
//           this.vapi.stop();
//           return;
//         }
//       }
//     }, 10000);

//     // await new Promise(resolve => setTimeout(resolve, 30000));

//     this.vapi = new Vapi('823d2036-344d-4d97-a147-f3c85209cbf9');

//     this.vapi.on("speech-start", () => {
//       this.isSpeaking = true;
//     });

//     this.vapi.on("speech-end", () => {
//       this.isSpeaking = false;
//       this.volumeLevel = 0;
//       this.pitchLevels = [0, 0, 0, 0, 0];
//     });

//     this.vapi.on("volume-level", (volume) => {
//       this.volumeLevel = volume;
//       // Simulate different pitch levels based on the volume
//       this.pitchLevels = [
//         volume * (0.7 + Math.random() * 0.3), // Low pitch
//         volume * (0.6 + Math.random() * 0.4), // Low-mid pitch
//         volume * (0.5 + Math.random() * 0.5), // Mid pitch
//         volume * (0.4 + Math.random() * 0.6), // Mid-high pitch
//         volume * (0.3 + Math.random() * 0.7)  // High pitch
//       ];
//     });

//     this.vapi.on("call-end", () => {
//       this.isInCall = false;
//       this.isLoading = false;
//       this.errorMessage = null;
//     });

//     this.vapi.on("call-start", () => {
//       this.isInCall = true;
//       this.isLoading = false;
//       this.errorMessage = null;
//     });

//     const call = await this.vapi.start('f20a0461-4a8e-4f9c-aa7f-abb06ebcdf0c');

//     this.vapi.on("error", () => {
//       this.errorMessage = 'Нещо се обърка. Опитайте отново.';
//       this.isLoading = false;
//       this.isInCall = false;
//       this.volumeLevel = 0;
//       this.pitchLevels = [0, 0, 0, 0, 0];
//     });



//     // let callDuration = 1; // minutes
//     // setTimeout(() => {
//     //   this.vapi?.send({
//     //     type: "add-message",
//     //     message: {
//     //       role: "system",
//     //       content: "The call will end soon. End any topic that you are talking about. End the conversation naturally, tell the user that the call will end soon, goodbye and end the conversation."
//     //     }
//     //   });

//     // }, callDuration * 60 * 1000 - 1000 * 30); // 30 seconds before the call ends


//     this.isInCall = true;
//     this.isLoading = false;
//     this.errorMessage = null;
//   }

//   async stopVapi() {
//     this.vapi?.stop();
//     this.isSpeaking = false;
//     this.isInCall = false;
//     this.volumeLevel = 0;
//     this.pitchLevels = [0, 0, 0, 0, 0];
//     this.errorMessage = null;
//     clearTimeout(this.loadingTimeout);
//   }

//   ngOnDestroy() {
//     clearTimeout(this.loadingTimeout);
//   }
// }
