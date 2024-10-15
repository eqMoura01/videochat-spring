package com.video_chamada.model;

public class Mensagem {

    private String type;
    private String room;
    private String content;

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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @Override
    public String toString() {
        return "{" +
                " \"type\": \"" + getType() + "\"" +
                ", \"room\": \"" + getRoom() + "\"" +
                ", \"content\": \"" + getContent() + "\"" +
                "}";
    }

}
