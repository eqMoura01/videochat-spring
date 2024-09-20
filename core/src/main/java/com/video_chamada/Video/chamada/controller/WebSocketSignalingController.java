package com.video_chamada.Video.chamada.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketSignalingController {

    @MessageMapping("/offer")
    @SendTo("/topic/offer")
    public String handleOffer(String offer) {
        return offer;
    }

    @MessageMapping("/answer")
    @SendTo("/topic/answer")
    public String handleAnswer(String answer) {
        return answer;
    }

    @MessageMapping("/candidate")
    @SendTo("/topic/candidate")
    public String handleCandidate(String candidate) {
        return candidate;
    }
}
