import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VideoRoomComponent } from './components/video-room/video-room.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, FormsModule, VideoRoomComponent]
})
export class AppComponent {
  title = 'front';
}
