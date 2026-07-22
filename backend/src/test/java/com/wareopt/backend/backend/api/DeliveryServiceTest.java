package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.entity.DeliveryOrder;
import com.wareopt.backend.backend.entity.DeliveryOrderItem;
import com.wareopt.backend.backend.entity.InventoryItem;
import com.wareopt.backend.backend.entity.OrderStatus;
import com.wareopt.backend.backend.repository.DeliveryOrderRepository;
import com.wareopt.backend.backend.repository.InventoryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryServiceTest {

    @InjectMocks
    private DeliveryService deliveryService;

    @Mock
    private DeliveryOrderRepository deliveryOrderRepository;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    private DeliveryOrder order;
    private InventoryItem inv;

    @BeforeEach
    public void setup() {
        inv = new InventoryItem();
        inv.setId(10L);
        inv.setSku("TEST-SKU-1");
        inv.setName("Test Item");
        inv.setQuantityOnHand(10);
        inv.setUnit("units");
        inv.setCostPerUnit(BigDecimal.ONE);

        order = new DeliveryOrder();
        order.setId(1L);
        order.setDestinationLat(BigDecimal.ZERO);
        order.setDestinationLng(BigDecimal.ZERO);
        order.setDeadline(LocalDateTime.now().plusDays(1));
        order.setWeightKg(BigDecimal.TEN);
        order.setStatus(OrderStatus.PENDING);
        order.setVersion(1L);

        DeliveryOrderItem item = new DeliveryOrderItem();
        item.setInventoryItem(inv);
        item.setQuantity(5);
        item.setOrder(order);

        order.setItems(Collections.singletonList(item));
    }

    @Test
    public void fulfillOrder_deductsInventory() {
        when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(i -> i.getArgument(0));

        DeliveryOrder fulfilled = deliveryService.fulfillOrder(1L);
        
        assertEquals(OrderStatus.FULFILLED, fulfilled.getStatus());
        assertEquals(5, inv.getQuantityOnHand());
        verify(inventoryItemRepository).save(inv);
        verify(deliveryOrderRepository).save(order);
    }

    @Test
    public void fulfillOrder_failsIfInsufficientStock() {
        inv.setQuantityOnHand(2);
        when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThrows(ResponseStatusException.class, () -> deliveryService.fulfillOrder(1L));
        verify(inventoryItemRepository, never()).save(any());
        verify(deliveryOrderRepository, never()).save(any());
    }

    @Test
    public void concurrentFulfill_onlyOneSucceeds() {
        // We will simulate the optimistic locking failure that Spring Data JPA would throw
        when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(order));
        
        // Simulating the DB throwing an optimistic locking exception on the second save attempt
        AtomicInteger saveAttempts = new AtomicInteger(0);
        when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(invocation -> {
            if (saveAttempts.incrementAndGet() > 1) {
                throw new ObjectOptimisticLockingFailureException(DeliveryOrder.class, order.getId());
            }
            return invocation.getArgument(0);
        });

        // Thread 1 successfully fulfills
        DeliveryOrder fulfilled = deliveryService.fulfillOrder(1L);
        assertEquals(OrderStatus.FULFILLED, fulfilled.getStatus());

        // Thread 2 tries to fulfill, but let's assume it reads the old PENDING state at the same time
        // Since we are mocking, we will just manually reset the status to simulate thread 2's dirty read
        order.setStatus(OrderStatus.PENDING);
        
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> {
            deliveryService.fulfillOrder(1L);
        });
    }
}
