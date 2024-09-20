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
            console.log('Evento recebido: ', event.data);

            let combinedData = {};  // Objeto final que vai conter a oferta e os candidatos

            // Verifique se a mensagem contém uma oferta e faça o parsing
            if (event.data.includes('offer')) {
              const parsedOffer = this.parseOffer(event.data);
              console.log('Oferta parseada: ', parsedOffer);
              // combinedData['offer'] = parsedOffer;  // Adiciona a oferta ao objeto combinado
            }

            // Verifique se a mensagem contém candidatos e faça o parsing
            if (event.data.includes('candidate')) {
              const parsedCandidate = this.parseCandidate(event.data);
              console.log('Candidato parseado: ', parsedCandidate);
              // combinedData['candidates'] = parsedCandidate;  // Adiciona os candidatos ao objeto combinado
            }

            console.log('Dados combinados: ', combinedData);

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

  private parseOffer(offerMsg: string): RTCSessionDescriptionInit {

    console.log('Offer recebida (não parseada): ', offerMsg);
    offerMsg = offerMsg.replace('{offer=', '');

    let endIndex = offerMsg.indexOf(', candidate=');

    if (endIndex !== -1) {
      offerMsg = offerMsg.substring(0, endIndex);
    }

    console.log('Offer recebida (parseada): ', JSON.parse(offerMsg));

    return JSON.parse(offerMsg);
  }

  private parseCandidate(candidateMsg: string): string {
    // Encontrar o índice de início correto do bloco 'candidate='
    const startIndex = candidateMsg.indexOf('candidate=');

    if (startIndex !== -1) {
      // Extrair a substring a partir do índice encontrado
      candidateMsg = candidateMsg.substring(startIndex + 10); // '+10' para remover 'candidate='

      // Agora remover o final inválido ']}'
      const endIndex = candidateMsg.lastIndexOf('}]');
      if (endIndex !== -1) {
        candidateMsg = candidateMsg.substring(0, endIndex + 2); // Mantém o fechamento correto
      }

      try {
        console.log('Candidate recebido (@não parseado@): ', candidateMsg);
        // Parseando o JSON agora
        const parsedCandidate = JSON.parse(candidateMsg);
        console.log('Candidate recebido (parseado): ', parsedCandidate);

        return parsedCandidate.candidate; // Retorna o bloco de candidate parseado
      } catch (error) {
        console.error('Error parsing candidate JSON: ', error);
        throw new Error('Erro ao parsear candidate');
      }
    } else {
      throw new Error('Candidate string mal formatada');
    }
  }


}
