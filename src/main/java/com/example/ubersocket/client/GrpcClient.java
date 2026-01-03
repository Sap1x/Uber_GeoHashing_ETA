package com.example.ubersocket.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.example.Uber.RideServiceGrpc;
import com.example.Uber.RideAcceptanceRequest;
import com.example.Uber.RideAcceptanceResponse;
// <CHANGE> Added payment service imports
import com.example.Uber.PaymentServiceGrpc;
import com.example.Uber.PaymentRequest;
import com.example.Uber.PaymentResponse;
import com.example.Uber.PaymentStatusUpdateRequest;
import com.example.Uber.PaymentStatusUpdateResponse;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;

@Component
public class GrpcClient {
    
    @Value("${grpc.client.port:9090}")
    private int grpcClientPort;

    @Value("${grpc.client.host:localhost}")
    private String grpcClientHost;

    private ManagedChannel channel;
    private RideServiceGrpc.RideServiceBlockingStub rideServiceStub;
    // <CHANGE> Added payment service stub
    private PaymentServiceGrpc.PaymentServiceBlockingStub paymentServiceStub;


    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder.forAddress(grpcClientHost, grpcClientPort)
        .usePlaintext()
        .build();

        rideServiceStub = RideServiceGrpc.newBlockingStub(channel);
        // <CHANGE> Initialize payment service stub
        paymentServiceStub = PaymentServiceGrpc.newBlockingStub(channel);
    }

    public boolean acceptRide(Integer driverId, Integer bookingId) {
        RideAcceptanceRequest request = RideAcceptanceRequest.newBuilder().setDriverId(driverId).setBookingId(bookingId).build();

        RideAcceptanceResponse response = rideServiceStub.acceptRide(request); // make the grpcCall

        return response.getSuccess();

    }
    
    // <CHANGE> Added payment processing method
    public PaymentResponse processPayment(PaymentRequest request) {
        return paymentServiceStub.processPayment(request);
    }
    
    // <CHANGE> Added payment status update method
    public PaymentStatusUpdateResponse updatePaymentStatus(PaymentStatusUpdateRequest request) {
        return paymentServiceStub.updatePaymentStatus(request);
    }
}
