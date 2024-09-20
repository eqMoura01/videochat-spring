package com.video_chamada.Video.chamada.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> rooms = new ConcurrentHashMap<>();
    private final Map<String, String> offerStorage = new ConcurrentHashMap<>();
    private final Map<String, List<String>> offerIceCandidateStorage = new ConcurrentHashMap<>();
    private final Map<String, List<String>> answerIceCandidateStorage = new ConcurrentHashMap<>();
    private boolean isOfferRequest = false;

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String jsonString = message.getPayload();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> jsonMap = objectMapper.readValue(jsonString, Map.class);

            String roomId = (String) jsonMap.get("roomId");
            String type = (String) jsonMap.get("type");

            if ("offer".equals(type)) {
                saveOffer(roomId, jsonString);
                isOfferRequest = true;
            } else if ("answer".equals(type)) {
                String offerAndIceCandidates = getOfferAndIceCandidates(roomId);
                session.sendMessage(new TextMessage(offerAndIceCandidates));
            } else if ("candidate".equals(type)) {
                if (isOfferRequest) {
                    saveOfferIceCandidates(roomId, jsonString);
                } else {
                    saveAnswerIceCandidates(roomId, jsonString);
                    sendAnswer(roomId, getOfferAndIceCandidates(roomId));
                }

            }
        } catch (Exception e) {
            System.out.println("Erro ao processar a mensagem: " + e);
        }
    }

    // Logica para salvar a offer.
    private void saveOffer(String roomId, String offer) {
        offerStorage.put(roomId, offer);
    }

    // Lógica para salvar os candidatos ICE vindo de uma offer.
    private void saveOfferIceCandidates(String roomId, String candidate) {
        offerIceCandidateStorage.computeIfAbsent(roomId, k -> new ArrayList<>()).add(candidate);
    }

    // Lógica para salvar os candidatos ICE vindo de uma answer
    private void saveAnswerIceCandidates(String roomId, String candidate) {
        answerIceCandidateStorage.computeIfAbsent(roomId, k -> new ArrayList<>()).add(candidate);
    }

    // Resgata a offer e os candidatos ICE de uma sala para serem enviados para o outro peer em caso do type ser answer.
    public String getOfferAndIceCandidates(String roomId) {
        Map<String, Object> response = new ConcurrentHashMap<>();
        response.put("offer", offerStorage.get(roomId));
        // Imprime todos os candidatos ICE que vieram atraves da oferta
        response.put("candidate", offerIceCandidateStorage.get(roomId));
        System.out.println("Resposta: " + response.toString());
        return response.toString();
    }

    // Envia os dados de resposta para o peer que fez a oferta.
    public void sendAnswer(String roomId, String answer) {
        WebSocketSession session = rooms.get(roomId);
        try {
            session.sendMessage(new TextMessage(answer));
        } catch (Exception e) {
            System.out.println("Erro ao enviar a resposta: " + e);
        }
    }
}
