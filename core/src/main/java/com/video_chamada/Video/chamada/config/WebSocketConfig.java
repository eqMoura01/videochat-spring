package com.video_chamada.Video.chamada.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String WEBSOCKET_ENDPOINT = "/ws/call";
    private static final String[] BROKER_DESTINATIONS = {"/topic", "/queue"};
    private static final String APP_DESTINATION_PREFIX = "/app";

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(WEBSOCKET_ENDPOINT).setAllowedOrigins("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(BROKER_DESTINATIONS);
        registry.setApplicationDestinationPrefixes(APP_DESTINATION_PREFIX);
    }
}

