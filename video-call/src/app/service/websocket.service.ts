import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private websocket: WebSocket | undefined;
  public videoRoomComponent: any;

  streamConstraints = { audio: false, video: true };

  initializeWebSocketConnection(url: string): void {
    this.websocket = new WebSocket(url);

    this.websocket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    this.websocket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.websocket.onerror = (event) => {
      console.error('WebSocket error', event);
    };

    this.websocket.onclose = (event) => {
      console.log('WebSocket connection closed', event);
    };
  }

  joinRoom(roomId: string): void {
    this.sendMessage({
      type: 'joinRoom',
      room: roomId,
      content: null
    });
  }

  handleMessage(message: string): void {


    console.log('Received message:', message);

    const parsedMessage = JSON.parse(message);
    console.log('Received parsed message:', parsedMessage);

    switch (parsedMessage.type) {
      case 'created':
        this.handleCreatedEvent();
        console.log('Room created');
        break;
      case 'joined':
        this.handleJoinedEvent();
        console.log('Room joined');
        break;
      case 'ready':
        this.handleReadyEvent();
        // Lógica para enviar oferta
        break;
      case 'offer':

        console.log('Offer received ASIDHuahsudhasuh');
        // Lógica para receber oferta
        break;
      case 'answer':
        // Lógica para receber resposta
        break;
      case 'offerIceCandidate':
        // Lógica para adicionar Ice Candidate
        break;
      case 'answerIceCandidate':
        // Lógica para adicionar Ice Candidate
        break;
      default:
        console.error('Unknown message type', parsedMessage);
    }
  }

  sendMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {

      console.log('Sending message:', message);

      this.websocket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  setVideoRoomComponent(component: any): void {
    this.videoRoomComponent = component;
  }

  closeWebSocketConnection(): void {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  handleCreatedEvent(): void {

    this.videoRoomComponent.isCaller = true;

    navigator.mediaDevices.getUserMedia(this.streamConstraints).then((stream) => {
      this.videoRoomComponent.localStream = stream;
      this.videoRoomComponent.localVideo.nativeElement.srcObject = stream;
    }).catch(console.error)
  }

  handleJoinedEvent(): void {
    navigator.mediaDevices.getUserMedia(this.streamConstraints).then((stream) => {
      this.videoRoomComponent.localStream = stream;
      this.videoRoomComponent.localVideo.nativeElement.srcObject = stream;

      this.sendMessage({
        type: 'ready',
        room: this.videoRoomComponent.roomId,
        content: null
      });
    }).catch(console.error)
  }

  handleReadyEvent(): void {

    console.log('Ready event received');
    console.log('Is caller:', this.videoRoomComponent.isCaller);

    if (this.videoRoomComponent.isCaller) {
      this.videoRoomComponent.setupPeerConnection();
    }
  }
}
