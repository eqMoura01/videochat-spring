package com.video_chamada.Video.chamada.controller;

import com.video_chamada.Video.chamada.model.CallMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/call.register")
    public void register(@Payload String roomId, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("roomId", roomId);
    }

    @MessageMapping("/call/send")
    public void send(@Payload CallMessageDTO message) {
        simpMessagingTemplate.convertAndSend("/topic/call/" + message.getCallId(), message.getBody());
    }

    @MessageMapping("/call/offer")
    public void offer(@Payload CallMessageDTO message) {
        simpMessagingTemplate.convertAndSend("/topic/call/" + message.getCallId(), message);
    }

    @MessageMapping("/call/answer")
    public void answer(@Payload CallMessageDTO message) {
        System.out.println("Answer: " + message.getBody());
        simpMessagingTemplate.convertAndSend("/topic/call/" + message.getCallId(), message);
    }

    @MessageMapping("/call/getOffer")
    public void getOffer(@Payload CallMessageDTO message) {
        message.setBody("needOffer");
        simpMessagingTemplate.convertAndSend("/topic/call/" + message.getCallId(), message);
    }

    @MessageMapping("/call/iceCandidate")
    public void iceCandidate(@Payload CallMessageDTO message) {
        simpMessagingTemplate.convertAndSend("/topic/call/" + message.getCallId(), message);
    }

    @MessageMapping("/test")
    public void test() {
        System.out.println("Mensagem recebida no endpoint.");
    }

}
