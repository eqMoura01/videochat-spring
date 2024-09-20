import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | undefined;

  initializeWebSocketConnection(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  sendOffer(offer: RTCSessionDescriptionInit, roomId: string): void {

    console.log('RoomId', roomId);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'offer',
        roomId: roomId,
        offer: offer
      }));

      console.log('Offer sent', offer);
    } else {
      console.error('WebSocket connection is not open');
    }
  }

  sendAnswer(answer: RTCSessionDescriptionInit, roomId: string): void {

    console.log('tentando enviar answer para o servidor...');
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'answer',
        roomId: roomId,
        answer: answer
      }));
    } else {
      console.error('WebSocket connection is not open');
    }
  }

  sendCandidate(candidate: RTCIceCandidate, roomId: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'candidate',
        roomId: roomId,
        candidate: candidate
      }));
    } else {
      console.error('WebSocket connection is not open');
    }
  }

  requestOffer(roomId: string): Promise<RTCSessionDescriptionInit> {

    return new Promise((resolve, reject) => {

      console.log('Requesting offer for room: ', roomId);

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {

        console.log('A conexão com o servidor está aberta, enviando a solicitação de oferta...');

        this.socket.send(JSON.stringify({
          type: 'answer',
          roomId: roomId
        }));

        this.socket.onmessage = (event) => {
          try {
            let offerMsg = event.data.toString();

            offerMsg = offerMsg.replace('{offer=', '');

            let endIndex = offerMsg.indexOf(', candidate=');

            if (endIndex !== -1) {
              offerMsg = offerMsg.substring(0, endIndex);
            }
            console.log('Offer recebida (parseada): ', JSON.parse(offerMsg));

          } catch (error) {
            console.error('Error parsing server message: ', error);
            reject('Error parsing server message: ' + error);
          }
        };


      } else {
        reject('WebSocket connection is not open');
      }
    });
  }

}
