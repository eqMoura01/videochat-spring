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
  private localStream: MediaStream | undefined;
  private remoteStream: MediaStream | undefined;
  private didIOffer: boolean = false;

  public roomId: string = 'room1'; // exemplo de roomId
  public messages: string[] = [];
  public username: string = ''; 
  public message: string = '';  
  private peerConnection: RTCPeerConnection | undefined;
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
    this.webSocketService.initializeWebSocketConnection(`ws://localhost:8080/ws`);
  }

  joinRoom(type: string): void {

    console.log('Tipo: ', type);

    if (type === 'offer') {
      this.createOffer();
    } else if (type === 'join-room') {
      this.remoteJoinRoom();
    }
  }

  async createOffer(): Promise<any> {
    await this.fetchUserMedia();

    this.peerConnection = new RTCPeerConnection(this.peerConfiguration);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.webSocketService.sendCandidate(event.candidate, this.roomId);
      }
    };

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.remoteStream = event.streams[0];
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.webSocketService.sendOffer(offer, this.roomId); // Enviar a oferta com o roomId
    this.didIOffer = true;

    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<any> {
    await this.fetchUserMedia();

    this.peerConnection = new RTCPeerConnection(this.peerConfiguration);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.webSocketService.sendCandidate(event.candidate, this.roomId);
      }
    };

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.remoteStream = event.streams[0];
    };

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.webSocketService.sendAnswer(answer, this.roomId); // Enviar a resposta com o roomId

    return answer;
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
    // Prepara o RTCSessionsDescriptionInit para enviar ao servidor
    this.webSocketService.requestOffer(this.roomId).then((offer: RTCSessionDescriptionInit) => {
      
      console.log('Offer recebida: ', offer);
      
      this.remoteStream = new MediaStream();

      // Define a oferta recebida como a descrição remota
      this.createAnswer(offer);
      
    });
  
  }
}
