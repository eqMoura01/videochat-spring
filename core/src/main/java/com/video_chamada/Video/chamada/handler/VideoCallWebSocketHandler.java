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
import com.video_chamada.model.Mensagem;

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
            Mensagem mensagemRecebida = objectMapper.readValue(payload, Mensagem.class);

            String room = mensagemRecebida.getRoom();

            switch (mensagemRecebida.getType()) {
                case "joinRoom":
                    joinRoom(session, room);
                    break;
                case "ready":
                    broadcastToRoom(room, new TextMessage("ready"));
                    break;
                case "candidate":
                    // onCandidate(session, message);
                    broadcastToRoom(room, new TextMessage(mensagemRecebida.getContent()));
                    break;
                case "offer":
                    // onOffer(session, message);
                    broadcastToRoom(room, new TextMessage(mensagemRecebida.getContent()));
                    break;
                case "answer":
                    // onAnswer(session, message);
                    broadcastToRoom(room, new TextMessage(mensagemRecebida.getContent()));
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
            session.sendMessage(new TextMessage("created"));
            rooms.put(session.getId(), room);
            return;
        }
        int roomSize = getClienteCountInRoom(room);
        if (roomSize > 1) {
            session.sendMessage(new TextMessage("full"));
            return;
        }
        rooms.put(session.getId(), room);
        session.sendMessage(new TextMessage("joined:" + room));
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