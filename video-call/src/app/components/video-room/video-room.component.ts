import { Component, OnInit } from '@angular/core';
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

  public localSdp: RTCSessionDescriptionInit | undefined;
  public localStream: MediaStream | undefined;
  public didIOffer: boolean = false;
  public roomId: string = 'room1'; // exemplo de roomId
  public messages: string[] = [];
  public username: string = '';
  public message: string = '';
  public peerConnection: RTCPeerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });
  private peerConfiguration: RTCConfiguration = {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      }
    ]
  };

  constructor(
    private webSocketService: WebsocketService
  ) { }

  ngOnInit(): void {
    this.webSocketService.setVideoRoomComponent(this);
    this.webSocketService.initializeWebSocketConnection(`ws://localhost:8080/ws/call`, this.roomId);
  }

  joinRoom(type: string): void {

    if (type === 'offer') {
      this.createOffer(true);
      this.didIOffer = true;
    } else if (type === 'join-room') {
      this.remoteJoinRoom();
    }
  }

  async createOffer(didIOffer: boolean): Promise<any> {

    await this.fetchUserMedia();

    this.peerConnection = new RTCPeerConnection(this.peerConfiguration);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log('ICE Candidate: ', event.candidate);
      }
    };

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.remoteStream = event.streams[0];
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    // this.webSocketService.sendOffer(offer, this.roomId); // Enviar a oferta com o roomId
    this.didIOffer = true;

    this.webSocketService.criarSala(this.roomId, offer.sdp!, this.didIOffer);

    this.webSocketService.localSdp = offer;

    return offer;
  }

  async createAnswer(): Promise<any> {

    console.log('Creating answer');

    await this.fetchUserMedia();

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate: ', event.candidate);
      }
    };

    console.log('Peer connection: ', this.peerConnection);

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.remoteStream = event.streams[0];
    };

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    console.log('Answer created: ', this.peerConnection);

    this.webSocketService.sendAnswer(answer);
    return answer;
  }

  setRemoteDescription(sdp: RTCSessionDescriptionInit): void {
    this.peerConnection?.setRemoteDescription(sdp);
    console.log('Remote description set', this.peerConnection);
  }

  fetchUserMedia = async () => {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
    } catch (e) {
      console.error('Error accessing media devices: ', e);
    }
  }

  remoteJoinRoom(): void {
    this.webSocketService.entrarSala(this.roomId);
  }
}
