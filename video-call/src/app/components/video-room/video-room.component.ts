import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WebsocketService } from '../../service/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-room',
  templateUrl: './video-room.component.html',
  styleUrls: ['./video-room.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VideoRoomComponent implements OnInit {
  private remoteStream: MediaStream | undefined;

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  localMediaStream!: MediaStream;
  remoteMediaStream!: MediaStream;
  public localSdp: RTCSessionDescriptionInit | undefined;
  public localStream: MediaStream | undefined;
  public isCaller: boolean = false;
  public roomId: string = 'room1';
  public messages: string[] = [];
  public username: string = '';
  public message: string = '';
  public peerConnection: RTCPeerConnection;
  private pendingOffer: RTCSessionDescriptionInit | null = null;
  private rtcPeerConnection: RTCPeerConnection | undefined;



  private peerConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  private iceCandidatesQueue: RTCIceCandidateInit[] = [];

  constructor(
    private webSocketService: WebsocketService
  ) {
    this.peerConnection = new RTCPeerConnection(this.peerConfiguration);

    this.webSocketService.setVideoRoomComponent(this);
  }

  ngOnInit(): void {
    this.webSocketService.setVideoRoomComponent(this);
    this.webSocketService.initializeWebSocketConnection(`ws://localhost:8080/ws`);
  }

  joinRoom(): void {
    this.webSocketService.joinRoom(this.roomId);

  }

  async setupPeerConnection() {
    this.rtcPeerConnection = new RTCPeerConnection(this.peerConfiguration);
    this.rtcPeerConnection.onicecandidate = this.onIceCandidate;
    this.rtcPeerConnection.ontrack = this.onAddStream;

    if (this.localStream && this.localStream.getTracks().length > 0) {
      // Adiciona todas as trilhas disponíveis do localStream
      this.localStream.getTracks().forEach(track => {
        this.rtcPeerConnection?.addTrack(track, this.localStream!);
      });
    } else {
      console.error('Local stream is undefined or has no tracks');
    }

    this.rtcPeerConnection.createOffer().then(sessionDescription => {

      if (this.rtcPeerConnection) {
        this.rtcPeerConnection.setLocalDescription(sessionDescription);
      } else {
        console.error('rtcPeerConnection is undefined');
      }

      this.webSocketService.sendMessage({
        type: 'offer',
        content: sessionDescription,
        room: this.roomId
      });

    }).catch(console.error);


  }

  onIceCandidate(e: RTCPeerConnectionIceEvent): void {
    if (e.candidate) {

      console.log('Sending ICE candidate:', e.candidate);

      if(this.webSocketService) {
        this.webSocketService.sendMessage(
          {
            type: 'candidate',
            content: e.candidate,
            room: this.roomId
          }
        );
      }
    }
  }

  onAddStream(e: any): void {
    this.remoteMediaStream = e.stream;
    this.remoteVideo.nativeElement.srcObject = this.remoteMediaStream;
  }
}
