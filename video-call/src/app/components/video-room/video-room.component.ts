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
  public didIOffer: boolean = false;
  public roomId: string = 'room1';
  public messages: string[] = [];
  public username: string = '';
  public message: string = '';
  public peerConnection: RTCPeerConnection;
  private pendingOffer: RTCSessionDescriptionInit | null = null;

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
  }

  ngOnInit(): void {
    this.webSocketService.setVideoRoomComponent(this);
    this.webSocketService.initializeWebSocketConnection(`ws://localhost:8080/ws`);
  }

  joinRoom(): void {
    this.webSocketService.joinRoom(this.roomId);
  
  }

  async setupPeerConnection() {
    this.localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = this.localMediaStream;

    this.localMediaStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localMediaStream);
    });

    this.peerConnection.ontrack = (event) => {
      console.log('Recebendo stream remoto...', event);
      this.remoteMediaStream = event.streams[0];
      this.remoteVideo.nativeElement.srcObject = this.remoteMediaStream;
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Enviando candidato ICE...', event.candidate);
        this.addIceCandidate(event.candidate);
        // this.webSocketService.sendIceCandidate(event.candidate);
      }
    };
  }

  async createOffer(didIOffer: boolean): Promise<any> {
    await this.setupPeerConnection();
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.didIOffer = true;

    // this.webSocketService.criarSala(this.roomId, offer.sdp!, this.didIOffer);
    return offer;
  }

  async createAnswer(sdp: RTCSessionDescriptionInit): Promise<any> {
    await this.setupPeerConnection();

    this.peerConnection.ontrack = (event) => {
      console.log('Recebendo stream remoto...', event);
      this.remoteMediaStream = event.streams[0];
      this.remoteVideo.nativeElement.srcObject = this.remoteMediaStream;
    }

    // this.setRemoteDescription(sdp);

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // this.webSocketService.sendAnswer(answer);

    return answer;
  }

  setRemoteDescription(sdp: RTCSessionDescriptionInit): void {
    if (this.peerConnection.signalingState === 'stable') {
      // Se a conexão já estiver estável, configurar a oferta imediatamente
      this.peerConnection.setRemoteDescription(sdp).then(() => {
        console.log('Remote description set successfully.');
        // Processar candidatos ICE enfileirados
        this.processIceCandidatesQueue();
      }).catch((error) => {
        console.error('Failed to set remote description: ', error);
      });
    } else {
      // Se a conexão não estiver pronta, armazenar a oferta
      this.pendingOffer = sdp;
    }
  }

  remoteJoinRoom(): void {
    // this.webSocketService.entrarSala(this.roomId);
  }
  addIceCandidate(candidate: RTCIceCandidateInit): void {
    if (this.peerConnection.remoteDescription) {
      this.peerConnection.addIceCandidate(candidate).catch((error) => {
        console.error('Failed to add ICE candidate: ', error);
      });
    } else {
      console.warn('Remote description not set yet. Queuing ICE candidate.');
      this.iceCandidatesQueue.push(candidate);
    }
  }

  processIceCandidatesQueue(): void {
    while (this.iceCandidatesQueue.length) {
      const candidate = this.iceCandidatesQueue.shift();
      this.addIceCandidate(candidate!);
    }
  }
}
