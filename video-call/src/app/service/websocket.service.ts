import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private websocket: WebSocket | undefined;
  private videoRoomComponent: any;

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
      room: roomId
    });
  }

  handleMessage(message: string): void {

    const parsedMessage = JSON.parse(message);
    console.log('Received message:', parsedMessage);

    switch (parsedMessage.type) {
      case 'created':
        // Lógica para envio de oferta
        console.log('Room created');
        break;
      case 'offer':
        // Lógica para receber oferta
        break;
      case 'answer':
        // Lógica para receber resposta
        break;
      case 'offerIceCandidate':
      case 'answerIceCandidate':
        // Lógica para adicionar Ice Candidate
        break;
      default:
        console.error('Unknown message type');
    }
  }

  sendMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
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
}
