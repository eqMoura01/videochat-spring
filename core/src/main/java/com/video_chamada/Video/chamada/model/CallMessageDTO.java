package com.video_chamada.Video.chamada.model;

public class CallMessageDTO {
    private String callId;
    private String body;
    private String type;

    // Getters e Setters
    public String getCallId() {
        return callId;
    }

    public void setCallId(String callId) {
        this.callId = callId;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}

