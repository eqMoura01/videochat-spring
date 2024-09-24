import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { VideoRoomComponent } from '../components/video-room/video-room.component';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | undefined;
  private videoRoomComponent: VideoRoomComponent | undefined;
  private didIOffer: boolean = false;
  public localSdp: RTCSessionDescriptionInit | undefined;

  initializeWebSocketConnection(url: string, callHandle: string): void {

    this.stompClient = new Client({
      brokerURL: url,
      connectHeaders: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket'
      },
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = () => {
      this.stompClient?.subscribe(`/topic/call/${callHandle}`, (message) => {
        this.handleMessage(message);
      });
    }

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    }

    this.stompClient.onWebSocketError = (event) => {
      console.error('WS error', event);
    }

    this.stompClient.activate();
  }

  handleMessage(message: any): void {

    message = JSON.parse(message.body);

    console.log('Eu que fiz a oferta? ', this.didIOffer);
    console.log(message);

    switch (message.type) {

      case 'needOffer':
        if (this.didIOffer) {
          const offer = this.localSdp;
          console.log('Sending offer', offer);
          this.sendOffer(offer);
        }
        break;
      case 'needAnswer':
        break;
      case 'offer':
        if (!this.didIOffer) {
          if (this.videoRoomComponent) {
            const offer: RTCSessionDescriptionInit = {
              type: 'offer',
              sdp: message.body
            };
            console.log('Offer received@@@@@@: ', offer);
            this.videoRoomComponent.peerConnection.setRemoteDescription(offer);
            this.videoRoomComponent.createAnswer();
          } else {
            console.error('videoRoomComponent is undefined');
          }
        }
        break;
      case 'answer':
        if (this.didIOffer) {
          // Acesse a SDP diretamente da mensagem
          const answer: RTCSessionDescriptionInit = {
            type: 'answer',
            sdp: JSON.parse(message.body).sdp // Corrigido: acessar diretamente a propriedade 'sdp'
          };

          this.videoRoomComponent?.peerConnection.setRemoteDescription(answer)
            .then(() => {
              console.log('Remote description set successfully.');
            })
            .catch((error) => {
              console.error('Error setting remote description:', error);
            });
        }
        break;

      default:
        console.error('Unknown message type');
    }
  }

  sendOffer(offer: any): void {
    if (this.stompClient && this.stompClient.connected) {
      const message = {
        callId: this.videoRoomComponent?.roomId,
        body: offer,
        type: 'offer'
      };
      this.stompClient?.publish({
        destination: `/app/call/offer`,
        body: JSON.stringify(message)
      });
    } else {
      console.error('STOMP client is not connected');
    }
  }

  sendAnswer(answer: any): void {

    console.log('Sending answer');

    if (this.stompClient && this.stompClient.connected) {
      const message = {
        callId: this.videoRoomComponent?.roomId,
        body: JSON.stringify(answer),
        type: 'answer'
      };
      this.stompClient?.publish({
        destination: `/app/call/answer`,
        body: JSON.stringify(message)
      });
    } else {
      console.error('STOMP client is not connected');
    }
  }

  criarSala(callHandle: string, offer: string, didIOffer: boolean): void {

    this.didIOffer = didIOffer;
    if (this.stompClient && this.stompClient.connected) {
      const message = {
        callId: callHandle,
        body: offer,
        type: 'offer'
      };
      this.stompClient?.publish({
        destination: `/app/call/offer`,
        body: JSON.stringify(message)
      });

      this.stompClient?.publish({
        destination: `/app/test`,
        body: ''
      });
    } else {
      console.error('STOMP client is not connected');
    }
  }

  entrarSala(callHandle: string): void {
    console.log('Eu que fiz a oferta? ', this.didIOffer);
    if (this.stompClient && this.stompClient.connected) {
      const message = {
        callId: callHandle,
        body: 'needOffer',
        type: 'needOffer'
      };
      this.stompClient?.publish({
        destination: `/app/call/getOffer`,
        body: JSON.stringify(message)
      });
    } else {
      console.error('STOMP client is not connected');
    }

  }

  setVideoRoomComponent(component: VideoRoomComponent): void {
    this.videoRoomComponent = component;
  }

}
