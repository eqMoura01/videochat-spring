package com.video_chamada.Video.chamada.handler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.video_chamada.Video.chamada.model.Mensagem;

@Component
public class VideoCallWebSocketHandler extends TextWebSocketHandler {

    private static final Map<String, WebSocketSession> users = new HashMap<>();
    private static final Map<String, String> rooms = new HashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println(String.format("Client connected: %s", session.getId()));
        users.put(session.getId(), session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String clientId = session.getId();
        String room = rooms.get(clientId);
        if (room != null) {
            rooms.remove(clientId);
            broadcastToRoom(room,
                    new TextMessage(String.format("{\"type\": \"user-disconnected\", \"userId\": \"%s\"}", clientId)));
        }
        users.remove(clientId);
        System.out.println(String.format("Client disconnected: %s from room: %s. Room size: %s", clientId, room,
                getClienteCountInRoom(room)));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String payload = message.getPayload();
    
        ObjectMapper objectMapper = new ObjectMapper();
    
        try {
            // Desserializar a mensagem recebida
            Mensagem mensagemRecebida = objectMapper.readValue(payload, Mensagem.class);
    
            // Tratamento flexível para o campo content
            Map<String, Object> content = mensagemRecebida.getContent();
    
            String room = mensagemRecebida.getRoom();
            System.out.println(mensagemRecebida.getType());
    
            switch (mensagemRecebida.getType()) {
                case "joinRoom":
                    joinRoom(session, room);
                    break;
                case "ready":
                    Mensagem mensagem = new Mensagem();
                    mensagem.setType("ready");
                    broadcastToRoom(room, new TextMessage(mensagem.toStringWithNoContent()));
                    break;
                case "candidate":
                case "offer":
                    broadcastToRoom(room, new TextMessage(objectMapper.writeValueAsString(content)));
                    break;
                case "answer":
                    // Tratar o conteúdo da mensagem
                    broadcastToRoom(room, new TextMessage(objectMapper.writeValueAsString(content)));
                    break;
                default:
                    System.out.println("Invalid message type");
                    break;
            }
        } catch (Exception e) {
            System.out.println("Error parsing message: " + e.getMessage());
        }
    }
    

    private void joinRoom(WebSocketSession session, String room) throws IOException {
        if (isCaller(room)) {

            Mensagem mensagem = new Mensagem();
            mensagem.setType("created");
            mensagem.setRoom(room);
            session.sendMessage(new TextMessage(mensagem.toStringWithNoContent()));
            rooms.put(session.getId(), room);
            return;
        }
        int roomSize = getClienteCountInRoom(room);
        if (roomSize > 1) {
            session.sendMessage(new TextMessage("full"));
            return;
        }
        rooms.put(session.getId(), room);

        Mensagem mensagem = new Mensagem();
        mensagem.setType("joined");
        mensagem.setRoom(room);
        session.sendMessage(new TextMessage(mensagem.toStringWithNoContent()));
    }

    private void broadcastToRoom(String room, TextMessage message) {
        rooms.forEach((clientId, clientRoom) -> {
            if (clientRoom.equals(room)) {
                try {
                    WebSocketSession clientSession = users.get(clientId);
                    if (clientSession != null && clientSession.isOpen()) {
                        clientSession.sendMessage(message);
                    }
                } catch (Exception e) {
                    // log.error("Error sending message to client", e);
                }
            }
        });
    }

    private int getClienteCountInRoom(String room) {
        int count = 0;
        for (String clientRoom : rooms.values()) {
            if (clientRoom.equals(room)) {
                count++;
            }
        }
        return count;
    }

    private boolean isCaller(String room) {
        return getClienteCountInRoom(room) < 1;
    }

}