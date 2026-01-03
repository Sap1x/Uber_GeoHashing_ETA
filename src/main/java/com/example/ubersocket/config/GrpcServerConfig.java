package com.example.ubersocket.config;

import org.springframework.context.annotation.Configuration;

import com.example.Uber.RideNotificationServiceGrpc;
// <CHANGE> Added PaymentServiceGrpc and DriverMatchServiceGrpc imports
import com.example.Uber.PaymentServiceGrpc;
import com.example.Uber.DriverMatchServiceGrpc;

import lombok.RequiredArgsConstructor;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import io.grpc.Server;
import jakarta.annotation.PostConstruct;
import io.grpc.ServerBuilder;


@Configuration
@RequiredArgsConstructor
public class GrpcServerConfig {
    
    @Value("${grpc.server.port:9091}")
    private int grpcServerPort;

    private final RideNotificationServiceGrpc.RideNotificationServiceImplBase rideNotificationServiceImpl;
    // <CHANGE> Added payment and driver matching service dependencies
    private final PaymentServiceGrpc.PaymentServiceImplBase paymentServiceImpl;
    private final DriverMatchServiceGrpc.DriverMatchServiceImplBase driverMatchServiceImpl;
    private Server server;
    
    @PostConstruct
    public void startGrpcServer() throws IOException {
        server = ServerBuilder
                    .forPort(grpcServerPort)
                    .addService(rideNotificationServiceImpl)
                    // <CHANGE> Register payment and driver matching services
                    .addService(paymentServiceImpl)
                    .addService(driverMatchServiceImpl)
                    .build()
                    .start();

        System.out.println("gRPC Server started on port " + grpcServerPort);


        new Thread(() -> {
            try {
                if( server != null ) {
                    server.awaitTermination();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("gRPC Server interrupted");
            }
        }).start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Shutting down gRPC Server...");
            if( server != null ) {
                server.shutdown();
            }
        }));

    }
}
