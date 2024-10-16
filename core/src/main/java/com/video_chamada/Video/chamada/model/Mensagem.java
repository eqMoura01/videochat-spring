package com.video_chamada.Video.chamada.model;

import java.util.Map;

public class Mensagem {
    private String type;
    private String room;
    private Map<String, Object> content;  // Mudança: de String para Map<String, Object>

    // Getters e Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public Map<String, Object> getContent() {
        return content;
    }

    public void setContent(Map<String, Object> content) {
        this.content = content;
    }

    @Override
    public String toString() {
        return "{" +
                " \"type\": \"" + getType() + "\"" +
                ", \"room\": \"" + getRoom() + "\"" +
                ", \"content\": \"" + getContent().toString() + "\"" +
                "}";
    }

    public String toStringWithNoContent() {
        return "{" +
                " \"type\": \"" + getType() + "\"" +
                ", \"room\": \"" + getRoom() + "\"" +
                "}";
    }
}

