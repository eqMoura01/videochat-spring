package com.video_chamada.Video.chamada.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

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
            broadcastToRoom(room, new TextMessage(String.format("{\"type\": \"user-disconnected\", \"userId\": \"%s\"}", clientId)));
        }
        users.remove(clientId);
        System.out.println(String.format("Client disconnected: %s from room: %s", clientId, room));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String payload = message.getPayload();
        // log.info("Received message: {} from client: {}", payload, session.getId());
        System.out.println(String.format("Received message: %s from client: %s.", payload, session.getId()));

        // Parse the payload and handle the events (joinRoom, offer, answer, etc.)
        // Example: Handle "joinRoom" event
        if (payload.startsWith("joinRoom:")) {
            String room = payload.split(":")[1];
            joinRoom(session, room);
        }
    }

    private void joinRoom(WebSocketSession session, String room) throws IOException {

        if(isCaller(room)){
            session.sendMessage(new TextMessage("setCaller"));
            System.out.println(String.format("Sending setCaller message to client with ID: %s", session.getId()));

            broadcastToRoom(room, new TextMessage(String.format("Sending setCaller message to client with ID: %s", session.getId())));

        }


        int roomSize = getClienteCountInRoom(room);

        if (roomSize > 1) {
            session.sendMessage(new TextMessage("Room is full"));
            System.out.println(String.format("Client %s tried to join room %s, but it's full", session.getId(), room));
            return;
        }

        rooms.put(session.getId(), room);

        session.sendMessage(new TextMessage("joined:" + room));

        System.out.println(String.format("Client %s joined room %s, room size: %s", session.getId(), room, roomSize));
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

    private boolean isCaller(String room){
        return getClienteCountInRoom(room) < 1;
    }

}
