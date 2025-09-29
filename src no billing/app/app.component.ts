import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet],
})
export class AppComponent {
    /**
     * Constructor
     */
    constructor() {
        this.getLocation();
    }

   getLocation(): void{
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position)=>{
              const longitude = position.coords.longitude;
              const latitude = position.coords.latitude;
              console.log(longitude, latitude);
            });
        } else {
           console.log("No support for geolocation")
        }
      }
}

